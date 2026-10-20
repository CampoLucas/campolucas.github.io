import { createMedia } from "../elements/Media.js";

const mediaTypes = new Set(["carousel", "video"]);

const builders = {
    carousel(model, renderer, spec, host) {
        if (!model.images?.length) return null;

        const element = document.createElement("div");
        element.className = "popup-block popup-carousel";
        host.appendChild(element);
        renderer.addImgCarousel(element, document.getElementById("game-carousel"), model.images, model.alt);
        return element;
    },

    video(model) {
        const video = createMedia(model.video, { lazy: false, controls: true, alt: model.alt, className: "popup-video" });
        if (!video) return null;

        video.preload = "metadata";
        const element = document.createElement("div");
        element.className = "popup-block popup-video-block";
        element.appendChild(video);
        return element;
    },

    description(model, renderer) {
        return textBlock(model.text?.description, renderer, "popup-description");
    },

    tags(model) {
        if (!model.tags?.length) return null;

        const element = document.createElement("div");
        element.className = "popup-block info-tags popup-tags";
        model.tags.forEach(tag => {
            const item = document.createElement("div");
            item.className = "info-tag";
            item.textContent = tag;
            element.appendChild(item);
        });
        return element;
    },

    links(model, renderer) {
        const buttons = model.buttons?.filter(button => button && !button.disabled);
        if (!buttons?.length) return null;

        const element = document.createElement("div");
        element.className = "popup-block social popup-links";
        renderer.renderContactButtons(element, buttons, model.hoverText);
        return element;
    },

    section(model, renderer, spec) {
        return textBlock(model.text?.[spec.id], renderer, "popup-section");
    }
};

function textBlock(blocks, renderer, className) {
    if (!Array.isArray(blocks) || !blocks.length) return null;

    const element = document.createElement("div");
    element.className = `popup-block ${className}`;
    renderer.renderCustomText(element, blocks);
    return element;
}

export function normalizeBlock(spec) {
    if (typeof spec === "string") return { type: spec };
    if (spec && typeof spec === "object" && spec.type) return spec;
    return null;
}

export function isMediaBlock(spec) {
    return mediaTypes.has(normalizeBlock(spec)?.type);
}

export function buildBlock(spec, model, renderer, host) {
    const block = normalizeBlock(spec);
    const build = block ? builders[block.type] : null;
    return build ? build(model, renderer, block, host) : null;
}
