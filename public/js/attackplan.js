// The attack planner (1.65.0): declaring attackers against several opponents at once.
// The old question sent every chosen creature at one target ("Attack <player>" answered the whole declaration), so in a
// multiplayer game a split attack was impossible. Here each creature gets its own target: players, and the
// planeswalkers and battles that can be attacked. The finished plan is one recorded answer ({ d: { attack } } in the
// human seat's record), so replays and undo play it back exactly.
// The first half is plain logic (no page needed; tests/attacks.mjs checks it), the second half draws the planner.
import { Agent } from './ai.js';
import * as K from './kingdomsPlay.js';
import { esc, makeRng } from './util.js';

/** Why a creature can't attack right now ('' when it can). Mirrors Game.canAttack, with a reason for the planner. */
export function whyCantAttack(g, o) {
  if (o.zone !== 'battlefield') return 'not on the battlefield';
  if (!o.fx.type.creature || g.dormant(o)) return 'not a creature right now';
  if (g.has(o, 'defender')) return 'defender';
  if (o.tapped) return 'tapped';
  if (o.sick && !g.has(o, 'haste')) return 'summoning sick';
  if (o.noAttackTurn === g.turn) return "can't attack this turn";
  const q = g.players[o.controller];
  if (q.battlefield.some(s => s.fx.noAttack)) return "your creatures can't attack";
  if (g.pacified(o)) return "can't attack (an Aura or effect)";
  if ((o.fx.needsBlessing && !g.evalCond(q, o, { c: 'blessing' })) || (o.fx.attackCond && !g.evalCond(q, o, o.fx.attackCond))) return "its attack condition isn't met";
  return g.canAttack(o) ? '' : "can't attack";
}

/** Target keys: 'p<seat>' for a player, 'o<iid>' for a planeswalker or battle. */
export const targetKey = t => (t.obj ? `o${t.obj.iid}` : `p${t.player}`);

/** Why creature o can't attack target t ({ player, obj? }); '' when it can. The same checks combat.js makes per target. */
export function targetRefusal(g, p, o, t) {
  const q = g.players[t.player];
  if (!q || q === p || q.lost) return 'not an opponent';
  if ((g.kingdoms && K.teammates(p, q)) || (g.teams && q.team === p.team)) return 'a teammate';
  if (t.obj && !g.attackable(p, t.obj)) return "can't be attacked";
  if (g.rules >= 25 && o.fx.attackOnce25 && o.attackedPlayers25?.turn === g.turn && o.attackedPlayers25.list.includes(q.idx)) return 'already attacked that player this turn';
  if (g.has(o, 'flying') && q.battlefield.some(s => s.fx.noFlyAttack)) return "creatures with flying can't attack that player";
  if (g.rules >= 26 && q.battlefield.some(s => s.fx.noAttackNamed26 && o.card.name.toLowerCase() === s.fx.noAttackNamed26)) return "can't attack that player";
  return '';
}

/** Everything the planner shows: who can attack, who can't (and why), and each target with its rules notes. */
export function attackOptions(g, p) {
  const creatures = p.battlefield.filter(o => o.fx.type.creature && !g.dormant(o));
  const eligible = creatures.filter(o => g.canAttack(o));
  const unavailable = creatures.filter(o => !g.canAttack(o)).map(o => ({ o, why: whyCantAttack(g, o) || "can't attack" }));
  const targets = [];
  for (const q of g.opponents(p)) {
    const tax = q.battlefield.reduce((s, o) => s + (o.fx.attackTax || 0) + (o.fx.attackTaxDyn ? g.countControlled(q, o.fx.attackTaxDyn) : 0), 0);
    const caps = q.battlefield.filter(o => o.fx.attackMeCap && (!o.fx.attackMeCap.tapped || o.tapped)).map(o => o.fx.attackMeCap.n);
    const notes = [];
    if (tax) notes.push(`costs {${tax}} per attacker`);
    if (caps.length) notes.push(`at most ${Math.min(...caps)} attacker${Math.min(...caps) === 1 ? '' : 's'}`);
    if (q.battlefield.some(s => s.fx.noFlyAttack)) notes.push("flyers can't attack");
    targets.push({ key: `p${q.idx}`, player: q.idx, obj: null, q, name: q.name, life: q.life, color: q.color, tax, notes });
  }
  for (const o of g.alive().flatMap(q => q.battlefield.filter(x => g.attackable(p, x)))) {
    const owner = o.fx.type.battle ? o.protector : o.controller;
    const q = g.players[owner];
    const caps = o.fx.attackSelfCap26 && g.rules >= 26 ? [`at most ${o.fx.attackSelfCap26}`] : [];
    targets.push({ key: `o${o.iid}`, player: owner, obj: o, q, name: o.card.name, life: o.fx.type.battle ? o.defense : o.loyalty, color: q.color,
      tax: 0, notes: [o.fx.type.battle ? `battle protected by ${q.name}` : `${q.name}'s planeswalker`, ...caps] });
  }
  // (rules notes for the whole table: Silent Arbiter and friends)
  const tableNotes = [];
  if (g.alive().some(q => q.battlefield.some(o => o.fx.attackCap))) tableNotes.push('Only one creature can attack each combat (the strongest one you choose goes).');
  const forced = eligible.filter(o => (o.goaded && o.goaded.until >= g.turn) || o.fx.mustAttack || (o.fx.condBuff?.mustAttack && g.condBuff(o)) || (g.rules >= 27 && o.mustAttack27 === g.turn));
  return { eligible, unavailable, targets, tableNotes, forced };
}

