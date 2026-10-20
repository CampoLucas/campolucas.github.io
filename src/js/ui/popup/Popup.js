import { normalizeMedia } from "../elements/Media.js";
import { buildBlock, isMediaBlock } from "./PopupBlocks.js";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select, textarea, video[controls], [tabindex]:not([tabindex='-1'])";
const backgroundVars = {
    baseColor: "--bg-base",
    overlayColor: "--bg-overlay",
    gradientEdgeColor: "--bg-grad-edge"
};

/**
 * Modal page driven by a model from PopupModels.js. The model's config picks the
 * layout and which blocks render, in order. Empty blocks are skipped. Every popup
 * shares one fixed content size.
 */
export class Popup {
    constructor(renderer, onRequestClose) {
        this.renderer = renderer;
        this.onRequestClose = onRequestClose;
        this.root = null;
        this.opener = null;
        this.inerted = [];
        this.pressedOnScroller = false;
        this.handleKey = this.handleKey.bind(this);
    }

    get isOpen() {
        return this.root !== null;
    }

    open() {
        if (this.root) return;

        this.opener = document.activeElement;
        this.buildShell();
        document.body.appendChild(this.root);
        this.lockPage();
        document.addEventListener("keydown", this.handleKey, true);
        this.dialog.focus({ preventScroll: true });
    }

    showSkeleton(template) {
        this.open();
        this.dialog.setAttribute("aria-busy", "true");
        this.body.replaceChildren();
        if (template) this.body.appendChild(template.content.firstElementChild.cloneNode(true));
    }

    show(model) {
        this.open();
        this.renderer.destroyCarouselsIn(this.root);

        const { layout, blocks } = model.config;
        this.root.dataset.layout = layout;
        this.dialog.setAttribute("aria-busy", "false");

        this.renderHeader(model);
        this.renderBackground(model.background);

        const media = this.createColumn("popup-media");
        const info = this.createColumn("popup-info");
        this.body.replaceChildren(media, info);

        blocks.forEach(spec => {
            const isMedia = isMediaBlock(spec);
            if (isMedia && layout === "none") return;

            const element = buildBlock(spec, model, this.renderer, isMedia ? media : info);
            if (element) (isMedia ? media : info).appendChild(element);
        });

        const columns = [media, info].filter(column => column.childElementCount);
        this.body.dataset.columns = String(columns.length);
        this.body.replaceChildren(...columns);
        this.scroller.scrollTop = 0;
    }

    destroy() {
        if (!this.root) return;

        document.removeEventListener("keydown", this.handleKey, true);
        this.renderer.destroyCarouselsIn(this.root);
        this.root.remove();
        this.root = null;
        this.unlockPage();

        const opener = this.opener;
        this.opener = null;
        if (opener && opener.isConnected && typeof opener.focus === "function") {
            opener.focus({ preventScroll: true });
        }
    }

