import { experienceModel } from "../popup/PopupModels.js";
import { buildEntryCard } from "../elements/EntryCard.js";
import { summaryOf } from "../text.js";

export class ExperienceSection {
    constructor(app) {
        this.app = app;
    }

    render() {
        const data = this.app.experience.experience;
        const container = document.getElementById("experiences-cnt");

        document.getElementById("experience-title").textContent = this.app.renderer.t(data.baseId, data.titleId);
        container.innerHTML = "";
        this.renderRows(container, data.baseId, data.experiences);
    }

    renderRows(container, group, entries) {
        const renderer = this.app.renderer;
        const presentLabel = renderer.t("experience", "present") ?? "";

        (entries ?? []).forEach(entry => {
            const text = renderer.t(group, entry.baseId);
            if (!text) {
                console.log(`WARNING: [ExperienceSection] No text for "${group}.${entry.baseId}".`);
                return;
            }

            const id = `${group}-${entry.baseId}`;
            const blocks = text[entry.blocksId];
            const opensPopup = (Array.isArray(blocks) && blocks.length > 0) || (entry.images?.length ?? 0) > 0;
            if (opensPopup) this.app.popups.set(id.toLowerCase(), () => experienceModel(entry, text));

            const company = text[entry.companyId];
            const product = entry.productId ? text[entry.productId] : null;
            const role = text[entry.roleId] ?? "";

            container.appendChild(buildEntryCard({
                href: opensPopup ? `#${id}` : null,
                logo: entry.logo ? { src: entry.logo.src, alt: text[entry.logo.altId] ?? entry.logo.altDefault ?? "" } : null,
                initials: entry.initials ?? null,
                role,
                company: product ? `${company} · ${product}` : company ?? "",
                range: text[entry.periodId] ?? "",
                description: text[entry.summaryId ?? "summary"] ?? summaryOf(blocks),
                tag: entry.current ? presentLabel : text[entry.tagId ?? "tag"] ?? null
            }));
        });
    }
}
