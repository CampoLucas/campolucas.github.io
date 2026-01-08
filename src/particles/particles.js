document.addEventListener("DOMContentLoaded", () => {

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
});