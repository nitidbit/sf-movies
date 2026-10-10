(require '[org.httpkit.server :as http])

(def port (parse-long (or (System/getenv "PORT") "8080")))

(defn handler [_req]
  {:status 200
   :headers {"Content-Type" "text/plain"}
   :body "hi."})

(http/run-server handler {:ip "127.0.0.1" :port port})
(println (str "Listening on http://127.0.0.1:" port))
@(promise)
