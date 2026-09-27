# Editing the site

## Timing & placement → `src/config/story.ts`
One config object controls the whole scroll-controlled video: each stop's timestamp,
how long it holds, how fast the video travels to it, and where its glass panel sits
(in video-frame coordinates, so it stays over the same empty space at any screen size).

## Words → `content/`

### `site.md`
Your name, page title, email and social links.

### `story/section-XX.md` — the glass panels over the video
One file per stop, named after its timestamp (`section-24.md` = the 00:24 stop).

```md
---
eyebrow: Optional label      # small label above the title (quote it if it has a colon)
title: Learning from the best
subtitle: Optional line     # used by the hero
links:                      # optional buttons
  - label: See the model
    href: /docs/valuation.pdf
---
Your text here. **Bold**, *italic*, [links](https://example.com) and lists all work.
```

### `story/section-06.md` — the "map of me" (first stop)
Instead of a panel, the first stop shows four callouts linked to the character:
Venezuela → Miami, Soccer, Running, Family & curiosity. All their text lives under `map:`
in this file.
- **Hometown dot:** set `map.hometown.lat` / `lon` to your hometown's coordinates
  (Google Maps: right-click the spot → the two numbers). `label` names it on the route map.
- **Photos:** put images in `public/images/` (e.g. `soccer.jpg`) and set
  `image: /images/soccer.jpg` for Soccer or Running. Empty `image` shows the placeholder.
  Landscape photos (4:3) fit best; they're cropped to fill the frame.
- **Line and callout positions** are in `MAP_OF_ME` in `src/config/story.ts`.

### `more/` — normal sections after the video
Ordered by filename. `type: text`, `type: links` (cards with `label`, `href`, `tag`,
`note`), or `type: contact` (shows the email + socials from `site.md`).
Each section gets an anchor from its filename, e.g. `05-contact.md` → `#contact`.

## Look of the glass panels → `src/app/globals.css`
The `--glass-*` variables at the top restyle every panel at once
(background, blur, border, glow, radius, padding). `--progress-*` styles the top line.

## Documents
Put PDFs or images in `public/docs/` and link them as `/docs/your-file.pdf`.

## Re-generating the video frames
If the video changes: put it in `source-media/` and run `npm run frames -- source-media/<file>.mp4`.
