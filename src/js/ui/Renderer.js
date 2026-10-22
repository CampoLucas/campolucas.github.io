import { MediaCarousel } from "./elements/MediaCarousel.js";
import { normalizeMedia } from "./elements/Media.js";
import { ProjectCarousel } from "./elements/ProjectCarousel.js";
import { ExperienceSection } from "./sections/ExperienceSection.js";
import { FeaturedSection } from "./sections/FeaturedSection.js";
import { ProjectsSection } from "./sections/ProjectsSection.js";
import { SkillsSection } from "./sections/SkillsSection.js";
import { SideNav } from "./SideNav.js";

export class Renderer {
    constructor(app) {
        this.app = app;
        this.carousels = [];
        this.customCarousels = [];
    }

    init() {
        this.safely("renderHero", () => this.renderHero());
        this.safely("ExperienceSection", () => new ExperienceSection(this.app).render());
        this.safely("FeaturedSection", () => new FeaturedSection(this.app).render());
        this.safely("ProjectsSection", () => new ProjectsSection(this.app).render());
        this.safely("SkillsSection", () => new SkillsSection(this.app).render());
        this.safely("renderAbout", () => this.renderAbout());
        this.safely("renderFooter", () => this.renderFooter());
        this.safely("renderCustomSections", () => this.renderCustomSections());
        this.safely("SideNav", () => new SideNav(this.app).init());
    }

    safely(name, render) {
        try {
            render();
        }
        catch (err) {
            console.log(`WARNING: [${name}] failed: ${err}`);
        }
    }

    renderCustomSections() {
        const sections = this.app.sections?.sections;
        if (!Array.isArray(sections)) return;

        const tails = new Map();
        let count = 0;

        sections.forEach(section => {
            let element = null;
            try {
                element = this.buildCustomSection(section);
            }
            catch (err) {
                console.log(`WARNING: [renderCustomSections] Section "${section?.baseId}" failed: ${err}`);
            }
            if (!element) return;

            const anchor = tails.get(section.after) ?? this.findSectionAnchor(section.after);
            if (!anchor) return;

            element.classList.add(count % 2 === 0 ? "fade" : "section--flat");
            count += 1;

            (anchor.closest(".section-group") ?? anchor).after(element);
            tails.set(section.after, element);
        });
    }

    findSectionAnchor(after) {
        if (after) {
            const found = document.querySelector(`main [data-section="${CSS.escape(after)}"]`);
            if (found) return found;
        }
        const all = document.querySelectorAll("main [data-section]");
        return all.length ? all[all.length - 1] : null;
    }

    buildCustomSection(section) {
        const baseId = section.baseId;
        if (!baseId) return null;

        const element = document.createElement("section");
        element.classList.add("section", "section--custom");
        element.dataset.section = baseId;
        element.id = baseId;

        const title = document.createElement("h2");
        title.classList.add("section-title");
        title.id = `${baseId}-title`;
        title.textContent = this.t(baseId, section.titleId) ?? "";
        element.appendChild(title);
        element.setAttribute("aria-labelledby", title.id);

        const subtitleText = section.subtitleId ? this.t(baseId, section.subtitleId) : null;
        if (subtitleText) {
            const subtitle = document.createElement("p");
            subtitle.classList.add("section-subtitle");
            subtitle.textContent = subtitleText;
            element.appendChild(subtitle);
        }

        switch (section.layout) {
            case "text":
                this.renderTextSection(element, section);
                break;
            case "tags":
                this.renderTagsSection(element, section);
                break;
            case "cards":
                this.renderCardsSection(element, section);
                break;
            case "capsules":
                this.renderCapsulesSection(element, section);
                break;
            default:
                console.log(`WARNING: [buildCustomSection] Unknown layout "${section.layout}" in section "${baseId}".`);
                return null;
        }

        return element;
    }

    renderTextSection(element, section) {
        const baseId = section.baseId;

        const body = document.createElement("div");
        body.classList.add("section-text");
        element.appendChild(body);
        this.renderParagraphs(body, this.t(baseId, section.descriptionId));

        if (section.buttons && section.buttons.length) {
            const buttons = document.createElement("div");
            buttons.classList.add("section-links");
            element.appendChild(buttons);
            this.renderContactButtons(buttons, section.buttons, baseId);
        }
    }

    renderTagsSection(element, section) {
        const container = document.createElement("div");
        container.classList.add("section-text");
        element.appendChild(container);
        this.renderCustomText(container, this.t(section.baseId, section.blocksId));
    }

    renderCardsSection(element, section) {
        const container = document.createElement("ul");
        container.classList.add("entry-list");
        element.appendChild(container);

        const items = Array.isArray(section.items) ? section.items : [];
        new ExperienceSection(this.app).renderRows(container, section.baseId, items);
    }

