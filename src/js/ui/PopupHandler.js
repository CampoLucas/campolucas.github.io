const popupTemplate = "popup-template";
const popupSkeletonTemplate = "popup-skeleton";

export class PopupHandler {
    constructor(app) {
        this.app = app;
        this.handleRoute = this.handleRoute.bind(this);
    }

    init() {
        window.addEventListener("hashchange", this.handleRoute);

        if (location.hash.length > 1) {
            this.showSkeleton();
        }

        this.app.ready.then(() => {
            this.handleRoute();
        })
    }

    handleRoute() {
        const slug = location.hash.slice(1);

        this.removePopup();

        if (!slug) return;

        const projects = [];

        this.app.projects.categories.forEach(c => {
            projects.push(...c.projects);
        });

        // check if there is a project with that id
        const project = projects.find(p => p.baseId.toLowerCase() === slug.toLowerCase());
        if (project) {
            document.body.classList.add("popup-open");
            this.createPopup(project);
        }

    }

    appendPopup() {
        const template = document.getElementById(popupTemplate);

        if (!template) {
            console.log(`WARNING: Couldn't find the tamplate "${popupTemplate}"`);
            return null;
        }

        const popup = template.content.firstElementChild.cloneNode(true);
        document.body.appendChild(popup);
        return popup;
    }

    showSkeleton() {
        const skeleton = document.getElementById(popupSkeletonTemplate);
        const popup = this.appendPopup();
        if (!popup || !skeleton) return;

        popup.querySelector("#popup-viewport").appendChild(skeleton.content.firstElementChild.cloneNode(true));
        document.body.classList.add("popup-open");
    }

    createPopup(project) {
        const popup = this.appendPopup();
        if (!popup) return;

        const cnt = document.getElementById("popup-viewport");
        const temp = document.getElementById("game-project");
        const render = this.app.renderer;
        const projects = this.app.projects;
        const baseId = projects.baseId;

        const id = render.t(baseId, "projects")[project.baseId];
        render.renderProject(cnt, temp, project, id);
        const closeBtn = popup.querySelector("#close-popup-btn");
        closeBtn.onclick = () => {
            history.replaceState(
                null,
                document.title,
                window.location.pathname + window.location.search
            );
            
            this.removePopup();
        }
    }

    removePopup() {
        document.body.classList.remove("popup-open");

        const popup = document.querySelector(".popup");
        if (!popup) return;

        this.app.renderer.destroyCarouselsIn(popup);
        popup.remove();
    }
}
