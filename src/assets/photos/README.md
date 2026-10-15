# Photos

Each file here fills one slot on the site, by name. `work.webp` fills the slot `work`, and so on;
`src/lib/photos.ts` picks them up at build time, and an empty slot renders a dark gradient instead.

| Slot        | Where it appears                          | Motif                                                         |
| ----------- | ----------------------------------------- | ------------------------------------------------------------- |
| `work`      | Home, "Principles" (portrait, 4:5)        | Dark server racks or hardware; no logos, crests or legible text |
| `europe`    | Home, "Europe" (circle)                   | Europe at night seen from space — the continent's lights      |
| `mission`   | Mission page opening (full width, dimmed) | Light trails or fibre optics in the dark                      |
| `contact`   | Contact page opening (full width, dimmed) | Dark architecture with a single line of light                 |

Use photos from Unsplash (unsplash.com/license), downloaded and stored here rather than linked:
the site makes no requests to third parties to draw itself, and the privacy policy says so.
Export as WebP, about 1600 px on the long edge, quality around 78.

Credit every photo in `credits.json`; the legal notice lists exactly the photos in use:

```json
{
  "europe": { "author": "Name of the photographer", "url": "https://unsplash.com/photos/<id>" }
}
```
