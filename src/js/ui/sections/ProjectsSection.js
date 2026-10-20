import { Capsule } from "../elements/CapsuleCarousel/Capsule.js";
import { CapsuleType } from "../elements/CapsuleCarousel/CapsuleType.js";
import { projectModel } from "../popup/PopupModels.js";

const kindOrder = ["GAME", "WEBPAGE", "TOOL"];
const allKind = "ALL";
const cardTagLimit = 3;
const gridId = "project-grid";

export class ProjectsSection {
    constructor(app) {
        this.app = app;
        this.cards = [];
        this.tabs = [];
    }

    render() {
        const renderer = this.app.renderer;
        const data = this.app.projects;
        const projectsText = renderer.t(data.baseId, "projects") ?? {};
        const container = document.getElementById("proj-cap-cnt");

        document.getElementById("proj-title").textContent = renderer.t(data.baseId, data.titleId);
        container.innerHTML = "";

        const featuredId = this.app.featured?.projectId;
        const entries = [];

        data.categories.forEach(category => {
            const type = CapsuleType[category.type] ? category.type : "GAME";

            category.projects.forEach(project => {
                const text = projectsText[project.baseId];
                if (!text) {
                    console.log(`WARNING: [ProjectsSection] No text for "${data.baseId}.projects.${project.baseId}".`);
                    return;
                }

                this.app.popups.set(project.baseId.toLowerCase(), () => projectModel(project, text));
                if (project.baseId !== featuredId) entries.push({ project, text, type });
            });
        });

        if (!entries.length) return;

        const grid = document.createElement("div");
        grid.id = gridId;
        grid.className = "project-grid";
        grid.setAttribute("role", "tabpanel");

        entries.forEach(({ project, text, type }) => {
            const capsule = new Capsule(this.capsuleData(project, text), grid, CapsuleType[type].card);
            capsule.element.dataset.kind = type;
            this.cards.push(capsule.element);
        });

        const kinds = kindOrder.filter(kind => entries.some(entry => entry.type === kind));
        container.append(this.buildFilters(data.baseId, kinds), grid);
        this.select(allKind);
    }

    capsuleData(project, text) {
        const media = project.media ?? {};
        const alt = text[project.imgAltId] ?? null;

        return {
            id: project.baseId,
            title: text[project.titleId],
            img: media.capsuleImg ? { media: media.capsuleImg, alt } : null,
            video: media.capsuleVideo ? { media: media.capsuleVideo, alt } : null,
            tags: project.tags ? project.tags.slice(0, cardTagLimit) : null,
            link: project.link ?? null
        };
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
            tab.setAttribute("aria-controls", gridId);
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

        this.cards.forEach(card => {
            card.hidden = kind !== allKind && card.dataset.kind !== kind;
        });
    }
}
