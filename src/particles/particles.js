const tsParticlesUrl = "https://cdn.jsdelivr.net/npm/tsparticles@2.12.0/tsparticles.bundle.min.js";

function initParticles() {
    // Get CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    const heroBg = rootStyles.getPropertyValue('--hero-page-bg').trim();
    const particleColor = rootStyles.getPropertyValue('--particle-color').trim();
    const particleLinksColor = rootStyles.getPropertyValue('--particle-links-color').trim();
    const particleWidth = rootStyles.getPropertyValue('--particle-width').trim();

    tsParticles.load("particles-background", {
        fullScreen: { enable: false },
        background: {
            color: heroBg
        },
        particles: {
            number: {
                value: 80,
                density: { enable: true, area: 800 }
            },
            color: { value: particleColor },
            links: {
                enable: true,
                distance: 150,
                color: particleLinksColor,
                opacity: 0.3,
                width: particleWidth
            },
            move: {
                enable: true,
                speed: 1.2
            }
        },
        interactivity: {
            events: {
                onHover: { enable: true, mode: "grab" }
            },
            modes: {
                grab: { distance: 200 }
            }
        }
    });
}

function loadParticles() {
    const script = document.createElement("script");
    script.src = tsParticlesUrl;
    script.async = true;
    script.onload = initParticles;
    document.head.appendChild(script);
}

function whenIdle(callback) {
    if ("requestIdleCallback" in window) {
        requestIdleCallback(callback, { timeout: 2000 });
    }
    else {
        setTimeout(callback, 200);
    }
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (document.readyState === "complete") {
        whenIdle(loadParticles);
    }
    else {
        window.addEventListener("load", () => whenIdle(loadParticles), { once: true });
    }
}
