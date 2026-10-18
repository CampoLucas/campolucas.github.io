import { CapsuleType } from "./CapsuleType.js";
import { Capsule } from "./Capsule.js";

const tempId = "cap-carousel-temp";
const titleId = "cap-carousel-title";
const capsulesCntId = "cap-cnt";

export class CapsuleCarousel {
    constructor(data, container) {
        this.cloneTemplate(container, tempId);
        this.populateCarousel(data, CapsuleType[data.type].temp);
    }

    cloneTemplate(container, tempId) {
        const temp = document.getElementById(tempId);
        this.element = temp.content.firstElementChild.cloneNode(true);

        container.appendChild(this.element);
    }

    populateCarousel(data, capsuleType) {
        // Set the title
        if (!this.element) {
            console.log("No element found");
        }
        const titleEl = this.element.querySelector(`#${titleId}`);
        titleEl.textContent = data.title;

        this.populateCapsules(data.capsules, this.element.querySelector(`#${capsulesCntId}`), capsuleType);
    }

    populateCapsules(capsData, container, tempId) {
        this.capsules = [];
        capsData.forEach(c => {
            this.capsules.push(new Capsule(c, container, tempId));
        });
    }
}