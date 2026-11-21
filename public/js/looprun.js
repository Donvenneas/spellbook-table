// The loop runner (1.65.0): a loop you've played twice by hand (the loop shortcut, human.js loopBlock) repeated an
// exact number of times. The count is picked from a list (1, 2, 3, 5, 10, 25, 50) or typed; the run shows its
// progress and can be paused, resumed or stopped between repetitions; a preview plays the loop on a copy of the game
// first and estimates what the whole run will do.
// Every repetition is the same real actions through the engine (Game.activate, Game.cast, Game.sacTo, mana abilities),
// so triggers, replacement effects and state-based actions happen as they would by hand. The run stops by itself when
// an action can't be done the same way any more, and says why. Choices the loop's actions ask for are asked of you;
// "answer the same way each time" answers a yes/no question the way you answered it the first time.
// Replays: the count is one recorded answer ({ d: { repeat, auto } }); a run stopped by hand adds where it stopped
// ({ stop }), so a replay stops at the same repetition.
import { esc } from './util.js';
import { cloneGame } from './lookahead.js';

export const REPEAT_CHOICES = [1, 2, 3, 5, 10, 25, 50];
export const MAX_REPEATS = 999;
export const clampReps = n => Math.max(1, Math.min(MAX_REPEATS, Math.floor(+n) || 1));

/** What one action of a loop is, in words */
export function actionText(g, x) {
  const o = x.iid != null ? g.objects.get(x.iid) : null;
  const name = o?.card.name || x.name || 'a card';
  if (x.k === 'mana') return `tap ${name} for mana`;
  if (x.k === 'cast') return `cast ${x.name} from your ${x.zone}`;
  if (x.k === 'sac') return `sacrifice ${x.name} to ${name}`;
  const ab = o ? g.abilitiesOf(o)[x.i] : null;
  return `${name}: ${ab?.text ? ab.text.slice(0, 40) : 'ability'}`;
}

/** Why the loop can't start right now ('' when it can): every piece still there, and the first action can be done. */
export function blockProblem(g, p, block) {
  for (const x of block) {
    if (x.k === 'cast') continue;
    const o = g.objects.get(x.iid);
    if (!o || o.zone !== 'battlefield' || o.controller !== p.idx) return `${o?.card.name || 'a card of the loop'} isn't on your battlefield any more`;
  }
  const x = block[0];
  if (x.k === 'cast') { const c = p[x.zone]?.find(y => y.card.name === x.name); return c && g.canCast(p, c) ? '' : `${x.name} can't be cast from your ${x.zone} now`; }
  const o = g.objects.get(x.iid);
  if (x.k === 'mana') return o.tapped ? `${o.card.name} is tapped` : '';
  if (x.k === 'sac') return o.fx.sacOutlet && !(o.fx.sacOutlet.tap && o.tapped) && p.battlefield.some(y => y.card.name === x.name && y.fx.type.creature) ? '' : `${x.name} can't be sacrificed to ${o.card.name}`;
  const ab = g.abilitiesOf(o)[x.i];
  return ab && g.canActivate(p, o, ab) ? '' : `${o.card.name}'s ability can't be paid for or used`;
}

/**
 * Plays the block n times, checking every step; it stops at the first action that can't be done the same way.
 * hooks.before(done) runs before each repetition (await it to pause; return 'stop' to stop there), hooks.after(done)
 * after each. Returns { done, why }. (The loop shortcut's engine half, moved here from human.js unchanged.)
 */
