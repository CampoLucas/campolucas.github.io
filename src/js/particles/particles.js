const tsParticlesUrl = "https://cdn.jsdelivr.net/npm/tsparticles@2.12.0/tsparticles.bundle.min.js";

function initParticles() {
    const rootStyles = getComputedStyle(document.documentElement);
    const dotColor = rootStyles.getPropertyValue("--role-particles-dots").trim();
    const linkColor = rootStyles.getPropertyValue("--role-particles-links").trim();

    tsParticles.load("particles-background", {
        fullScreen: { enable: false },
        fpsLimit: 60,
        background: { color: "transparent" },
        detectRetina: true,
        particles: {
            number: {
                value: 80,
                density: { enable: true, area: 800 }
            },
            color: { value: dotColor },
            links: {
                enable: true,
                distance: 150,
                color: linkColor,
                opacity: 0.3,
                width: 1
            },
            move: {
                enable: true,
                speed: 1.2
            }
        },
        interactivity: {
            detectsOn: "window",
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
    if (!document.getElementById("particles-background")) return;
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
