import { MediaCarousel } from "./elements/MediaCarousel.js";
import { CapsuleCarousel } from "./elements/CapsuleCarousel/CapsuleCarousel.js";

// HTML Ids
const projectsTitle = "proj-title";
const projectsCarouselCnt = "proj-cap-cnt";

export class Renderer {
    constructor(app) {
        this.app = app;
        this.carousels = [];
    }

    init() {
        this.renderHero();
        this.renderAbout();
        this.renderExperiences();
        this.renderProjects();

    }

    renderHero() {
        if (!this.app) {
        }
        const data = this.app.home.hero;
        const baseId = data.baseId;
        
        // Title
        const heroTitleEl = document.getElementById("hero-title");
        const heroTitleBlocks = this.t(baseId, data.titleId);
        this.renderStylizedText(heroTitleEl, heroTitleBlocks);

        // Roles
        const heroRolesEl = document.getElementById("hero-roles");
        const heroRoles = this.t(baseId, data.rolesId);
        this.renderStylizedRoles(heroRolesEl, heroRoles, "hero-role", "ceparator");

        // Image
        const heroImg = document.getElementById("hero-pic");
        heroImg.src = data.picture.img;
        heroImg.alt = this.t(baseId, data.picture.altId) ?? "";

        // Buttons
        const btnCnt = document.getElementById("hero-btn-cnt");
        this.renderContactButtons(btnCnt, data.buttons, baseId);
        
    }

    renderAbout() {
        const data = this.app.home.about;
        const baseId = data.baseId;

        // Title
        const titleEl = document.getElementById("about-title");
        titleEl.textContent = this.t(baseId, data.titleId);

        // Description
        const aboutDescEl = document.getElementById("about-desc");
        const aboutParagraphs = this.t(baseId, data.descriptionId);
        this.renderParagraphs(aboutDescEl, aboutParagraphs, ["header-description"]);

        // Image
        const aboutImg = document.getElementById("about-pic");
        if (aboutImg) {
            aboutImg.src = data.picture.img;
            aboutImg.alt = this.t(baseId, data.picture.altId) ?? "";
        }

        // Contacts
        const contactsEl = document.getElementById("about-contacts");
        this.renderContactInfo(contactsEl, data.contact, "contact-link", "contact-sep");

        // Buttons
        const buttonsEl = document.getElementById("about-buttons");
        this.renderContactButtons(buttonsEl, data.buttons, baseId);
    }

    renderExperiences() {
        const experience = this.app.experience.experience;
        const baseId = experience.baseId;
        

        // Title
        const titleEl = document.getElementById("experience-title");
        titleEl.textContent = this.t(baseId, experience.titleId);

        // test
        const experiencesEl = document.getElementById("experiences-cnt");
        experiencesEl.innerHTML = "";
        
        const experiences = experience.experiences;
        const temp = document.getElementById("game-experience");
        for (let i = 0; i < experiences.length; i++) {
            this.renderExperience(experiencesEl, temp, experiences[i], this.t(baseId, experiences[i].baseId));
        }
    }

    renderProjects() {
        const data = this.app.projects;
        const baseId = data.baseId;
        
        // Title
        const heroTitleEl = document.getElementById(projectsTitle);
        heroTitleEl.textContent = this.t(baseId, data.titleId);

        // Add carousels
        const projectsCnt = document.getElementById(projectsCarouselCnt);
        if (!projectsCnt) {
            console.log(`WARNING: The project's carousel container with the id: ${projectsCarouselCnt} wasn't found`);
            return;
        }

        // Render each category
        if (!data.categories || data.categories.length === 0) {
            console.log("No categories");
        }

        this.projCategories = [];
        for (let i = 0; i < data.categories.length; i++) {
            const capsules = [];

            const category = data.categories[i];
            const projects = category.projects;

        
            projects.forEach(project => {
                const projId = project.baseId;

                const imgAlt = this.t(baseId, "projects")[projId][project.imgAltId];
                capsules.push({
                    id: projId,
                    title: this.t(baseId, "projects")[projId][project.titleId],
                    img: project.media.capsuleImg ? { media: project.media.capsuleImg, alt: imgAlt ? imgAlt : null } : null,
                    video: project.media.capsuleVideo ? { media: project.media.capsuleVideo, alt: imgAlt ? imgAlt : null } : null,
                    tags: project.tags ? project.tags : null,
                    link: project.link ? project.link : null
                });
            })
            
            const catData = {
                type: category.type,
                title: category.titleId ? this.t(baseId, "categories")[category.titleId] : null,
                capsules: capsules,
            };

            this.projCategories.push(new CapsuleCarousel(catData, projectsCnt));
            
        }
        
    }

