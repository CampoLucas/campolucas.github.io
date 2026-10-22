import { Popup } from "./popup/Popup.js";

const skeletonTemplate = "popup-skeleton";

export class PopupHandler {
    constructor(app) {
        this.app = app;
        this.popup = null;
        this.handleRoute = this.handleRoute.bind(this);
        this.close = this.close.bind(this);
    }

    init() {
        window.addEventListener("hashchange", this.handleRoute);

        if (this.slug() && !this.isPageAnchor(this.slug())) {
            this.ensurePopup().showSkeleton(document.getElementById(skeletonTemplate));
        }

        this.app.ready.then(() => this.handleRoute());
    }

    slug() {
        try {
            return decodeURIComponent(location.hash.slice(1));
        }
        catch {
            return "";
        }
    }

    isPageAnchor(slug) {
        return !!document.getElementById(slug) || !!document.querySelector(`[data-section="${CSS.escape(slug)}"]`);
    }

    handleRoute() {
        const build = this.app.popups.get(this.slug().toLowerCase());

        if (!build) {
            this.destroy();
            return;
        }

        this.ensurePopup().show(build());
    }

    ensurePopup() {
        if (!this.popup) {
            this.popup = new Popup(this.app.renderer, this.close);
        }
        return this.popup;
    }

    close() {
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
        this.destroy();
    }

    destroy() {
        if (!this.popup) return;

        this.popup.destroy();
        this.popup = null;
    }
}
