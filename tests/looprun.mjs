// The loop runner (1.65.0, looprun.js and HumanAgent.runLoop): a loop repeated an exact number of times with real
// cards, triggers along the way, running out of resources, pausing and stopping between repetitions, stopping by hand
// recorded for replays, choices asked of the person, "answer the same way each time", and the preview on a copy.
// Usage: node tests/looprun.mjs [name filter]
import { scenario, P, find, all, errors, logText as rawLog } from './scenario.mjs';
import { HumanAgent } from '../public/js/human.js';
import { runLoopBlock, blockProblem, previewLoop, loopSnapshot, clampReps, REPEAT_CHOICES } from '../public/js/looprun.js';

const filter = process.argv[2] ? new RegExp(process.argv[2], 'i') : null;
let pass = 0, fail = 0;
async function test(name, fn) {
  if (filter && !filter.test(name)) return;
  try { const note = await fn(); pass++; console.log(`  ok   ${name}${note ? ` — ${note}` : ''}`); } catch (e) { fail++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const expect = (c, m) => { if (!c) throw new Error(m); };
const logText = g => rawLog(g).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

// Ashnod's Altar + many Grizzly Bears (+ Blood Artist): each repetition sacrifices a Bear for {C}{C}, and Blood Artist
// drains an opponent each time a creature dies
async function altar(nBears, extra = [], opp = [], oppLife = 100) {
  const g = await scenario([{ battlefield: ["Ashnod's Altar", ...Array(nBears).fill('Grizzly Bears'), ...extra] }, { battlefield: opp, life: oppLife }]);
  g.turn = 3; g.active = 0;
  const block = [{ k: 'sac', iid: find(g, 0, "Ashnod's Altar").iid, name: 'Grizzly Bears' }];
  return { g, p: P(g, 0), block };
}
function human(g, answer = () => ({ button: 'cancel' })) {
  const asked = [], amended = [];
  const ui = { panels: true, replaying: false, view: null, autoAnswers: new Map(), learnAuto: null,
    amend: (game, i, patch) => amended.push({ i, ...patch }), ask: async (text, opts) => { asked.push(text); return answer(text, opts); } };
  const a = new HumanAgent('balanced', ui);
  P(g, 0).agent = a;
  return { a, ui, asked, amended };
}

await test('the count choices and limits', async () => {
  expect(REPEAT_CHOICES.join() === '1,2,3,5,10,25,50', `choices ${REPEAT_CHOICES}`);
  expect(clampReps('25') === 25 && clampReps(0) === 1 && clampReps(-3) === 1 && clampReps(5000) === 999 && clampReps('abc') === 1 && clampReps(7.9) === 7, 'clamp');
});

for (const n of [1, 10, 50]) {
  await test(`a loop run ${n} time${n === 1 ? '' : 's'}: the state after every repetition`, async () => {
    const { g, p, block } = await altar(60, ['Blood Artist'], ['Wastes']);
    const steps = [];
    const res = await runLoopBlock(g, p, block, n, { after: d => { steps.push({ d, bears: all(g, 0, 'Grizzly Bears').length, mana: p.pool.length, opp: P(g, 1).life, me: p.life }); } });
    expect(res.done === n && !res.why, `done ${res.done} (${res.why})`);
    for (const s of steps) expect(s.bears === 60 - s.d && s.mana === 2 * s.d && s.opp === 100 - s.d && s.me === 40 + s.d, `after ${s.d}: ${JSON.stringify(s)}`);
    expect(!errors(g).length, errors(g).join('\n'));
    return `${n} Bears sacrificed, ${p.pool.length} mana, Blood Artist drained ${100 - P(g, 1).life}`;
  });
}

await test('the run stops by itself when the game ends (Blood Artist drains the last opponent)', async () => {
  const { g, p, block } = await altar(60, ['Blood Artist'], ['Wastes'], 12);
  const { a } = human(g);
  await a.runLoop(g, p, block, { repeat: 50 }, 0);
  expect(g.over && P(g, 1).lost && all(g, 0, 'Grizzly Bears').length === 48, `over ${g.over}, Bears ${all(g, 0, 'Grizzly Bears').length}`);
  expect(/repeated the loop 12 of 50 times \(stopped: the game is over\)/.test(logText(g)), logText(g).split('\n').at(-1));
  return '12 of 50: the opponent lost';
});

await test('a custom count (HumanAgent.runLoop with { repeat: 7 }) logs and records', async () => {
  const { g, p, block } = await altar(20);
  const { a } = human(g);
  await a.runLoop(g, p, block, { repeat: 7 }, 0);
  expect(all(g, 0, 'Grizzly Bears').length === 13 && p.pool.length === 14, `bears ${all(g, 0, 'Grizzly Bears').length}, mana ${p.pool.length}`);
  expect(/repeated the loop 7 of 7 times/.test(logText(g)), 'no log line');
  expect(a.loopCount === 7, 'the count is not remembered for next time');
  return '7 of 7';
});

await test('a loop that runs out of resources stops by itself, with the reason', async () => {
  const { g, p, block } = await altar(4);
  const { a } = human(g);
  await a.runLoop(g, p, block, { repeat: 25 }, 0);
  const log = logText(g);
  expect(/repeated the loop 4 of 25 times \(stopped: Grizzly Bears can't be sacrificed to Ashnod's Altar\)/.test(log), log.split('\n').slice(-3).join(' | '));
  expect(blockProblem(g, p, block) !== '', 'blockProblem should now refuse the loop');
  return "4 of 25: no Bears left";
});

await test('pause and resume between repetitions (the run waits, then goes on)', async () => {
  const { g, p, block } = await altar(30);
  let release = null, waited = -1;
  const run = runLoopBlock(g, p, block, 10, { before: async d => { if (d === 4) { waited = d; await new Promise(r => { release = r; }); } } });
  // (the run is paused before its 5th repetition)
  await new Promise(r => setTimeout(r, 20));
  expect(waited === 4 && all(g, 0, 'Grizzly Bears').length === 26, `paused at ${waited} with ${all(g, 0, 'Grizzly Bears').length} Bears`);
  release();
  const res = await run;
  expect(res.done === 10 && all(g, 0, 'Grizzly Bears').length === 20, `done ${res.done}`);
  return 'paused after 4, resumed to 10';
});

await test('stop before the end: the stop is recorded, and a replay stops at the same repetition', async () => {
  const { g, p, block } = await altar(30);
  const { a, amended } = human(g);
  // a live stop: the runner's before() says stop at 12 (what the Stop button does), written into answer 3 of the record
  const res = await runLoopBlock(g, p, block, 25, { before: async d => (d === 12 ? 'stop' : undefined) });
  expect(res.done === 12 && res.why === 'you stopped it', `done ${res.done} (${res.why})`);
  // the replay of a recorded { repeat: 25, stop: 12 }
  const r2 = await altar(30);
  human(r2.g);
  await r2.p.agent.runLoop(r2.g, r2.p, r2.block, { repeat: 25, stop: 12 }, 3);
  expect(all(r2.g, 0, 'Grizzly Bears').length === 18 && /repeated the loop 12 of 25 times \(stopped: you stopped it\)/.test(logText(r2.g)), logText(r2.g).split('\n').at(-1));
  expect(!amended.length, 'a replayed stop was written again');
  void a;
  return '12 of 25 both times';
});

await test('a loop needing a choice asks the person each time; "the same way each time" asks once', async () => {
  // Goblin Bombardment's damage needs a target: that is always asked of the person (never automated)
  const { g, p } = await altar(10, ['Goblin Bombardment', "Zulaport Cutthroat"]);
  const bomb = find(g, 0, 'Goblin Bombardment');
  const block = [{ k: 'sac', iid: bomb.iid, name: 'Grizzly Bears' }];
  const { a, asked, ui } = human(g, (t, o) => (o.players?.length ? { player: 1 } : o.objs?.length ? { obj: o.objs[0] } : { button: o.buttons?.[0]?.value }));
  await a.runLoop(g, p, block, { repeat: 5, auto: true }, 0);
  const done = 10 - all(g, 0, 'Grizzly Bears').length;
  expect(done === 5, `${done} Bears sacrificed`);
  expect(!ui.learnAuto && !ui.autoAnswers.size, 'the loop\'s auto answers outlived it');
  expect(!errors(g).length, errors(g).join('\n'));
  return `${asked.length} question${asked.length === 1 ? '' : 's'} asked over 5 repetitions; P2 at ${P(g, 1).life}`;
});

await test('the preview plays the loop on a copy: estimates, and the real game is untouched', async () => {
  const { g, p, block } = await altar(12, ['Blood Artist'], ['Wastes']);
  const before = JSON.stringify(loopSnapshot(g, p)), logs = g.logEntries.length, objs = g.objects.size;
  const r = await previewLoop(g, p, block, 10);
  expect(JSON.stringify(loopSnapshot(g, p)) === before && g.logEntries.length === logs && g.objects.size === objs, 'the preview changed the real game');
  expect(r.ran === 10 && !r.why, `ran ${r.ran} (${r.why})`);
  const per = r.per.join(', ');
  expect(/2 more mana/.test(per) && /opponents lose 1 life/.test(per) && /you gain 1 life/.test(per), `per repetition: ${per}`);
  const r2 = await previewLoop(g, p, block, 50);
  expect(r2.ran === 12 && /can't be sacrificed/.test(r2.why), `50: ran ${r2.ran} (${r2.why})`);
  return `each: ${per}; 50 asked → stops after 12`;
});

await test('nothing changes for the old ×10 / ×99 buttons (the same engine calls)', async () => {
  const { g, p, block } = await altar(15);
  const { a } = human(g);
  await a.repeatLoop(g, p, block, 10);
  expect(all(g, 0, 'Grizzly Bears').length === 5 && /repeated the loop 10 of 10 times/.test(logText(g)), 'repeatLoop ×10');
  await a.repeatLoop(g, p, block, 99);
  expect(/repeated the loop 5 of 99 times \(stopped: Grizzly Bears can't be sacrificed/.test(logText(g)), 'repeatLoop ×99 stop reason');
  return '10, then 5 of 99';
});

console.log(`\nLoop runner: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
