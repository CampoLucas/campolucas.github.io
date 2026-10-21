const layouts = ["carouselLeft", "carouselRight", "carouselTop", "none"];

const projectDefaults = {
    layout: "carouselLeft",
    blocks: ["carousel", "video", "capsule", "description", "meta", "tags", "links"]
};

const experienceDefaults = {
    layout: "carouselLeft",
    blocks: ["carousel", "description", { type: "section", id: "skills" }, "links"]
};

export function resolveConfig(config, defaults) {
    return {
        layout: layouts.includes(config?.layout) ? config.layout : defaults.layout,
        blocks: Array.isArray(config?.blocks) ? config.blocks : defaults.blocks
    };
}

export function projectModel(project, text, labels = {}) {
    const media = project.media ?? {};
    const roles = project.roleId ? text[project.roleId] : null;
    return {
        id: project.baseId,
        title: text[project.titleId],
        subtitle: null,
        period: null,
        logo: null,
        capsule: media.capsuleImg ?? null,
        labels,
        meta: [
            { label: labels.released, value: text[project.periodId] },
            { label: labels.role, value: Array.isArray(roles) ? roles.join(", ") : roles }
        ],
        alt: text[project.imgAltId] ?? text[project.titleId] ?? "",
        images: media.carouselImages ?? [],
        video: media.video ?? null,
        background: media.background ?? null,
        tags: project.tags ?? [],
        buttons: project.buttons ?? [],
        hoverText: text,
        text: { description: text[project.blocksId] },
        config: resolveConfig(project.popup, projectDefaults)
    };
}

export function experienceModel(entry, text) {
    const company = text[entry.companyId];
    const product = entry.productId ? text[entry.productId] : null;
    const title = text[entry.roleId];

    return {
        id: entry.baseId,
        title,
        subtitle: product ? `${company} - ${product}` : company,
        period: text[entry.periodId] ?? null,
        logo: entry.logo
            ? { src: entry.logo.src, alt: text[entry.logo.altId] ?? entry.logo.altDefault ?? "" }
            : null,
        alt: text[entry.imgAltId] ?? product ?? title ?? "",
        images: entry.images ?? [],
        video: entry.video ?? null,
        background: null,
        tags: entry.tags ?? [],
        buttons: entry.buttons ?? [],
        hoverText: text,
        text: {
            description: text[entry.blocksId],
            skills: entry.skillsId ? text[entry.skillsId] : null
        },
        config: resolveConfig(entry.popup, experienceDefaults)
    };
}
