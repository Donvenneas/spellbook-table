// Draws the skin artwork (frames, plaques, rings, gears, dials) as SVG files, from scratch.
// Run: node design/skins/tools/make-assets.mjs [path to @iconify-json/game-icons icons.json]
// 9-slice frames are 120x120 with 40px corners: everything that is not a straight line stays inside a corner.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");
const out = (dir, name, svg) => { mkdirSync(join(root, dir), { recursive: true }); writeFileSync(join(root, dir, name), svg.trim() + "\n"); };
const svg = (w, h, body, defs = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}</defs>${body}</svg>`;
const r = n => Math.round(n * 100) / 100;
// the same corner drawn four times
const corners = (id, size = 120) => `<use href="#${id}"/><use href="#${id}" transform="translate(${size},0) scale(-1,1)"/><use href="#${id}" transform="translate(0,${size}) scale(1,-1)"/><use href="#${id}" transform="translate(${size},${size}) scale(-1,-1)"/>`;

const GOLD = `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f7e4a6"/><stop offset=".45" stop-color="#cfa54e"/><stop offset="1" stop-color="#8a6322"/></linearGradient>`;
const GOLD_BB = `<linearGradient id="goldb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9b0"/><stop offset=".35" stop-color="#d9b25c"/><stop offset=".7" stop-color="#9c7128"/><stop offset="1" stop-color="#5e3f12"/></linearGradient>`;
const BRASS = `<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e0a2"/><stop offset=".3" stop-color="#c79d4b"/><stop offset=".62" stop-color="#8f6828"/><stop offset=".85" stop-color="#b8904a"/><stop offset="1" stop-color="#5a3d14"/></linearGradient>`;
const RIVET = `<radialGradient id="rivet" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff3c8"/><stop offset=".35" stop-color="#d0a853"/><stop offset=".8" stop-color="#6e4c18"/><stop offset="1" stop-color="#2b1b05"/></radialGradient>`;

