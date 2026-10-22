import { ProjectCarousel } from "../elements/ProjectCarousel.js";
import { projectModel } from "../popup/PopupModels.js";
import { summaryOf } from "../text.js";

const variants = { GAME: "game", WEBPAGE: "site", TOOL: "tool" };

export function projectSummary(project, text) {
    return text.shortDesc
        ?? (project.display?.descriptionId ? text[project.display.descriptionId] : null)
        ?? summaryOf(text[project.blocksId]);
}

export class ProjectsSection {
    constructor(app) {
        this.app = app;
        this.carousels = [];
    }

    render() {
        const renderer = this.app.renderer;
        const data = this.app.projects;
        const projectsText = renderer.t(data.baseId, "projects") ?? {};
        const categoriesText = renderer.t(data.baseId, "categories") ?? {};
        const actions = renderer.t(data.baseId, "actions") ?? {};
        const carouselLabels = renderer.t(data.baseId, "carousel") ?? {};
        const container = document.getElementById("proj-cap-cnt");

        document.getElementById("proj-title").textContent = renderer.t(data.baseId, data.titleId);
        container.innerHTML = "";

        const labels = { released: renderer.t("popup", "released"), role: renderer.t("popup", "role"), tags: renderer.t("popup", "tags") };

        data.categories.forEach(category => {
            const variant = variants[category.type] ?? "game";
            const cards = [];

            category.projects.forEach(project => {
                const text = projectsText[project.baseId];
                if (!text) {
                    console.log(`WARNING: [ProjectsSection] No text for "${data.baseId}.projects.${project.baseId}".`);
                    return;
                }

                this.app.popups.set(project.baseId.toLowerCase(), () => projectModel(project, text, labels));
                cards.push(this.toCard(project, text, variant, actions));
            });

            if (!cards.length) return;

            const title = category.titleId ? categoriesText[category.titleId] ?? null : null;
            this.carousels.push(new ProjectCarousel(container, { title, cards, labels: carouselLabels, maxVisible: category.maxVisible }));
        });
    }

    toCard(project, text, variant, actions) {
        const media = project.media ?? {};
        const name = text[project.titleId] ?? "";
        const special = text[project.display?.badgeId ?? "badge"] ?? project.displayTags?.[0] ?? null;
        const wide = media.featureGraphic ?? media.banner ?? null;

        let image = media.capsuleImg ?? null;
        let imageIsIcon = false;
        let icon = media.icon ?? null;

        if (variant !== "game") icon = icon ?? media.capsuleImg ?? null;

        if (variant === "site") {
            image = wide;
            if (!image && media.capsuleImg) {
                image = media.capsuleImg;
                imageIsIcon = true;
            }
        }

        return {
            id: project.baseId,
            variant,
            name,
            description: projectSummary(project, text),
            tags: project.tags ?? [],
            special,
            image,
            imageIsIcon,
            icon,
            preview: media.capsuleVideo ?? null,
            alt: text[project.imgAltId] ?? name,
            href: project.link ?? `#${project.baseId}`,
            external: Boolean(project.link),
            action: project.link ? actions.visit ?? "Visit site" : actions[variant] ?? actions.game ?? "View project"
        };
    }
}
