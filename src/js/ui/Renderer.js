import { MediaCarousel } from "./elements/MediaCarousel.js";
import { normalizeMedia } from "./elements/Media.js";
import { CapsuleCarousel } from "./elements/CapsuleCarousel/CapsuleCarousel.js";
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

            element.classList.add("band");
            element.style.setProperty("--band-bg", count % 2 === 0 ? "var(--band-custom-a)" : "var(--band-custom-b)");
            count += 1;

            anchor.after(element);
            tails.set(section.after, element);
        });
    }

    findSectionAnchor(after) {
        if (after) {
            const found = document.querySelector(`[data-section="${CSS.escape(after)}"]`);
            if (found) return found;
        }
        const all = document.querySelectorAll("main [data-section]");
        return all.length ? all[all.length - 1] : null;
    }

    buildCustomSection(section) {
        const baseId = section.baseId;
        if (!baseId) return null;

        const element = document.createElement("section");
        element.classList.add("section-viewport");
        element.dataset.section = baseId;

        const title = document.createElement("h2");
        title.classList.add("title");
        title.textContent = this.t(baseId, section.titleId) ?? "";
        element.appendChild(title);

        const subtitleText = section.subtitleId ? this.t(baseId, section.subtitleId) : null;
        if (subtitleText) {
            const subtitle = document.createElement("p");
            subtitle.classList.add("sub-title");
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

        const list = document.createElement("ul");
        list.classList.add("about-me-container");
        const item = document.createElement("li");
        item.classList.add("about-me-text");
        list.appendChild(item);
        element.appendChild(list);
        this.renderParagraphs(item, this.t(baseId, section.descriptionId), ["header-description"]);

        if (section.buttons && section.buttons.length) {
            const buttons = document.createElement("div");
            buttons.classList.add("social");
            buttons.style.justifyContent = "center";
            element.appendChild(buttons);
            this.renderContactButtons(buttons, section.buttons, baseId);
        }
    }

    renderTagsSection(element, section) {
        const container = document.createElement("div");
        element.appendChild(container);
        this.renderCustomText(container, this.t(section.baseId, section.blocksId));
    }

    renderCardsSection(element, section) {
        const container = document.createElement("div");
        container.classList.add("experiences-cnt");
        element.appendChild(container);

        const items = Array.isArray(section.items) ? section.items : [];
        new ExperienceSection(this.app).renderRows(container, section.baseId, items);
    }

    renderCapsulesSection(element, section) {
        const baseId = section.baseId;
        const container = document.createElement("div");
        element.appendChild(container);

        const projectsText = this.t(baseId, "projects") ?? {};
        const categoriesText = this.t(baseId, "categories") ?? {};
        const categories = Array.isArray(section.categories) ? section.categories : [];

        categories.forEach(category => {
            const capsules = [];
            (category.projects ?? []).forEach(project => {
                const text = projectsText[project.baseId];
                if (!text) return;
                const imgAlt = text[project.imgAltId];
                const media = project.media ?? {};
                capsules.push({
                    id: project.baseId,
                    title: text[project.titleId],
                    img: media.capsuleImg ? { media: media.capsuleImg, alt: imgAlt ? imgAlt : null } : null,
                    video: media.capsuleVideo ? { media: media.capsuleVideo, alt: imgAlt ? imgAlt : null } : null,
                    tags: project.tags ? project.tags : null,
                    link: project.link ? project.link : null
                });
            });

            const catData = {
                type: category.type,
                title: category.titleId ? categoriesText[category.titleId] ?? null : null,
                capsules: capsules
            };
            this.customCarousels.push(new CapsuleCarousel(catData, container));
        });
    }

    renderHero() {
        const data = this.app.home.hero;
        const baseId = data.baseId;

        this.renderStylizedText(document.getElementById("hero-title"), this.t(baseId, data.titleId));
        this.renderStylizedRoles(document.getElementById("hero-roles"), this.t(baseId, data.rolesId), "hero-role", "ceparator");

        const heroImg = document.getElementById("hero-pic");
        const heroPic = normalizeMedia(data.picture.img);
        if (heroPic && heroImg.getAttribute("src") !== heroPic.src) {
            heroImg.src = heroPic.src;
        }
        heroImg.alt = this.t(baseId, data.picture.altId) ?? "";

        this.renderContactButtons(document.getElementById("hero-btn-cnt"), data.buttons, baseId);
    }

    renderAbout() {
        const data = this.app.home.about;
        const baseId = data.baseId;

        document.getElementById("about-title").textContent = this.t(baseId, data.titleId);
        this.renderParagraphs(document.getElementById("about-desc"), this.t(baseId, data.descriptionId), ["header-description"]);

        const aboutImg = document.getElementById("about-pic");
        if (aboutImg) {
            aboutImg.src = data.picture.img;
            aboutImg.alt = this.t(baseId, data.picture.altId) ?? "";
        }

        this.renderContactInfo(document.getElementById("about-contacts"), data.contact, "contact-link", "contact-sep");
        this.renderContactButtons(document.getElementById("about-buttons"), data.buttons, baseId);
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

    renderStylizedRoles(container, blocks, elementClass, ceparatorClass = null) {
        container.innerHTML = "";

        if (!blocks) return;
        const length = blocks.length;
        for (let i = 0; i < length; i++) {
            const block = blocks[i];
            if (!block) {
                console.log(`WARNING: [renderStylizedRoles] Block from the index ${i} is null.`);
                continue;
            }

            const span = document.createElement("span");
            span.classList.add(elementClass);
            span.textContent = block;
            container.appendChild(span);

            if (ceparatorClass && i < length - 1) {
                const sep = document.createElement("span");
                sep.classList.add(elementClass);
                sep.classList.add(ceparatorClass);
                sep.textContent = " | ";
                container.appendChild(sep);
            }
        }
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

    renderContactInfo(container, contact, contactClass = null, ceparatorClass = null) {
        container.innerHTML = "";

        if (contact?.email) {
            const email = document.createElement("a");
            email.href = `mailto:${contact.email}`;
            email.textContent = contact.email;
            if (contactClass) email.classList.add(contactClass);
            container.appendChild(email);
        }

        const ceparator = document.createElement("span");
        ceparator.textContent = "•";
        if (ceparatorClass) ceparator.classList.add(ceparatorClass);
        container.appendChild(ceparator);

        if (contact?.phone) {
            const phone = document.createElement("a");
            phone.href = `tel:${contact.phone}`;
            phone.textContent = contact.phone;
            if (contactClass) phone.classList.add(contactClass);
            container.appendChild(phone);
        }
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