/** The declaration combat.js reads ({ o, target, obj? }) from a plan: Map of creature iid → target key. Illegal pairs are dropped. */
export function planToDecl(g, p, plan) {
  const { eligible, targets } = attackOptions(g, p);
  const byKey = new Map(targets.map(t => [t.key, t]));
  const out = [];
  for (const o of eligible) {
    const t = byKey.get(plan.get(o.iid));
    if (!t || targetRefusal(g, p, o, t)) continue;
    out.push(t.obj ? { o, target: t.player, obj: t.obj } : { o, target: t.player });
  }
  return out;
}

/** The recorded form of a declaration: [[creature iid, target seat, attacked permanent's iid or null], …] */
export const declToRecord = decl => decl.map(d => [d.o.iid, d.target, d.obj ? d.obj.iid : null]);
/** And back, checking every entry against the game as it is now (a damaged or foreign record can't sneak in an illegal attack). */
export function recordToDecl(g, p, rec) {
  if (!Array.isArray(rec)) return [];
  const plan = new Map();
  for (const e of rec) {
    if (!Array.isArray(e) || typeof e[0] !== 'number' || typeof e[1] !== 'number') continue;
    plan.set(e[0], e[2] != null ? `o${e[2]}` : `p${e[1]}`);
  }
  return planToDecl(g, p, plan);
}

/** "Spread evenly": the strongest creature first, each to the allowed player with the least power sent so far
 * (ties: the one with less life). Only players, not planeswalkers. Deterministic. */
export function spreadEvenly(g, p, creatures, targetKeys) {
  const { targets } = attackOptions(g, p);
  const ts = targets.filter(t => !t.obj && (!targetKeys || targetKeys.includes(t.key)));
  const sent = new Map(ts.map(t => [t.key, 0]));
  const plan = new Map();
  for (const o of [...creatures].sort((a, b) => g.power(b) - g.power(a) || a.iid - b.iid)) {
    let ok = ts.filter(t => !targetRefusal(g, p, o, t));
    // (an opponent with an attack tax, Ghostly Prison or Propaganda, only when no untaxed one can be attacked)
    if (ok.some(t => !t.tax)) ok = ok.filter(t => !t.tax);
    if (!ok.length) continue;
    ok.sort((a, b) => sent.get(a.key) - sent.get(b.key) || a.life - b.life || a.player - b.player);
    plan.set(o.iid, ok[0].key);
    sent.set(ok[0].key, sent.get(ok[0].key) + Math.max(0, g.power(o)));
  }
  return plan;
}

/** "AI plan": what a plain AI pilot of the same style would attack with. It runs on a random stream of its own and
 * logs nothing, so asking never changes the game (or a replay of it), the same way as the coach's hints. */
export function aiPlan(g, p, style) {
  const rand = g.rand;
  g.rand = makeRng(((g.turn + 1) * 104729 + (g.steps || 0)) >>> 0);
  try {
    const ai = new Agent(style || 'balanced');
    ai.lookahead = false;
    ai.explain = () => {};
    const r = ai.declareAttackersPlan(g, p);
    const plan = new Map();
    for (const d of Array.isArray(r) ? r : []) plan.set(d.o.iid, d.obj ? `o${d.obj.iid}` : `p${d.target}`);
    return plan;
  } catch { return new Map(); } finally { g.rand = rand; }
}

