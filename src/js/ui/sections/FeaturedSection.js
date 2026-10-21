import { createMedia, loadMedia, normalizeMedia, pauseMedia, playMedia } from "../elements/Media.js";

const sectionId = "featured";
const canHover = window.matchMedia("(hover: hover)").matches;
const defaultOrder = ["images", "description"];
const defaultImageCount = 2;

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
        this.video = null;
        this.cover = null;
        this.preview = null;
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
        container.appendChild(this.buildCard(project, text));
    }

    buildCard(project, text) {
        const card = this.createEl("article", "featured-steam");
        const main = this.createEl("div", "featured-main");
        main.appendChild(this.buildCover(project, text));
        main.appendChild(this.buildInfo(project, text));
        card.appendChild(main);

        if (isShown(project.display, "showLinks")) {
            const links = this.createEl("div", "featured-links social");
            this.app.renderer.renderContactButtons(links, project.buttons, text);
            if (links.childElementCount) card.appendChild(links);
        }

        this.bindPreview(card);
        return card;
    }

    buildCover(project, text) {
        const display = project.display;
        const media = project.media ?? {};
        const alt = text[project.imgAltId] ?? text[project.titleId] ?? "";

        const cover = this.createEl("div", "featured-cover");
        this.cover = cover;

        const image = normalizeMedia(display?.media?.img ?? media.capsuleImg);
        if (image) {
            const element = this.createEl("img", "featured-cover-img");
            element.src = image.src;
            element.alt = alt;
            element.decoding = "async";
            if (image.width) element.width = image.width;
            if (image.height) element.height = image.height;
            cover.appendChild(element);
        }

        const video = canHover ? createMedia(display?.media?.video ?? media.capsuleVideo, { lazy: true, className: "featured-cover-video" }) : null;
        if (video) {
            cover.appendChild(video);
            this.video = video;
        }

        this.preview = this.createEl("img", "featured-cover-preview");
        this.preview.alt = "";
        this.preview.decoding = "async";
        cover.appendChild(this.preview);

        return cover;
    }

    bindPreview(card) {
        const video = this.video;
        if (!video) return;

        const start = () => {
            loadMedia(video);
            playMedia(video);
        };
        const stop = () => pauseMedia(video);
        card.addEventListener("pointerenter", start);
        card.addEventListener("focusin", start);
        card.addEventListener("pointerleave", stop);
        card.addEventListener("focusout", stop);
    }

    buildInfo(project, text) {
        const display = project.display;
        const info = this.createEl("div", "featured-info");

        const head = this.createEl("div", "featured-head");
        const title = this.createEl("h3", "featured-name");
        const link = this.createEl("a", "featured-link", text[project.titleId]);
        link.href = `#${project.baseId}`;
        title.appendChild(link);
        head.appendChild(title);

        const badge = isShown(display, "showBadge") ? text[display?.badgeId ?? "badge"] : null;
        if (badge) head.appendChild(this.createEl("span", "featured-badge", badge));
        info.appendChild(head);

        const order = Array.isArray(display?.order) ? display.order : defaultOrder;
        const builders = {
            images: () => this.buildShots(project),
            description: () => this.buildDescription(project, text)
        };
        order.forEach(key => {
            const element = builders[key]?.();
            if (element) info.appendChild(element);
        });

        if (isShown(display, "showTags") && project.tags?.length) {
            const tags = this.createEl("div", "info-tags featured-tags");
            project.tags.forEach(tag => tags.appendChild(this.createEl("div", "info-tag", tag)));
            info.appendChild(tags);
        }

        return info;
    }

    buildDescription(project, text) {
        if (!isShown(project.display, "showDescription")) return null;

        const description = this.descriptionOf(project, text);
        return description ? this.createEl("p", "featured-desc", description) : null;
    }

    buildShots(project) {
        const display = project.display;
        if (!isShown(display, "showImages")) return null;

        const count = Number.isInteger(display?.imageCount) ? display.imageCount : defaultImageCount;
        const shots = (project.media?.carouselImages ?? [])
            .map(entry => normalizeMedia(entry))
            .filter(entry => entry && !entry.isVideo)
            .slice(0, count);
        if (!shots.length) return null;

        const strip = this.createEl("div", "featured-shots");
        shots.forEach(shot => {
            const item = this.createEl("a", "featured-shot");
            item.href = `#${project.baseId}`;
            const image = this.createEl("img");
            image.src = shot.thumb ?? shot.src;
            image.alt = "";
            image.loading = "lazy";
            image.decoding = "async";
            item.appendChild(image);

            const show = () => this.showPreview(shot.src);
            const hide = () => this.hidePreview();
            item.addEventListener("pointerenter", show);
            item.addEventListener("focus", show);
            item.addEventListener("pointerleave", hide);
            item.addEventListener("blur", hide);
            strip.appendChild(item);
        });
        return strip;
    }

    showPreview(src) {
        if (!this.preview || !this.cover) return;

        this.preview.src = src;
        this.cover.classList.add("is-previewing");
    }

    hidePreview() {
        this.cover?.classList.remove("is-previewing");
    }

    descriptionOf(project, text) {
        const custom = project.display?.descriptionId ? text[project.display.descriptionId] : null;
        if (custom) return custom;

        const blocks = text[project.blocksId];
        const first = Array.isArray(blocks) ? blocks.find(block => block?.type === "desc") : null;
        const paragraph = Array.isArray(first?.text) ? first.text[0] : first?.text;
        return paragraph ? new DOMParser().parseFromString(paragraph, "text/html").body.textContent.trim() : "";
    }

    createEl(tag, className = null, text = null) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }
}
