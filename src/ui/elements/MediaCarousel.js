export class MediaCarousel {
    constructor(root, thumbsPerView = 4, autoInterval = null, images = null, alt = null) {
        this.root = root;

        if (!images) {
            this.images = Array.from(root.querySelectorAll('.carousel-viewport img'));
            this.thumbButtons = Array.from(root.querySelectorAll('.carousel-thumbs-track button'));
            this.dotButtons = Array.from(root.querySelectorAll('.carousel-dots button'));
        }
        else {
            this.images = [];
            this.thumbButtons = [];
            this.dotButtons = [];

            // set images, thumbs and buttons
            const imgCntEl = root.querySelector("[img-cnt]");
            const thumbCntEl = root.querySelector("[thumb-cnt]");
            const dotCntEl = root.querySelector("[dot-cnt]");

            for (let i = 0; i < images.length; i++) {
                const img = images[i];        
                
                // preview img
                const previewEl = document.createElement("img");
                previewEl.src = img;
                previewEl.alt = `${alt} preview ${i + 1}`;
                imgCntEl.appendChild(previewEl);

                this.images.push(previewEl);

                // thumbnail
                const thumbEl = document.createElement("img");
                const thumbBtnEl = document.createElement("button");
                thumbBtnEl.appendChild(thumbEl);
                thumbEl.src = img;
                thumbEl.alt = `${alt} thumbnail ${i + 1}`;
                thumbCntEl.appendChild(thumbBtnEl);

                this.thumbButtons.push(thumbBtnEl);

                // dot
                const dotEl = document.createElement("button");
                dotEl.setAttribute("data-index", `${i}`);
                dotCntEl.appendChild(dotEl);

                this.dotButtons.push(dotEl);
            }
        }

        this.track = root.querySelector('.carousel-thumbs-track');

        this.prevButtons = root.querySelectorAll('[data-prev]');
        this.nextButtons = root.querySelectorAll('[data-next]');
        this.scrollTrack = root.querySelector('.carousel-thumb-scroll-track');
        this.scrollHandle = root.querySelector('.carousel-thumb-scroll-handle');
        
        this.thumbsPerView = thumbsPerView;
        this.currentIndex = 0;
        this.thumbStart = 0;

        this.autoInterval = autoInterval;
        this.autoTimer = null;

        this.isDraggingScrollbar = false;
        this.dragGrabOffsetPx = 0;

        this.handleWidthPct = null;
        
        this.setupThumbs();
        this.bind();
        this.update();
        this.startAuto();
    }

    setupThumbs() {
        if (this.track) {
            const w = 100 / this.thumbsPerView;
            this.thumbButtons.forEach(btn => {
                btn.style.flex = `0 0 ${w}%`;
            });
        }

        if (this.scrollHandle) {
            if (!this.canScrollThumbs()) {
                this.handleWidthPct = 100;
            } else {
                this.handleWidthPct = (this.thumbsPerView / this.thumbButtons.length) * 100;
            }

            this.scrollHandle.style.width = `${this.handleWidthPct}%`;
        }
    }

    bind() {
        this.thumbButtons.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                this.goTo(i);
                this.resetAuto();
            });
        });

        this.dotButtons.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                this.goTo(i);
                this.resetAuto();
            });
        });

        this.prevButtons.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                this.move(-1);
                this.resetAuto();
            });
        });

        this.nextButtons.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                this.move(1);
                this.resetAuto();
            });
        });

        // Dragging and scrolling
        if (this.scrollHandle && this.scrollTrack) {
            this.scrollHandle.addEventListener('mousedown', (e) => {
                if (!this.canScrollThumbs()) return;

                e.preventDefault();
                this.isDraggingScrollbar = true;
            });

            window.addEventListener('mousemove', (e) => {
                if (!this.isDraggingScrollbar) return;
                if (!this.canScrollThumbs()) return;

                const trackRect = this.scrollTrack.getBoundingClientRect();

                const handleWidthPx = trackRect.width * (this.handleWidthPct / 100);
                const maxX = trackRect.width - handleWidthPx;

                // position in track coordinates, adjusted by grab offset
                let x = (e.clientX - trackRect.left) - this.dragGrabOffsetPx;
                x = Math.max(0, Math.min(maxX, x));

                // Convert handle position to thumbStart
                const ratio = (maxX === 0) ? 0 : (x / maxX);
                const maxStart = this.thumbButtons.length - this.thumbsPerView;

                this.thumbStart = Math.round(ratio * maxStart);

                this.update();
                this.resetAuto();
            });

            window.addEventListener('mouseup', () => {
                this.isDraggingScrollbar = false;
            });

            // Click on the track to jump the handle
            this.scrollTrack.addEventListener('mousedown', (e) => {
                // If they click the handle itself, the handle's listener will run
                if (e.target === this.scrollHandle) return;
                if (!this.canScrollThumbs()) return;

                const trackRect = this.scrollTrack.getBoundingClientRect();
                const handleWidthPx = trackRect.width * (this.handleWidthPct / 100);
                const maxX = trackRect.width - handleWidthPx;

                // Center the handle around the click
                let x = (e.clientX - trackRect.left) - (handleWidthPx / 2);
                x = Math.max(0, Math.min(maxX, x));

                const ratio = (maxX === 0) ? 0 : (x / maxX);
                const maxStart = this.thumbButtons.length - this.thumbsPerView;

                this.thumbStart = Math.round(ratio * maxStart);

                this.update();
                this.resetAuto();
            });
        }
    }

    move(dir) {
        const len = this.images.length;
        this.currentIndex = (this.currentIndex + dir + len) % len;
        this.ensureThumbVisible();
        this.update();
    }

    goTo(index) {
        this.currentIndex = index;
        this.ensureThumbVisible();
        this.update();
    }

    ensureThumbVisible() {
        if (!this.track) return;

        if (!this.canScrollThumbs()) {
            this.thumbStart = 0;
            return;
        }

        if (this.currentIndex < this.thumbStart) {
            this.thumbStart = this.currentIndex;
        }

        if (this.currentIndex >= this.thumbStart + this.thumbsPerView) {
            this.thumbStart = this.currentIndex - this.thumbsPerView + 1;
        }
    }

    update() {
        this.images.forEach((img, i) =>
            img.classList.toggle('active', i === this.currentIndex)
        );

        this.thumbButtons.forEach((btn, i) =>
            btn.classList.toggle('active', i === this.currentIndex)
        );

        this.dotButtons.forEach((btn, i) =>
            btn.classList.toggle('active', i === this.currentIndex)
        );


        if (this.track) {
            if (!this.canScrollThumbs()) {
                this.track.style.transform = 'translateX(0%)';
            } else {
                const offset = -(100 / this.thumbsPerView) * this.thumbStart;
                this.track.style.transform = `translateX(${offset}%)`;
            }
        }

        const scrollHandle = this.root.querySelector('.carousel-thumb-scroll-handle');

        if (scrollHandle) {
            if (!this.canScrollThumbs()) {
                scrollHandle.style.transform = 'translateX(0%)';
            } else {
                const handleOffset = (100 / this.thumbsPerView) * this.thumbStart;

                scrollHandle.style.transform = `translateX(${handleOffset}%)`;
            }
        }
    }

    startAuto() {
        if (this.autoInterval == null) return;

        this.autoTimer = setInterval(() => {
            this.move(1);
        }, this.autoInterval);
    }

    stopAuto() {
        if (this.autoTimer) {
            clearInterval(this.autoTimer);
            this.autoTimer = null;
        }
    }

    resetAuto() {
        if (this.autoInterval == null) return;

        this.stopAuto();
        this.startAuto();
    }

    canScrollThumbs() {
        return this.thumbButtons.length > this.thumbsPerView;
    }
}