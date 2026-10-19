import { createMedia, loadMedia, normalizeMedia, playMedia, pauseMedia, isVideo, isReady } from "./Media.js";

const visibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.mediaCarousel?.setVisible(entry.isIntersecting));
}, { rootMargin: "200px 0px" });

export class MediaCarousel {
    constructor(root, thumbsPerView = 4, autoInterval = null, images = null, alt = null) {
        this.root = root;
        this.viewport = root.querySelector(".carousel-viewport");

        if (!images) {
            this.images = Array.from(root.querySelectorAll(".carousel-viewport img"));
            this.thumbButtons = Array.from(root.querySelectorAll(".carousel-thumbs-track button"));
            this.dotButtons = Array.from(root.querySelectorAll(".carousel-dots button"));
        }
        else {
            this.images = [];
            this.thumbButtons = [];
            this.dotButtons = [];
            this.pendingThumbs = new Map();

            const imgCntEl = root.querySelector("[img-cnt]");
            const thumbCntEl = root.querySelector("[thumb-cnt]");
            const dotCntEl = root.querySelector("[dot-cnt]");

            for (let i = 0; i < images.length; i++) {
                const media = normalizeMedia(images[i]);
                if (!media) continue;
                const index = this.images.length;

                const previewEl = createMedia(media, { lazy: true, alt: `${alt} preview ${index + 1}`, controls: true });
                imgCntEl.appendChild(previewEl);
                this.images.push(previewEl);

                const thumbEl = document.createElement("img");
                const thumbBtnEl = document.createElement("button");
                thumbBtnEl.type = "button";
                thumbBtnEl.setAttribute("aria-label", `Show ${index + 1}`);
                thumbBtnEl.appendChild(thumbEl);
                if (media.isVideo) thumbBtnEl.classList.add("is-video");
                thumbEl.alt = `${alt} thumbnail ${index + 1}`;
                thumbEl.decoding = "async";
                thumbEl.draggable = false;

                const thumbSrc = media.thumb ?? media.poster;
                if (thumbSrc) {
                    thumbEl.dataset.src = thumbSrc;
                }
                else if (!media.isVideo) {
                    this.pendingThumbs.set(index, { el: thumbEl, src: media.src });
                }
                thumbCntEl.appendChild(thumbBtnEl);
                this.thumbButtons.push(thumbBtnEl);

                const dotEl = document.createElement("button");
                dotEl.type = "button";
                dotEl.setAttribute("data-index", `${index}`);
                dotEl.setAttribute("aria-label", `Show ${index + 1}`);
                dotCntEl.appendChild(dotEl);
                this.dotButtons.push(dotEl);
            }
        }

        this.track = root.querySelector(".carousel-thumbs-track");
        this.thumbsArea = root.querySelector(".carousel-thumbs");
        this.prevButtons = root.querySelectorAll("[data-prev]");
        this.nextButtons = root.querySelectorAll("[data-next]");
        this.scrollTrack = root.querySelector(".carousel-thumb-scroll-track");
        this.scrollHandle = root.querySelector(".carousel-thumb-scroll-handle");

        this.thumbsPerView = thumbsPerView;
        this.currentIndex = 0;
        this.thumbOffset = 0;

        this.autoInterval = autoInterval;
        this.autoTimer = null;
        this.snapTimer = null;
        this.visible = false;
        this.scrub = null;

        this.setupThumbs();
        this.bind();
        this.update();

        this.root.mediaCarousel = this;
        visibilityObserver.observe(this.root);
    }

    setupThumbs() {
        if (this.track) {
            const w = 100 / this.thumbsPerView;
            this.thumbButtons.forEach(btn => {
                btn.style.flex = `0 0 ${w}%`;
            });
        }

        if (this.scrollHandle) {
            this.handleWidthPct = this.canScrollThumbs() ? (this.thumbsPerView / this.thumbButtons.length) * 100 : 100;
            this.scrollHandle.style.width = `${this.handleWidthPct}%`;
        }

        this.root.classList.toggle("thumbs-scrollable", this.canScrollThumbs());
    }

