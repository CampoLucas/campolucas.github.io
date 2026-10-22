import { buildEntryCard } from "../elements/EntryCard.js";

export class SkillsSection {
    constructor(app) {
        this.app = app;
    }

    render() {
        const renderer = this.app.renderer;
        const data = this.app.skills?.skills;
        if (!data) return;

        document.getElementById("skills-title").textContent = renderer.t(data.baseId, data.titleId) ?? "";

        const container = document.getElementById("skills-cnt");
        container.innerHTML = "";

        (data.columns ?? []).forEach(column => {
            container.appendChild(this.buildCard(renderer.tPath(data.baseId, column.titleId), column.items ?? [], column));
        });

        (data.rows ?? []).forEach(row => {
            const labels = (row.itemsId ?? [])
                .map(path => renderer.tPath(data.baseId, path))
                .filter(Boolean)
                .map(entry => (entry.desc && !row.titleOnly ? `${entry.title} - ${entry.desc}` : entry.title));

            container.appendChild(this.buildCard(renderer.tPath(data.baseId, row.titleId), labels, row));
        });
    }

    buildCard(title, items, source) {
        const renderer = this.app.renderer;
        const baseId = this.app.skills.skills.baseId;

        return buildEntryCard({
            initials: source.initials ?? null,
            role: title ?? "",
            description: items.join(" · "),
            tag: source.tagId ? renderer.tPath(baseId, source.tagId) : null,
            multiline: true
        });
    }
}
