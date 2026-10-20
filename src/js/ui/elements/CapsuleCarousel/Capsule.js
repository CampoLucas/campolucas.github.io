import { createMedia, loadMedia, normalizeMedia, playMedia, pauseMedia } from "../Media.js";

const titleId = "cap-title";
const imgId = "cap-banner-img";
const videoId = "cap-banner-video";
const linkId = "cap-link";
const tagCntId = "cap-tag-cnt";
const iconId = "cap-icon-img";
const bandIconId = "cap-band-icon";
const subtitleId = "cap-sub";

const canHover = window.matchMedia("(hover: hover)").matches;

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

        const iconEl = this.element.querySelector(`#${iconId}`);
        const bandIconEl = this.element.querySelector(`#${bandIconId}`);
        const subtitleEl = this.element.querySelector(`#${subtitleId}`);
        const isWeb = !!iconEl;

        const img = normalizeMedia(isWeb ? data.graphic : data.img?.media);
        if (img) {
            const el = this.element.querySelector(`#${imgId}`);
            if (el) {
                if (img.width) el.width = img.width;
                if (img.height) el.height = img.height;
                el.alt = data.img?.alt ?? "";
                el.src = img.src;
            }
        }

        if (isWeb) {
            const icon = normalizeMedia(data.img?.media);
            [iconEl, bandIconEl].forEach(el => {
                if (!el) return;
                if (icon) el.src = icon.src;
                else el.remove();
            });

            if (img) bandIconEl?.remove();
            else {
                this.element.querySelector(`#${imgId}`)?.remove();
                this.element.classList.add("no-graphic");
            }

            if (subtitleEl) {
                subtitleEl.textContent = data.subtitle ?? "";
                subtitleEl.hidden = !data.subtitle;
            }
        }

        const placeholder = this.element.querySelector(`#${videoId}`);
        if (placeholder) {
            const preview = data.video && canHover
                ? createMedia(data.video.media, { lazy: true, className: "capsule-video" })
                : null;

            if (preview) {
                placeholder.replaceWith(preview);
                this.bindPreview(preview);
            }
            else {
                placeholder.remove();
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

    bindPreview(preview) {
        const start = () => {
            loadMedia(preview);
            playMedia(preview);
        };
        const stop = () => pauseMedia(preview);

        this.element.addEventListener("pointerenter", start);
        this.element.addEventListener("focus", start);
        this.element.addEventListener("pointerleave", stop);
        this.element.addEventListener("blur", stop);
    }
}
