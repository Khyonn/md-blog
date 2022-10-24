const version = "0.0.2";
const cache_name = `cache_${version}`;
const staticsFiles = [".", "./pages/home.md", "./pages/notfound.md", "./pages/offline.md", "./assets/scripts/marked.min.js"];

importScripts("./assets/scripts/marked.min.js");

self.addEventListener("install", (event) => {
  self.skipWaiting(); // service worker should install to replace older one
  event.waitUntil(caches.open(cache_name).then(cache => cache.addAll(staticsFiles)));
});

self.addEventListener("activate", (event) => {
  clients.claim();
  // clean old caches => new files
  event.waitUntil(caches.keys().then((cacheKeys) => cacheKeys.map((cacheKey) => cacheKey !== cache_name && caches.delete(cacheKey))));
});

const markdownToPageResponse = async (markdownText) => {
  const content = marked.parse(markdownText);
  const cache = await caches.open(cache_name);
  const template = await cache.match(".").then((r) => r && r.text());

  return typeof template !== "string"
    ? template
    : new Response(
        template
          .replace(/(<title.*>)(.*)(<\/title>)/, `$1${content.match(/<h1(?:.*)>(.+)<\/h1>/)?.at(1) ?? "$2"}$3`)
          .replace(/(<div id="__content__">)(?:.*)(<\/div>)/, `$1${content}$2`),
        { headers: { "Content-type": "text/html", charset: "UTF-8" } }
      );
};

/**
 * @param {string} markdownUrl
 */
const fetchMarkdownAndPutInCache = async (markdownUrl) => {
  const markdownResponse = await fetch(markdownUrl);
  const cache = await caches.open(cache_name);
  if (markdownResponse.ok) {
    cache.put(markdownUrl, markdownResponse.clone());
    return markdownResponse;
  }
};

/**
 * @param {string} requestedMarkdown
 */
const getMarkdownPageResponse = async (requestedMarkdown) => {
  const markdownUrl = `./pages/${requestedMarkdown}.md`;
  const cache = await caches.open(cache_name);
  let markdownResponse = await cache.match(markdownUrl);
  if (!markdownResponse) {
    try {
      markdownResponse = (await fetchMarkdownAndPutInCache(markdownUrl)) ?? (await cache.match("./pages/notfound.md"));
    } catch (e) {
      markdownResponse = await cache.match("./pages/offline.md")
    }
  }
  if (!markdownResponse) {
    return markdownResponse
  }
  const markdownText = await markdownResponse.text();
  const markdownPage = await markdownToPageResponse(markdownText)
  return markdownPage;
};

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    const isHomePage = [
      new URL(event.request.url).pathname,
      new URL(event.request.url).pathname.slice(0, -1)
    ].includes(self.location.pathname.replace("sw.js", ""));
    const requestedPage = new URLSearchParams(new URL(event.request.url).search).get("page") ?? "home";
    if (isHomePage && requestedPage) {
        event.respondWith(
          getMarkdownPageResponse(requestedPage).then(r => r ?? event.preloadResponse)
        );
    }
  } else if (self.location.origin === new URL(event.request.url).origin) {
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