/* ---------------- Nightspire: gold line-work on night blue ---------------- */
{
  const corner = `<g id="c" fill="none" stroke="url(#gold)">
    <path d="M3 40V15L15 3H40" stroke-width=".8" opacity=".55"/>
    <path d="M7 40V19L19 7H40" stroke-width="1.6"/>
    <path d="M12 40V23L23 12H40" stroke-width=".7" opacity=".7"/>
    <path d="M27 7.5c4 0 7 2 7.5 5.5.4 3-2.4 4.6-4.4 3.2-1.4-1-.6-3.2 1-2.8" stroke-width=".9"/>
    <path d="M7.5 27c0 4 2 7 5.5 7.5 3 .4 4.6-2.4 3.2-4.4-1-1.4-3.2-.6-2.8 1" stroke-width=".9"/>
    <path d="M17 10.5 23.5 17 17 23.5 10.5 17Z" fill="url(#gold)" stroke="none"/>
    <path d="M17 13.5 20.5 17 17 20.5 13.5 17Z" fill="#0b1226" stroke="none"/>
    <circle cx="17" cy="17" r="1.3" fill="#8fc3ff" stroke="none"/>
  </g>`;
  out("frames", "ns-frame.svg", svg(120, 120, `<g fill="none" stroke="url(#gold)"><path d="M40 7H80M40 113H80M7 40V80M113 40V80" stroke-width="1.6"/><path d="M40 3H80M40 117H80M3 40V80M117 40V80" stroke-width=".8" opacity=".55"/><path d="M40 12H80M40 108H80M12 40V80M108 40V80" stroke-width=".7" opacity=".7"/></g>` + corners("c"), GOLD + corner));

  // elongated hexagon button, slice 0 30
  out("frames", "ns-button.svg", svg(200, 48, `
    <path d="M2 24 20 3H180L198 24 180 45H20Z" fill="url(#fillb)" stroke="url(#g2)" stroke-width="1.6"/>
    <path d="M8 24 23 7H177L192 24 177 41H23Z" fill="none" stroke="url(#g2)" stroke-width=".7" opacity=".7"/>
    <path d="M12 24 16 20 20 24 16 28Z M188 24 184 20 180 24 184 28Z" fill="url(#g2)"/>`,
    `<linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e4a6"/><stop offset=".5" stop-color="#cfa54e"/><stop offset="1" stop-color="#8a6322"/></linearGradient>
     <linearGradient id="fillb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16203d"/><stop offset="1" stop-color="#070b18"/></linearGradient>`));
  out("frames", "ns-button-go.svg", svg(200, 48, `
    <path d="M2 24 20 3H180L198 24 180 45H20Z" fill="url(#fillr)" stroke="url(#g2)" stroke-width="1.6"/>
    <path d="M8 24 23 7H177L192 24 177 41H23Z" fill="none" stroke="#ffd9a0" stroke-width=".7" opacity=".6"/>
    <path d="M12 24 16 20 20 24 16 28Z M188 24 184 20 180 24 184 28Z" fill="url(#g2)"/>`,
    `<linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e4a6"/><stop offset=".5" stop-color="#cfa54e"/><stop offset="1" stop-color="#8a6322"/></linearGradient>
     <linearGradient id="fillr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9b2235"/><stop offset="1" stop-color="#3e0812"/></linearGradient>`));

  // rune circle: two rings, ticks, a hexagram
  let ticks = "";
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2, l = i % 4 === 0 ? 7 : 3.5;
    ticks += `M${r(60 + Math.cos(a) * 54)} ${r(60 + Math.sin(a) * 54)}L${r(60 + Math.cos(a) * (54 - l))} ${r(60 + Math.sin(a) * (54 - l))}`;
  }
  const tri = off => [0, 1, 2].map(k => { const a = off + k * (Math.PI * 2 / 3); return `${r(60 + Math.cos(a) * 44)} ${r(60 + Math.sin(a) * 44)}`; }).join("L");
  out("frames", "ns-rune.svg", svg(120, 120, `<g fill="none" stroke="url(#gold)">
    <circle cx="60" cy="60" r="58" stroke-width="1.4"/><circle cx="60" cy="60" r="54" stroke-width=".6" opacity=".7"/>
    <path d="${ticks}" stroke-width=".8"/>
    <circle cx="60" cy="60" r="44" stroke-width="1" opacity=".8"/>
    <path d="M${tri(-Math.PI / 2)}Z M${tri(Math.PI / 2)}Z" stroke-width=".7" opacity=".45"/>
    </g>${[0, 1, 2, 3].map(k => { const a = k * Math.PI / 2 - Math.PI / 2; const x = 60 + Math.cos(a) * 58, y = 60 + Math.sin(a) * 58; return `<path d="M${r(x)} ${r(y - 4)}L${r(x + 4)} ${r(y)}L${r(x)} ${r(y + 4)}L${r(x - 4)} ${r(y)}Z" fill="url(#gold)"/>`; }).join("")}`, GOLD));

  // divider with a centre diamond
  out("frames", "ns-divider.svg", svg(240, 16, `<g stroke="url(#gl)" fill="none"><path d="M0 8H104M136 8H240" stroke-width="1"/><path d="M30 5H100M140 5H210M30 11H100M140 11H210" stroke-width=".5" opacity=".5"/></g>
    <path d="M120 1 127 8 120 15 113 8Z" fill="url(#gl)"/><path d="M120 4.5 123.5 8 120 11.5 116.5 8Z" fill="#0b1226"/><circle cx="120" cy="8" r="1.3" fill="#8fc3ff"/>
    <path d="M104 8 108 5 112 8 108 11Z M136 8 132 5 128 8 132 11Z" fill="url(#gl)"/>`,
    `<linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#cfa54e" stop-opacity="0"/><stop offset=".3" stop-color="#cfa54e"/><stop offset=".5" stop-color="#f7e4a6"/><stop offset=".7" stop-color="#cfa54e"/><stop offset="1" stop-color="#cfa54e" stop-opacity="0"/></linearGradient>`));

  // pointed arch crown for the card in focus
  out("frames", "ns-arch.svg", svg(240, 70, `<g fill="none" stroke="url(#gold)">
    <path d="M6 70V52C6 30 60 22 120 4 180 22 234 30 234 52V70" stroke-width="1.6"/>
    <path d="M14 70V54C14 36 64 29 120 13 176 29 226 36 226 54V70" stroke-width=".7" opacity=".7"/>
    <path d="M120 4V-4" stroke-width="1"/></g>
    <path d="M120 18 127 26 120 34 113 26Z" fill="url(#gold)"/><circle cx="120" cy="26" r="2" fill="#8fc3ff"/>`, GOLD.replace('y2="120"', 'y2="70"')));
}

