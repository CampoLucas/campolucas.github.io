import { createMedia, loadMedia, normalizeMedia } from "../elements/Media.js";
import { createEl } from "../text.js";
import { projectSummary } from "./ProjectsSection.js";

const sectionId = "featured";
const defaultImageCount = 5;
const advanceDelay = 5000;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';

export function findFeaturedProject(projects) {
    for (const category of projects?.categories ?? []) {
        const found = category.projects.find(project => project.display?.featured);
        if (found) return found;
    }
    return null;
}

function isShown(display, key) {
    return display?.[key] !== false;
}

export class FeaturedSection {
    constructor(app) {
        this.app = app;
        this.index = 0;
        this.slides = [];
        this.dots = [];
        this.timer = null;
        this.visible = false;
        this.paused = false;
    }

    render() {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const project = findFeaturedProject(this.app.projects);
        const text = project ? this.app.renderer.t(this.app.projects.baseId, "projects")?.[project.baseId] : null;

        if (!project || !text) {
            section.remove();
            return;
        }

        document.getElementById("featured-title").textContent = this.app.renderer.t("featured", "title") ?? "";

        const container = document.getElementById("featured-cnt");
        container.innerHTML = "";

        const layout = createEl("div", "featured__layout");
        layout.append(this.buildGallery(project, text), this.buildPanel(project, text));
        container.appendChild(layout);

        if (this.slides.length > 1) container.appendChild(this.buildIndicator());
        this.go(0);
        this.observe();
    }

    imagesOf(project) {
        const display = project.display;
        const count = Number.isInteger(display?.imageCount) ? display.imageCount : defaultImageCount;
        const shots = isShown(display, "showImages")
            ? (project.media?.carouselImages ?? []).map(entry => normalizeMedia(entry)).filter(entry => entry && !entry.isVideo).slice(0, count)
            : [];
        if (shots.length) return shots;

        const cover = normalizeMedia(display?.media?.img ?? project.media?.capsuleImg);
        return cover ? [cover] : [];
    }

    buildGallery(project, text) {
        const title = text[project.titleId] ?? "";
        const alt = text[project.imgAltId] ?? title;

        const gallery = createEl("div", "gallery");
        gallery.setAttribute("aria-roledescription", "carousel");
        gallery.setAttribute("aria-label", title);

        const link = createEl("a", "gallery__link");
        link.href = `#${project.baseId}`;
        link.setAttribute("aria-label", title);

        this.track = createEl("div", "gallery__track");
        const images = this.imagesOf(project);
        images.forEach((entry, i) => {
            const slide = createEl("div", "media gallery__slide");
            slide.setAttribute("aria-roledescription", "slide");
            slide.setAttribute("aria-label", `${i + 1} / ${images.length}`);
            const image = createMedia(entry, { lazy: true, alt, className: "media__img" });
            if (image) slide.appendChild(image);
            this.track.appendChild(slide);
            this.slides.push(slide);
        });

        link.appendChild(this.track);
        gallery.appendChild(link);

        gallery.addEventListener("pointerenter", () => this.setPaused(true));
        gallery.addEventListener("pointerleave", () => this.setPaused(false));
        gallery.addEventListener("focusin", () => this.setPaused(true));
        gallery.addEventListener("focusout", () => this.setPaused(false));

        this.gallery = gallery;
        return gallery;
    }

    buildPanel(project, text) {
        const display = project.display;
        const panel = createEl("div", "featured__panel");

        const head = createEl("div", "featured__head");
        const name = createEl("h3", "featured__name");
        const link = createEl("a", null, text[project.titleId]);
        link.href = `#${project.baseId}`;
        name.appendChild(link);
        head.appendChild(name);

        const badge = isShown(display, "showBadge") ? text[display?.badgeId ?? "badge"] : null;
        if (badge) head.appendChild(createEl("span", "special-tag", badge));
        panel.appendChild(head);

        if (isShown(display, "showDescription")) {
            panel.appendChild(createEl("p", "featured__description", projectSummary(project, text)));
        }

        if (isShown(display, "showTags") && project.tags?.length) {
            const tags = createEl("ul", "tags featured__tags");
            project.tags.forEach(tag => tags.appendChild(createEl("li", "tag", tag)));
            panel.appendChild(tags);
        }

        if (isShown(display, "showLinks")) {
            const actions = this.buildActions(project, text);
            if (actions) panel.appendChild(actions);
        }

        return panel;
    }

    buildActions(project, text) {
        const buttons = (project.buttons ?? []).filter(button => button && !button.disabled && button.link);
        if (!buttons.length) return null;

        const renderer = this.app.renderer;
        const actions = createEl("div", "featured__actions");

        buttons.forEach((button, i) => {
            const link = createEl("a", `button ${i === 0 ? "button--primary" : "button--ghost"}`);
            link.href = button.type === "email" ? `mailto:${button.link}` : button.link;
            if (button.newTab && button.type !== "email") {
                link.target = "_blank";
                link.rel = "noopener noreferrer";
            }

            const label = renderer.tPath("featured", `buttons.${button.id}`) ?? text[button.hoverTextId] ?? button.id;
            if (i === 0) link.innerHTML = playIcon;
            link.append(label);
            actions.appendChild(link);
        });

        return actions;
    }

    buildIndicator() {
        const label = this.app.renderer.t("featured", "screenshot") ?? "Screenshot";
        const indicator = createEl("div", "indicator");
        indicator.setAttribute("role", "tablist");
        indicator.setAttribute("aria-label", this.app.renderer.t("featured", "chooseScreenshot") ?? label);

        this.slides.forEach((slide, i) => {
            const dot = createEl("button", "indicator__dot");
            dot.type = "button";
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-label", `${label} ${i + 1}`);
            dot.addEventListener("click", () => {
                this.go(i);
                this.restart();
            });
            indicator.appendChild(dot);
            this.dots.push(dot);
        });

        return indicator;
    }

    go(i) {
        if (!this.slides.length) return;

        this.index = (i + this.slides.length) % this.slides.length;
        this.track.style.transform = `translateX(-${this.index * 100}%)`;
        this.dots.forEach((dot, n) => {
            const current = n === this.index;
            dot.setAttribute("aria-selected", String(current));
            dot.setAttribute("aria-current", String(current));
            dot.tabIndex = current ? 0 : -1;
        });
    }

    observe() {
        if (!this.gallery) return;

        const observer = new IntersectionObserver(entries => {
            this.visible = entries[entries.length - 1].isIntersecting;
            if (this.visible) this.slides.forEach(slide => loadMedia(slide.querySelector("[data-src]")));
            this.restart();
        }, { rootMargin: "200px 0px" });
        observer.observe(this.gallery);
    }

    setPaused(paused) {
        this.paused = paused;
        this.restart();
    }

    restart() {
        clearInterval(this.timer);
        this.timer = null;
        if (this.slides.length < 2 || !this.visible || this.paused || reducedMotion.matches) return;
        this.timer = setInterval(() => this.go(this.index + 1), advanceDelay);
    }
}