    renderCapsulesSection(element, section) {
        const baseId = section.baseId;
        element.classList.add("section--carousels");
        const container = document.createElement("div");
        element.appendChild(container);

        const projectsText = this.t(baseId, "projects") ?? {};
        const categoriesText = this.t(baseId, "categories") ?? {};
        const actions = this.t("projects", "actions") ?? {};
        const labels = this.t("projects", "carousel") ?? {};
        const variants = { GAME: "game", WEBPAGE: "site", TOOL: "tool" };
        const categories = Array.isArray(section.categories) ? section.categories : [];

        categories.forEach(category => {
            const variant = variants[category.type] ?? "game";
            const cards = [];
            (category.projects ?? []).forEach(project => {
                const text = projectsText[project.baseId];
                if (!text || !project.link) return;
                const media = project.media ?? {};
                const name = text[project.titleId] ?? "";
                const siteImage = media.featureGraphic ?? null;
                cards.push({
                    id: project.baseId,
                    variant,
                    name,
                    description: text.shortDesc ?? text.description ?? "",
                    tags: project.tags ?? [],
                    special: text.badge ?? null,
                    image: variant === "site" ? siteImage ?? media.capsuleImg ?? null : media.capsuleImg ?? null,
                    imageIsIcon: variant === "site" && !siteImage,
                    icon: media.icon ?? (variant !== "game" ? media.capsuleImg ?? null : null),
                    preview: media.capsuleVideo ?? null,
                    alt: text[project.imgAltId] ?? name,
                    href: project.link,
                    external: true,
                    action: actions.visit ?? "Visit site"
                });
            });

            if (!cards.length) return;
            const title = category.titleId ? categoriesText[category.titleId] ?? null : null;
            this.customCarousels.push(new ProjectCarousel(container, { title, cards, labels, maxVisible: category.maxVisible }));
        });
    }

    renderHero() {
        const data = this.app.home.hero;
        const baseId = data.baseId;

        this.renderStylizedText(document.getElementById("hero-title"), this.t(baseId, data.titleId));

        const roles = this.t(baseId, data.rolesId);
        document.getElementById("hero-roles").textContent = Array.isArray(roles) ? roles.join(" · ") : roles ?? "";
        document.getElementById("hero-description").textContent = this.t(baseId, data.descriptionId ?? "description") ?? "";

        const heroImg = document.getElementById("hero-pic");
        const heroPic = normalizeMedia(data.picture.img);
        if (heroPic && heroImg.getAttribute("src") !== heroPic.src) {
            heroImg.src = heroPic.src;
        }
        heroImg.alt = this.t(baseId, data.picture.altId) ?? "";
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            document.getElementById("hero-shapes")?.pauseAnimations();
        }

