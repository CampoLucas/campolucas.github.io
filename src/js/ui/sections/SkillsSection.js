export class SkillsSection {
    constructor(app) {
        this.app = app;
    }

    render() {
        const renderer = this.app.renderer;
        const data = this.app.skills?.skills;
        if (!data) return;

        document.getElementById("skills-title").textContent = renderer.t(data.baseId, data.titleId) ?? "";
        document.getElementById("skills-subtitle").textContent = renderer.t(data.baseId, data.subtitleId) ?? "";

        const container = document.getElementById("skills-cnt");
        container.innerHTML = "";

        const list = document.createElement("ul");
        list.className = "skills-columns";

        data.columns.forEach(column => {
            const item = document.createElement("li");
            item.className = "skills-column";
            item.appendChild(this.buildHeading("h3", renderer.tPath(data.baseId, column.titleId)));
            item.appendChild(this.buildTags(column.items));
            list.appendChild(item);
        });

        container.appendChild(list);

        (data.rows ?? []).forEach(row => {
            const labels = (row.itemsId ?? [])
                .map(path => renderer.tPath(data.baseId, path))
                .filter(Boolean)
                .map(entry => (entry.desc && !row.titleOnly ? `${entry.title} - ${entry.desc}` : entry.title));

            const element = document.createElement("div");
            element.className = "skills-row";
            element.appendChild(this.buildHeading("h3", renderer.tPath(data.baseId, row.titleId)));
            element.appendChild(this.buildTags(labels));
            container.appendChild(element);
        });
    }

    buildHeading(tag, content) {
        const heading = document.createElement(tag);
        heading.textContent = content ?? "";
        return heading;
    }

    buildTags(items) {
        const tags = document.createElement("div");
        tags.className = "info-tags skill-tags";

        items.forEach(item => {
            const tag = document.createElement("div");
            tag.className = "info-tag";
            tag.textContent = item;
            tags.appendChild(tag);
        });

        return tags;
    }
}
