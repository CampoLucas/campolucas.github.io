import { normalizeMedia } from "./Media.js";
import { createEl, initialsOf } from "../text.js";

export function buildEntryCard({ href = null, logo = null, initials = null, role = "", company = "", range = "", description = "", tag = null, multiline = false }) {
    const item = createEl("li", "entry-item");
    const card = createEl(href ? "a" : "div", "entry-card");
    if (href) card.href = href;
    if (multiline) card.classList.add("entry-card--list");

    const logoBox = createEl("div", "entry-card__logo");
    const image = normalizeMedia(logo?.src);
    if (image) {
        const img = createEl("img");
        img.src = image.src;
        img.alt = logo.alt ?? "";
        img.width = 72;
        img.height = 72;
        img.loading = "lazy";
        img.decoding = "async";
        logoBox.appendChild(img);
    }
    else {
        logoBox.setAttribute("aria-hidden", "true");
        logoBox.textContent = initials ?? initialsOf(role);
    }

    const body = createEl("div", "entry-card__body");
    body.appendChild(createEl("h3", "entry-card__role", role));
    if (company) body.appendChild(createEl("p", "entry-card__company", company));
    if (range) body.appendChild(createEl("p", "entry-card__range", range));
    if (description) body.appendChild(createEl("p", "entry-card__description", description));

    card.append(logoBox, body);
    if (tag) card.appendChild(createEl("span", "special-tag", tag));
    else card.classList.add("entry-card--no-tag");

    item.appendChild(card);
    return item;
}
