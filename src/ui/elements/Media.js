const videoExt = /\.(mp4|webm)([?#].*)?$/i;
const animatedExt = /\.gif([?#].*)?$/i;

export function normalizeMedia(entry) {
    if (!entry) return null;

    const media = typeof entry === "string" ? { src: entry } : { ...entry };
    if (!media.src) return null;

    media.isVideo = videoExt.test(media.src);
    media.isAnimated = media.isVideo || animatedExt.test(media.src);
    return media;
}

export function createMedia(entry, { lazy = true, alt = "", className = null } = {}) {
    const media = normalizeMedia(entry);
    if (!media) return null;

    let el;
    if (media.isVideo) {
        el = document.createElement("video");
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        el.preload = "none";
        el.setAttribute("muted", "");
        el.setAttribute("playsinline", "");
        if (media.poster) el.poster = media.poster;
        if (alt) el.setAttribute("aria-label", alt);
    }
    else {
        el = document.createElement("img");
        el.alt = alt ?? "";
        el.decoding = "async";
    }

    if (media.width) el.width = media.width;
    if (media.height) el.height = media.height;
    if (className) el.className = className;

    if (lazy) {
        el.dataset.src = media.src;
    }
    else {
        setSource(el, media.src);
    }

    return el;
}

export function loadMedia(el) {
    if (!el || !el.dataset.src) return el;

    const src = el.dataset.src;
    delete el.dataset.src;
    setSource(el, src);
    return el;
}

export function isVideo(el) {
    return el instanceof HTMLVideoElement;
}

export function playMedia(el) {
    if (!isVideo(el)) return;
    loadMedia(el);
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
}

export function pauseMedia(el) {
    if (isVideo(el) && !el.paused) el.pause();
}

function setSource(el, src) {
    const ready = () => el.classList.add("is-ready");

    if (isVideo(el)) {
        el.addEventListener("loadeddata", ready, { once: true });
        el.preload = "auto";
    }
    else {
        el.addEventListener("load", ready, { once: true });
    }

    el.src = src;
}