    bind() {
        this.thumbButtons.forEach((btn, i) => btn.addEventListener("click", () => this.goTo(i)));
        this.dotButtons.forEach((btn, i) => btn.addEventListener("click", () => this.goTo(i)));
        this.prevButtons.forEach(btn => btn.addEventListener("click", () => this.move(-1)));
        this.nextButtons.forEach(btn => btn.addEventListener("click", () => this.move(1)));

        this.images.forEach((el, i) => {
            el.addEventListener(isVideo(el) ? "loadeddata" : "load", () => this.onSlideReady(i));
            if (isVideo(el)) {
                el.addEventListener("ended", () => {
                    if (i === this.currentIndex && this.autoInterval != null) this.move(1);
                });
            }
        });

        if (this.scrollHandle && this.scrollTrack) {
            this.scrollHandle.addEventListener("pointerdown", e => this.startScrub(e, true));
            this.scrollTrack.addEventListener("pointerdown", e => {
                if (e.target === this.scrollHandle) return;
                this.startScrub(e, false);
            });
            this.onPointerMove = e => this.moveScrub(e);
            this.onPointerUp = () => this.endScrub();
            window.addEventListener("pointermove", this.onPointerMove);
            window.addEventListener("pointerup", this.onPointerUp);
            window.addEventListener("pointercancel", this.onPointerUp);
        }

        if (this.thumbsArea) {
            this.onWheel = e => {
                if (!this.canScrollThumbs()) return;
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
                if (!delta) return;
                e.preventDefault();
                const step = this.thumbStep();
                if (!step) return;
                this.setThumbOffset(this.thumbOffset + delta / step, false);
                clearTimeout(this.snapTimer);
                this.snapTimer = setTimeout(() => this.setThumbOffset(Math.round(this.thumbOffset), true), 140);
            };
            this.thumbsArea.addEventListener("wheel", this.onWheel, { passive: false });
        }
    }

    thumbStep() {
        if (this.thumbButtons.length > 1) return this.thumbButtons[1].offsetLeft - this.thumbButtons[0].offsetLeft;
        return this.thumbButtons[0]?.offsetWidth ?? 0;
    }

    maxThumbOffset() {
        return Math.max(0, this.thumbButtons.length - this.thumbsPerView);
    }

    setThumbOffset(offset, animate) {
        this.thumbOffset = Math.max(0, Math.min(this.maxThumbOffset(), offset));
        this.root.classList.toggle("is-scrubbing", !animate);
        this.renderThumbs();
    }

    handleRatioFromPointer(clientX, grab) {
        const rect = this.scrollTrack.getBoundingClientRect();
        const handleWidth = rect.width * (this.handleWidthPct / 100);
        const free = rect.width - handleWidth;
        if (free <= 0) return 0;
        const x = clientX - rect.left - (grab ?? handleWidth / 2);
        return Math.max(0, Math.min(1, x / free));
    }

    startScrub(e, onHandle) {
        if (!this.canScrollThumbs() || e.button > 0) return;
        e.preventDefault();
        const handleRect = this.scrollHandle.getBoundingClientRect();
        const grab = onHandle ? e.clientX - handleRect.left : null;
        this.scrub = { grab, pointerId: e.pointerId };
        this.root.classList.add("is-dragging-scrollbar");
        this.setThumbOffset(this.handleRatioFromPointer(e.clientX, grab ?? undefined) * this.maxThumbOffset(), !onHandle);
        if (!onHandle) this.scrub.grab = this.scrollTrack.getBoundingClientRect().width * (this.handleWidthPct / 100) / 2;
    }

    moveScrub(e) {
        if (!this.scrub || e.pointerId !== this.scrub.pointerId) return;
        this.setThumbOffset(this.handleRatioFromPointer(e.clientX, this.scrub.grab) * this.maxThumbOffset(), false);
    }

    endScrub() {
        if (!this.scrub) return;
        this.scrub = null;
        this.root.classList.remove("is-dragging-scrollbar");
        this.setThumbOffset(Math.round(this.thumbOffset), true);
    }

    move(dir) {
        const len = this.images.length;
        if (!len) return;
        this.goTo((this.currentIndex + dir + len) % len);
    }

    goTo(index) {
        this.currentIndex = index;
        this.ensureThumbVisible();
        this.update();
    }

