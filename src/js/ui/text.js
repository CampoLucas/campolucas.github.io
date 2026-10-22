export function plainText(html) {
    if (!html) return "";
    return new DOMParser().parseFromString(html, "text/html").body.textContent.trim();
}

export function summaryOf(blocks) {
    const first = Array.isArray(blocks) ? blocks.find(block => block?.type === "desc") : null;
    if (!first) return "";

    const text = Array.isArray(first.text) ? first.text[0] : first.text;
    return plainText(text);
}

export function initialsOf(label) {
    const words = (label ?? "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

export function createEl(tag, className = null, text = null) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}