    renderExperience(container, template, block, baseId) {
        // Clone template
        const clone = template.content.firstElementChild.cloneNode(true);
        container.appendChild(clone);
        
        // Set the title section
        const headerEl = clone.querySelector("#exp-header");

        if (headerEl) {
            const imgEl = headerEl.querySelector('img');
            if (imgEl){
                if (block.logo){
                    imgEl.src = block.logo.src;
                    imgEl.alt = baseId[block.logo.altId] ? baseId[block.logo.altId] : block.logo.altDefault;
                }
                else {
                    
                    imgEl.classList.add("hidden");
                }
            }
        }
        const titleEl = clone.querySelector("#exp-role");
        titleEl.innerHTML = `${baseId[block.roleId]}`;
        
        const subTitle = clone.querySelector("#exp-company");

        const subtitleText = block.productId ? `${baseId[block.companyId]} - ${baseId[block.productId]}` : `${baseId[block.companyId]}`;
        subTitle.textContent = subtitleText;
        
        const thirdTitle = clone.querySelector("#exp-period");
        thirdTitle.textContent = `${baseId[block.periodId]}`;

        // Add the img carousel
        const imgCnt = clone.querySelector("#carousel-cnt");
        if (block && block.images && block.images.length >= 0){

            const carouselTemp = document.getElementById("game-carousel");
            this.addImgCarousel(imgCnt, carouselTemp, block.images, baseId[block.productId]);
        }
        else {
            imgCnt.classList.add("hidden");
        }

        // Add the experience description
        const descCnt = clone.querySelector("#description-cnt");
        this.renderCustomText(descCnt, baseId[block.blocksId]);

        // Skills
        const skillEl = clone.querySelector("#skills-cnt");
        if (skillEl) {
            if (block.skillsId && baseId[block.skillsId]) {
                this.renderCustomText(skillEl, baseId[block.skillsId]);
            }
            else {
                skillEl.classList.add("hidden");
            }
        }

        // Buttons
        const btnCnt = clone.querySelector("#links-btn-cnt");
        this.renderContactButtons(btnCnt, block.buttons, baseId);

    }

    renderProject(container, template, block, baseId) {
        // Set background
        const img = document.getElementById("bg-popup");
        const media = block.media;
        const hasMedia = media;
        this.applyPopupBackground(media);
        
        const clone = template.content.firstElementChild.cloneNode(true);
        container.appendChild(clone);

        // Set the title section
        console.log(`base id is ${baseId}`);
        const titleEl = clone.querySelector("#project-title");
        titleEl.textContent = `${baseId[block.titleId]}`;

        const thirdTitle = clone.querySelector("#project-period");
        thirdTitle.textContent = `${baseId[block.periodId]}`;

        // Add the img carousel
        if (hasMedia && media.carouselImages) {
            const imgCnt = clone.querySelector("#carousel-cnt");
            const carouselTemp = document.getElementById("game-carousel");
            this.addImgCarousel(imgCnt, carouselTemp, media.carouselImages, baseId[block.titleId]);
        }
    
        // Add project description
        const descCnt = clone.querySelector("#description-cnt");
        this.renderCustomText(descCnt, baseId[block.blocksId]);


        // Add the tags
        // if (block.tags) {
        //     const tagCnt = clone.querySelector("#tags-cnt");
        //     tagCnt.appendChild(this.getUlEl(block.tags, "info-tags", "info-tag");
        // }

        // Buttons
        if (block.buttons) {
            const btnCnt = clone.querySelector("#links-btn-cnt");
            this.renderContactButtons(btnCnt, block.buttons, baseId);
        }
    }

