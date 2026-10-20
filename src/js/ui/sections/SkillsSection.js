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

            const title = document.createElement("h3");
            title.textContent = renderer.tPath(data.baseId, column.titleId) ?? "";
            item.appendChild(title);

            column.groups.forEach(group => item.appendChild(this.buildGroup(data.baseId, group)));
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    buildGroup(baseId, group) {
        const renderer = this.app.renderer;
        const element = document.createElement("div");
        element.className = "skills-group";

        if (group.titleId) {
            const title = document.createElement("h4");
            title.className = "skills-group-title";
            title.textContent = renderer.tPath(baseId, group.titleId) ?? "";
            element.appendChild(title);
        }

        if (group.items) {
            element.appendChild(this.buildTags(group.items));
        }

        if (group.itemsId) {
            const labels = group.itemsId
                .map(path => renderer.tPath(baseId, path))
                .filter(Boolean)
                .map(entry => entry.desc ? `${entry.title} - ${entry.desc}` : entry.title);
            element.appendChild(this.buildTags(labels));
        }

        if (group.conceptsId) {
            group.conceptsId.forEach(path => {
                const concept = renderer.tPath(baseId, path);
                if (!concept) return;

                if (!concept.desc) {
                    element.appendChild(this.buildTags([concept.title]));
                    return;
                }

                const name = document.createElement("h5");
                name.className = "skills-concept";
                name.textContent = concept.title;
                element.append(name, this.buildTags(concept.desc.split(", ")));
            });
        }

        return element;
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