export async function runLoopBlock(g, p, block, n, hooks = {}) {
  let done = 0, why = '';
  for (; done < n && !g.over && !p.lost; done++) {
    if (hooks.before && (await hooks.before(done)) === 'stop') { why = 'you stopped it'; break; }
    for (const x of block) {
      // (rules 7) a creature spell cast again from the zone it was cast from last time (Squee from exile, Gravecrawler)
      if (x.k === 'cast') {
        const c = p[x.zone]?.find(y => y.card.name === x.name);
        if (!c || !g.canCast(p, c)) { why = `${x.name} can't be cast from your ${x.zone} now`; break; }
        await g.cast(p, c);
        continue;
      }
      const o = g.objects.get(x.iid);
      if (!o || o.zone !== 'battlefield' || o.controller !== p.idx) { why = `${o?.card.name || 'a card'} isn't on your battlefield any more`; break; }
      if (x.k === 'mana') { if (o.tapped || !g.tapForMana(p, o)) { why = `${o.card.name} can't be tapped for mana`; break; } continue; }
      // (rules 7) the same creature sacrificed to the same outlet
      if (x.k === 'sac') {
        const v = p.battlefield.find(y => y.card.name === x.name && y.fx.type.creature && (y !== o || !o.fx.sacOutlet?.other));
        if (!v || !o.fx.sacOutlet || (o.fx.sacOutlet.tap && o.tapped)) { why = `${x.name} can't be sacrificed to ${o.card.name}`; break; }
        await g.sacTo(p, o, v);
        continue;
      }
      const ab = g.abilitiesOf(o)[x.i];
      if (!ab || !g.canActivate(p, o, ab)) { why = `${o.card.name}'s ability can't be paid for or used`; break; }
      await g.activate(p, o, ab);
    }
    if (why) break;
    if (hooks.after) await hooks.after(done + 1);
  }
  if (!why && done < n) why = g.over ? 'the game is over' : p.lost ? 'you lost' : '';
  return { done, why };
}

// ---------- preview: the loop played on a copy of the game

/** The numbers a preview compares: life, tokens, cards, mana and counters (counts only: no hidden card is named). */
export function loopSnapshot(g, p) {
  const opps = g.players.filter(q => q !== p);
  const counters = p.battlefield.reduce((s, o) => s + (o.counters || 0) + Object.values(o.named || {}).reduce((a, v) => a + (+v || 0), 0), 0);
  return {
    life: p.life,
    oppLife: opps.filter(q => !q.lost).reduce((s, q) => s + q.life, 0),
    oppsLost: opps.filter(q => q.lost).length,
    tokens: p.battlefield.filter(o => o.token).length,
    creatures: p.battlefield.filter(o => o.fx.type.creature).length,
    hand: p.hand.length,
    library: p.library.length,
    oppLibrary: opps.reduce((s, q) => s + q.library.length, 0),
    graveyard: p.graveyard.length,
    mana: (p.pool || []).length,
    counters,
  };
}
const SNAP_TEXT = {
  life: ['you gain {n} life', 'you lose {n} life'],
  oppLife: ['opponents gain {n} life in total', 'opponents lose {n} life in total'],
  tokens: ['{n} more tokens', '{n} fewer tokens'],
  creatures: ['{n} more creatures', '{n} fewer creatures'],
  hand: ['{n} more cards in hand', '{n} fewer cards in hand'],
  library: ['', 'you draw or mill {n} cards'],
  oppLibrary: ['', 'opponents lose {n} cards from their libraries'],
  graveyard: ['{n} more cards in your graveyard', '{n} fewer cards in your graveyard'],
  mana: ['{n} more mana in your pool', '{n} less mana in your pool'],
  counters: ['{n} more counters on your permanents', '{n} fewer counters on your permanents'],
};
/** The change between two snapshots, in words (per repetition when per > 1) */
export function snapshotChange(a, b, per = 1) {
  const out = [];
  for (const [k, [up, down]] of Object.entries(SNAP_TEXT)) {
    const d = (b[k] - a[k]) / per;
    if (!d) continue;
    const t = d > 0 ? up : down;
    const n = Math.abs(d);
    if (t) out.push(t.replace('{n}', Number.isInteger(n) ? String(n) : n.toFixed(1)));
  }
  if (b.oppsLost > a.oppsLost) out.push(`${b.oppsLost - a.oppsLost} opponent${b.oppsLost - a.oppsLost === 1 ? '' : 's'} lose${b.oppsLost - a.oppsLost === 1 ? 's' : ''} the game`);
  return out;
}

/**
 * Plays up to n repetitions (at most 50) on a copy of the game and reports what each did on average, and the estimate
 * for all n. The copy's choices are made by the AI, its libraries are in an unknown order, and nothing it does reaches
 * the real game. Returns { ran, n, why, per: [text], total: [text], over }.
 */
