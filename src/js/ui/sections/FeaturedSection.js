import { createMedia, loadMedia, normalizeMedia, pauseMedia, playMedia } from "../elements/Media.js";

const sectionId = "featured";
const canHover = window.matchMedia("(hover: hover)").matches;

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
        card.appendChild(this.buildCover(project, text));
        card.appendChild(this.buildInfo(project, text));
        this.bindPreview(card);
        return card;
    }

    buildCover(project, text) {
        const display = project.display;
        const media = project.media ?? {};
        const alt = text[project.imgAltId] ?? text[project.titleId] ?? "";

        const cover = this.createEl("div", "featured-cover");

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
        const renderer = this.app.renderer;
        const display = project.display;
        const info = this.createEl("div", "featured-info");

        const title = this.createEl("h3", "featured-name");
        const link = this.createEl("a", "featured-link", text[project.titleId]);
        link.href = `#${project.baseId}`;
        title.appendChild(link);
        info.appendChild(title);

        if (isShown(display, "showDescription")) {
            const description = this.descriptionOf(project, text);
            if (description) info.appendChild(this.createEl("p", "featured-desc", description));
        }

        const footer = this.createEl("div", "featured-footer");

        const badge = isShown(display, "showBadge") ? text[display?.badgeId ?? "badge"] : null;
        if (badge) footer.appendChild(this.createEl("span", "featured-badge", badge));

        if (isShown(display, "showTags") && project.tags?.length) {
            const tags = this.createEl("div", "info-tags featured-tags");
            project.tags.forEach(tag => tags.appendChild(this.createEl("div", "info-tag", tag)));
            footer.appendChild(tags);
        }

        if (isShown(display, "showLinks")) {
            const links = this.createEl("div", "featured-links social");
            renderer.renderContactButtons(links, project.buttons, text);
            if (links.childElementCount) footer.appendChild(links);
        }

        info.appendChild(footer);
        return info;
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
