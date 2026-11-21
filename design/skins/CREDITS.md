# Skin previews: assets and licences

Open `index.html` through `node design/skins/tools/serve.mjs` (http://localhost:8790). Nothing here is used by the game yet.

| Folder | What | Source | Licence |
| --- | --- | --- | --- |
| `assets/textures/` | Rock031, Marble023, Wood094, Leather037, Leather026, Metal009, Metal051A (1K colour maps) | https://ambientcg.com/ | CC0 1.0 |
| `assets/fonts/` | Cinzel Decorative, Cormorant Garamond, Marcellus, Marcellus SC, Metamorphous, IM Fell English SC, Spectral | https://fonts.google.com/ | SIL Open Font License 1.1 (ship the licence text with the fonts) |
| `assets/fonts/special-elite.woff2` | Special Elite | https://fonts.google.com/specimen/Special+Elite | Apache 2.0 |
| `assets/icons/` | 18 icons | https://game-icons.net/ (Lorc, Delapouite and other contributors), via the `@iconify-json/game-icons` package | CC BY 3.0: credit in Help |
| `assets/frames/` | Frames, plaques, rings, sockets, gear, dial, vials, buttons, divider, filigree | Drawn for Spellbook Table by `tools/make-assets.mjs` | Ours |

Rebuild the drawn art (and copy icons out of a downloaded `icons.json`):

    node design/skins/tools/make-assets.mjs path/to/icons.json

Style references (looked at, nothing copied): Adobe Stock "fantasy game UI" search results, the GDKeys article on Fairtravel Battle's card game UI, and the card-game list on Interface In Game.
