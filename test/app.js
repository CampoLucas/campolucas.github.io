async function fetchJson(path) {
    let res;
    try {
        res = await fetch(path, { cache: "no-store" });
    } catch (e) {
        throw new Error(`Network error while loading ${path}`);
    }

    if (!res.ok) {
        throw new Error(`Failed to load ${path}: HTTP ${res.status}`);
    }

    return res.json();
}

function pickLanguage() {
    // save preference
    const saved = localStorage.getItem("lang");
    if (saved) return saved;

    // browse preference (en / es)
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return ["en", "es"].includes(nav) ? nav : "en";
}

function t(dict, key, fallback = key) {
    return dict?.[key] ?? fallback;
}

async function main() {
    const app = document.getElementById("app");
    const loadingText = document.getElementById("loadingText");

    const lang = pickLanguage();

    // Show loadader
    app.setAttribute("aria-busy", "true");
    loadingText.textContent = lang === "es" ? "Cargando" : "Loading";

    // Load content + language in parallel
    const [content, langDict] = await Promise.all([
        fetchJson("./data/content.json"),
        fetchJson(`./data/${lang}.json`)
    ]);

    // render using keys from content.json + translations from lang json
    document.getElementById("title").textContent = t(langDict, content.titleKey, "Title");
    document.getElementById("subtitle").textContent = t(langDict, content.subtitleKey, "Subtitle");

    // hide loader, show content
    app.setAttribute("aria-busy", "false");
}

main().catch(err => {
  console.error(err);
  const loadingText = document.getElementById("loadingText");
  loadingText.textContent = "Failed to load";
});