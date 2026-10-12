(require '[org.httpkit.server :as http]
         '[babashka.fs :as fs]
         '[clojure.string :as str])

(def port (parse-long (or (System/getenv "PORT") "8080")))

;; The built Astro site. On Opalstack it is APP_DIR/site, beside APP_DIR/src.
(def site-dir
  (fs/canonicalize (or (System/getenv "SITE_DIR")
                       (fs/path (fs/parent (fs/parent *file*)) "site"))))

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

(defn handler [{:keys [uri]}]
  (if-let [path (resolve-file uri)]
    {:status 200
     :headers {"Content-Type" (get content-types (fs/extension path) "application/octet-stream")}
     :body (fs/file path)}
    {:status 404
     :headers {"Content-Type" "text/plain"}
     :body "Not found"}))

(http/run-server handler {:ip "127.0.0.1" :port port})
(println (str "Serving " site-dir " on http://127.0.0.1:" port))
@(promise)
