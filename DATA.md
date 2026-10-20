# Data model

Content lives in `data/*.json` (structure) and `i18n/*.json` (text). Text is looked up as `t(baseId, key)`: active language, then `en`.

## Page order

`index.html` holds the sections in this order. Every navigable section has a `data-section` id; `SideNav` builds itself from those elements in document order, using the icons in `src/js/core/Sections.js` and the labels in `i18n` → `nav.<id>`.

| `data-section` | Content | Data |
|---|---|---|
| `hero` | name, roles, buttons | `home.json` → `hero` |
| `experience` | compact rows + popup | `experience.json` |
| `featured` | one big showcase | `featured.json` |
| `projects` | filterable grid | `projects.json` |
| `skills` | three columns | `skills.json` |
| `about` | text, contacts, links | `home.json` → `about` |
| `footer` | static HTML | none |

Custom sections (`sections.json`) are inserted after the section named in `after`.

## home.json

- `hero.buttons[]` and `about.buttons[]`: `{id, link, classList[], label?, hoverTextId, type: "link"|"email", newTab?, disabled?}`. Text lives in `i18n.<baseId>`. The hero has a `contacts` button (`#contact`) and a `featured` button (`#featured`).

## experience.json

`experience.experiences[]` entries: `{baseId, companyId, productId?, periodId, roleId, blocksId, skillsId?, imgAltId?, logo?, images?, video?, buttons?, popup?}`.

- Text at `i18n.experience.<baseId>`: `company`, `product`, `period`, `role`, `blocks[]`, `skills[]`, `imgAlt`, `iconAlt`.
- The row shows logo, role, company (- product), period and a one-line summary taken from the first `desc` block of `blocks`.
- The row opens the popup at `#experience-<baseId>`.

## projects.json

`categories[]` is `{type, titleId, projects[]}`. `type` is `GAME` (icon card), `WEBPAGE` (preview card) or `TOOL` (asset-store card). An unknown type falls back to `GAME`. Each project: `{baseId, titleId, periodId, roleId?, blocksId, imgAltId, media, buttons, tags?, link?, popup?}`.

- `media`: `capsuleImg`, `capsuleVideo` (hover preview), `carouselImages[]`, `video?` (popup video block), `background` (popup tint).
- A project with `link` opens that URL in a new tab; without it the card opens the popup at `#<baseId>`.
- The project named by `featured.json` → `projectId` is skipped by the grid but keeps its popup.
- Filter tabs are built from the `type`s in use. Labels: `i18n.projects.filters`.

## featured.json

`{baseId: "featured", projectId, titleId, badgeId, programmedTitleId, programmedId, toolsTitleId, toolsUsed[], moreBtnId, video, screenshots}`.

- `projectId` points to a project in `projects.json`. Change it to swap the featured project.
- `video`: media entry shown first in the gallery (null = none). `screenshots`: media entries (null = use the project's `carouselImages`).
- Text at `i18n.featured`: `title`, `badge`, `programmedTitle`, `programmed[]`, `toolsTitle`, `moreBtn`.
- The capsule image, the first `desc` block, the tags and the buttons come from the project itself.
- If the file is missing or `projectId` is unknown the section removes itself.

## skills.json

`skills.columns[]` is `{titleId, groups[]}`; `titleId` is a dotted path under `i18n.skills`. A group has an optional `titleId` and one of:

- `items[]`: plain tag strings.
- `itemsId[]`: dotted paths to `{title, desc}` rendered as `title - desc`.
- `conceptsId[]`: dotted paths to `{title, desc}`; `desc` is split on `, ` into tags under the concept title.

## Popup config

Any experience entry or project can carry `popup`; every field is optional.

```json
"popup": {
    "layout": "carouselLeft",
    "size": "large",
    "blocks": ["carousel", "video", "description", "tags", "links", { "type": "section", "id": "skills" }]
}
```

- `layout`: `carouselLeft`, `carouselRight`, `carouselTop` or `none` (media blocks are dropped).
- `size`: `small` (560px), `medium` (860px) or `large` (1200px).
- `blocks`: order matters. `carousel` and `video` go in the media column, the rest in the info column. Blocks with no data are skipped.
- `{type: "section", id}` renders `text[id]` as rich text blocks. For experience, `skills` is `skillsId`.
- Defaults: projects `carousel, video, description, tags, links`; experience `carousel, description, skills, links`.

## sections.json

Unchanged: custom sections with layouts `text`, `tags`, `cards`, `capsules`. `cards` items render as experience rows and open the shared popup at `#<sectionBaseId>-<itemBaseId>`. Section ids can't be `hero`, `about`, `experience`, `featured`, `projects`, `skills`, `footer` or `sections`.

## Popup routes

`PopupHandler` resolves `location.hash` through `app.popups` (lowercase id to model builder). Projects register as `<baseId>`, experience rows as `<group>-<baseId>`. A hash that matches a page element or `data-section` is a normal anchor and opens nothing.