    applyPopupBackground(data) {
        if (!data) return;

        const background = data.background;
        if (!background) return;

        const img = document.getElementById("bg-popup");
        const popup = document.querySelector(".popup");

        // image
        if (background.img) {
            img.src = background.img;
        } 
        else {
            img.classList.add("disabled");
            return;
        }

        // colors via CSS variables
        if (background.baseColor) popup.style.setProperty("--bg-base", background.baseColor);
        if (background.overlayColor) popup.style.setProperty("--bg-overlay", background.overlayColor);
        if (background.gradientEdgeColor) popup.style.setProperty("--bg-grad-edge", background.gradientEdgeColor);
    }

    addImgCarousel(container, template, images, alt) {
        container.innerHTML = "";
        
        // clone template
        const clone = template.content.firstElementChild.cloneNode(true);
        container.appendChild(clone);

        this.carousels.push(new MediaCarousel(clone, 5, 4000, images, alt));
    }

    

    // Helpers
    
    t(id) {
        if (!id) return null;
        return this.app.lang[id] ?? this.app.defaultLang?.[id] ?? null;
    }

    t(baseId, key) {
        return (
            this.app.lang?.[baseId]?.[key] ??
            this.app.defaultLang?.[baseId]?.[key] ??
            null
        );
    }

    getNestedText(firstId, secondId, key) {
        return this.t(firstId, secondId)?.[key] ?? null;
    }
    
    renderStylizedText(container, blocks) {
        container.innerHTML = "";
        
        if (!blocks) return;

        const length = blocks.length;
        for (let i = 0; i < length; i++) {
            const block = blocks[i];
            if (!block) {
                console.log(`WARNING: [renderStylizedText] Block from the index ${i} is null.`)
                continue;
            }

            const span = document.createElement("span");
            span.textContent = block.text;
            span.className = block.style;
            container.appendChild(span);

        }
    }

    renderCustomText(container, blocks) {
        container.innerHTML = "";

        if (!blocks) return;

        const length = blocks.length;
        
        for (let i = 0; i < length; i++) {
            const block = blocks[i];
            if (!block) {
                console.log(`WARNING: [renderCustomText] Block from the index ${i} is null.`)
                continue;
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

        }
        
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
        
        if (Array.isArray(block.text)) {
            block.text.forEach(t => {
                const el = document.createElement("p");
                el.innerHTML = t;
                cntEl.appendChild(el);
            });
        }
        else {
            const textEl = document.createElement("p");
            textEl.innerHTML = block.text;
            cntEl.appendChild(textEl);
        }

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
        for (let i = 0; i < block.items.length; i++) {
            const liEl = document.createElement(isList ? "li" : "div");
            liEl.innerHTML = block.items[i];

            if (itemClass) {
                liEl.classList = itemClass;
            }

            ulEl.appendChild(liEl);
        }

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
                console.log(`WARNING: [renderStylizedRoles] Block from the index ${i} is null.`)
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
                for (let i = 0; i < classes.length; i++) {
                    const c = classes[i];
                    if (!c) continue;

                    p.classList.add(c);
                }
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
            phone.href = `tel:${contact.phone}`
            phone.textContent = contact.phone;
            if (contactClass) phone.classList.add(contactClass);
            container.appendChild(phone);
        }
    }

    renderContactButtons(container, buttons, baseId = null) {
        container.innerHTML = "";

        if (!buttons) return;

        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];

            if (!btn) {
                console.log(`WARNING: [renderContactButtons] Button from the index ${i} is null.`)
                continue;
            }

            if (btn.disabled) continue;

            const isLink = btn.type && btn.type !== "email";
            const a = document.createElement("a");
            
            // add the mailto
            a.href = isLink ? btn.link : `mailto:${btn.link}`;
            
            if (btn.classList) {
                for (let i = 0; i <= btn.classList.length; i++) {
                    a.classList.add(btn.classList[i]);
                }
            }

            if (btn.label) {
                a.textContent = this.t(baseId, btn.label);
            }

            a.title = this.t(baseId, btn.hoverTextId) ?? "";

            if (isLink && btn.newTab) {
                a.target = "_blank";
                a.rel = "noopener noreferrer";
            }

            container.appendChild(a);
        }
    }
}