        const links = document.getElementById("hero-links");
        links.setAttribute("aria-label", this.t(baseId, "linksLabel") ?? "Contact and profiles");
        this.renderContactButtons(links, data.buttons, baseId);
    }

    renderAbout() {
        const data = this.app.home.about;
        const baseId = data.baseId;

        document.getElementById("about-title").textContent = this.t(baseId, data.titleId);

        const picture = normalizeMedia(data.picture?.img);
        const img = document.getElementById("about-pic");
        if (picture) {
            img.src = picture.src;
            img.alt = this.t(baseId, data.picture.altId) ?? "";
        }
        else {
            img.closest(".about__avatar").remove();
        }

        const paragraphs = this.t(baseId, data.descriptionId ?? "description");
        this.renderParagraphs(document.getElementById("about-desc"), Array.isArray(paragraphs) ? paragraphs : paragraphs ? [paragraphs] : null);

        const links = document.getElementById("about-links");
        links.setAttribute("aria-label", this.t("hero", "linksLabel") ?? "Contact and profiles");
        this.renderContactButtons(links, data.buttons, baseId);
    }

    renderFooter() {
        const data = this.app.home.footer;
        if (!data) return;

        const baseId = data.baseId;
        const email = data.contact?.email ?? this.app.home.about?.contact?.email ?? null;

        document.getElementById("footer-title").textContent = this.t(baseId, data.titleId) ?? "";

        const link = document.getElementById("footer-email");
        if (email) {
            link.href = `mailto:${email}`;
            link.textContent = email;
        }
        else {
            link.remove();
        }

        const copy = this.t(baseId, data.copyId) ?? "";
        document.getElementById("footer-copy").textContent = copy.replace("{year}", String(new Date().getFullYear()));
    }

    addImgCarousel(container, template, images, alt) {
        container.innerHTML = "";

        const clone = template.content.firstElementChild.cloneNode(true);
        container.appendChild(clone);

        this.carousels.push(new MediaCarousel(clone, 5, 4000, images, alt));
    }

    destroyCarouselsIn(root) {
        this.carousels = this.carousels.filter(carousel => {
            if (!root.contains(carousel.root)) return true;

            carousel.destroy();
            return false;
        });
    }

    t(baseId, key) {
        return (
            this.app.lang?.[baseId]?.[key] ??
            this.app.defaultLang?.[baseId]?.[key] ??
            null
        );
    }

    tPath(baseId, path) {
        const keys = path.split(".");
        const read = root => keys.reduce((node, key) => node?.[key], root?.[baseId]) ?? null;
        return read(this.app.lang) ?? read(this.app.defaultLang);
    }

    lookup(source, key) {
        if (!key) return null;
        return typeof source === "string" ? this.t(source, key) : source?.[key] ?? null;
    }

    renderStylizedText(container, blocks) {
        container.innerHTML = "";

        if (!blocks) return;

        blocks.forEach((block, i) => {
            if (!block) {
                console.log(`WARNING: [renderStylizedText] Block from the index ${i} is null.`);
                return;
            }

            const span = document.createElement("span");
            span.textContent = block.text;
            span.className = block.style;
            container.appendChild(span);
        });
    }

    renderCustomText(container, blocks) {
        container.innerHTML = "";

        if (!blocks) return;

        blocks.forEach((block, i) => {
            if (!block) {
                console.log(`WARNING: [renderCustomText] Block from the index ${i} is null.`);
                return;
            }

            switch (block.type) {
                case "desc":
                    container.appendChild(this.getDescEl(block));
                    break;
                case "ul":
                    container.appendChild(this.getUlEl(block, "list"));
                    break;
                case "hr-ul":
                    container.appendChild(this.getUlEl(block, "info-tags", "info-tag", false));
                    break;
            }
        });
    }

    getBlockCntEl() {
        const cntEl = document.createElement("div");
        cntEl.classList.add("block-cnt");

        return cntEl;
    }

    getDescEl(block) {
        const cntEl = this.getBlockCntEl();

        if (block.title) {
            const titleEl = document.createElement("h4");
            titleEl.innerHTML = block.title;
            cntEl.appendChild(titleEl);
        }

        const paragraphs = Array.isArray(block.text) ? block.text : [block.text];
        paragraphs.forEach(text => {
            const el = document.createElement("p");
            el.innerHTML = text;
            cntEl.appendChild(el);
        });

        return cntEl;
    }

    getUlEl(block, styleClass, itemClass = null, isList = true) {
        const cntEl = this.getBlockCntEl();

        if (block.title) {
            const titleEl = document.createElement("h4");
            titleEl.innerHTML = block.title;
            cntEl.appendChild(titleEl);
        }

        if (!block.items) return cntEl;

        const ulEl = document.createElement(isList ? "ul" : "div");
        ulEl.classList.add(styleClass);
        block.items.forEach(item => {
            const liEl = document.createElement(isList ? "li" : "div");
            liEl.innerHTML = item;

            if (itemClass) {
                liEl.classList = itemClass;
            }

            ulEl.appendChild(liEl);
        });

        cntEl.appendChild(ulEl);

        return cntEl;
    }

    renderParagraphs(container, paragraphs, classes = null) {
        container.innerHTML = "";

        if (!paragraphs) return;

        paragraphs.forEach(text => {
            const p = document.createElement("p");
            if (classes && classes.length !== 0) {
                classes.forEach(c => {
                    if (c) p.classList.add(c);
                });
            }
            p.textContent = text;
            container.appendChild(p);
        });
    }

    renderContactButtons(container, buttons, source = null) {
        container.innerHTML = "";

        if (!buttons) return;

        buttons.forEach((btn, i) => {
            if (!btn) {
                console.log(`WARNING: [renderContactButtons] Button from the index ${i} is null.`);
                return;
            }

            if (btn.disabled) return;

            const isLink = btn.type && btn.type !== "email";
            const a = document.createElement("a");

            a.href = isLink ? btn.link : `mailto:${btn.link}`;

            if (btn.classList) {
                btn.classList.forEach(className => a.classList.add(className));
            }

            if (btn.label) {
                a.textContent = this.lookup(source, btn.label);
            }

            const hover = this.lookup(source, btn.hoverTextId);
            if (hover) {
                a.title = hover;
                if (!btn.label) a.setAttribute("aria-label", hover);
            }

            if (isLink && btn.newTab) {
                a.target = "_blank";
                a.rel = "noopener noreferrer";
            }

            container.appendChild(a);
        });
    }
}
