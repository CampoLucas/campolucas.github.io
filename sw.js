const VERSION = "v15";
const SHELL_CACHE = `shell-${VERSION}`;
const MEDIA_CACHE = `media-${VERSION}`;

const SHELL = [
    "./",
    "./index.html",

    "./src/css/foundation/variables.css",
    "./src/css/foundation/typography.css",
    "./src/css/layout/layout.css",
    "./src/css/components/buttons.css",
    "./src/css/components/icons.css",
    "./src/css/components/social.css",
    "./src/css/components/carousel.css",
    "./src/css/components/carousel-projects.css",
    "./src/css/components/skeleton.css",
    "./src/css/components/separator.css",
    "./src/css/sections/hero.css",
    "./src/css/sections/projects.css",
    "./src/css/sections/experience.css",
    "./src/css/sections/showcases.css",
    "./src/css/sections/footer.css",
    "./src/css/sections/popup.css",
    "./src/css/sections/skills.css",
    "./src/css/effects/particles.css",
    "./src/css/effects/gradient.css",

    "./src/js/core/App.js",
    "./src/js/core/JSONLoader.js",
    "./src/js/ui/Renderer.js",
    "./src/js/ui/PopupHandler.js",
    "./src/js/ui/elements/Media.js",
    "./src/js/ui/elements/MediaCarousel.js",
    "./src/js/ui/elements/CapsuleCarousel/CapsuleCarousel.js",
    "./src/js/ui/elements/CapsuleCarousel/Capsule.js",
    "./src/js/ui/elements/CapsuleCarousel/CapsuleType.js",
    "./src/js/particles/particles.js",

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

    if (sameOrigin && url.pathname.includes("/src/media/")) {
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
