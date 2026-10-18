const VERSION = "v1";
const SHELL_CACHE = `shell-${VERSION}`;
const MEDIA_CACHE = `media-${VERSION}`;

const SHELL = [
    "./",
    "./index.html",

    "./assets/css/foundation/variables.css",
    "./assets/css/foundation/typography.css",
    "./assets/css/layout/layout.css",
    "./assets/css/components/buttons.css",
    "./assets/css/components/icons.css",
    "./assets/css/components/social.css",
    "./assets/css/components/carousel.css",
    "./assets/css/components/carousel-projects.css",
    "./assets/css/components/skeleton.css",
    "./assets/css/components/separator.css",
    "./assets/css/sections/hero.css",
    "./assets/css/sections/projects.css",
    "./assets/css/sections/experience.css",
    "./assets/css/sections/showcases.css",
    "./assets/css/sections/footer.css",
    "./assets/css/sections/popup.css",
    "./assets/css/sections/skills.css",
    "./assets/css/effects/particles.css",
    "./assets/css/effects/gradient.css",

    "./src/core/App.js",
    "./src/core/JSONLoader.js",
    "./src/ui/Renderer.js",
    "./src/ui/PopupHandler.js",
    "./src/ui/elements/Media.js",
    "./src/ui/elements/MediaCarousel.js",
    "./src/ui/elements/CapsuleCarousel/CapsuleCarousel.js",
    "./src/ui/elements/CapsuleCarousel/Capsule.js",
    "./src/ui/elements/CapsuleCarousel/CapsuleType.js",
    "./src/particles/particles.js",

    "./data/home.json",
    "./data/experience.json",
    "./data/projects.json",
    "./data/skills.json",
    "./i18n/en.json"
];

const IMMUTABLE_HOSTS = ["cdn.jsdelivr.net"];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then(cache => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== SHELL_CACHE && key !== MEDIA_CACHE).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;

    if (request.headers.has("range") || request.destination === "video") return;

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;

    if (request.mode === "navigate") {
        event.respondWith(networkFirst(request, SHELL_CACHE));
        return;
    }

    if (sameOrigin && url.pathname.includes("/assets/img/")) {
        event.respondWith(cacheFirst(request, MEDIA_CACHE));
        return;
    }

    if (IMMUTABLE_HOSTS.includes(url.hostname)) {
        event.respondWith(cacheFirst(request, SHELL_CACHE));
        return;
    }

    if (sameOrigin) {
        event.respondWith(staleWhileRevalidate(event, SHELL_CACHE));
    }
});

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    }
    catch (err) {
        return (await cache.match(request, { ignoreSearch: true })) ?? (await cache.match("./index.html")) ?? Response.error();
    }
}

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok || response.type === "opaque") cache.put(request, response.clone());
    return response;
}

async function staleWhileRevalidate(event, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(event.request);

    const refresh = fetch(event.request)
        .then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
        });

    if (cached) {
        event.waitUntil(refresh.catch(() => {}));
        return cached;
    }
    return refresh;
}
