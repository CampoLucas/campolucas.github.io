# Assets and content to fill in

| What | Where | Target |
|---|---|---|
| Rush Rift trailer or gameplay video | `src/media/projects/rush-rift/trailer.mp4` plus a poster | MP4/WebM, 1280x720 or smaller. Set `data/featured.json` → `video` to `{src, poster, thumb, width, height}`. Until then the gallery starts with the project's own `carousel/02.mp4`. |
| Rush Rift featured screenshots | `src/media/projects/rush-rift/carousel/` | WebP 1920x1080 plus `-thumb.webp`. Set `featured.json` → `screenshots` or leave `null` to reuse `carouselImages`. |
| EVA Play Online 2026 badge text | `i18n/*.json` → `featured.badge` | Check the wording. A logo image is optional and not wired. |
| "What I programmed" list | `i18n/*.json` → `featured.programmed` | Placeholder derived from the existing Rush Rift "My Role" text. Replace with the real list in every language. |
| "Tools used" list | `data/featured.json` → `toolsUsed` | Placeholder taken from the removed Independent Game Developer entry (Unity, Unity Editor Tools, C#, Git). Verify. |
| Japanese translations | `i18n/jp.json` | `nav`, `featured`, `popup`, `projects.filters`, `hero.featuredBtn` fall back to English. |