/* ---------------- Highkeep: carved gold, gems, navy insets ---------------- */
{
  const GEM = (id, a, b, c) => `<radialGradient id="${id}" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
  const corner = `<g id="c">
    <path d="M0 0H34V8H16V16H8V34H0Z" fill="url(#goldb)" stroke="#2a1806" stroke-width="1"/>
    <path d="M3 3H31V5H13V13H5V31H3Z" fill="#fff2c4" opacity=".35"/>
    <path d="M6 6H40V10H10V40H6Z" fill="url(#goldb)" stroke="#2a1806" stroke-width=".8"/>
    <path d="M13 21 21 13 29 21 21 29Z" fill="url(#goldb)" stroke="#2a1806" stroke-width="1"/>
    <path d="M15.5 21 21 15.5 26.5 21 21 26.5Z" fill="url(#ruby)"/>
    <path d="M18 19 21 16.5 22 18Z" fill="#fff" opacity=".7"/>
  </g>`;
  out("frames", "hk-frame.svg", svg(120, 120, `
    <path d="M40 0H80V8H40ZM40 112H80V120H40ZM0 40H8V80H0ZM112 40H120V80H112Z" fill="url(#goldb)"/>
    <path d="M40 .5H80M40 119.5H80M.5 40V80M119.5 40V80" stroke="#2a1806"/>
    <path d="M40 7.5H80M40 112.5H80M7.5 40V80M112.5 40V80" stroke="#2a1806"/>
    <path d="M40 2.5H80M2.5 40V80" stroke="#fff2c4" stroke-opacity=".4"/>
    <path d="M40 10.5H80M40 109.5H80M10.5 40V80M109.5 40V80" stroke="#d9b25c" stroke-opacity=".55"/>` + corners("c"),
    `<linearGradient id="goldb" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse" spreadMethod="reflect"><stop offset="0" stop-color="#fbe9b0"/><stop offset=".35" stop-color="#d9b25c"/><stop offset=".7" stop-color="#9c7128"/><stop offset="1" stop-color="#5e3f12"/></linearGradient>` + GEM("ruby", "#ff9b8a", "#c0251a", "#3d0503") + corner));

  // title plaque, slice 0 60 fill
  out("frames", "hk-plaque.svg", svg(240, 48, `
    <path d="M2 24 16 6H60V42H16Z M238 24 224 6H180V42H224Z" fill="url(#bronze)" stroke="#1e1103" stroke-width="1.2"/>
    <rect x="40" y="8" width="160" height="32" fill="url(#bronze)"/>
    <path d="M40 8H200M40 40H200" stroke="#1e1103" stroke-width="1.2"/>
    <path d="M40 11H200" stroke="#fff2c4" stroke-opacity=".45"/>
    <rect x="40" y="13" width="160" height="22" fill="#0c1430" stroke="#1e1103"/>
    <path d="M40 14H200" stroke="#4d6aa8" stroke-opacity=".5"/>
    <path d="M9 24 18 13H44V35H18Z M231 24 222 13H196V35H222Z" fill="#0c1430" stroke="#1e1103"/>
    <path d="M14 24 20 18 26 24 20 30Z M226 24 220 18 214 24 220 30Z" fill="url(#ruby)" stroke="#e7c46d" stroke-width="1"/>`,
    `<linearGradient id="bronze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d892"/><stop offset=".4" stop-color="#b78a3c"/><stop offset=".75" stop-color="#7a531a"/><stop offset="1" stop-color="#4a300b"/></linearGradient>` + GEM("ruby", "#ff9b8a", "#c0251a", "#3d0503")));

  // red lacquer button with gold rim, slice 0 26 fill
  out("frames", "hk-button.svg", svg(200, 52, `
    <path d="M3 26 16 3H184L197 26 184 49H16Z" fill="url(#rim)" stroke="#1e1103" stroke-width="1.2"/>
    <path d="M10 26 20 8H180L190 26 180 44H20Z" fill="url(#lac)" stroke="#1e1103"/>
    <path d="M22 11H178" stroke="#ffd2b0" stroke-opacity=".5" stroke-width="1.2"/>`,
    `<linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9b0"/><stop offset=".5" stop-color="#c99b3e"/><stop offset="1" stop-color="#5e3f12"/></linearGradient>
     <linearGradient id="lac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4473a"/><stop offset=".5" stop-color="#931c15"/><stop offset="1" stop-color="#4c0906"/></linearGradient>`));
  out("frames", "hk-button-plain.svg", svg(200, 52, `
    <path d="M3 26 16 3H184L197 26 184 49H16Z" fill="url(#rim)" stroke="#1e1103" stroke-width="1.2"/>
    <path d="M10 26 20 8H180L190 26 180 44H20Z" fill="url(#lac)" stroke="#1e1103"/>
    <path d="M22 11H178" stroke="#9fb6e8" stroke-opacity=".35" stroke-width="1.2"/>`,
    `<linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9b0"/><stop offset=".5" stop-color="#c99b3e"/><stop offset="1" stop-color="#5e3f12"/></linearGradient>
     <linearGradient id="lac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22305e"/><stop offset=".5" stop-color="#121b3c"/><stop offset="1" stop-color="#070b1c"/></linearGradient>`));

  // portrait ring with four studs
  const studs = [0, 1, 2, 3].map(k => { const a = k * Math.PI / 2 - Math.PI / 2; const x = 50 + Math.cos(a) * 45, y = 50 + Math.sin(a) * 45; return `<path d="M${r(x)} ${r(y - 6)}L${r(x + 6)} ${r(y)}L${r(x)} ${r(y + 6)}L${r(x - 6)} ${r(y)}Z" fill="url(#goldb)" stroke="#1e1103"/><circle cx="${r(x)}" cy="${r(y)}" r="2.4" fill="url(#sapph)"/>`; }).join("");
  out("frames", "hk-ring.svg", svg(100, 100, `
    <circle cx="50" cy="50" r="44" fill="none" stroke="#1e1103" stroke-width="10"/>
    <circle cx="50" cy="50" r="44" fill="none" stroke="url(#goldb)" stroke-width="7"/>
    <circle cx="50" cy="50" r="46.5" fill="none" stroke="#fff2c4" stroke-opacity=".35" stroke-width=".8"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="#1e1103" stroke-width="1"/>${studs}`, GOLD_BB + GEM("sapph", "#c9ecff", "#2f8bd8", "#08203f")));

  // orb socket for mana
  out("frames", "hk-socket.svg", svg(60, 60, `<circle cx="30" cy="30" r="27" fill="none" stroke="#1e1103" stroke-width="7"/><circle cx="30" cy="30" r="27" fill="none" stroke="url(#goldb)" stroke-width="4.5"/><circle cx="30" cy="30" r="24" fill="none" stroke="#1e1103"/><path d="M30 1 34 5 30 9 26 5Z" fill="url(#goldb)" stroke="#1e1103" stroke-width=".8"/>`, GOLD_BB));
}