/** A short summary of a plan, per target: "North ×3 (7 power)". */
export function planSummary(g, p, plan) {
  const { targets } = attackOptions(g, p);
  const decl = planToDecl(g, p, plan);
  const parts = targets.map(t => {
    const mine = decl.filter(d => (d.obj ? `o${d.obj.iid}` : `p${d.target}`) === t.key);
    // (can the tax be paid? combat.js holds back the attackers it can't pay for, strongest first)
    const tax = t.tax * mine.length;
    let unpaid = false;
    try { unpaid = tax > 0 && !g.planPayment(p, { generic: tax, pips: [], x: 0 }); } catch { unpaid = false; }
    return mine.length ? { t, n: mine.length, power: mine.reduce((s, d) => s + Math.max(0, g.power(d.o)), 0), tax, unpaid } : null;
  }).filter(x => !!x);
  return { decl, parts };
}

// ---------- the planner on the page

const KW_ICONS = [['flying', '🪽', 'flying'], ['vigilance', '👁', "vigilance (won't tap)"], ['trample', '🦶', 'trample'], ['haste', '⚡', 'haste'],
  ['deathtouch', '☠', 'deathtouch'], ['lifelink', '❤', 'lifelink'], ['first strike', '⚔', 'first strike'], ['double strike', '⚔⚔', 'double strike'], ['menace', '😈', 'menace']];

/**
 * Draws the planner into host and keeps it up to date. ctx: { g, p, view, style, initial (Map), last (Map|null),
 * done(decl|'none'|'ai') }. Returns { toggle(o), assignTo(iid, seat), confirm(), state } for the board's clicks and drags.
 */
