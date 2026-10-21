import { CapsuleCarousel } from "../elements/CapsuleCarousel/CapsuleCarousel.js";
import { CapsuleType } from "../elements/CapsuleCarousel/CapsuleType.js";
import { normalizeMedia } from "../elements/Media.js";
import { projectModel } from "../popup/PopupModels.js";
import { findFeaturedProject } from "./FeaturedSection.js";

const kindOrder = ["GAME", "WEBPAGE", "TOOL"];
const allKind = "ALL";
const blocksId = "project-blocks";

export class ProjectsSection {
    constructor(app) {
        this.app = app;
        this.blocks = [];
        this.tabs = [];
        this.carousels = [];
    }

    render() {
        const renderer = this.app.renderer;
        const data = this.app.projects;
        const projectsText = renderer.t(data.baseId, "projects") ?? {};
        const categoriesText = renderer.t(data.baseId, "categories") ?? {};
        const container = document.getElementById("proj-cap-cnt");

        document.getElementById("proj-title").textContent = renderer.t(data.baseId, data.titleId);
        container.innerHTML = "";

        const featuredId = findFeaturedProject(data)?.baseId;
        const labels = { released: renderer.t("popup", "released"), role: renderer.t("popup", "role"), tags: renderer.t("popup", "tags") };
        const wrapper = document.createElement("div");
        wrapper.id = blocksId;
        wrapper.setAttribute("role", "tabpanel");

        data.categories.forEach(category => {
            const type = CapsuleType[category.type] ? category.type : "GAME";
            const entries = [];

            category.projects.forEach(project => {
                const text = projectsText[project.baseId];
                if (!text) {
                    console.log(`WARNING: [ProjectsSection] No text for "${data.baseId}.projects.${project.baseId}".`);
                    return;
                }

                this.app.popups.set(project.baseId.toLowerCase(), () => projectModel(project, text, labels));
                if (project.baseId !== featuredId) entries.push({ project, text });
            });

            if (!entries.length) return;

            const title = category.titleId ? categoriesText[category.titleId] ?? null : null;
            const block = document.createElement("div");
            block.className = "project-block";
            block.dataset.kind = type;
            wrapper.appendChild(block);
            this.blocks.push(block);

            if (type === "TOOL") this.renderToolGrid(block, title, entries);
            else this.renderCapsules(block, type, title, entries, category.maxVisible);
        });

        if (!this.blocks.length) return;

        const kinds = kindOrder.filter(kind => this.blocks.some(block => block.dataset.kind === kind));
        container.append(this.buildFilters(data.baseId, kinds), wrapper);
        this.select(allKind);
    }

    renderCapsules(block, type, title, entries, maxVisible) {
        const capsules = entries.map(({ project, text }) => {
            const media = project.media ?? {};
            const alt = text[project.imgAltId] ?? null;

            return {
                id: project.baseId,
                title: text[project.titleId],
                img: media.capsuleImg ? { media: media.capsuleImg, alt } : null,
                video: media.capsuleVideo ? { media: media.capsuleVideo, alt } : null,
                tags: project.tags ?? null,
                link: project.link ?? null,
                graphic: media.featureGraphic ?? null,
                subtitle: text[project.periodId] ?? null
            };
        });

        this.carousels.push(new CapsuleCarousel({ type, title, capsules, maxVisible }, block));
    }

    renderToolGrid(block, title, entries) {
        if (title) {
            const heading = document.createElement("h3");
            heading.className = "tool-heading";
            heading.textContent = title;
            block.appendChild(heading);
        }

        const grid = document.createElement("div");
        grid.className = "tool-grid";
        entries.forEach(({ project, text }) => grid.appendChild(this.buildToolCard(project, text, title)));
        block.appendChild(grid);
    }

    buildToolCard(project, text, category) {
        const card = document.createElement("a");
        card.className = "tool-card";
        card.href = project.link ?? `#${project.baseId}`;
        if (project.link) {
            card.target = "_blank";
            card.rel = "noopener noreferrer";
        }

        const preview = document.createElement("div");
        preview.className = "tool-thumb";

        const source = normalizeMedia(project.media?.capsuleImg);
        if (source) {
            const image = document.createElement("img");
            image.src = source.src;
            image.alt = text[project.imgAltId] ?? "";
            image.loading = "lazy";
            image.decoding = "async";
            preview.appendChild(image);
        }

        const body = document.createElement("div");
        body.className = "tool-text";
        body.appendChild(this.createLine("tool-title", text[project.titleId]));
        body.appendChild(this.createLine("tool-category", category));
        body.appendChild(this.createLine("tool-meta", text[project.periodId]));

        if (project.displayTags?.length) {
            const tags = document.createElement("div");
            tags.className = "display-tags";
            project.displayTags.forEach(label => tags.appendChild(this.createLine("display-tag", label, "span")));
            body.appendChild(tags);
        }

        card.append(preview, body);
        return card;
    }

    createLine(className, content, tag = "p") {
        const line = document.createElement(tag);
        line.className = className;
        line.textContent = content ?? "";
        line.hidden = !content;
        return line;
    }

    buildFilters(baseId, kinds) {
        const labels = this.app.renderer.t(baseId, "filters") ?? {};
        const bar = document.createElement("div");
        bar.className = "project-filters";
        bar.setAttribute("role", "tablist");
        bar.setAttribute("aria-label", labels.label ?? "");

        [allKind, ...kinds].forEach(kind => {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.className = "project-filter";
            tab.dataset.kind = kind;
            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-controls", blocksId);
            tab.textContent = labels[kind.toLowerCase()] ?? kind;
            tab.addEventListener("click", () => this.select(kind));
            tab.addEventListener("keydown", event => this.handleKey(event, tab));
            bar.appendChild(tab);
            this.tabs.push(tab);
        });

        return bar;
    }

    handleKey(event, tab) {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (event.key !== "Home" && event.key !== "End" && !step) return;

        event.preventDefault();
        const index = this.tabs.indexOf(tab);
        let next = (index + (step ?? 0) + this.tabs.length) % this.tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = this.tabs.length - 1;

        this.tabs[next].focus();
        this.select(this.tabs[next].dataset.kind);
    }

    select(kind) {
        this.tabs.forEach(tab => {
            const selected = tab.dataset.kind === kind;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            tab.classList.toggle("is-selected", selected);
        });

        this.blocks.forEach(block => {
            block.hidden = kind !== allKind && block.dataset.kind !== kind;
        });
    }
}
