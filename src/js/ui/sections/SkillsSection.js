import { createEl, initialsOf } from "../text.js";

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
            container.appendChild(this.buildGroup(renderer.tPath(data.baseId, column.titleId), column.items ?? [], column));
        });

        (data.rows ?? []).forEach(row => {
            const labels = (row.itemsId ?? [])
                .map(path => renderer.tPath(data.baseId, path))
                .filter(Boolean)
                .map(entry => (entry.desc && !row.titleOnly ? `${entry.title} - ${entry.desc}` : entry.title));

            container.appendChild(this.buildGroup(renderer.tPath(data.baseId, row.titleId), labels, row));
        });
    }

    buildGroup(title, items, source) {
        const renderer = this.app.renderer;
        const baseId = this.app.skills.skills.baseId;
        const group = createEl("li", "skill-group");

        const icon = createEl("span", "skill-group__icon", source.initials ?? initialsOf(title));
        icon.setAttribute("aria-hidden", "true");

        const body = createEl("div", "skill-group__body");
        const head = createEl("div", "skill-group__head");
        head.appendChild(createEl("h3", "skill-group__title", title ?? ""));

        const special = source.tagId ? renderer.tPath(baseId, source.tagId) : null;
        if (special) head.appendChild(createEl("span", "special-tag", special));

        const tags = createEl("ul", "tags skill-group__tags");
        items.filter(Boolean).forEach(item => tags.appendChild(createEl("li", "tag", item)));

        body.append(head, tags);
        group.append(icon, body);
        return group;
    }
}