export async function previewLoop(g, p, block, n) {
  const m = Math.min(n, 50);
  let ng;
  try { ng = cloneGame(g, ((g.turn + 7) * 2654435761 + (g.steps || 0)) >>> 0, 60000); } catch (e) { return { ran: 0, n, why: 'the preview could not copy the game', per: [], total: [], over: false }; }
  const np = ng.players[p.idx];
  const a = loopSnapshot(ng, np);
  let res = { done: 0, why: '' }, over = false;
  try { res = await runLoopBlock(ng, np, block, m); } catch (e) { over = true; res.why = e?.name === 'OverBudget' ? 'the preview ran too long' : `the preview failed (${e?.message || e})`; }
  const b = loopSnapshot(ng, np);
  const done = res.done;
  const scale = done ? n / done : 0;
  const total = done ? snapshotChange(a, { ...a, ...Object.fromEntries(Object.keys(a).map(k => [k, a[k] + (b[k] - a[k]) * (res.why ? 1 : scale)])) }) : [];
  return { ran: done, n, why: res.why, per: done ? snapshotChange(a, b, done) : [], total, over, gameOver: ng.over || np.lost };
}

// ---------- on the page

/**
 * The loop controls in the main phase's action bar. ctx: { g, p, block, reps (last count used), auto, answer(data),
 * preview(n) → Promise }. Returns { key(e) }.
 */
export function loopPanel(host, ctx) {
  const { g, p, block } = ctx;
  const box = document.createElement('div');
  box.className = 'loop-ctl';
  const problem = blockProblem(g, p, block);
  const reps = clampReps(ctx.reps || 10);
  const inList = REPEAT_CHOICES.includes(reps);
  box.innerHTML = `<div class="loop-what"><b>🔁 Loop found</b> <span class="muted">(you played it twice): ${block.map(x => esc(actionText(g, x))).join(' → ')}</span></div>
    <div class="loop-row">
      <label>Repetitions <select class="input loop-sel" aria-label="Repetitions">${REPEAT_CHOICES.map(v => `<option value="${v}"${v === reps ? ' selected' : ''}>${v}</option>`).join('')}<option value="custom"${inList ? '' : ' selected'}>Custom…</option></select></label>
      <input class="input loop-n" type="number" min="1" max="${MAX_REPEATS}" step="1" value="${reps}" aria-label="Number of repetitions">
      <label class="loop-auto" title="A yes/no question the loop asks (an optional trigger, a &quot;you may&quot;) is answered the way you answered it the first time, for the rest of this run. Targets and other choices are always asked."><input type="checkbox"${ctx.auto ? ' checked' : ''}> Answer yes/no questions the same way each time</label>
    </div>
    <div class="loop-row">
      <button type="button" class="btn loop-prev">Preview</button>
      <button type="button" class="btn primary loop-go">Execute loop</button>
      <span class="loop-msg muted" aria-live="polite">${problem ? `Can't start: ${esc(problem)}.` : ''}</span>
    </div>
    <div class="loop-out muted" aria-live="polite"></div>`;
  host.append(box);
  const sel = /** @type {HTMLSelectElement} */ (box.querySelector('.loop-sel'));
  const num = /** @type {HTMLInputElement} */ (box.querySelector('.loop-n'));
  const auto = /** @type {HTMLInputElement} */ (box.querySelector('.loop-auto input'));
  const go = /** @type {HTMLButtonElement} */ (box.querySelector('.loop-go'));
  const out = /** @type {HTMLElement} */ (box.querySelector('.loop-out'));
  const count = () => clampReps(num.value);
  const sync = () => { go.textContent = `Execute loop ×${count()}`; go.disabled = !!problem; };
  sel.addEventListener('change', () => { if (sel.value === 'custom') { num.focus(); num.select(); } else num.value = sel.value; sync(); });
  num.addEventListener('input', () => { const v = count(); sel.value = REPEAT_CHOICES.includes(v) && String(v) === num.value ? String(v) : 'custom'; sync(); });
  num.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !problem) run(); });
  for (const el of [sel, num, auto]) el.addEventListener('click', e => e.stopPropagation());
  const run = () => { num.value = String(count()); ctx.answer({ repeat: count(), auto: auto.checked }); };
  go.addEventListener('click', e => { e.stopPropagation(); run(); });
  box.querySelector('.loop-prev')?.addEventListener('click', async e => {
    e.stopPropagation();
    const n = count();
    out.textContent = `Playing the loop on a copy of the game (up to ${Math.min(n, 50)} times)…`;
    const r = await ctx.preview(n);
    if (!out.isConnected) return;
    const est = r.ran >= n || r.why ? '' : ` Estimated for ${n}: ${r.total.join(', ') || 'no visible change'}.`;
    out.innerHTML = r.ran
      ? `<b>Preview</b> (on a copy; the AI made its choices): each repetition — ${esc(r.per.join(', ') || 'no visible change')}.${r.ran >= n && !r.why ? ` All ${n}: ${esc(r.total.join(', ') || 'no visible change')}.` : esc(est)}${r.why ? ` <span class="atk-msg">It stopped after ${r.ran} of ${n}: ${esc(r.why)}.</span>` : ''}${r.gameOver ? ' <b>The game would end.</b>' : ''}`
      : `<span class="atk-msg">The loop can't be repeated${r.why ? `: ${esc(r.why)}` : ''}.</span>`;
  });
  sync();
  return { key: e => { if (e.key === 'Enter' && !problem) { run(); return true; } return false; } };
}

