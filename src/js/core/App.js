import { JSONLoader } from "./JSONLoader.js";
import { Renderer } from "../ui/Renderer.js";
import { PopupHandler } from "../ui/PopupHandler.js";

const dataPath = "./data";
const langPath = "./i18n";
const imgPath = "./src/media";
const defaultLang = "en";

export class App {
    constructor() {
        this.popup = new PopupHandler(this);
        this.json = new JSONLoader();
        this.renderer = new Renderer(this);

        this.home = null;
        this.experience = [];
        this.projects = [];
        this.skills = [];
        this.sections = null;
        this.popups = new Map();

        this.lang = null;
        this.defaultLang = null;
        
        this.ready = this.init();
    }

    async init() {
        this.beginLoad();

        // Get the language from the url
        const lang = getLangFromURL();

        const [structData, sectionsData, langData, defaultLangData] = await Promise.all([
            this.json.loadAllFromFolder(dataPath, [
                "home",
                "experience",
                "projects",
                "skills"
            ]),
            this.json.load(`${dataPath}/sections.json`).catch(() => null),
            this.json.load(`${langPath}/${lang}.json`).catch(() => null),
            lang !== defaultLang ? this.json.load(`${langPath}/${defaultLang}.json`) : null
        ]);
        
        this.home = structData.home;
        this.experience = structData.experience;
        this.projects = structData.projects;
        this.skills = structData.skills;
        this.sections = sectionsData;

        this.lang = langData ?? defaultLangData;
        this.defaultLang = defaultLangData;

        this.renderer.init();

        this.endLoad();
    }

    beginLoad() {
        const app = document.getElementById("app");
        app.setAttribute("aria-busy", "true");
    }

    endLoad() {
        const app = document.getElementById("app");
        app.setAttribute("aria-busy", "false");
    }
    
}

const app = new App();
app.popup.init();
registerServiceWorker();
//await app.init();



function getLangFromURL() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");

    return lang && /^[a-z-]+$/i.test(lang) ? lang : defaultLang;
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
    if (isLocal && !new URLSearchParams(location.search).has("sw")) return;

    const register = () => {
        navigator.serviceWorker.register("./sw.js").catch(err => {
            console.log(`WARNING: Service worker registration failed: ${err}`);
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
}