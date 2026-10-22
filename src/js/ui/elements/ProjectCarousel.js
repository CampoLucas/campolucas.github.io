import { normalizeMedia } from "./Media.js";
import { createEl } from "../text.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let carouselCount = 0;

const icons = {
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>'
};

export class ProjectCarousel {
    constructor(container, { title = null, cards = [], labels = {}, maxVisible = 4 }) {
        this.labels = labels;
        this.element = createEl("div", "category");
        this.element.style.setProperty("--per-view", String(Math.max(1, Number(maxVisible) || 4)));

        if (title) this.element.appendChild(createEl("h3", "category__title", title));

        this.carousel = createEl("div", "project-carousel");
        this.track = createEl("ul", "carousel__track");
        this.track.id = `project-track-${++carouselCount}`;
        if (title) this.track.setAttribute("aria-label", title);
        cards.forEach(card => this.track.appendChild(this.buildCard(card)));

        this.prev = this.buildArrow(-1, title);
        this.next = this.buildArrow(1, title);
        this.bar = this.buildScrollbar(title);
        this.carousel.appendChild(this.track);

        this.element.appendChild(this.carousel);
        container.appendChild(this.element);

        this.update = this.update.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.track.addEventListener("scroll", this.update, { passive: true });
        this.track.addEventListener("wheel", this.onWheel, { passive: false });
        this.resizeObserver = new ResizeObserver(this.update);
        this.resizeObserver.observe(this.track);
        this.update();
    }

    buildArrow(direction, title) {
        const button = createEl("button", `carousel__arrow carousel__arrow--${direction < 0 ? "prev" : "next"}`);
        button.type = "button";
        const label = direction < 0 ? this.labels.prev ?? "Previous" : this.labels.next ?? "Next";
        button.setAttribute("aria-label", title ? `${label}: ${title}` : label);
        button.innerHTML = direction < 0 ? icons.prev : icons.next;
        button.addEventListener("click", () => this.scrollByPage(direction));
        return button;
    }

    buildScrollbar(title) {
        const bar = createEl("div", "scrollbar");
        bar.setAttribute("role", "scrollbar");
        bar.setAttribute("aria-controls", this.track.id);
        bar.setAttribute("aria-orientation", "horizontal");
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-valuenow", "0");
        if (title) bar.setAttribute("aria-label", title);
        bar.tabIndex = 0;

        this.thumb = createEl("span", "scrollbar__thumb");
        bar.appendChild(this.thumb);

        bar.addEventListener("keydown", event => {
            const steps = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageDown: 1, PageUp: -1 };
            if (event.key === "Home") this.scrollToLeft(0);
            else if (event.key === "End") this.scrollToLeft(this.maxScroll());
            else if (event.key in steps) {
                if (event.key.startsWith("Page")) this.scrollByPage(steps[event.key]);
                else this.scrollByCard(steps[event.key]);
            }
            else return;
            event.preventDefault();
        });