/** The progress box while a loop runs: "Loop progress 12 / 25", Pause/Resume and Stop. */
export class LoopProgress {
  constructor(n, label) {
    this.n = n; this.paused = false; this.stopped = false; this.waiters = [];
    const el = this.el = document.createElement('div');
    el.className = 'loop-run';
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="loop-run-top"><b>Loop progress</b> <span class="loop-run-n">0 / ${n}</span><span class="muted loop-run-what">${esc(label)}</span></div>
      <div class="loop-bar"><i></i></div>
      <div class="loop-run-btns"><button type="button" class="btn loop-pause">Pause</button><button type="button" class="btn loop-stop">Stop</button><span class="loop-run-msg muted"></span></div>`;
    document.body.append(el);
    this.pauseBtn = /** @type {HTMLButtonElement} */ (el.querySelector('.loop-pause'));
    this.stopBtn = /** @type {HTMLButtonElement} */ (el.querySelector('.loop-stop'));
    this.pauseBtn.addEventListener('click', () => this.setPaused(!this.paused));
    this.stopBtn.addEventListener('click', () => this.stop());
  }
  setPaused(on) {
    if (this.stopped) return;
    this.paused = on;
    this.pauseBtn.textContent = on ? 'Resume' : 'Pause';
    this.el.classList.toggle('paused', on);
    this.note(on ? 'Paused (the run waits before its next repetition).' : '');
    if (!on) this.release();
  }
  stop() { this.stopped = true; this.note('Stopping after this repetition…'); this.release(); }
  release() { const w = this.waiters; this.waiters = []; w.forEach(f => f()); }
  wait() { return this.paused && !this.stopped ? new Promise(res => this.waiters.push(res)) : Promise.resolve(); }
  note(t) { const m = this.el.querySelector('.loop-run-msg'); if (m) m.textContent = t; }
  progress(done) {
    const nEl = this.el.querySelector('.loop-run-n');
    if (nEl) nEl.textContent = `${done} / ${this.n}`;
    const bar = /** @type {HTMLElement | null} */ (this.el.querySelector('.loop-bar i'));
    if (bar) bar.style.width = `${Math.round(100 * done / this.n)}%`;
  }
  // The end: a completion message (or why it stopped early), then the box goes
  finish(done, why) {
    this.stopped = true;
    this.release();
    this.progress(done);
    this.pauseBtn.remove();
    this.stopBtn.textContent = 'Close';
    this.stopBtn.onclick = () => this.el.remove();
    this.el.classList.add(why ? 'early' : 'complete');
    this.note(why ? `Stopped after ${done} of ${this.n}: ${why}.` : `Done: the loop ran ${done} of ${this.n} times.`);
    setTimeout(() => this.el.remove(), why ? 12000 : 4000);
  }
}
