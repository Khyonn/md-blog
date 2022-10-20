const version = "0.0.1";
const cache_name = `cache_${version}`;
const staticsFiles = [
  "./pages/home.md",
  "./pages/notfound.md",
  "./pages/offline.md",
  "./scripts/marked.min.js",
];

importScripts("./scripts/marked.min.js");

self.addEventListener("install", (event) => {
  self.skipWaiting(); // rien à foutre, il s'installe meme s'il y a d'autres SW qui veulent s'enregistrer avant
  event.waitUntil(
    caches.open(cache_name).then((cache) => {
      cache.addAll(staticsFiles).then(() =>
        cache
          .match("./pages/home.md")
          .then((r) => r.text())
          .then((content) => cache.put(new Request("."), getPageWithContent(marked.parse(content))))
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  clients.claim();
  // clean old caches => new files
  event.waitUntil(
    caches
      .keys()
      .then((cacheKeys) =>
        cacheKeys.map(
          (cacheKey) => cacheKey !== cache_name && caches.delete(cacheKey)
        )
      )
  );
});

const getPageWithContent = (content) => {
  const response = new Response(
    `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="manifest" href="manifest.json">
          <title>${
            content.match(/<h1(?:.*)>(.+)<\/h1>/)?.at(1) ?? "Khyonn's blog"
          }</title>
          <style>
              *,
              ::before,
              ::after {
                  box-sizing: border-box;
              }

              body {
                  margin: 0;
                  font-family: sans-serif;
              }
              
          </style>
          <script>
              window.addEventListener("load", () => {
                  navigator.serviceWorker?.register('./sw.js');
              });
          </script>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `,
    { headers: { "Content-type": "text/html" } }
  );
  response.type = "text/html";
  return response;
};

self.addEventListener("fetch", (event) => {
  console.log("Fetching " + event.request.url);
  if (event.request.mode === "navigate") {
    let requiredPage = new URLSearchParams(
      event.request.url.split("?").at(1)?.split("#").at(0)
    ).get("page");
    if (event.request.url.startsWith(location.origin) && requiredPage) {
      event.respondWith(
        caches
          .match(`./pages/${requiredPage}.md`)
          .then((c) => {
            if (!c) {
              throw new Error("Not present in cache");
            }
            return c;
          })
          .catch(() =>
            // si pas présent dans le cache, on le cherche
            fetch(`./pages/${requiredPage}.md`)
              .then((response) => {
                if (!response.ok) {
                  return caches.match("./pages/notfound.md"); // si pas ok => 404
                }
                return caches.open(cache_name).then((cache) => {
                  cache.put(
                    new Request(`./pages/${requiredPage}.md`),
                    response.clone()
                  );
                  return response;
                });
              })
          )
          .catch(() => caches.match("./pages/offline.md")) // le fetch ne marche pas => offline
          .then((c) => c.text())
          .then((content) => getPageWithContent(marked.parse(content)))
      );
    } else {
      event.respondWith(caches.match("."));
    }
  } else {
    event.respondWith(
      caches.match(event.request).then((r) => {
        return (
          r ||
          fetch(event.request).then((response) => {
            if (!event.request.url.startsWith("http")) {
              return response;
            }
            return caches.open(cache_name).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
        );
      })
    );
  }
});
