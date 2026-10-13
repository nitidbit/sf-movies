;; Run with: bb server/test/server_test.clj

(require '[clojure.test :refer [deftest is testing use-fixtures run-tests]]
         '[babashka.fs :as fs]
         '[cheshire.core :as json])

(load-file (str (fs/path (fs/parent (fs/parent *file*)) "src" "server.clj")))

;; A new database file for each test. The folder is left for the OS to clean
;; up; deleting it races SQLite removing its own -wal file.
(def test-dir (fs/create-temp-dir))

(use-fixtures :each
  (fn [test]
    (alter-var-root #'db-file (constantly (str (fs/path test-dir (str (random-uuid) ".db")))))
    (create-tables!)
    (test)))

(defn sample-star [& {:as overrides}]
  (merge {:sourceUrl "https://roxie.com/film/vertigo"
          :handle "AN"
          :title "Vertigo"
          :startTime "2026-10-20T19:00:00-07:00"
          :theater "Roxie"}
         overrides))

(defn request [method uri & [params query-string]]
  (let [response (handler {:request-method method
                           :uri uri
                           :query-string query-string
                           :body (when params
                                   (java.io.ByteArrayInputStream. (.getBytes (json/generate-string params))))})]
    (cond-> response
      (= "application/json" (get-in response [:headers "Content-Type"]))
      (update :body json/parse-string true))))

(defn showings [list-id]
  (:showings (:body (request :get (str "/api/lists/" list-id)))))

(deftest an-unknown-list-is-empty
  (is (= [] (showings "nobody-has-this"))))

(deftest starring
  (testing "the first star puts the showing on the list with its details"
    (request :post "/api/lists/L1/stars" (sample-star :handle "AN"))
    (is (= [{:sourceUrl "https://roxie.com/film/vertigo"
             :title "Vertigo"
             :startTime "2026-10-20T19:00:00-07:00"
             :theater "Roxie"
             :stars ["AN"]
             :comments []}]
           (showings "L1"))))

  (testing "a second person's star adds their handle"
    (request :post "/api/lists/L1/stars" (sample-star :handle "BE"))
    (is (= ["AN" "BE"] (:stars (first (showings "L1"))))))

  (testing "starring twice is the same as once"
    (request :post "/api/lists/L1/stars" (sample-star :handle "BE"))
    (is (= ["AN" "BE"] (:stars (first (showings "L1"))))))

  (testing "unstarring removes only your own star"
    (request :delete "/api/lists/L1/stars" (sample-star :handle "AN"))
    (is (= ["BE"] (:stars (first (showings "L1"))))))

  (testing "the showing leaves the list with its last star"
    (request :delete "/api/lists/L1/stars" (sample-star :handle "BE"))
    (is (= [] (showings "L1")))))

(deftest lists-are-separate
  (request :post "/api/lists/L1/stars" (sample-star))
  (is (= [] (showings "L2"))))

(deftest changes-return-the-whole-list
  (let [response (request :post "/api/lists/L1/stars" (sample-star))]
    (is (= ["AN"] (-> response :body :showings first :stars)))))

(deftest comments
  (request :post "/api/lists/L1/stars" (sample-star :handle "AN"))
  (request :post "/api/lists/L1/comments" {:sourceUrl "https://roxie.com/film/vertigo" :handle "BE" :body "I'm in"})
  (let [comment-id (-> (showings "L1") first :comments first :id)
        comment-uri (str "/api/lists/L1/comments/" comment-id)]

    (testing "a comment shows with its writer's handle"
      (is (= [{:id comment-id :handle "BE" :body "I'm in"}]
             (:comments (first (showings "L1"))))))

    (testing "a comment keeps the showing on the list after the last star goes"
      (request :delete "/api/lists/L1/stars" (sample-star :handle "AN"))
      (is (= 1 (count (showings "L1")))))

    (testing "only the writer can edit a comment"
      (request :put comment-uri {:handle "AN" :body "hijacked"})
      (is (= "I'm in" (-> (showings "L1") first :comments first :body)))
      (request :put comment-uri {:handle "BE" :body "I'm in, 2 tickets"})
      (is (= "I'm in, 2 tickets" (-> (showings "L1") first :comments first :body))))

    (testing "comments over 2000 characters are refused"
      (let [too-long (apply str (repeat 2001 "x"))]
        (is (= 400 (:status (request :post "/api/lists/L1/comments"
                                     {:sourceUrl "https://roxie.com/film/vertigo" :handle "BE" :body too-long}))))
        (is (= 400 (:status (request :put comment-uri {:handle "BE" :body too-long}))))
        (is (= 1 (count (:comments (first (showings "L1"))))))
        (is (= 200 (:status (request :put comment-uri {:handle "BE" :body (apply str (repeat 2000 "x"))}))))))

    (testing "only the writer can delete a comment"
      (request :delete comment-uri {:handle "AN"})
      (is (= 1 (count (:comments (first (showings "L1"))))))
      (request :delete comment-uri {:handle "BE"})
      (is (= [] (showings "L1"))))))

(deftest handles
  (testing "the server trims a handle and keeps at most 5 characters, as typed"
    (is (= {:handle "Winst"} (:body (request :get "/api/handle" nil "typed=%20Winston%20")))))

  (testing "handles are cleaned before they are stored"
    (request :post "/api/lists/L1/stars" (sample-star :handle "  Winston  "))
    (is (= ["Winst"] (:stars (first (showings "L1"))))))

  (testing "a change without a handle is refused"
    (is (= 400 (:status (request :post "/api/lists/L1/stars" (sample-star :handle "   ")))))))

(deftest who-is-watching
  (reset! subscribers {"L1" {:ana-phone "AN" :ana-laptop "AN" :ben "BE" :not-named-yet nil}
                       "L2" {:cy "CY"}})
  (testing "each handle once, without visitors who have no handle yet"
    (is (= ["AN" "BE"] (watching "L1"))))
  (testing "the list comes with who is watching it"
    (is (= ["AN" "BE"] (:watching (:body (request :get "/api/lists/L1"))))))
  (reset! subscribers {}))

(deftest pages
  (alter-var-root #'site-dir (constantly (fs/canonicalize (fs/create-temp-dir))))
  (spit (fs/file site-dir "index.html") "the page")

  (testing "a list URL gets the front page"
    (is (= "the page" (slurp (:body (request :get "/list/k7f3q9x2m4"))))))

  (testing "paths outside the site are not served"
    (is (= 404 (:status (request :get "/../server.clj"))))))

(let [{:keys [fail error]} (run-tests)]
  (System/exit (if (pos? (+ fail error)) 1 0)))
