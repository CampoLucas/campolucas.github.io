const titleId = "cap-title";
const imgId = "cap-banner-img";
const videoId = "cap-banner-video";
const linkId = "cap-link";
const tagCntId = "cap-tag-cnt";

export class Capsule {
    constructor(data, container, tempId) {
        this.cloneTemplate(container, tempId);
        this.populateCapsule(data);
    }

    cloneTemplate(container, tempId) {
        const temp = document.getElementById(tempId);
        this.element = temp.content.firstElementChild.cloneNode(true);

        container.appendChild(this.element);
    }

    populateCapsule(data) {
        // Set the link
        const linkEl = this.element;
        if (linkEl) {
            if (!data.link) {
                linkEl.href = `#${data.id}`;
            }
            else {
                linkEl.href = data.link;
                linkEl.target = "_blank";
            }
        }


        // Set the title
        const titleEl = this.element.querySelector(`#${titleId}`);
        if (titleEl) {
            titleEl.textContent = data.title;
        }

        // Set the banner
        if (data.img) {
            const el = this.element.querySelector(`#${imgId}`);
            if (el) {
                el.src = data.img.media;
            }
        }
        if (data.video) {
            const el = this.element.querySelector(`#${videoId}`);
            if (el) {
                el.src = data.video.media;
            }
        }

        // Set the tags
        if (data.tags) {
            const el = this.element.querySelector(`#${tagCntId}`);
            if (el) {
                data.tags.forEach(tag => {
                    const divEl = document.createElement("div");
                    divEl.classList.add("info-tag");
                    divEl.textContent = tag;
                    el.appendChild(divEl);
                });
            }
        }
        
    }
}