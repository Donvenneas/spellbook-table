# Making a skin

A skin is a set of tokens and a few shape rules in `public/css/skins.css`, chosen in **Display → Skin** (saved as
`prefs.skin`, applied as `data-skin` on the root element by `applySkin()` in `public/js/main.js`). With no skin
chosen the file does nothing and the Grimoire look in `style.css` stays as it is.

## 1. Draw the art

`tools/make-assets.mjs` draws every frame, ring, plate, gear, dial and divider as SVG. Add the new skin's pieces
there and run it:

    node design/skins/tools/make-assets.mjs path/to/icons.json

(The icons file is `@iconify-json/game-icons`' `icons.json`; without it the icons are left as they are.) Copy what the
game uses into `public/skins/frames/`.

Rules for the art:
- A panel frame is a 120×120 nine-slice with 40px corners. Everything that is not a straight line stays inside a corner,
  because the edges are stretched.
- A button or plate is a 200-wide strip with fixed ends (slice `0 30 fill` or `0 26 fill`); the middle stretches.
- Textures: CC0 only (ambientCG, Poly Haven), shrunk to 512px (see the PowerShell step in item 394's notes).
- Fonts: SIL Open Font License only, the woff2 in `public/skins/fonts` with its licence text beside it.
- Never copy art, names or layouts from MTG Arena, other clients or other games.

## 2. Add the tokens

Add a `:root[data-skin="name"] { … }` block to `skins.css` with:
- the Grimoire tokens it changes (`--bg`, `--panel`, `--panel-2`, `--line`, `--text`, `--muted`, `--accent`, `--gold-hi`,
  `--topbar`, `--table-bg`, `--font-display` …);
- the skin tokens the shared rules read: `--sk-title`, `--sk-label` (fonts), `--sk-metal`, `--sk-metal-lo`, `--sk-glow`,
  `--sk-on`, `--sk-on-ink` (the "on" state), `--sk-page`, `--sk-panel` (backgrounds), `--sk-frame`, `--sk-fw`,
  `--sk-fw-big` (frame and its widths), `--sk-go`, `--sk-go-slice`, `--sk-go-w`, `--sk-go-ink` (main buttons),
  `--sk-ring`, `--sk-ring-out` (portrait ring), `--sk-life-bg`, `--sk-mark` (start-menu sigil), `--sk-divider`, and the
  lane tints `--sk-lane-c`, `--sk-lane-o`, `--sk-lane-l`.

A light version is a `:root[data-skin="name"][data-theme="light"]` block that changes the same tokens plus
`--sk-well` and `--sk-read`; list the skin in `LIGHT_SKINS` (main.js and remote.js).

## 3. Wire it in

- `SKINS` and `SKIN_NAMES` in `public/js/main.js`, `SKINS` in `public/js/remote.js`.
- An `<option>` in `#dispSkin` and `#dispMenuSkin` (`public/index.html`) and `#friendSkin` (`public/play.html`).
- Optional: a voice in `Sound.voices` (`ui.js`), a piece in `STYLES` (`music.js`), a card back in `BACKS`
  (`cosmetics.js`, with `skin:` and an `unlock: { skinGames: [name, 5] }`).

## 4. Check it

- `node tests/skins-contrast.mjs`: add the skin to `looks`; every pair must reach 4.5:1.
- `node tests/csslint.mjs`: literal colors belong in the token block.
- The interface test's "Skins" check: add the skin to its list.
- Look at the start menu, a four-player table, the setup screen, Display and a results window, at 1366×768 and phone
  width, in dark and (if it has one) light.

## Previews

`index.html` here is the design preview (published as an artifact); open it with `node tools/serve.mjs`
(http://localhost:8790, the "skin-previews" entry in `.claude/launch.json`). Card pictures for it are fetched by
`tools/fetch-art.mjs` into `_cardart/`, which git and the shareable zip leave out.
