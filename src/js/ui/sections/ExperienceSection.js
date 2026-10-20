import { experienceModel } from "../popup/PopupModels.js";

const templateId = "experience-row";

function summaryOf(blocks) {
    const first = Array.isArray(blocks) ? blocks.find(block => block?.type === "desc") : null;
    if (!first) return "";

    const text = Array.isArray(first.text) ? first.text[0] : first.text;
    if (!text) return "";

    return new DOMParser().parseFromString(text, "text/html").body.textContent.trim();
}

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
        const template = document.getElementById(templateId);
        const presentLabel = renderer.t("experience", "present") ?? "";

        entries.forEach(entry => {
            const text = renderer.t(group, entry.baseId);
            if (!text) {
                console.log(`WARNING: [ExperienceSection] No text for "${group}.${entry.baseId}".`);
                return;
            }

            const id = `${group}-${entry.baseId}`;
            this.app.popups.set(id.toLowerCase(), () => experienceModel(entry, text));

            const row = template.content.firstElementChild.cloneNode(true);
            row.href = `#${id}`;

            const logo = row.querySelector(".exp-logo");
            if (entry.logo) {
                logo.src = entry.logo.src;
                logo.alt = text[entry.logo.altId] ?? entry.logo.altDefault ?? "";
            }
            else {
                logo.remove();
            }

            const company = text[entry.companyId];
            const product = entry.productId ? text[entry.productId] : null;

            row.querySelector(".exp-role").textContent = text[entry.roleId] ?? "";
            row.querySelector(".exp-company").textContent = product ? `${company} - ${product}` : company ?? "";
            row.querySelector(".exp-period").textContent = text[entry.periodId] ?? "";
            row.querySelector(".exp-summary").textContent = text[entry.summaryId ?? "summary"] ?? summaryOf(text[entry.blocksId]);

            const present = row.querySelector(".exp-present");
            present.textContent = presentLabel;
            present.hidden = !entry.current;

            container.appendChild(row);
        });
    }
}
