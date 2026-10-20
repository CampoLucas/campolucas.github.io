import { createMedia, loadMedia, normalizeMedia, pauseMedia, playMedia } from "../elements/Media.js";

const sectionId = "featured";
const canHover = window.matchMedia("(hover: hover)").matches;

export class FeaturedSection {
    constructor(app) {
        this.app = app;
    }

    render() {
        const section = document.getElementById(sectionId);
        const data = this.app.featured;
        const project = data ? this.findProject(data.projectId) : null;
        const text = project ? this.app.renderer.t(this.app.projects.baseId, "projects")?.[project.baseId] : null;

        if (!section) return;
        if (!project || !text) {
            section.remove();
            return;
        }

        const copy = key => this.app.renderer.t(data.baseId, key);

        document.getElementById("featured-title").textContent = copy(data.titleId) ?? "";

        const container = document.getElementById("featured-cnt");
        container.innerHTML = "";
        container.appendChild(this.buildCard(data, project, text, copy));
    }

    findProject(id) {
        const categories = this.app.projects.categories ?? [];
        for (const category of categories) {
            const found = category.projects.find(project => project.baseId === id);
            if (found) return found;
        }
        return null;
    }

    buildCard(data, project, text, copy) {
        const card = this.createEl("article", "featured-steam");
        card.appendChild(this.buildCover(data, project, text));
        card.appendChild(this.buildInfo(data, project, text, copy));
        return card;
    }

    buildCover(data, project, text) {
        const media = project.media ?? {};
        const alt = text[project.imgAltId] ?? text[project.titleId] ?? "";

        const cover = this.createEl("a", "featured-cover");
        cover.href = `#${project.baseId}`;
        cover.setAttribute("aria-label", text[project.titleId] ?? "");

        const capsule = normalizeMedia(media.capsuleImg);
        if (capsule) {
            const image = this.createEl("img", "featured-cover-img");
            image.src = capsule.src;
            image.alt = alt;
            image.decoding = "async";
            if (capsule.width) image.width = capsule.width;
            if (capsule.height) image.height = capsule.height;
            cover.appendChild(image);
        }

        const video = canHover ? createMedia(data.video ?? media.capsuleVideo, { lazy: true, className: "featured-cover-video" }) : null;
        if (video) {
            cover.appendChild(video);
            const start = () => {
                loadMedia(video);
                playMedia(video);
            };
            const stop = () => pauseMedia(video);
            cover.addEventListener("pointerenter", start);
            cover.addEventListener("focus", start);
            cover.addEventListener("pointerleave", stop);
            cover.addEventListener("blur", stop);
        }

        return cover;
    }

    buildInfo(data, project, text, copy) {
        const renderer = this.app.renderer;
        const info = this.createEl("div", "featured-info");

        info.appendChild(this.createEl("h3", "featured-name", text[project.titleId]));

        const badge = copy(data.badgeId);
        if (badge) info.appendChild(this.createEl("span", "featured-badge", badge));

        const about = Array.isArray(text[project.blocksId]) ? text[project.blocksId].find(block => block?.type === "desc") : null;
        if (about) info.appendChild(renderer.getDescEl(about));

        if (project.tags?.length) info.appendChild(this.buildTags(project.tags));

        const programmed = copy(data.programmedId);
        if (Array.isArray(programmed) && programmed.length) {
            info.appendChild(this.createEl("h4", "featured-subtitle", copy(data.programmedTitleId)));
            const list = this.createEl("ul", "featured-list");
            programmed.forEach(item => list.appendChild(this.createEl("li", null, item)));
            info.appendChild(list);
        }

        if (data.toolsUsed?.length) {
            info.appendChild(this.createEl("h4", "featured-subtitle", copy(data.toolsTitleId)));
            info.appendChild(this.buildTags(data.toolsUsed));
        }

        const links = this.createEl("div", "featured-links social");
        renderer.renderContactButtons(links, project.buttons, text);
        if (links.childElementCount) info.appendChild(links);

        const more = copy(data.moreBtnId);
        if (more) {
            const row = this.createEl("div", "featured-more-row");
            const button = this.createEl("a", "cta-btn secondary", more);
            button.href = `#${project.baseId}`;
            row.appendChild(button);
            info.appendChild(row);
        }

        return info;
    }

    buildTags(tags) {
        const element = this.createEl("div", "info-tags featured-tags");
        tags.forEach(tag => element.appendChild(this.createEl("div", "info-tag", tag)));
        return element;
    }

    createEl(tag, className = null, text = null) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }
}