    buildShell() {
        const root = document.createElement("div");
        root.className = "popup";
        root.dataset.layout = "carouselLeft";

        const backgrounds = document.createElement("div");
        backgrounds.className = "bg-cnt";
        backgrounds.innerHTML = `
            <div class="bg-color"></div>
            <div class="bg-img-cnt" hidden><img class="bg-img" alt="" decoding="async"></div>
            <div class="bg-overlay-cnt"><div class="bg-overlay"></div><div class="bg-gradient"></div></div>`;

        const scroller = document.createElement("div");
        scroller.className = "popup-panel";

        const dialog = document.createElement("div");
        dialog.className = "popup-content";
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-labelledby", "popup-title");
        dialog.tabIndex = -1;

        const header = document.createElement("header");
        header.className = "popup-header";

        const logo = document.createElement("img");
        logo.className = "popup-logo";
        logo.width = 56;
        logo.height = 56;
        logo.alt = "";
        logo.hidden = true;

        const heading = document.createElement("div");
        heading.className = "popup-heading";

        const title = document.createElement("h2");
        title.id = "popup-title";
        title.className = "popup-title";

        const subtitle = document.createElement("p");
        subtitle.className = "popup-subtitle";

        const period = document.createElement("p");
        period.className = "popup-period";

        heading.append(title, subtitle, period);

        const close = document.createElement("button");
        close.type = "button";
        close.className = "close-popup";
        close.setAttribute("aria-label", this.renderer.t("popup", "close") ?? "Close");
        close.textContent = "X";
        close.addEventListener("click", () => this.requestClose());

        header.append(logo, heading, close);

        const box = document.createElement("div");
        box.className = "popup-box";

        const body = document.createElement("div");
        body.className = "popup-body";
        box.appendChild(body);

        dialog.append(header, box);
        scroller.appendChild(dialog);
        root.append(backgrounds, scroller);

        scroller.addEventListener("pointerdown", event => {
            this.pressedOnScroller = event.target === scroller;
        });
        scroller.addEventListener("click", event => {
            if (this.pressedOnScroller && event.target === scroller) this.requestClose();
            this.pressedOnScroller = false;
        });

        this.root = root;
        this.scroller = scroller;
        this.dialog = dialog;
        this.backgroundImage = backgrounds.querySelector(".bg-img");
        this.backgroundWrap = backgrounds.querySelector(".bg-img-cnt");
        this.logo = logo;
        this.title = title;
        this.subtitle = subtitle;
        this.period = period;
        this.body = body;
    }

    createColumn(className) {
        const column = document.createElement("div");
        column.className = className;
        return column;
    }

    renderHeader(model) {
        this.title.textContent = model.title ?? "";
        this.subtitle.textContent = model.subtitle ?? "";
        this.subtitle.hidden = !model.subtitle;
        this.period.textContent = model.period ?? "";
        this.period.hidden = !model.period;

        const logo = normalizeMedia(model.logo?.src);
        this.logo.hidden = !logo;
        if (logo) {
            this.logo.src = logo.src;
            this.logo.alt = model.logo.alt ?? "";
        }
    }

    renderBackground(background) {
        Object.values(backgroundVars).forEach(name => this.root.style.removeProperty(name));
        this.backgroundWrap.hidden = true;
        this.backgroundImage.removeAttribute("src");

        if (!background) return;

        Object.entries(backgroundVars).forEach(([key, name]) => {
            if (background[key]) this.root.style.setProperty(name, background[key]);
        });

        const image = normalizeMedia(background.img);
        if (!image) return;

        this.backgroundImage.src = image.src;
        this.backgroundWrap.hidden = false;
    }

    requestClose() {
        if (this.onRequestClose) this.onRequestClose();
        else this.destroy();
    }

    handleKey(event) {
        if (!this.root) return;

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            this.requestClose();
            return;
        }

        if (event.key !== "Tab") return;

        const items = [...this.dialog.querySelectorAll(focusableSelector)].filter(el => el.offsetParent !== null);
        if (!items.length) {
            event.preventDefault();
            this.dialog.focus();
            return;
        }

        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        const outside = !this.dialog.contains(active) || active === this.dialog;

        if (event.shiftKey && (active === first || outside)) {
            event.preventDefault();
            last.focus();
        }
        else if (!event.shiftKey && (active === last || outside)) {
            event.preventDefault();
            first.focus();
        }
    }

    lockPage() {
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.setProperty("--scrollbar-width", `${scrollbar}px`);
        document.body.classList.add("popup-open");

        [...document.body.children].forEach(element => {
            if (element === this.root || element.inert) return;
            if (element.tagName === "SCRIPT" || element.tagName === "TEMPLATE") return;

            element.inert = true;
            this.inerted.push(element);
        });
    }

    unlockPage() {
        document.body.classList.remove("popup-open");
        document.body.style.removeProperty("--scrollbar-width");
        this.inerted.forEach(element => {
            element.inert = false;
        });
        this.inerted = [];
    }
}