        this.thumb.addEventListener("pointerdown", event => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            this.startDrag(event);
        });

        bar.addEventListener("pointerdown", event => {
            if (event.button !== 0 || event.target === this.thumb) return;
            event.preventDefault();
            const rect = bar.getBoundingClientRect();
            const thumbWidth = this.thumb.getBoundingClientRect().width;
            const ratio = (event.clientX - rect.left - thumbWidth / 2) / Math.max(1, rect.width - thumbWidth);
            this.scrollToLeft(Math.min(1, Math.max(0, ratio)) * this.maxScroll());
        });

        return bar;
    }

    startDrag(event) {
        const barWidth = this.bar.getBoundingClientRect().width;
        const thumbWidth = this.thumb.getBoundingClientRect().width;
        const startX = event.clientX;
        const startLeft = this.track.scrollLeft;
        const ratio = this.maxScroll() / Math.max(1, barWidth - thumbWidth);

        this.track.classList.add("is-dragging");
        try {
            this.thumb.setPointerCapture(event.pointerId);
        }
        catch {
        }

        const move = e => {
            this.track.scrollLeft = startLeft + (e.clientX - startX) * ratio;
        };
        const end = () => {
            this.track.classList.remove("is-dragging");
            this.thumb.removeEventListener("pointermove", move);
            this.thumb.removeEventListener("pointerup", end);
            this.thumb.removeEventListener("pointercancel", end);
        };
        this.thumb.addEventListener("pointermove", move);
        this.thumb.addEventListener("pointerup", end);
        this.thumb.addEventListener("pointercancel", end);
    }

    maxScroll() {
        return Math.max(0, this.track.scrollWidth - this.track.clientWidth);
    }

    behavior() {
        return reducedMotion.matches ? "auto" : "smooth";
    }

    cardStep() {
        const first = this.track.firstElementChild;
        if (!first) return this.track.clientWidth;
        const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
        return first.getBoundingClientRect().width + gap;
    }

    scrollToLeft(left) {
        this.track.scrollTo({ left, behavior: this.behavior() });
    }

    scrollByCard(direction) {
        this.track.scrollBy({ left: direction * this.cardStep(), behavior: this.behavior() });
    }

    scrollByPage(direction) {
        this.track.scrollBy({ left: direction * this.track.clientWidth, behavior: this.behavior() });
    }

    onWheel(event) {
        if (!this.overflowing || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        const direction = Math.sign(event.deltaY);
        if (!direction) return;
        const max = this.maxScroll();
        if ((direction > 0 && this.track.scrollLeft >= max - 1) || (direction < 0 && this.track.scrollLeft <= 1)) return;
        event.preventDefault();
        this.scrollByCard(direction);
    }

    update() {
        const track = this.track;
        const max = this.maxScroll();
        this.overflowing = max > 1;

        if (this.overflowing && !this.bar.isConnected) {
            this.carousel.prepend(this.prev);
            this.carousel.append(this.next);
            this.element.append(this.bar);
        }
        else if (!this.overflowing && this.bar.isConnected) {
            this.prev.remove();
            this.next.remove();
            this.bar.remove();
        }
        this.element.classList.toggle("is-static", !this.overflowing);
        if (!this.overflowing) return;

        const visible = track.scrollWidth > 0 ? Math.min(1, track.clientWidth / track.scrollWidth) : 1;
        const progress = Math.min(1, Math.max(0, track.scrollLeft / max));

        this.thumb.style.width = `${visible * 100}%`;
        this.thumb.style.left = `${progress * (1 - visible) * 100}%`;
        this.bar.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
        this.prev.disabled = track.scrollLeft <= 1;
        this.next.disabled = track.scrollLeft >= max - 1;
    }

    buildCard(card) {
        const item = createEl("li");
        const link = createEl("a", `project-card project-card--${card.variant === "game" ? "game" : "site"}`);
        link.href = card.href;
        if (card.external) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }

        const media = createEl("div", "project-card__media");
        media.appendChild(this.buildMedia(card));
        const preview = this.buildPreview(card);
        if (preview) {
            media.appendChild(preview);
            this.bindPreview(link, preview);
        }
        if (card.special) media.appendChild(createEl("span", "special-tag project-card__tag", card.special));
        link.appendChild(media);

        if (card.variant === "game") link.appendChild(this.buildGameBody(card));
        else link.appendChild(this.buildSiteBody(card));

        item.appendChild(link);
        return item;
    }

    buildMedia(card) {
        const box = createEl("div", "media");
        const source = normalizeMedia(card.image);
        if (!source || source.isVideo) return box;

        const image = createEl("img", card.imageIsIcon ? "media__icon" : "media__img");
        image.src = source.src;
        image.alt = card.alt ?? "";
        image.loading = "lazy";
        image.decoding = "async";
        if (source.width) image.width = source.width;
        if (source.height) image.height = source.height;
        box.appendChild(image);
        return box;
    }

    buildPreview(card) {
        const source = normalizeMedia(card.preview);
        if (!source) return null;

        let el;
        if (source.isVideo) {
            el = createEl("video", "project-card__preview");
            el.muted = true;
            el.loop = true;
            el.playsInline = true;
            el.preload = "none";
            el.setAttribute("aria-hidden", "true");
            if (source.poster) el.poster = source.poster;
        }
        else {
            el = createEl("img", "project-card__preview");
            el.alt = "";
            el.decoding = "async";
        }
        el.dataset.src = source.src;
        return el;
    }

    bindPreview(card, preview) {
        const show = () => {
            if (!preview.getAttribute("src")) preview.setAttribute("src", preview.dataset.src);
            card.classList.add("is-previewing");
            if (preview instanceof HTMLVideoElement) preview.play()?.catch(() => {});
        };
        const hide = () => {
            card.classList.remove("is-previewing");
            if (preview instanceof HTMLVideoElement) preview.pause();
        };
        card.addEventListener("pointerenter", show);
        card.addEventListener("pointerleave", hide);
        card.addEventListener("focus", show);
        card.addEventListener("blur", hide);
    }

    buildTags(card) {
        const tags = createEl("ul", "tags project-card__tags");
        (card.tags ?? []).forEach(tag => tags.appendChild(createEl("li", "tag", tag)));
        return tags;
    }

    buildGameBody(card) {
        const body = createEl("div", "project-card__body");
        body.appendChild(createEl("h4", "project-card__name", card.name));
        body.appendChild(createEl("p", "project-card__description", card.description));
        body.appendChild(this.buildTags(card));
        return body;
    }

    buildSiteBody(card) {
        const body = createEl("div", "project-card__body");
        const row = createEl("div", "project-card__row");

        const icon = createEl("span", "project-card__icon");
        const source = normalizeMedia(card.icon);
        if (source && !source.isVideo) {
            const image = createEl("img");
            image.src = source.src;
            image.alt = "";
            image.width = 30;
            image.height = 30;
            image.loading = "lazy";
            image.decoding = "async";
            icon.appendChild(image);
        }
        else {
            icon.setAttribute("aria-hidden", "true");
            icon.innerHTML = card.variant === "tool" ? icons.tool : icons.site;
        }

        const text = createEl("div", "project-card__text");
        text.appendChild(createEl("h4", "project-card__name", card.name));
        text.appendChild(createEl("p", "project-card__description", card.description));

        row.append(icon, text);
        body.append(row, this.buildTags(card));
        return body;
    }

    destroy() {
        this.resizeObserver.disconnect();
        this.track.removeEventListener("scroll", this.update);
        this.track.removeEventListener("wheel", this.onWheel);
        this.track.querySelectorAll("video").forEach(video => {
            video.pause();
            video.removeAttribute("src");
            video.load();
        });
    }
}