/* ---------------- Brass Meridian: brass, rivets, gears, dials ---------------- */
{
  const corner = `<g id="c">
    <path d="M0 0H40V12H22A10 10 0 0 0 12 22V40H0Z" fill="url(#brass)" stroke="#241503" stroke-width="1"/>
    <path d="M3 3H38" stroke="#fff3c8" stroke-opacity=".45"/>
    <path d="M6 38V18A12 12 0 0 1 18 6H38" fill="none" stroke="#3a2507" stroke-width=".7" opacity=".7"/>
    <path d="M9 30c0-9 5-17 14-20M14 34c2-6 6-11 12-13" fill="none" stroke="#5a3d14" stroke-width=".8" opacity=".6"/>
    <circle cx="9" cy="9" r="4.2" fill="url(#rivet)" stroke="#241503" stroke-width=".6"/>
    <circle cx="31" cy="6.5" r="2.4" fill="url(#rivet)"/><circle cx="6.5" cy="31" r="2.4" fill="url(#rivet)"/>
  </g>`;
  out("frames", "bm-frame.svg", svg(120, 120, `
    <path d="M40 0H80V12H40ZM40 108H80V120H40ZM0 40H12V80H0ZM108 40H120V80H108Z" fill="url(#brassE)"/>
    <path d="M40 .5H80M40 119.5H80M.5 40V80M119.5 40V80M40 11.5H80M40 108.5H80M11.5 40V80M108.5 40V80" stroke="#241503"/>
    <path d="M40 3H80M3 40V80" stroke="#fff3c8" stroke-opacity=".4"/>
    <path d="M40 6H80M40 114H80M6 40V80M114 40V80" stroke="#3a2507" stroke-width=".6" stroke-dasharray="1 3" opacity=".7"/>` + corners("c"),
    `<linearGradient id="brass" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse" spreadMethod="reflect"><stop offset="0" stop-color="#f6e0a2"/><stop offset=".3" stop-color="#c79d4b"/><stop offset=".62" stop-color="#8f6828"/><stop offset=".85" stop-color="#b8904a"/><stop offset="1" stop-color="#5a3d14"/></linearGradient>` +
    `<linearGradient id="brassE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9cd85"/><stop offset=".5" stop-color="#a77d35"/><stop offset="1" stop-color="#5a3d14"/></linearGradient>` + RIVET + corner));

  // gear, 16 teeth, spokes cut out
  const gear = (cx, cy, ro, ri, n) => {
    let d = "";
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, s = (Math.PI * 2 / n);
      const p = [[ri, a0], [ro, a0 + s * .18], [ro, a0 + s * .48], [ri, a0 + s * .66]];
      p.forEach(([rad, a], k) => { d += `${i === 0 && k === 0 ? "M" : "L"}${r(cx + Math.cos(a) * rad)} ${r(cy + Math.sin(a) * rad)}`; });
    }
    return d + "Z";
  };
  let holes = "";
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, b = a + Math.PI * 2 / 6 * .62, ri = 18, ro = 31;
    holes += `M${r(50 + Math.cos(a) * ri)} ${r(50 + Math.sin(a) * ri)}A${ri} ${ri} 0 0 1 ${r(50 + Math.cos(b) * ri)} ${r(50 + Math.sin(b) * ri)}L${r(50 + Math.cos(b) * ro)} ${r(50 + Math.sin(b) * ro)}A${ro} ${ro} 0 0 0 ${r(50 + Math.cos(a) * ro)} ${r(50 + Math.sin(a) * ro)}Z`;
  }
  out("frames", "bm-gear.svg", svg(100, 100, `<path d="${gear(50, 50, 48, 40, 16)} M50 41A9 9 0 1 0 50.01 41Z ${holes}" fill="url(#brass)" fill-rule="evenodd" stroke="#241503" stroke-width="1.2"/><circle cx="50" cy="50" r="36" fill="none" stroke="#fff3c8" stroke-opacity=".25"/><circle cx="50" cy="50" r="13" fill="none" stroke="#241503"/>`, BRASS));

  // life dial: aged face, 270 degree scale 0..40, brass bezel
  let t = "", nums = "";
  for (let v = 0; v <= 40; v++) {
    const a = (-225 + v / 40 * 270) * Math.PI / 180, big = v % 10 === 0, mid = v % 5 === 0;
    const l = big ? 9 : mid ? 6 : 3.5;
    t += `M${r(60 + Math.cos(a) * 44)} ${r(60 + Math.sin(a) * 44)}L${r(60 + Math.cos(a) * (44 - l))} ${r(60 + Math.sin(a) * (44 - l))}`;
    if (big) nums += `<text x="${r(60 + Math.cos(a) * 28)}" y="${r(60 + Math.sin(a) * 28 + 3.5)}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#3b2a12">${v}</text>`;
  }
  const arc = (from, to, rad) => { const a = (-225 + from / 40 * 270) * Math.PI / 180, b = (-225 + to / 40 * 270) * Math.PI / 180; return `M${r(60 + Math.cos(a) * rad)} ${r(60 + Math.sin(a) * rad)}A${rad} ${rad} 0 ${to - from > 20 ? 1 : 0} 1 ${r(60 + Math.cos(b) * rad)} ${r(60 + Math.sin(b) * rad)}`; };
  out("frames", "bm-dial.svg", svg(120, 120, `
    <circle cx="60" cy="60" r="58" fill="url(#brass)" stroke="#241503" stroke-width="1.2"/>
    <circle cx="60" cy="60" r="51" fill="#2a1a06"/>
    <circle cx="60" cy="60" r="49" fill="url(#face)"/>
    <path d="${arc(0, 10, 46)}" stroke="#b4402a" stroke-width="3" fill="none"/>
    <path d="${arc(10, 20, 46)}" stroke="#c9963c" stroke-width="3" fill="none"/>
    <path d="${arc(20, 40, 46)}" stroke="#3f9c84" stroke-width="3" fill="none"/>
    <path d="${t}" stroke="#3b2a12" stroke-width="1" fill="none"/>${nums}
    <text x="60" y="88" text-anchor="middle" font-family="Georgia,serif" font-size="6.5" letter-spacing="1.5" fill="#6a5434">VITALITY</text>
    ${[45, 135, 225, 315].map(d => { const a = d * Math.PI / 180; return `<circle cx="${r(60 + Math.cos(a) * 54.5)}" cy="${r(60 + Math.sin(a) * 54.5)}" r="2.2" fill="url(#rivet)"/>`; }).join("")}`,
    BRASS + RIVET + `<radialGradient id="face" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#f6eed6"/><stop offset=".75" stop-color="#e2d3ad"/><stop offset="1" stop-color="#b9a578"/></radialGradient>`));

  // glass vial for mana; liquid is drawn by the page behind it
  out("frames", "bm-vial.svg", svg(30, 90, `
    <rect x="3" y="0" width="24" height="9" rx="2" fill="url(#brass)" stroke="#241503"/>
    <rect x="3" y="81" width="24" height="9" rx="2" fill="url(#brass)" stroke="#241503"/>
    <rect x="6" y="9" width="18" height="72" rx="3" fill="none" stroke="#c9e6e3" stroke-opacity=".5" stroke-width="1.2"/>
    <path d="M9 13V77" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
    ${[27, 45, 63].map(y => `<path d="M18 ${y}H24" stroke="#efd28a" stroke-opacity=".7"/>`).join("")}
    <circle cx="8" cy="4.5" r="1.4" fill="url(#rivet)"/><circle cx="22" cy="4.5" r="1.4" fill="url(#rivet)"/>`, BRASS + RIVET));

  // brass name plate, slice 0 30 fill
  out("frames", "bm-plate.svg", svg(200, 50, `
    <rect x="1" y="1" width="198" height="48" rx="10" fill="url(#brass)" stroke="#241503" stroke-width="1.2"/>
    <rect x="7" y="7" width="186" height="36" rx="6" fill="none" stroke="#3a2507" stroke-opacity=".6"/>
    <path d="M12 3H188" stroke="#fff3c8" stroke-opacity=".5"/>
    <circle cx="14" cy="25" r="4" fill="url(#rivet)" stroke="#241503" stroke-width=".6"/><path d="M11.5 22.5 16.5 27.5" stroke="#2b1b05" stroke-width=".9"/>
    <circle cx="186" cy="25" r="4" fill="url(#rivet)" stroke="#241503" stroke-width=".6"/><path d="M183.5 22.5 188.5 27.5" stroke="#2b1b05" stroke-width=".9"/>`, BRASS + RIVET));
  out("frames", "bm-plate-go.svg", svg(200, 50, `
    <rect x="1" y="1" width="198" height="48" rx="10" fill="url(#copper)" stroke="#241503" stroke-width="1.2"/>
    <rect x="7" y="7" width="186" height="36" rx="6" fill="none" stroke="#3a1606" stroke-opacity=".6"/>
    <path d="M12 3H188" stroke="#ffe0c0" stroke-opacity=".55"/>
    <circle cx="14" cy="25" r="4" fill="url(#rivet)" stroke="#241503" stroke-width=".6"/><path d="M11.5 22.5 16.5 27.5" stroke="#2b1b05" stroke-width=".9"/>
    <circle cx="186" cy="25" r="4" fill="url(#rivet)" stroke="#241503" stroke-width=".6"/><path d="M183.5 22.5 188.5 27.5" stroke="#2b1b05" stroke-width=".9"/>`,
    RIVET + `<linearGradient id="copper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc396"/><stop offset=".35" stop-color="#d07a44"/><stop offset=".7" stop-color="#8a4019"/><stop offset="1" stop-color="#4f210a"/></linearGradient>`));

  // engraved filigree corner for the focus card
  out("frames", "bm-filigree.svg", svg(60, 60, `<g fill="none" stroke="url(#brass)" stroke-width="1.3" stroke-linecap="round">
    <path d="M4 56V20C4 11 11 4 20 4H56"/>
    <path d="M10 44c0-14 6-24 18-28 8-3 14 0 14 6 0 5-5 7-8 4"/>
    <path d="M44 10c-14 0-24 6-28 18-3 8 0 14 6 14 5 0 7-5 4-8"/></g>
    <circle cx="10" cy="10" r="3.2" fill="url(#rivet)"/>`, BRASS + RIVET));
}

/* ---------------- icons from game-icons.net (CC BY 3.0) ---------------- */
const iconSrc = process.argv[2];
if (iconSrc && existsSync(iconSrc)) {
  const set = JSON.parse(readFileSync(iconSrc, "utf8"));
  const pick = ["crossed-swords", "checked-shield", "scroll-unfurled", "cog", "hourglass", "crown", "tombstone", "portal", "book-cover", "heart-drop", "gears", "candle-light", "spell-book", "card-draw", "crystal-ball", "castle", "steam", "pentacle"];
  for (const name of pick) {
    const ic = set.icons[name]; if (!ic) continue;
    const w = ic.width || set.width || 512, h = ic.height || set.height || 512;
    out("icons", name + ".svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${ic.body}</svg>`);
  }
}
console.log("assets written to", root);
