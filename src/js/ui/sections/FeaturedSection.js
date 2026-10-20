const sectionId = "featured";

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

        const renderer = this.app.renderer;
        const copy = key => renderer.t(data.baseId, key);

        document.getElementById("featured-title").textContent = copy(data.titleId) ?? "";

        const container = document.getElementById("featured-cnt");
        container.innerHTML = "";
        this.buildCard(container, data, project, text, copy);
    }

    findProject(id) {
        const categories = this.app.projects.categories ?? [];
        for (const category of categories) {
            const found = category.projects.find(project => project.baseId === id);
            if (found) return found;
        }
        return null;
    }

    buildCard(container, data, project, text, copy) {
        const renderer = this.app.renderer;
        const media = project.media ?? {};

        const card = this.createEl("article", "featured-card");
        container.appendChild(card);

        const head = this.createEl("div", "featured-head");
        head.appendChild(this.createEl("h3", "featured-name", text[project.titleId]));
        const badge = copy(data.badgeId);
        if (badge) head.appendChild(this.createEl("span", "featured-badge", badge));
        card.appendChild(head);

        const main = this.createEl("div", "featured-main");
        card.appendChild(main);

        const gallery = [data.video, ...(data.screenshots ?? media.carouselImages ?? [])].filter(Boolean);
        if (gallery.length) {
            const mediaCnt = this.createEl("div", "featured-media");
            main.appendChild(mediaCnt);
            renderer.addImgCarousel(mediaCnt, document.getElementById("game-carousel"), gallery, text[project.imgAltId]);
        }

        main.appendChild(this.buildSide(data, project, text, copy));

        const details = this.buildDetails(data, copy);
        if (details.childElementCount) card.appendChild(details);
    }

    buildSide(data, project, text, copy) {
        const renderer = this.app.renderer;
        const side = this.createEl("aside", "featured-side");

        const capsule = project.media?.capsuleImg;
        if (capsule) {
            const image = document.createElement("img");
            image.className = "featured-capsule";
            image.src = typeof capsule === "string" ? capsule : capsule.src;
            if (capsule.width) image.width = capsule.width;
            if (capsule.height) image.height = capsule.height;
            image.alt = text[project.imgAltId] ?? "";
            image.loading = "lazy";
            image.decoding = "async";
            side.appendChild(image);
        }

        const about = Array.isArray(text[project.blocksId]) ? text[project.blocksId].find(block => block?.type === "desc") : null;
        if (about) side.appendChild(renderer.getDescEl(about));

        if (project.tags?.length) {
            side.appendChild(this.buildTags(project.tags, "featured-tags"));
        }

        const links = this.createEl("div", "featured-links");
        const buttons = this.createEl("div", "social");
        renderer.renderContactButtons(buttons, project.buttons, text);
        if (buttons.childElementCount) links.appendChild(buttons);

        const more = copy(data.moreBtnId);
        if (more) {
            const link = this.createEl("a", "cta-btn secondary", more);
            link.href = `#${project.baseId}`;
            links.appendChild(link);
        }
        side.appendChild(links);

        return side;
    }

    buildDetails(data, copy) {
        const details = this.createEl("div", "featured-details");

        const programmed = copy(data.programmedId);
        if (Array.isArray(programmed) && programmed.length) {
            const column = this.createEl("div", "featured-column");
            column.appendChild(this.createEl("h4", "featured-subtitle", copy(data.programmedTitleId)));
            const list = this.createEl("ul", "featured-list");
            programmed.forEach(item => list.appendChild(this.createEl("li", null, item)));
            column.appendChild(list);
            details.appendChild(column);
        }

        if (data.toolsUsed?.length) {
            const column = this.createEl("div", "featured-column");
            column.appendChild(this.createEl("h4", "featured-subtitle", copy(data.toolsTitleId)));
            column.appendChild(this.buildTags(data.toolsUsed, "featured-tools"));
            details.appendChild(column);
        }

        return details;
    }

    buildTags(tags, className) {
        const element = this.createEl("div", `info-tags ${className}`);
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
