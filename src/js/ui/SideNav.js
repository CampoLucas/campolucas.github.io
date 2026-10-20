import { sectionIcons, defaultSectionIcon } from "../core/Sections.js";

const svgNs = "http://www.w3.org/2000/svg";
const maxDistance = 4;
const noHover = 9;

/**
 * Scroll-wheel style navigation built from every [data-section] element in the page,
 * in document order. Icons come from core/Sections.js and labels from i18n "nav".
 */
export class SideNav {
    constructor(app) {
        this.app = app;
        this.sections = [];
        this.items = [];
        this.intersecting = new Set();
        this.atEnd = false;
        this.active = -1;
        this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    }

    init() {
        this.sections = [...document.querySelectorAll("[data-section]")];
        if (this.sections.length < 2) return;

        document.body.appendChild(this.build());
        this.observe();
        this.setActive(0);
    }

    build() {
        const nav = document.createElement("nav");
        nav.className = "side-nav";
        nav.setAttribute("aria-label", this.app.renderer.t("nav", "label") ?? "Page sections");

        const list = document.createElement("ul");
        list.className = "side-nav-list";

        this.sections.forEach((section, index) => {
            const id = section.dataset.section;
            const item = document.createElement("li");
            item.className = "side-nav-item";
            item.addEventListener("pointerenter", () => this.setHover(index));
            item.addEventListener("focusin", () => this.setHover(index));

            const button = document.createElement("button");
            button.type = "button";
            button.className = "side-nav-button";
            button.addEventListener("click", () => this.scrollTo(section));

            const label = document.createElement("span");
            label.className = "side-nav-label";
            label.textContent = this.labelFor(section, id);

            button.append(this.createIcon(id), label);
            item.appendChild(button);
            list.appendChild(item);
            this.items.push({ item, button, index });
        });

        nav.addEventListener("pointerleave", () => this.setHover(null));
        nav.addEventListener("focusout", event => {
            if (!nav.contains(event.relatedTarget)) this.setHover(null);
        });

        nav.appendChild(list);
        return nav;
    }

    labelFor(section, id) {
        return this.app.renderer.t("nav", id)
            ?? section.querySelector("h2")?.textContent?.trim()
            ?? id;
    }

    createIcon(id) {
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("class", "side-nav-icon");
        svg.setAttribute("aria-hidden", "true");

        const path = document.createElementNS(svgNs, "path");
        path.setAttribute("d", sectionIcons[id] ?? defaultSectionIcon);
        svg.appendChild(path);
        return svg;
    }

    observe() {
        const band = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) this.intersecting.add(entry.target);
                else this.intersecting.delete(entry.target);
            });
            this.update();
        }, { rootMargin: "-50% 0px -50% 0px" });

        const end = new IntersectionObserver(entries => {
            this.atEnd = entries[entries.length - 1].isIntersecting;
            this.update();
        }, { threshold: 1 });

        this.sections.forEach(section => band.observe(section));
        end.observe(this.sections[this.sections.length - 1]);
    }

    update() {
        const last = this.sections.length - 1;
        const index = this.atEnd ? last : this.sections.findIndex(section => this.intersecting.has(section));
        if (index >= 0) this.setActive(index);
    }

    setActive(index) {
        if (index === this.active) return;
        this.active = index;

        this.items.forEach(({ item, button, index: itemIndex }) => {
            const distance = Math.min(Math.abs(itemIndex - index), maxDistance);
            item.style.setProperty("--scroll-d", String(distance));
            item.classList.toggle("is-active", distance === 0);

            if (distance === 0) button.setAttribute("aria-current", "true");
            else button.removeAttribute("aria-current");
        });
    }

    setHover(index) {
        this.items.forEach(({ item, index: itemIndex }) => {
            const distance = index === null ? noHover : Math.min(Math.abs(itemIndex - index), maxDistance);
            item.style.setProperty("--hover-d", String(distance));
            item.classList.toggle("is-hovered", itemIndex === index);
        });
    }

    scrollTo(section) {
        section.scrollIntoView({
            behavior: this.reducedMotion.matches ? "auto" : "smooth",
            block: "start"
        });
    }
}
