import { CapsuleType } from "./CapsuleType.js";
import { Capsule } from "./Capsule.js";

const tempId = "cap-carousel-temp";
const titleId = "cap-carousel-title";
const capsulesCntId = "cap-cnt";

export class CapsuleCarousel {
    constructor(data, container) {
        this.cloneTemplate(container, tempId);
        this.populateCarousel(data, (CapsuleType[data.type] ?? CapsuleType.GAME).temp);
        this.setupScrolling();
    }

    cloneTemplate(container, tempId) {
        const temp = document.getElementById(tempId);
        this.element = temp.content.firstElementChild.cloneNode(true);

        container.appendChild(this.element);
    }

    populateCarousel(data, capsuleType) {
        const titleEl = this.element.querySelector(`#${titleId}`);
        titleEl.textContent = data.title;

        this.populateCapsules(data.capsules, this.element.querySelector(`#${capsulesCntId}`), capsuleType);
    }

    populateCapsules(capsData, container, tempId) {
        this.capsules = [];
        capsData.forEach(c => {
            this.capsules.push(new Capsule(c, container, tempId));
        });
    }

    setupScrolling() {
        this.scroller = this.element.querySelector(`#${capsulesCntId}`);
        this.prevArrow = this.element.querySelector(".arrow.left");
        this.nextArrow = this.element.querySelector(".arrow.right");
        const bar = this.element.querySelector(".carousel-thumbs");
        if (!this.scroller || !bar) return;

        this.track = document.createElement("div");
        this.track.className = "cap-scroll-track hidden";
        this.handle = document.createElement("div");
        this.handle.className = "cap-scroll-handle";
        this.track.appendChild(this.handle);
        bar.appendChild(this.track);

        this.prevArrow?.addEventListener("click", () => this.page(-1));
        this.nextArrow?.addEventListener("click", () => this.page(1));
        this.scroller.addEventListener("scroll", () => this.sync(), { passive: true });

        this.handle.addEventListener("pointerdown", e => this.startDrag(e, true));
        this.track.addEventListener("pointerdown", e => {
            if (e.target === this.handle) return;
            this.startDrag(e, false);
        });
        this.track.addEventListener("pointermove", e => this.moveDrag(e));
        this.track.addEventListener("pointerup", e => this.endDrag(e));
        this.track.addEventListener("pointercancel", e => this.endDrag(e));

        if ("ResizeObserver" in window) {
            this.resizeObserver = new ResizeObserver(() => this.sync());
            this.resizeObserver.observe(this.scroller);
        }
        window.addEventListener("load", () => this.sync(), { once: true });
        this.sync();
    }

    maxScroll() {
        return Math.max(0, this.scroller.scrollWidth - this.scroller.clientWidth);
    }

    page(dir) {
        this.scroller.scrollBy({ left: dir * this.scroller.clientWidth, behavior: "smooth" });
    }

    sync() {
        const max = this.maxScroll();
        const overflow = max > 1;
        const left = this.scroller.scrollLeft;

        this.track.classList.toggle("hidden", !overflow);
        this.prevArrow?.classList.toggle("hidden", !overflow || left <= 1);
        this.nextArrow?.classList.toggle("hidden", !overflow || left >= max - 1);

        if (!overflow) return;
        const widthPct = (this.scroller.clientWidth / this.scroller.scrollWidth) * 100;
        this.handle.style.width = `${widthPct}%`;
        this.handle.style.left = `${(left / max) * (100 - widthPct)}%`;
    }

    scrollFromPointer(clientX) {
        const rect = this.track.getBoundingClientRect();
        const handleWidth = this.handle.offsetWidth;
        const free = rect.width - handleWidth;
        if (free <= 0) return;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left - this.drag.grab) / free));
        this.scroller.scrollLeft = ratio * this.maxScroll();
    }

    startDrag(e, onHandle) {
        if (e.button > 0) return;
        e.preventDefault();
        const grab = onHandle ? e.clientX - this.handle.getBoundingClientRect().left : this.handle.offsetWidth / 2;
        this.drag = { grab, pointerId: e.pointerId };
        this.track.setPointerCapture(e.pointerId);
        this.element.classList.add("is-scrubbing");
        this.scrollFromPointer(e.clientX);
    }

    moveDrag(e) {
        if (!this.drag || e.pointerId !== this.drag.pointerId) return;
        this.scrollFromPointer(e.clientX);
    }

    endDrag(e) {
        if (!this.drag || e.pointerId !== this.drag.pointerId) return;
        this.drag = null;
        if (this.track.hasPointerCapture(e.pointerId)) this.track.releasePointerCapture(e.pointerId);
        this.element.classList.remove("is-scrubbing");
        const step = this.capsuleStep();
        if (step) this.scroller.scrollTo({ left: Math.round(this.scroller.scrollLeft / step) * step, behavior: "smooth" });
    }

    capsuleStep() {
        const items = this.scroller.children;
        if (items.length > 1) return items[1].offsetLeft - items[0].offsetLeft;
        return 0;
    }
}
