import { normalizeMedia } from "./Media.js";
import { createEl } from "../text.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const icons = {
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>'
};

export class ProjectCarousel {
    constructor(container, { title = null, cards = [], labels = {} }) {
        this.labels = labels;
        this.element = createEl("div", "category");

        if (title) this.element.appendChild(createEl("h3", "category__title", title));

        const carousel = createEl("div", "project-carousel");
        this.track = createEl("ul", "carousel__track");
        if (title) this.track.setAttribute("aria-label", title);
        cards.forEach(card => this.track.appendChild(this.buildCard(card)));

        this.prev = this.buildArrow(-1, title);
        this.next = this.buildArrow(1, title);
        carousel.append(this.prev, this.track, this.next);

        const bar = createEl("div", "scrollbar");
        bar.setAttribute("aria-hidden", "true");
        this.thumb = createEl("span", "scrollbar__thumb");
        bar.appendChild(this.thumb);

        this.element.append(carousel, bar);
        container.appendChild(this.element);

        this.update = this.update.bind(this);
        this.track.addEventListener("scroll", this.update, { passive: true });
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
        button.addEventListener("click", () => {
            this.track.scrollBy({ left: direction * this.track.clientWidth, behavior: reducedMotion.matches ? "auto" : "smooth" });
        });
        return button;
    }

    update() {
        const track = this.track;
        const max = track.scrollWidth - track.clientWidth;
        const visible = track.scrollWidth > 0 ? Math.min(1, track.clientWidth / track.scrollWidth) : 1;
        const progress = max > 0 ? track.scrollLeft / max : 0;

        this.thumb.style.width = `${visible * 100}%`;
        this.thumb.style.left = `${progress * (1 - visible) * 100}%`;
        this.prev.disabled = track.scrollLeft <= 1;
        this.next.disabled = track.scrollLeft >= max - 1;
        this.element.classList.toggle("is-static", max <= 1);
    }

    buildCard(card) {
        const item = createEl("li");
        const article = createEl("article", `project-card project-card--${card.variant === "game" ? "game" : "site"}`);

        const link = createEl("a", "project-card__media");
        link.href = card.href;
        link.setAttribute("aria-label", card.name ?? "");
        if (card.external) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }

        link.appendChild(this.buildMedia(card));

        const overlay = createEl("span", "project-card__overlay");
        overlay.appendChild(createEl("strong", null, card.name));
        overlay.append(card.action ?? "");
        overlay.setAttribute("aria-hidden", "true");
        link.appendChild(overlay);

        if (card.special) link.appendChild(createEl("span", "special-tag project-card__tag", card.special));
        article.appendChild(link);

        if (card.variant === "game") article.appendChild(this.buildGameBody(card));
        else article.appendChild(this.buildSiteBody(card));

        item.appendChild(article);
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
    }
}