export function attackPlanner(host, ctx) {
  const { g, p, view } = ctx;
  const opts = attackOptions(g, p);
  const plan = new Map(ctx.initial || []);
  const sel = new Set();
  const byIid = new Map(opts.eligible.map(o => [o.iid, o]));
  const tByKey = new Map(opts.targets.map(t => [t.key, t]));
  let msg = '';
  const root = document.createElement('div');
  root.className = 'atk-plan';
  host.append(root);

  const avatarOf = i => view?.boards?.[i]?.el?.querySelector('.avatar')?.style.backgroundImage || '';
  const paint = o => { const el = view?.cards?.get(o.iid); if (el) el.classList.toggle('chosen', plan.has(o.iid) || sel.has(o.iid)); };
  const assign = (iids, key) => {
    const t = tByKey.get(key);
    const refused = [];
    for (const iid of iids) {
      const o = byIid.get(iid);
      if (!o || !t) continue;
      const why = targetRefusal(g, p, o, t);
      if (why) { refused.push(`${o.card.name}: ${why}`); continue; }
      plan.set(iid, key);
    }
    msg = refused.length ? `Not moved — ${refused.join('; ')}` : '';
  };
  const api = {
    state: { plan, sel },
    toggle(o) { if (!byIid.has(o.iid)) return; sel.has(o.iid) ? sel.delete(o.iid) : sel.add(o.iid); draw(); },
    // (a creature dropped on a player's board on the table; a selected one takes the rest of the selection with it)
    assignTo(iid, seat) {
      const key = `p${seat}`;
      if (!tByKey.has(key)) return;
      assign(sel.has(iid) ? [...sel] : [iid], key);
      if (sel.has(iid)) sel.clear();
      draw();
    },
    confirm() { const decl = planToDecl(g, p, plan); ctx.done(decl.length ? decl : 'none'); },
    // (only here for the interface test: the same as clicking that target's lane)
    moveSelected(key) { assign([...sel], key); sel.clear(); draw(); },
  };

  const btn = (label, title, on, cls = 'btn') => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.textContent = label; if (title) b.title = title;
    b.addEventListener('click', e => { e.stopPropagation(); on(); });
    return b;
  };

  function draw() {
    root.innerHTML = '';
    for (const o of [...opts.eligible]) paint(o);
    // Bulk controls
    const tools = document.createElement('div');
    tools.className = 'atk-tools';
    tools.append(
      btn('Select all', 'Select every creature that can attack', () => { for (const o of opts.eligible) sel.add(o.iid); draw(); }),
      btn('Select unassigned', 'Select the creatures that are not attacking yet', () => { sel.clear(); for (const o of opts.eligible) if (!plan.has(o.iid)) sel.add(o.iid); draw(); }),
      btn('Clear selection', '', () => { sel.clear(); draw(); }),
      btn('Spread evenly', 'Every creature that can attack, shared out so each opponent gets about the same power (selected creatures only, when some are selected)', () => {
        const pool = sel.size ? opts.eligible.filter(o => sel.has(o.iid)) : opts.eligible;
        for (const [k, v] of spreadEvenly(g, p, pool)) plan.set(k, v);
        sel.clear(); msg = ''; draw();
      }),
      btn('AI plan', "What the AI pilot would attack with here (you can change it before confirming)", () => {
        const ai = aiPlan(g, p, ctx.style);
        plan.clear(); for (const [k, v] of ai) plan.set(k, v);
        msg = ai.size ? '' : 'The AI would not attack here.'; sel.clear(); draw();
      }),
      ...(ctx.last?.size ? [btn('Last combat', 'Start from your previous attack (creatures still able to attack the same targets)', () => {
        plan.clear();
        for (const [iid, key] of ctx.last) if (byIid.has(iid) && tByKey.has(key) && !targetRefusal(g, p, byIid.get(iid), tByKey.get(key))) plan.set(iid, key);
        msg = plan.size ? '' : 'None of last combat\'s attackers can attack the same targets now.'; draw();
      })] : []),
      btn('Reset', 'Nobody attacks; start again', () => { plan.clear(); sel.clear(); msg = ''; draw(); }),
    );
    root.append(tools);

    // One lane per target: avatar, name, life, how many attackers and how much power
    const lanes = document.createElement('div');
    lanes.className = 'atk-lanes';
    for (const t of opts.targets) {
      const mine = opts.eligible.filter(o => plan.get(o.iid) === t.key);
      const power = mine.reduce((s, o) => s + Math.max(0, g.power(o)), 0);
      const lane = document.createElement('div');
      lane.className = `atk-lane${t.obj ? ' perm' : ''}${mine.length ? ' has' : ''}`;
      lane.style.setProperty('--pc', t.color || '');
      lane.dataset.key = t.key;
      const head = document.createElement('button');
      head.type = 'button';
      head.className = 'atk-lane-head';
      head.title = sel.size ? `Send the ${sel.size} selected creature${sel.size === 1 ? '' : 's'} to ${t.name}` : `Select creatures below, then click here to send them to ${t.name}`;
      const av = t.obj ? '' : avatarOf(t.player);
      head.innerHTML = `<span class="atk-av"${av ? ` style="background-image:${esc(av)}"` : ''}>${t.obj ? (t.obj.fx.type.battle ? '⛨' : '✦') : esc(String(t.player + 1))}</span>
        <span class="atk-who"><b>${esc(t.name)}</b><span class="muted">${t.obj ? (t.obj.fx.type.battle ? `${t.life} defense` : `${t.life} loyalty`) : `${t.life} life`}</span></span>
        <span class="atk-count" aria-label="${mine.length} attackers, ${power} power">${mine.length ? `⚔ ${mine.length} · ${power}` : '—'}</span>`;
      head.addEventListener('click', e => { e.stopPropagation(); if (!sel.size) { msg = `Select creatures first (click them below or on your board), then click ${t.name}.`; draw(); return; } assign([...sel], t.key); sel.clear(); draw(); });
      lane.append(head);
      if (t.notes.length) { const n = document.createElement('div'); n.className = 'atk-note'; n.textContent = t.notes.join(' · '); lane.append(n); }
      const row = document.createElement('div');
      row.className = 'atk-lane-btns';
      row.append(
        btn('All here', `Every creature that can attack ${t.name} goes there`, () => { assign(opts.eligible.map(o => o.iid), t.key); sel.clear(); draw(); }, 'btn small'),
        ...(mine.length ? [btn('Clear', `Nobody attacks ${t.name}`, () => { for (const o of mine) plan.delete(o.iid); draw(); }, 'btn small')] : []),
      );
      lane.append(row);
      // (drop a creature chip here)
      lane.addEventListener('dragover', e => { e.preventDefault(); lane.classList.add('drop'); });
      lane.addEventListener('dragleave', () => lane.classList.remove('drop'));
      lane.addEventListener('drop', e => {
        e.preventDefault(); lane.classList.remove('drop');
        const iid = +(e.dataTransfer?.getData('text/plain') || 0);
        if (!byIid.has(iid)) return;
        assign(sel.has(iid) ? [...sel] : [iid], t.key);
        if (sel.has(iid)) sel.clear();
        draw();
      });
      lanes.append(lane);
    }
    root.append(lanes);

    // The creatures: available ones first (selected and assigned stand out), then the ones that can't attack, greyed with the reason
    const grid = document.createElement('div');
    grid.className = 'atk-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Your creatures');
    for (const o of opts.eligible) {
      const key = plan.get(o.iid), t = key ? tByKey.get(key) : null;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `atk-chip${sel.has(o.iid) ? ' sel' : ''}${t ? ' set' : ''}`;
      chip.draggable = true;
      chip.dataset.iid = String(o.iid);
      chip.setAttribute('aria-pressed', String(sel.has(o.iid)));
      if (t) chip.style.setProperty('--pc', t.color || '');
      const kws = KW_ICONS.filter(([k]) => g.has(o, k)).filter(([k], i, a) => !(k === 'first strike' && a.some(x => x[0] === 'double strike')));
      const forced = opts.forced.includes(o);
      chip.title = `${o.card.name} ${g.power(o)}/${g.toughness(o)}${kws.length ? ` · ${kws.map(x => x[2]).join(', ')}` : ''}${forced ? ' · must attack if able' : ''}${t ? ` · attacking ${t.name}` : ''}\nClick to select; drag onto a player to send it there.`;
      chip.innerHTML = `<span class="atk-name">${esc(o.card.name)}</span><span class="atk-pt">${g.power(o)}/${g.toughness(o)}</span>${kws.length ? `<span class="atk-kw" aria-hidden="true">${kws.map(x => x[1]).join('')}</span>` : ''}${forced ? '<span class="atk-must">must attack</span>' : ''}<span class="atk-to">${t ? `→ ${esc(t.name)}` : 'stays home'}</span>`;
      chip.addEventListener('click', e => { e.stopPropagation(); api.toggle(o); });
      chip.addEventListener('dragstart', e => { e.dataTransfer?.setData('text/plain', String(o.iid)); });
      if (t) {
        const x = document.createElement('span');
        x.className = 'atk-x'; x.textContent = '✕'; x.title = 'Stays home'; x.setAttribute('role', 'button'); x.setAttribute('aria-label', `${o.card.name} stays home`);
        x.addEventListener('click', e => { e.stopPropagation(); plan.delete(o.iid); sel.delete(o.iid); draw(); });
        chip.append(x);
      }
      grid.append(chip);
    }
    for (const { o, why } of opts.unavailable) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'atk-chip off';
      chip.disabled = true;
      chip.dataset.iid = String(o.iid);
      chip.title = `${o.card.name} can't attack: ${why}`;
      chip.innerHTML = `<span class="atk-name">${esc(o.card.name)}</span><span class="atk-pt">${g.power(o)}/${g.toughness(o)}</span><span class="atk-to">${esc(why)}</span>`;
      grid.append(chip);
    }
    root.append(grid);

    // Summary and the buttons that answer
    const { decl, parts } = planSummary(g, p, plan);
    const sum = document.createElement('div');
    sum.className = 'atk-sum';
    sum.setAttribute('aria-live', 'polite');
    const home = opts.eligible.length - decl.length;
    sum.innerHTML = `${decl.length ? `<b>Attacking with ${decl.length}:</b> ${parts.map(x => `${esc(x.t.name)} ×${x.n} (${x.power} power${x.tax ? `, pay {${x.tax}}${x.unpaid ? ' — not enough mana: those not paid for stay home' : ''}` : ''})`).join(', ')}.` : '<b>No attackers chosen.</b>'}
      ${home ? `${home} stay${home === 1 ? 's' : ''} home.` : ''}${sel.size ? ` <span class="muted">${sel.size} selected: click a player above to send them.</span>` : ''}
      ${opts.tableNotes.map(n => `<br><span class="muted">${esc(n)}</span>`).join('')}${opts.forced.length ? `<br><span class="muted">Creatures that must attack attack anyway if you leave them home.</span>` : ''}${msg ? `<br><span class="atk-msg">${esc(msg)}</span>` : ''}`;
    root.append(sum);
    const acts = document.createElement('div');
    acts.className = 'atk-acts';
    acts.append(
      btn(decl.length ? `Confirm attackers (${decl.length})` : 'Confirm: no attack', 'Declare these attackers (Enter)', () => api.confirm(), 'btn primary'),
      btn('No attack', 'Attack with nothing this combat', () => ctx.done('none')),
      btn('Let the AI attack', 'The AI pilot declares the attack for you', () => ctx.done('ai')),
    );
    root.append(acts);
  }
  draw();
  return api;
}
