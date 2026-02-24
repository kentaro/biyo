/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
/*
 * Minimal COOP/COEP service worker.
 * Adds the headers required for SharedArrayBuffer on cross-origin-isolated pages
 * (e.g. GitHub Pages where you cannot set server headers).
 *
 *   Cross-Origin-Embedder-Policy: require-corp
 *   Cross-Origin-Opener-Policy: same-origin
 */
// eslint-disable-next-line no-restricted-globals
const _self = self;

_self.addEventListener("install", () => {
  _self.skipWaiting();
});

_self.addEventListener("activate", (event) => {
  event.waitUntil(_self.clients.claim());
});

_self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only intercept navigations (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        // If the response is a redirect or opaque, pass through unchanged
        if (response.status === 0 || response.type === "opaqueredirect") {
          return response;
        }

        const headers = new Headers(response.headers);
        headers.set("Cross-Origin-Embedder-Policy", "require-corp");
        headers.set("Cross-Origin-Opener-Policy", "same-origin");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      })
    );
  }
});