    ensureThumbVisible() {
        if (!this.track) return;
        if (!this.canScrollThumbs()) {
            this.thumbOffset = 0;
            return;
        }
        if (this.currentIndex < this.thumbOffset) this.thumbOffset = this.currentIndex;
        if (this.currentIndex >= this.thumbOffset + this.thumbsPerView) this.thumbOffset = this.currentIndex - this.thumbsPerView + 1;
        this.root.classList.remove("is-scrubbing");
    }

    renderThumbs() {
        if (this.track) {
            const offsetPx = this.canScrollThumbs() ? this.thumbOffset * this.thumbStep() : 0;
            this.track.style.transform = `translateX(${-offsetPx}px)`;
        }
        if (this.scrollHandle) {
            const max = this.maxThumbOffset();
            const ratio = max > 0 ? this.thumbOffset / max : 0;
            this.scrollHandle.style.left = `${ratio * (100 - this.handleWidthPct)}%`;
        }
    }

    update() {
        this.images.forEach((img, i) => img.classList.toggle("active", i === this.currentIndex));
        this.thumbButtons.forEach((btn, i) => btn.classList.toggle("active", i === this.currentIndex));
        this.dotButtons.forEach((btn, i) => btn.classList.toggle("active", i === this.currentIndex));
        this.renderThumbs();
        this.syncMedia();
        this.updateLoading();
        this.scheduleAuto();
    }

    updateLoading() {
        if (!this.viewport) return;
        const current = this.images[this.currentIndex];
        this.viewport.classList.toggle("is-loading", !!current && !isReady(current));
    }

    onSlideReady(index) {
        if (index !== this.currentIndex) return;
        this.updateLoading();
        this.scheduleAuto();
    }

    syncMedia() {
        const len = this.images.length;
        if (!this.visible || len === 0) return;

        const current = this.images[this.currentIndex];
        loadMedia(current);
        this.fillPendingThumb(this.currentIndex);

        if (len > 1) {
            const nextIndex = (this.currentIndex + 1) % len;
            loadMedia(this.images[nextIndex]);
            this.fillPendingThumb(nextIndex);
        }

        this.images.forEach(el => {
            if (el === current) {
                if (isVideo(el) && el.ended) el.currentTime = 0;
                playMedia(el);
            }
            else {
                pauseMedia(el);
            }
        });
    }

    fillPendingThumb(index) {
        const pending = this.pendingThumbs?.get(index);
        if (!pending) return;
        pending.el.src = pending.src;
        this.pendingThumbs.delete(index);
    }

    setVisible(visible) {
        if (this.visible === visible) return;
        this.visible = visible;

        if (visible) {
            this.thumbButtons.forEach(btn => loadMedia(btn.querySelector("img")));
            this.syncMedia();
            this.updateLoading();
            this.scheduleAuto();
        }
        else {
            this.stopAuto();
            this.images.forEach(pauseMedia);
        }
    }

    destroy() {
        this.stopAuto();
        clearTimeout(this.snapTimer);
        this.visible = false;
        this.images.forEach(pauseMedia);
        visibilityObserver.unobserve(this.root);
        delete this.root.mediaCarousel;

        if (this.onPointerMove) window.removeEventListener("pointermove", this.onPointerMove);
        if (this.onPointerUp) {
            window.removeEventListener("pointerup", this.onPointerUp);
            window.removeEventListener("pointercancel", this.onPointerUp);
        }
        if (this.onWheel && this.thumbsArea) this.thumbsArea.removeEventListener("wheel", this.onWheel);
    }

    scheduleAuto() {
        this.stopAuto();
        if (this.autoInterval == null || !this.visible || this.images.length < 2) return;

        const current = this.images[this.currentIndex];
        if (!current || isVideo(current) || !isReady(current)) return;

        this.autoTimer = setTimeout(() => {
            this.autoTimer = null;
            this.move(1);
        }, this.autoInterval);
    }

    stopAuto() {
        if (this.autoTimer) {
            clearTimeout(this.autoTimer);
            this.autoTimer = null;
        }
    }

    canScrollThumbs() {
        return this.thumbButtons.length > this.thumbsPerView;
    }
}
