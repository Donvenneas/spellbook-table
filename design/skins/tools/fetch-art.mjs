// Downloads the card pictures the skin preview shows, from Scryfall, into design/skins/_cardart/.
// The pictures are Wizards of the Coast's art: _cardart is kept out of git and out of the shareable zip.
// Run: node design/skins/tools/fetch-art.mjs
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "_cardart");
mkdirSync(dir, { recursive: true });
const headers = { "User-Agent": "SpellbookTable-SkinPreview/1.0", Accept: "application/json" };
const wait = ms => new Promise(r => setTimeout(r, ms));

// id -> [Scryfall query, want art crop too]
const CARDS = {
  korvold: ["!\"Korvold, Fae-Cursed King\"", true], tracker: ["!\"Tireless Tracker\""], signet: ["!\"Arcane Signet\""],
  atraxa: ["!\"Atraxa, Praetors' Voice\"", true], solring: ["!\"Sol Ring\""], rhystic: ["!\"Rhystic Study\""],
  yuriko: ["!\"Yuriko, the Tiger's Shadow\"", true], ornithopter: ["!\"Ornithopter\""], island: ["!\"Island\" set:unf"],
  najeela: ["!\"Najeela, the Blade-Blossom\"", true], safekeeper: ["!\"Sylvan Safekeeper\""], vault: ["!\"Mana Vault\""],
  smothering: ["!\"Smothering Tithe\""], tower: ["!\"Command Tower\""], plains: ["!\"Plains\" set:unf"], forest: ["!\"Forest\" set:unf"],
  mountain: ["!\"Mountain\" set:unf"], rift: ["!\"Cyclonic Rift\""], tutor: ["!\"Demonic Tutor\""], teferi: ["!\"Teferi's Protection\""],
  swat: ["!\"Deflecting Swat\""], savannah: ["!\"Savannah\""], swords: ["!\"Swords to Plowshares\"", true],
  warrior: ["t:token t:warrior pow=1 tou=1 c=r"]
};

const pics = c => c.image_uris || c.card_faces?.[0]?.image_uris || {};
for (const [id, [q, crop]] of Object.entries(CARDS)) {
  if (existsSync(join(dir, id + ".jpg")) && (!crop || existsSync(join(dir, id + "-art.jpg")))) continue;
  const res = await fetch("https://api.scryfall.com/cards/search?unique=cards&order=edhrec&q=" + encodeURIComponent(q), { headers });
  const json = await res.json(); await wait(150);
  const card = json.data?.[0];
  if (!card) { console.log("not found:", id, q); continue; }
  const p = pics(card);
  for (const [url, name] of [[p.normal, id + ".jpg"], ...(crop ? [[p.art_crop, id + "-art.jpg"]] : [])]) {
    if (!url || !url.startsWith("https://cards.scryfall.io/")) { console.log("no picture:", id); continue; }
    const img = await fetch(url, { headers: { "User-Agent": headers["User-Agent"] } });
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf[0] !== 0xff || buf[1] !== 0xd8) { console.log("not a jpeg:", id); continue; }
    writeFileSync(join(dir, name), buf); await wait(100);
  }
  console.log(id, "·", card.name, "·", card.set.toUpperCase(), "·", card.artist);
}
