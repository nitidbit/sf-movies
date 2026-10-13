(require '[org.httpkit.server :as http]
         '[babashka.fs :as fs]
         '[babashka.pods :as pods]
         '[cheshire.core :as json]
         '[clojure.string :as str])

(pods/load-pod 'org.babashka/go-sqlite3 "0.3.13")
(require '[pod.babashka.go-sqlite3 :as sqlite])

(def port (parse-long (or (System/getenv "PORT") "8080")))

;; On Opalstack, APP_DIR. Locally, the repo's server/ folder.
(def app-dir (fs/parent (fs/parent *file*)))

;; The built Astro site. On Opalstack it is APP_DIR/site, beside APP_DIR/src.
(def site-dir
  (fs/canonicalize (or (System/getenv "SITE_DIR")
                       (fs/path app-dir "site"))))

(def db-file
  (str (or (System/getenv "DB_FILE")
           (fs/path app-dir "sqlite" "sf-movies.db"))))

;;; Static files

(def content-types
  {"html" "text/html; charset=utf-8"
   "css" "text/css; charset=utf-8"
   "js" "text/javascript; charset=utf-8"
   "json" "application/json"
   "svg" "image/svg+xml"
   "png" "image/png"
   "webp" "image/webp"
   "ico" "image/x-icon"
   "woff2" "font/woff2"})

(defn resolve-file
  "The file under site-dir for a request URI, or nil if there is none."
  [uri]
  (let [path (fs/canonicalize (fs/path site-dir (str/replace-first uri #"^/+" "")))
        path (if (fs/directory? path) (fs/path path "index.html") path)]
    (when (and (fs/starts-with? path site-dir)
               (fs/regular-file? path))
      path)))

(def not-found
  {:status 404
   :headers {"Content-Type" "text/plain"}
   :body "Not found"})

(defn serve-file [uri]
  (if-let [path (resolve-file uri)]
    {:status 200
     :headers {"Content-Type" (get content-types (fs/extension path) "application/octet-stream")}
     :body (fs/file path)}
    not-found))

;;; Database
;; A list has no row of its own. It exists once it has stars or comments.
;; `showings` is a copy of each showing's details, taken at its first star,
;; because the built page drops showings once they are past.

(def db-lock (Object.))

(defn query [sql-and-params]
  (locking db-lock (sqlite/query db-file sql-and-params)))

(defn execute! [sql-and-params]
  (locking db-lock (sqlite/execute! db-file sql-and-params)))

(defn create-tables! []
  (fs/create-dirs (fs/parent db-file))
  (query ["pragma journal_mode=wal"])
  (execute! ["create table if not exists showings (
                list_id text, source_url text, title text, start_time text, theater text,
                primary key (list_id, source_url))"])
  (execute! ["create table if not exists stars (
                list_id text, source_url text, handle text,
                primary key (list_id, source_url, handle))"])
  (execute! ["create table if not exists comments (
                id integer primary key, list_id text, source_url text, handle text, body text)"]))

(defn whole-list
  "Every showing on the list: those with any stars or any comments."
  [list-id]
  (let [stars (group-by :source_url
                        (query ["select source_url, handle from stars where list_id = ? order by rowid" list-id]))
        comments (group-by :source_url
                           (query ["select id, source_url, handle, body from comments where list_id = ? order by id" list-id]))
        showings (query ["select * from showings where list_id = ?" list-id])]
    {:showings (for [{:keys [source_url title start_time theater]} showings
                     :when (or (stars source_url) (comments source_url))]
                 {:sourceUrl source_url
                  :title title
                  :startTime start_time
                  :theater theater
                  :stars (mapv :handle (stars source_url))
                  :comments (mapv #(dissoc % :source_url) (comments source_url))})}))

(defn add-star! [list-id {:keys [sourceUrl handle title startTime theater]}]
  (execute! ["insert or ignore into showings values (?, ?, ?, ?, ?)" list-id sourceUrl title startTime theater])
  (execute! ["insert or ignore into stars values (?, ?, ?)" list-id sourceUrl handle]))

(defn remove-star! [list-id {:keys [sourceUrl handle]}]
  (execute! ["delete from stars where list_id = ? and source_url = ? and handle = ?" list-id sourceUrl handle]))

(defn add-comment! [list-id {:keys [sourceUrl handle body]}]
  (execute! ["insert into comments (list_id, source_url, handle, body) values (?, ?, ?, ?)"
             list-id sourceUrl handle body]))

;; Edits and deletes only touch a comment posted under the handle sent.
(defn edit-comment! [list-id comment-id {:keys [handle body]}]
  (execute! ["update comments set body = ? where id = ? and list_id = ? and handle = ?"
             body comment-id list-id handle]))

(defn delete-comment! [list-id comment-id {:keys [handle]}]
  (execute! ["delete from comments where id = ? and list_id = ? and handle = ?"
             comment-id list-id handle]))

;;; Handles. The server cleans every handle it receives, so a page can't
;;; store an overlong one.

(def max-handle-length 5)

(defn clean-handle
  "Trimmed, and at most max-handle-length characters. Otherwise kept as typed."
  [typed]
  (let [trimmed (str/trim (str typed))]
    (subs trimmed 0 (min max-handle-length (count trimmed)))))

;;; Live updates: server-sent events. Every change sends the whole list to
;;; everyone who has that list open, along with the handles of who has it
;;; open. Visitors who haven't typed initials yet aren't listed.

(def subscribers (atom {})) ; list-id -> {channel handle}

(defn watching
  "The handles of everyone with the list open."
  [list-id]
  (->> (vals (get @subscribers list-id)) (remove str/blank?) distinct sort vec))

(defn list-message [list-id]
  (assoc (whole-list list-id) :watching (watching list-id)))

(defn event-data [message]
  (str "data: " (json/generate-string message) "\n\n"))

(defn broadcast! [list-id]
  (let [data (event-data (list-message list-id))]
    (doseq [ch (keys (get @subscribers list-id))]
      (http/send! ch data false))))

(defn query-param [query-string param]
  (some->> query-string
           (re-find (re-pattern (str "(?:^|&)" param "=([^&]*)")))
           second
           (java.net.URLDecoder/decode)))

(defn subscribe [{:keys [query-string] :as req} list-id]
  (http/as-channel
   req
   {:on-open (fn [ch]
               ;; The headers go first, before the channel is added, so a
               ;; broadcast from another request can't reach it ahead of them.
               (http/send! ch {:status 200
                               :headers {"Content-Type" "text/event-stream"
                                         "Cache-Control" "no-cache"
                                         ;; Stops nginx holding the stream back.
                                         "X-Accel-Buffering" "no"}
                               :body ":\n\n"}
                           false)
               (swap! subscribers assoc-in [list-id ch] (clean-handle (query-param query-string "handle")))
               (broadcast! list-id))
    :on-close (fn [ch _status]
                (swap! subscribers update list-id dissoc ch)
                (broadcast! list-id))}))

;;; Routes

(defn json-response [data]
  {:status 200
   :headers {"Content-Type" "application/json"}
   :body (json/generate-string data)})

(defn change!
  "Runs a change to a list, tells everyone watching it, and returns the list."
  [list-id change]
  (change)
  (broadcast! list-id)
  (json-response (list-message list-id)))

(def max-comment-length 2000)

(defn bad-request [message]
  {:status 400
   :headers {"Content-Type" "text/plain"}
   :body message})

(defn api [{:keys [request-method body] :as req} list-id path]
  (let [params (some-> body slurp (json/parse-string true) (update :handle clean-handle))
        comment-id (some->> path (re-matches #"/comments/(\d+)") second parse-long)]
    (cond
      (and (not= request-method :get) (str/blank? (:handle params))) (bad-request "A handle is required")
      (> (count (:body params)) max-comment-length) (bad-request "Comments are limited to 2000 characters")
      (and (= request-method :get) (nil? path)) (json-response (list-message list-id))
      (and (= request-method :get) (= path "/events")) (subscribe req list-id)
      (and (= request-method :post) (= path "/stars")) (change! list-id #(add-star! list-id params))
      (and (= request-method :delete) (= path "/stars")) (change! list-id #(remove-star! list-id params))
      (and (= request-method :post) (= path "/comments")) (change! list-id #(add-comment! list-id params))
      (and (= request-method :put) comment-id) (change! list-id #(edit-comment! list-id comment-id params))
      (and (= request-method :delete) comment-id) (change! list-id #(delete-comment! list-id comment-id params))
      :else not-found)))

(defn handler [{:keys [uri query-string] :as req}]
  (if-let [[_ list-id path] (re-matches #"/api/lists/([^/]+)(/.*)?" uri)]
    (api req list-id path)
    (cond
      ;; Lets the page store the handle as the server will use it.
      (= uri "/api/handle") (json-response {:handle (clean-handle (query-param query-string "typed"))})
      (str/starts-with? uri "/list/") (serve-file "/index.html")
      :else (serve-file uri))))

(defn -main []
  (create-tables!)
  (http/run-server handler {:ip "127.0.0.1" :port port})
  (println (str "Serving " site-dir " on http://127.0.0.1:" port ", database " db-file))
  @(promise))

;; Tests load this file without starting the server.
(when (= *file* (System/getProperty "babashka.file"))
  (-main))
