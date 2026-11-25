# Spellbook Table: the improvement hunt (Round 9)

Written 2026-11-23 against version 1.69.0 (rules 27, commit after `2e400c3`).
This file is for a **new chat**. It plans a hunt for every worthwhile improvement to the game, using the Claude Code
agents in `.claude/agents/` and the plugins listed below, and ends with one ranked list of improvements in this file.
It is a survey: find, prove and write down. Fixing comes in later sessions, item by item.

`ROADMAP.md` stays the project's history. `AUDIT-ROADMAP.md` (items 197 to 218) and `DESIGN-ROADMAP.md` (items 220 to 494)
stay the open work lists for their areas. New findings here are numbered from **500** so they never collide.

**To start the new chat, paste:**

> Read CLAUDE.md and IMPROVE-ROADMAP.md, then do hunt H0. Use the agents and plugins the roadmap names, write every
> proven finding into its Findings section, and stop after each hunt to show me what you found.

(For all hunts at once: "…then do H0, run H1 to H8 as parallel subagents, and finish with H9 and H10.")

## How to use this file

1. Read `CLAUDE.md` (hard rules, test commands, "Claude Code setup") first. Every rule there applies.
2. Do the hunts in order H0 → H10. Hunts H1 to H8 don't depend on each other; when the person asks for parallel work, run
   them as subagents (one per hunt) and merge their findings in H9. Otherwise one hunt per session is a good pace.
3. Write every finding into **"Findings"** below in the format given there, as soon as it is proven. Never write a finding
   from memory or a guess: each one needs evidence someone else can reproduce.
4. After each hunt, tick it here with a one-line "Done:" note (games run, findings added, what wasn't covered).
5. Commit after each hunt (the person asks first; see "After each finished change" in CLAUDE.md: no VERSION bump for this
   file alone, no zip needed).

## Rules for the hunt

- **Survey, don't fix.** The only code a hunt adds is evidence: a `known` test in `tests/rules.mjs`, a probe in
  `tests/audit-probes.mjs`, or a proposed `tests/ai.mjs` case written into the finding. CI must stay green.
- **Don't duplicate.** Before adding a finding, search `ROADMAP.md`, `AUDIT-ROADMAP.md`, `DESIGN-ROADMAP.md` and
  `tests/known-defects.json`. If the problem is already listed, add the new evidence to the finding's "Also" line
  pointing at the old item number instead of a new item.
- **Free only, nothing copied.** No paid services, sign-ups, analytics or trackers. No names, art, code or layouts from
  MTG Arena, Moxgate or Forge. Never Microsoft Edge. Never read `data/` (a hook blocks it).
- **Replays stay exact.** A proposed engine fix must say it goes behind the next rules version (28).
- **Measure honestly.** Give sample sizes and seeds. A hunt that couldn't run something says so in its Done note.

## Tools for the hunt

Agents (in `.claude/agents/`; call them by name, e.g. "use fuzz-triager"):

| Agent | Used in | What it gives the hunt |
|---|---|---|
| `fuzz-triager` | H1 | seeded fuzz games, replayed and shrunk failures as `known` tests and findings |
| `rules-judge` | H1, H2 | read-only check of engine code against `cache/MagicCompRules.txt` and replay gating |
| `card-fixer` | H2 | card families ranked by how many cards one fix repairs (**survey mode: ask it not to fix**) |
| `ai-evaluator` | H3 | seeded AI games, win rates, decision times, bad plays as `tests/ai.mjs` cases |
| `design-worker` | H4 | screens checked at phone, tablet and desktop, light and dark, several skins (**survey mode: no edits**) |
| `release-guard` | H10 | the finishing checklist for the roadmap commit |
| built-in `Explore` | all | broad read-only searches across the 77 modules |

Plugins (install from the plugin directory before H0; all free, none needs an account):

| Plugin | Used in | What for |
|---|---|---|
| typescript-lsp | H6 | go-to-definition, references and type errors across `public/js` (needs the TypeScript language server from npm, a developer tool only) |
| feature-dev | H6, H8 | `code-explorer` and `code-architect` agents for module structure and feature ideas |
| frontend-design | H4 | critique of the table, setup screen and windows |
| Design | H4 | `accessibility-review`, `design-critique`, `ux-copy` (ignore its connectors) |
| Engineering | H6, H9 | `tech-debt`, `testing-strategy`, `architecture` (ignore its connectors) |
| OWASP Security Audit | H5 | OWASP Top 10 pass over the three servers and online seats |
| plugin-dev | H10 | `skill-reviewer` / `agent-creator` to improve the agents with what the hunt learned |

Built-in commands: `/security-review` (H5), `/code-review` and `/simplify` (H6).
Not used, on purpose: playwright (the browser pane does this, and it can pick Edge on Windows), context7 (needs a
sign-in), Axe Accessibility (needs a paid key), Ponytail (pushes against rules-version gating and a test per fix).

## Baseline (2026-11-23)

Measured in this session, so H0 can tell what changed. Everything was green except the one probe that is meant to fail.

| Check | Result |
|---|---|
| 27 Node suites (every one under "Testing" in CLAUDE.md) | all pass: 736 tests in the named suites, 138 golden games with 0 differences, 6,687 hidden-information decisions unchanged, type check 0 findings (strict null checks included) |
| Card readings | 3,500 cards, 2,823 fully read (80.7%), 0 changed |
| Coverage classes | fully simulated 328 (9.4%), needs interaction test 2,466 (70.5%), partial 410, incorrect 157, unsimulated 139; restriction 86 |
| `tests/rules.mjs` | 27 tests, 26 pass, 1 known deviation |
| `tests/audit-probes.mjs` | 1 still failing: [212] Blood Moon + Urborg (layers) |
| Fuzz (CI seeds 61000, 12 games) | 0 simulator errors, 0 broken rules, replay identical |
| Browser self-test (`Spellbook Table.exe`) | 19 of 19 pass; 50 games 0 simulator errors; rules check clean; look-ahead 6/6 replayed; determinism 6/6; Kingdoms 10/10 role wins |
| Interface test (`uitest.html`) | 20 passed, 0 failed, 1 not run (online seats, by design) |
| Code | 77 modules in `public/js`, 2.36 MB; no TODO/FIXME/HACK markers; 18 entries in `tests/known-defects.json`; csslint 72 literal colors outside `:root` (baseline) |
| Open items elsewhere | ROADMAP.md 7, AUDIT-ROADMAP.md 8, DESIGN-ROADMAP.md 85 |

### Leads seen while measuring (start here; each still needs proof before it becomes a finding)

- **Fuzz: illegal targets chosen.** The CI fuzz run reports "targets chosen that were not legal" from Artifact Mutation,
  Collective Resistance, Volatile Stormdrake and Red Elemental Blast (one each). Check whether the engine refuses them or
  lets them through (H1).
- **Fuzz: Equipment unattached by 704.5n** in one game: check it was a legal state-based action and not a wrong attach (H1).
- **Coverage numbers disagree:** "incorrect" is 71 cards in the status table but 157 in the classes table (different
  definitions; see old items 213 and 218). Pick one before counting card fixes (H2).
- **Only 9.4% of cards are proven by a test**; 70.5% are read and handled but never checked one by one (H2 sampling).
- **Kingdoms balance:** assassins won 6 of 10 self-test games (old item 115) (H3).
- **Layers:** the Blood Moon + Urborg probe still fails (old items 90 / 212) (H1).
- **Node warning in `tests/replay.mjs`:** "localStorage is not available because --localstorage-file was not provided"
  on newer Node; harmless today, but the suite may silently stop testing storage paths (H6).
- **Module size:** `effects.js` 342 KB and `main.js` 306 KB are each larger than the rest of the engine sections together (H6).

---

## The hunts

- [x] **H0. Setup and baseline.** (S)
  - Confirm the six agents are listed (ask Claude "which agents do you have?") and the plugins are installed.
  - Run every suite (the list is under "Testing" in CLAUDE.md), the browser self-test and `uitest.html?run` with the
    `test-spellbook-table` skill. Compare with "Baseline" above; anything that got worse since 2026-11-23 is finding 500 onward.
  - Done (2026-11-23, Node 26.13.0): all six agents listed. None of the seven plugins above is installed (only
    claude-code-setup is), so H4, H5, H6, H8 and H10 must install theirs first or fall back to built-in agents and
    `/security-review`, `/code-review`, `/simplify`. All 27 suites + audit probes and coverage ran: 736/736 named tests, 138
    golden games 0 differ, 6,687 hidden decisions unchanged, type check 0, cards 2,823/3,500 read and 0 changed, rules 26 + 1
    known, probe [212] still the only failure, fuzz seed 61000 the same four illegal-target sources and one 704.5n. Self-test
    19/19 (50 games 0 errors, look-ahead 6/6, determinism 6/6, Kingdoms 10/10 with assassin 6), uitest 20 passed, 0 failed,
    1 not run. Code numbers unchanged (77 modules, 2.36 MB, 0 markers, 18 known defects, 72 literal colors; open items 7/8/85).
    Only change: fully simulated 333, not 328 (better). Nothing worse, so no findings. `servers.mjs` and other browsers not run.

- [x] **H1. Engine correctness.** (L) — `fuzz-triager`, then `rules-judge`
  - Done (2026-11-23): 300 fuzz games (seeds 90000/91000/92000, all 4-player; `fuzz.mjs` has no 2-player option) with 0
    simulator errors and every first game replayed identically; 2 broken-rule reports, both watcher false alarms (515). The
    40 illegal-target lines are traced (510–513); the 11 704.5n events are all legal (Equipment on crewed Vehicles or Mirage
    Mirror copies). `rules-judge` reviewed stack, triggers, replacements, combat, zones and layers and proved 500–509 on
    real-card boards. Findings 500–516; `known` tests R28–R31 added to `tests/rules.mjs` (31 tests, 26 pass, 5 known, 0 failed).
    Not covered: 2-player fuzz, face-down cards in depth, layers beyond 7b and the Moon, mutate, phasing, Kingdoms, loops.js,
    Two-Headed Giant. Unproven suspicions (spell copies resolving at once, exalted/annihilator not on the stack, 616.1 order of
    damage modifiers, Clone becoming the copy after enter watchers) are in the H1 notes for later.
  - Fuzz: 300 games on new seeds (e.g. `--seed 90000`, `91000`, `92000`, 100 games each), plus 4-player games.
  - `node tests/audit-probes.mjs` and `--scan`: which probes still fail, which were fixed but not moved.
  - `rules-judge` over the modules with the most rules weight and least test cover: `stack.js`, `triggers.js`,
    `replacements.js`, `combat.js`, `zones.js`, layers and continuous effects (old items 90 / 212), the "known" tests in `tests/rules.mjs`.
  - Look especially at: simultaneous events, last-known information, copies and face-down cards, control changes,
    commander zone moves, multiplayer leaving the game (800.4a), timestamps.

- [x] **H2. Card coverage.** (L) — `card-fixer` in survey mode, `rules-judge`
  - Done (2026-11-23): `tests/card-coverage.md` refreshed (full 2,794, partial 406, restriction 86, incorrect 71,
    unhandled 4, unsupported 139; fully simulated 337). Count card fixes against "incorrect" 71; the class "incorrectly
    simulated" 157 is 71 + the 86 restriction cards, and that restriction list itself is wrong (524). 14 card families are
    findings 517–530, each proven on real-card boards. Trust in "full": 21 of the most-played untested full cards were
    probed and 19 were right (Toxic Deluge and Austere Command wrong), and the family scans found about 42 more wrong full
    cards, so "needs interaction test" is roughly 85–95% right; a card named in a test can still have an untested ability
    (Enduring Innocence). Other formats (old item 98): no generator checks coverage; 60-card-legal snapshot cards split like
    Commander (about 80% full), Pauper is 96% full. Not covered: the 17Lands set pools (need downloads), Castle Garenbrig,
    Tablet of Discovery and cost-floor cards, other watcher events that may share 522's gap, AI games with these cards,
    and a `rules-judge` review of the fix ideas.
  - Refresh `node tests/coverage.mjs --report tests/card-coverage.md`.
  - Group the incorrect, partial, restriction, unhandled and unsupported cards into **families** (same unread wording),
    rank families by how many cards and how popular, and write one finding per family (cards repaired, example card, likely module).
  - Restriction cards first: they play **stronger** than printed, which changes game results.
  - Sample the "needs interaction test" class: the 100 most-played full cards with no test; write quick probes for 20 of them
    and file any that play wrong (this tells how much "full" can be trusted).
  - Formats beyond Commander: cards the 60-card and Limited generators pick (old item 98).

- [x] **H3. AI quality.** (L) — `ai-evaluator`
  - Done (2026-11-23): 1,598 seeded all-AI games (rules 27, `noLearning`), 0 simulator errors. Seats are even (22–27%); going
    first wins 27.7% against 21.6% for fourth (normal); no play style is clearly off (aggressive lowest, 21.7% [19–25]).
    Look-ahead shows no edge (24.8% against 25.3% over 200 games) at about 8x the decision time, with more missed lethals
    (26 against 12): **not trustworthy**, because H7 found the timing wrappers change look-ahead games (546); rerun after 546. `perf.mjs`: median/95%/slowest per decision respond 0.0/0.1/2.9 ms,
    main phase 0.3/8.1/96 ms, attacks 0.6/7.8/120 ms; 200-creature board blocks 991 ms; heap flat over 50 games; `perf.mjs`
    also times look-ahead copies' decisions (tool note for H7). Kingdoms (old ROADMAP 115, still open, new numbers):
    assassins win 74.5% [68–80] with the cEDH presets and 70.0% with random decks, so not only fast decks; Bandits 0 of 160
    games; 11 of 149 assassin wins were the King losing to 531/535, so fix those first. Findings 531–542; 11 proposed
    `tests/ai.mjs` cases kept in the notes. Not covered: combos ready but not started (four checked by hand, fine),
    removal-target and counter-risk judgement in bulk, human seats, Beginner/Casual strengths, learning, 60-card and
    Limited, Two-Headed Giant, Planechase, online seats.
  - Win rates by seat and play style over at least 200 seeded games; the built-in cEDH decks and random snapshot decks.
  - Bad plays (missed lethal, blocks, removal targets, counter mana, combos on the table, commander damage), each confirmed
    on a small board and proposed as a `tests/ai.mjs` case.
  - Decision time (median, 95th percentile, slowest) with `node --expose-gc tests/perf.mjs`; look-ahead cost.
  - Kingdoms balance (old item 115: Assassins winning most games with fast decks).

- [ ] **H4. Interface, accessibility and look.** (L) — Design `accessibility-review`, frontend-design, `design-worker` in survey mode
  - Every screen: start menu, setup, table (2 and 4 players), stack and prompts, deck builder, analysis, library,
    puzzles, online lobby, help, settings, results. At 375 px, tablet and desktop; light, dark, high contrast; three skins.
  - Keyboard-only play of one whole game; screen reader names on the table; focus order; 200% zoom; Fewer animations.
  - Reconcile with the 85 open `DESIGN-ROADMAP.md` items: still needed, already done, or changed. New problems become findings.

- [ ] **H5. Security, servers and online play.** (M) — OWASP Security Audit, `/security-review`
  - The three servers (`launcher/SpellbookTable.cs`, `server.ps1`, `server.py`): same endpoints, limits, path checks,
    headers; `node tests/servers.mjs` against each (needs each one running).
  - Online seats (`net.js`, `remote.js`) and the tunnel tool: trust of answers, room codes, what a seat can see.
  - Untrusted data: Scryfall, Commander Spellbook, EDHTop16, Archidekt answers, imported deck lists, replay files.
  - Old items 199 to 204 and 203 (updates and the tunnel tool not verified).

- [ ] **H6. Code health.** (L) — typescript-lsp, Engineering `tech-debt`, feature-dev `code-explorer`, `/code-review`
  - The large modules: `effects.js` (342 KB), `main.js` (306 KB), `engine.js` (213 KB), `ai.js` (170 KB), `resolve.js` (161 KB).
    Propose splits that keep golden games and card readings identical (old items 176 / 217).
  - Dead code (functions nothing calls), duplicated logic between modules, functions over ~200 lines, rules-version
    branches older than any replay that still loads (can they be kept but isolated?).
  - Type coverage: what still escapes `--strictNullChecks`; where JSDoc types are missing on public functions.
  - Test gaps: modules or functions no suite reaches (Engineering `testing-strategy`).

- [x] **H7. Performance and reliability.** (M) — `ai-evaluator`, browser pane
  - Done (2026-11-23): 1,520 seeded 4-player games in three one-process sessions (710000–710319, 720000–720199 with
    learning, 730000–730999) and the game page and friend page in the browser pane. No memory growth, no slowdown over a
    session, page load 0.6 s. Findings 543–551; 542 rewritten (Ocelot Pride copies itself: a misreading, not legal
    growth). 546 means H3's look-ahead numbers must be rerun. Proposed `tests/ai.mjs` cases 47–48 kept in the H7 notes.
    Not covered: frame time (the pane was hidden), the offline image cache (`data/` is off limits; the picture fallback is
    in uitest), a cold start with an empty card cache, the tunnel itself, Commander Spellbook's share of replay size,
    `scryfall.js` keeping every card read for the page's life (lead), heap snapshots, 2-player and other formats, Kingdoms.
  - `node --expose-gc tests/perf.mjs`: large boards, long sessions, memory growth.
  - Page load time and size of the game page; first-game time on a cold start; image cache behaviour offline.
  - Long games (20+ turns, big boards) in the browser: frame time while animating, log size.
  - Saved data: storage use over many games, replay sizes, what happens when storage is full (`tests/storage.mjs` cases).

- [x] **H8. Features and play experience.** (M) — feature-dev `code-architect`, `Explore`
  - Done (2026-11-23), without feature-dev (not installed): played as a first-time player in the browser pane at 1280×800
    (lesson 1, a 4-player cEDH game seated to turn 8, the puzzle "Burn them out"), and an `Explore` pass over README, every
    roadmap and the code. Findings 552–571 (friction 552–559, missing features 560–571); gaps already listed elsewhere are
    left to their items (DESIGN 246, 280, 296–298, 302, 304, 342, 347, 349, 352–361; IMPROVE 509). Leads for H4: hand cards
    you can't play now are `role="img"` and leave the Tab order. Not covered: a whole 2-player game (only the one-turn
    lesson), finishing the 4-player game, online seats, phone sizes.
  - Play three whole games as a person (2-player, 4-player Commander, a puzzle) and note every point of friction.
  - New-player path: first start, first game, learning the controls, finding help.
  - Missing features players would expect from a Commander table (free and our own design only): compare with the
    open ideas already in `ROADMAP.md` so nothing is listed twice.

- [ ] **H9. Merge and rank.** (M) — Engineering `architecture`
  - Merge duplicates, link each finding to the old items it touches, and rank all findings by
    **impact** (wrong game results > crashes > security > player-facing friction > code health) and **effort** (S/M/L).
  - Write the "Suggested order" below and a short summary at the top of "Findings".

- [ ] **H10. Close the hunt.** (S) — `release-guard`, plugin-dev
  - Check this file and the links in `CLAUDE.md`, `README.md` where needed, vault notes; commit.
  - Use plugin-dev's `skill-reviewer` / `agent-creator` to fold what the hunt learned back into the six agents
    (better commands, missed checks).

---

## Findings

Numbered from 500. One entry per problem (or per card family). Format:

```
- [ ] **5NN. Short title.** (S/M/L) — area: engine | cards | AI | interface | security | code | performance | feature
  - Problem: what goes wrong, for whom, how often.
  - Evidence: command, seed, test id or screenshot that shows it; rule number for rules problems.
  - Where: files / functions.
  - Fix idea: the direction, and whether it needs rules version 28.
  - Done when: the check that will prove it fixed.
  - Also: related old items (ROADMAP / AUDIT / DESIGN numbers), if any.
```

_(H0 found nothing worse than the baseline; findings start with H1.)_

### From H1 (engine correctness)

Board repros for 500 to 509 are throwaway scripts kept with the hunt notes; each fix adds the repro as a `tests/rules.mjs`
or `tests/interactions.mjs` test with a rules 27 twin. Every engine fix goes behind rules 28.

- [ ] **500. Dies triggers are worked out after the creature is reset (last-known information).** (M) — area: engine
  - Problem: the control and copy resets run before the death is noted. A stolen creature's dies trigger and "creature you
    control dies" watchers go to the owner, not the last controller (outside batch deaths); a Clone loses the copied dies ability.
  - Evidence: Act of Treason on P2's Solemn Simulacrum, sacrifice it: Pitiless Plunderer and Zulaport Cutthroat don't
    trigger and P2 draws. Clone copying Solemn, then Murder: no draw. Rules 603.3a, 603.10a, 707.2.
  - Where: `zones.js` `move` (control reset ~104, `noteDeath` ~125), `leaveBattlefield` (~307), watchers ~489/495; `triggers.js` ~20.
  - Fix idea: snapshot fx, card and controller before the resets and use the snapshot for dies triggers and watchers. Rules 28.
  - Done when: both boards trigger for the last controller / copied ability; rules 27 twin unchanged.
- [ ] **501. Aura spells with an illegal target still resolve.** (M) — area: engine
  - Problem: the Aura's target is only checked for zone, and only after the Aura is on the battlefield, so it enters (and its
    ETB triggers) before going to the graveyard; a target that gained hexproof is still enchanted (Control Magic steals).
  - Evidence: Kenrith's Transformation, target bounced in response: P1 still draws. Target given hexproof: attached, Bears 3/3. Rules 608.3b, 303.4g.
  - Where: `engine.js` ~1235–1286 (permanent spell resolution).
  - Fix idea: check Aura targets with `validTarget` + `targetLegal` before it enters; illegal → it doesn't resolve. Rules 28.
  - Done when: both boards: Aura in graveyard, no draw, no attach.
- [ ] **502. Combat damage to a removed planeswalker goes to its controller.** (M) — area: engine
  - Problem: creatures attacking a planeswalker that left combat deal their damage to the player (and commander damage counts). Battles too.
  - Evidence: two creatures attack Jace, the Mind Sculptor; Jace bounced before damage; P2 goes 40 → 37. Rule 506.4c.
  - Where: `combat.js` ~262.
  - Fix idea: no damage when the attacked planeswalker or battle is gone (unless a "trample over planeswalkers" ability). Rules 28.
  - Done when: P2 stays at 40 on that board.
- [ ] **503. Blood Moon only changes mana; nonbasic lands keep their other abilities.** (S/M) — area: engine
  - Problem: under Blood Moon, Bojuka Bog still enters tapped and exiles, Mutavault still animates, Urborg still gives black.
  - Evidence: board repro; `node tests/audit-probes.mjs` probe [212]. Rules 305.7, 614.12.
  - Where: `mana.js` ~135/145 (the only place the Moon is read).
  - Fix idea: a layer-4 type change that removes all abilities of nonbasic lands, read everywhere the land's fx is used. Rules 28.
  - Done when: probe [212] passes and Bog/Mutavault boards do nothing.
  - Also: AUDIT 212, ROADMAP 90 (this widens 212 from Urborg to every nonbasic land ability).
- [ ] **504. God-Eternals are a replacement, not a "may" dies/exile trigger.** (S) — area: engine, cards
  - Problem: God-Eternal Oketra (and the cycle) go straight to the library: no dies event (Blood Artist doesn't trigger), no
    choice ("you may"), no chance to respond.
  - Evidence: Murder on God-Eternal Oketra: "put into its owner's library third from the top instead". Rules 603.6c, 614.1a.
  - Where: `effects.js` ~2155, `replacements.js` ~113, `zones.js` ~67.
  - Fix idea: read it as a dies/exiled trigger with an optional choice. Rules 28.
  - Done when: Oketra goes to the graveyard, Blood Artist triggers, then the trigger puts it third from the top when chosen.
- [ ] **505. Banishing Light-style cards don't return their card when their controller leaves the game.** (S) — area: engine
  - Problem: when a player loses, the "until ~ leaves the battlefield" return never runs; the exiled card stays exiled for good.
  - Evidence: P2's Banishing Light holds P1's creature; P2 goes to 0 life; the creature stays in exile. (Oblivion Ring's
    two-trigger version staying exiled is correct, 800.4d.) Rule 610.3.
  - Where: `triggers.js` `lose` (~809–820); the `holds` return exists only in `zones.move`.
  - Fix idea: run the `holds` return for permanents that leave with the player. Rules 28.
  - Done when: the creature returns to P1's battlefield on that board.
- [ ] **506. A creature whose control changes mid-combat stays in combat.** (S) — area: engine
  - Problem: a blocker stolen after blocks still deals and takes damage (and dies); same gap for regeneration.
  - Evidence: Grizzly Bears blocked by Llanowar Elves, P1 steals the Elves: Elves die, Bears take 1. Rule 506.4.
    Also: `zones.js` ~453 logs regeneration as 701.15a (goad in this CR; regenerate is 701.19).
  - Where: `resolve.js` `steal`, `combat.js` ~257/284.
  - Fix idea: clear combat flags on a control change and on regeneration. Rules 28 (the log number fix needs none).
  - Done when: the Elves survive and the Bears take no damage.
- [ ] **507. "Until end of turn" control comes back to a new object.** (S) — area: engine
  - Problem: Act of Treason, sacrifice, reanimate under your control: at cleanup the creature goes back to the old controller.
  - Evidence: board repro: controller 0 before cleanup, 1 after. Rule 400.7.
  - Where: `engine.js` `tempSteals` (~3122–3129) only checks the zone.
  - Fix idea: record the object id/zone-change count with the steal and end it if the object changed. Rules 28.
  - Done when: the reanimated creature stays with P1.
- [ ] **508. A leaving player's cards take other players' abilities with them.** (S) — area: engine (multiplayer)
  - Problem: an ability on the stack controlled by a remaining player is removed because its source's owner left.
  - Evidence: ability controlled by P1, source owned by P2; P2 leaves; the ability is countered. Rules 800.4a, 113.7a.
  - Where: `triggers.js` `leaveGame18` (~848).
  - Fix idea: remove only stack objects the leaver controls. Rules 28.
  - Done when: P1's ability resolves after P2 leaves; `tests/multiplayer.mjs` gets the case.
- [ ] **509. The legend rule never lets the player choose.** (S) — area: engine, interface
  - Problem: the newest copy is always kept; a person (or the AI) can't keep the older one (e.g. one with counters or attached Auras).
  - Evidence: `triggers.js` ~723–725 (`group.slice(0, -1)` always goes to the graveyard). Rule 704.5j.
  - Where: `triggers.js` state-based actions; `human.js` for the prompt.
  - Fix idea: ask the controller (AI: keep the more valuable one), recorded as an answer for replays. Rules 28.
  - Done when: a person is asked which legend to keep, and the answer is replayed.
- [ ] **510. "Hit that instead" deals aim removal at illegal targets.** (S/M) — area: engine, AI
  - Problem: in multiplayer deals the target's controller suggests another target and the AI caster accepts it even when the
    card type is wrong (Doom Blade at a non-creature god, Naturalize at a creature). The spell is paid for and wasted. 37 of 40
    illegal-target lines in 300 fuzz games, in 32 games (10.7%); a person who accepts has the whole cast refused (seed 90064).
  - Evidence: `known` test R29; `node tests/fuzz.mjs --games 100 --seed 91000` (seed 91000 Pongify at Artist's Talent,
    91012 Force of Vigor at Gisela); 29 more seeds in the H1 fuzz notes. Rules 601.2c, 115.1.
  - Where: `ai.js` `redirectOffer`, `considerRedirect` (only `canTarget` + `targetFits`); `engine.js` `Game.cast` (~1085:
    `targetsBad` skips AI-chosen targets, including those `redirectTalk` changed).
  - Fix idea: use `targetLegal` in both AI functions and in `redirectTalk`; check changed targets as given. Rules 28.
  - Done when: R29 says FIXED; a `--seed 91000` batch shows no illegal target right after an "asks … to aim" deal.
  - Also: ROADMAP 388; AUDIT 200, 209.
- [ ] **511. A spell whose only target stops fitting its words still resolves its other parts.** (S) — area: engine
  - Problem: the 608.2b check uses only `validTarget` (zone, hexproof, protection), so when a target becomes illegal by type,
    color or controller, the untargeted parts still happen.
  - Evidence: `known` test R28 (Artifact Mutation at Mirage Mirror that became Llanowar Elves still makes a Saproling); fuzz
    seed 61008 (4 Saprolings), 61010 (Volatile Stormdrake's second trigger still gives energy). Rule 608.2b.
  - Where: spell fizzle check `engine.js` ~1235; `triggers.js` `resolveAbility` ~597.
  - Fix idea: a target is illegal when it fails `validTarget` or `targetLegal` (or `counterFits` for counters). Rules 28.
  - Done when: R28 says FIXED with a rules 27 twin.
  - Also: ROADMAP 185 ("still open: a target that stops being a creature isn't rechecked"), AUDIT 209 (effect-level part fixed).
- [ ] **512. Change-the-target spells accept an illegal new target.** (S) — area: engine, AI
  - Problem: Misdirection / Redirect Lightning take whatever the AI's `redirectTarget` returns (same card type only).
  - Evidence: `known` test R30 (Red Elemental Blast moved from Thassa's Oracle to Llanowar Elves; both survive); fuzz seeds
    90000, 92072 (Alela's goad moved onto Alela). Rule 115.7a.
  - Where: `resolve.js` `case 'redirect'` (~388); `ai.js` `redirectTarget`, `redirectResponse`.
  - Fix idea: accept only a target legal for the redirected spell (`validTarget` + `targetLegal`), else keep the old one. Rules 28.
  - Done when: R30 says FIXED.
- [ ] **513. A counterspell's words aren't checked when it is cast with given targets.** (S) — area: engine (person and online seats)
  - Problem: a person or online seat can cast Red Elemental Blast at a non-blue spell; it is paid for and does nothing. The AI checks first.
  - Evidence: `known` test R31 (`Game.cast` with Fellwar Stone as the target returns true); fuzz seed 61011. Rule 601.2c.
  - Where: `stack.js` `targetsBad`; `human.js` `castWithChoices` (`spellTarget`).
  - Fix idea: `targetsBad` also requires `counterFits` for counter effects; grey out modes with no legal spell. Rules 28.
  - Done when: R31 says FIXED.
- [ ] **514. Volatile Stormdrake keeps the stolen creature for free.** (S) — area: cards (restriction: plays stronger than printed)
  - Problem: "If you do, you get {E}{E}{E}{E}, then sacrifice that creature unless you pay {E} equal to its mana value" is
    read as 4 energy; the sacrifice is dropped, yet the card counts as fully read.
  - Evidence: board: Stormdrake takes Myrel (mana value 5), keeps it with 4 energy; fuzz seed 61010; `fx.etb` = `[exchange, playerCounter energy 4]`.
  - Where: `effects.js`.
  - Fix idea: read the "if you do" and the pay-energy-or-sacrifice choice, or mark it unread and add it to
    `tests/known-defects.json` meanwhile. Rules 28.
  - Done when: an `interactions.mjs` test: Myrel sacrificed; a mana value 3 creature kept with 1 energy left.
- [ ] **515. The rules watcher reports two false breaks.** (S) — area: code (tests; `invariants.js` changes no game, no rules version)
  - Problem: fuzz seed 92026 "P2 has 14 poison counters and hasn't lost" (P2 has Platinum Angel: the poison check lacks
    `!g.cantLose?.(p)`, which the life check has); seed 92067 "P4 played 2 lands with 1 land drops" (Ghirapur Orrery; the
    second landfall made P4 draw from an empty library and leave, and the watcher counted land drops afterwards).
  - Evidence: `node tests/fuzz.mjs --replay tests/fuzz-failures/seed-92026.json` (and `seed-92067.json`); `node tests/fuzz.mjs --games 100 --seed 92000` exits 1.
  - Where: `invariants.js` ~38 (poison), ~120 (land drops).
  - Fix idea: add `cantLose` to the poison check; read land drops before `playLand` or skip players who lost.
  - Done when: both saved files replay with 0 problems and the 92000 batch exits 0.
- [ ] **516. The measuring tools over-report.** (S) — area: code (tests)
  - Problem: `fuzz.mjs` "Targets chosen that were not legal" also counts correct refusals (2 of 40 lines); `audit-probes.mjs
    --scan` uses patterns from before the fixes, so ticked items 206, 207, 209, 210 and 214 keep listing cards (206: 99
    listed, only 17 really lack a reading: Guardian Project, Arena of Glory, Springheart Nantuko, Padeem, …).
  - Evidence: `node tests/audit-probes.mjs --scan`; H1 fuzz notes.
  - Where: `tests/fuzz.mjs` (the " is not a legal target" counter), `tests/audit-probes.mjs` scan patterns.
  - Fix idea: split the fuzz counter into resolved / changed / refused at cast; update the scan to the current field names.
  - Done when: the scan lists only the 17 cards plus 209's open "up to N" and "you control" families.
  - Also: AUDIT 206, 207, 209, 210, 214.

### From H2 (card coverage)

Probe scripts are kept with the hunt notes (folder `h2/`), run from the repo root. Popularity is the snapshot's EDHREC
order (#). Ordered with the cards that play stronger than printed first. Every engine change goes behind rules 28 with a
rules 27 twin test. The "target … you control" / "up to N target" family (13 + 9 misread cards: Nesting Grounds #556,
Destiny Spinner #1045, Hunter's Insight #1067, Endurance #1338…) is the open part of AUDIT 209, not a new finding.

- [ ] **517. Conditional board wipes kill everything.** (S) — area: cards (plays stronger; 5 full cards)
  - Problem: "destroy all creatures with power 4 or greater / with mana value 3 or less / with power greater than
    target creature's power" is read as "destroy all creatures". Austere Command #166 (modes 3 and 4 are both "all
    creatures"), Elspeth Sun's Champion #765 (−3), Dusk // Dawn #976, Fell the Mighty #1505, The Battle of Bywater
    #1870, Expel the Interlopers #2786 (partial). Raise the Past (`maxMv`) is read right.
  - Evidence: `(H2 notes) h2/p7-wipes.mjs`: 6 of 6 wrong. Llanowar Elves (1/1) and Craterhoof (5/5) both die every time. The
    reading is `{"k":"wipe","mode":"destroy","what":"creatures"}` with no condition. Found first in the H2 sample of untested full cards.
  - Where: the `wipe` pattern in `effects.js`; `resolve.js` `case 'wipe'`.
  - Fix idea: read `minPow` / `maxPow` / `minMv` / `maxMv` (and "greater than target creature's power") into the wipe,
    filter in `resolve.js`; when the clause can't be read, mark the line unread. Rules 28. Add a `MISREAD` check
    ("destroy all … with (power|mana value)" and no filter in the reading).
  - Done when: the probe boards keep the right creature at rules 28.
- [ ] **518. "Pay X life" is read as a flat 3 life and X stays 0.** (S) — area: cards (Toxic Deluge does nothing)
  - Problem: `parseCostText` turns "pay X life" and "pay life equal to …" into 3 life, with the comment "counted as a
    few life". That is a silent approximation. Toxic Deluge #61 (full) costs 3 life and gives −0/−0. Fire Covenant
    #2704 (full) deals 0. War Room #133 (full) always costs 3 life.
  - Evidence: `(H2 notes) h2/p6b-deluge.mjs`: the log says "P1 pays 3 life to pay for Toxic Deluge … all creatures get -0/-0",
    even with `{ x: 5 }`.
  - Where: `effects.js` ~581–582; X choice in `Game.cast` / `mana.js`; the AI's choice of X.
  - Fix idea: an X life cost the caster chooses (the AI picks the X that kills what it wants and keeps it alive), paid
    as X life; "life equal to the number of colors in your commander's identity" computed. Unreadable ones are marked
    unread. Rules 28.
  - Done when: Toxic Deluge with X = 5 costs 5 life and kills a 5/5; War Room costs the identity count.
- [ ] **519. "Activate only if / during …" is dropped from activated abilities.** (M) — area: cards (restriction: plays stronger)
  - Problem: 30 cards in the restriction list (plus Shrine of the Forsaken Gods). The ability is read but its
    activation condition is not, so it can be used at any time. Inventors' Fair #264 (tutor with no artifacts),
    Idol of Oblivion #186, Shifting Woodland #357, Minas Tirith #414, Wishclaw Talisman #522, Bonders' Enclave #525,
    Cephalid Coliseum #852, Rivendell #1012, Vivi Ornitier #1068, Weathered Wayfarer #1409, Barad-dûr #1746, Humble
    Defector #1787, Nimbus Maze #1804, Urza's Workshop #2252, Endless Atlas #2455, Bloodline Keeper #2540, Arch of
    Orazca #2636, Leechridden Swamp #2669, Lagomos #3064, Luminarch Ascension #3326, Speaker of the Heavens #3448, and more.
  - Evidence: `(H2 notes) h2/p3-restrictions.mjs`: 16 of 19 activation boards wrong (each `g.activate` returned true with the
    condition false). Glint-Horn Buccaneer is the one correctly refused; Kitsa's probe hit its unrestricted loot (inconclusive).
    `(H2 notes) h2/p4-mana-restrictions.mjs`: Nimbus Maze makes {W} with no Island and Urza's Workshop pays with no artifacts.
    Shrine and Glistening Sphere were correctly refused.
  - Where: `effects.js` ~2607–2619 (activated abilities: only `sorcery` is read from the text); mana lines ~2556–2572
    (`need` / `cond25` are read, but Nimbus Maze and Urza's Workshop still play unrestricted in a rules 27 game:
    check that `mana.js` uses `cond25` for every mana line, not only the first). Conditions: `effects.js` `parseCond`,
    `triggers.js` `evalCond`.
  - Fix idea: read "activate only if <cond>" with `parseCond`, and "only during your turn" and "only as a sorcery" as
    flags on the ability. `Game.activate` / `canActivate` refuse when the condition is false. A condition that can't be
    read makes the ability unavailable and reported (never free). Rules 28.
  - Done when: each probe board is refused at rules 28 and allowed at rules 27; the restriction list loses these cards.
  - Also: ROADMAP 740 / 889 (mana-line conditions, partly done); AUDIT "old open items" (92 unread restrictions).
- [ ] **520. Spending restrictions on mana are not enforced (Plaza of Heroes and kin).** (S/M) — area: cards (restriction)
  - Problem: 8 cards plus Shrine: Plaza of Heroes #460, Castle Garenbrig #717, Eldrazi Temple #1675, Klauth #2171,
    Karn Legacy Reforged #2516, Master of Dark Rites #2744, The Mightstone and Weakstone #3074, Tablet of Discovery #3271.
  - Evidence: `(H2 notes) h2/p4-mana-restrictions.mjs`: Plaza of Heroes casts Llanowar Elves (not legendary) with its
    any-color mana. Eldrazi Temple and Shrine were correctly refused for Mind Stone. Castle Garenbrig and Tablet were
    not tested properly (only one source of the right size), so they are unproven.
  - Where: `effects.js` ~2569 (`spend: spendWords(...)` is read per mana line from rules 25), `mana.js` (paying).
  - Fix idea: carry `spend` on the mana a line makes and check it while paying, as Cavern of Souls does. Rules 28.
  - Done when: the Plaza board is refused; a legendary spell is still paid.
  - Also: ROADMAP 889 (spend restrictions on mana lines).
- [ ] **521. Drawbacks dropped from "partial" cards (they play stronger, the restriction check can't see them).** (M) — area: cards, code (coverage)
  - Problem: coverage's `RESTRICTION` words (activate only, can't, unless…) don't cover drawbacks such as "sacrifice",
    "lose the game", "an opponent gains control" or "each opponent gains life". These cards are counted partial but
    play stronger:
    - Necromancy #1030 and Dance of the Dead #2291: the creature stays when the Aura leaves.
    - Grove of the Burnwillows #3325: opponents don't gain life.
    - Final Fortune #1522: an extra turn and you never lose.
    - Xantcha #3055: enters under your control, and its ability is a plain "{3}: draw".
    - Coveted Jewel #1254: nobody can take it.
    - Endrek Sahr #3205 and Grafted Exoskeleton #2306: never sacrificed.
    - Wishclaw Talisman #522 and Humble Defector #1787: never given away (also in 519).
    - Gemstone Mine #3311: stays on the battlefield (minor).
  - Evidence: `(H2 notes) h2/p5-drawbacks.mjs` (Final Fortune: `extraTurns=1`, nothing delayed; Necromancy: Craterhoof still on
    the battlefield; Xantcha on P1's side), `(H2 notes) h2/p3-restrictions.mjs` (Grove: opponent 37, not 38; Wishclaw: P1 keeps it).
  - Also, **Animate Dead #217 is listed as partial (one dropped sentence) but does nothing at all**: its reading is
    `etb: [attachSelf]` with no reanimation, and `Game.cast` refuses it (`(H2 notes) h2/p3b-animate.mjs`, `(H2 notes) h2/p5-drawbacks.mjs`).
    It belongs in "incorrect".
  - Where: `tests/coverage.mjs` `RESTRICTION`; the readers of those lines in `effects.js`.
  - Fix idea: (S, coverage) add drawback words to the restriction check (`sacrifice (it|~|that)`, `lose the game`,
    `gains control of (this|~)`, `enters under the control of`, `each opponent gains`) and a `MISREAD` check for an
    Aura reanimator with no reanimate effect. (M, cards) read the "when this leaves, sacrifice it" link (Animate Dead
    family: 3 cards), "at the beginning of that turn's end step, you lose the game", and painland-style "each opponent
    gains N life" on mana lines. Rules 28.
  - Done when: these cards are counted restriction or incorrect, and the Necromancy, Final Fortune and Grove boards pass.
  - Also: ROADMAP 559 / 691 mention Animate Dead only as a combo piece.
- [ ] **522. Enter watchers with a condition never trigger.** (S/M) — area: cards (21 full cards wrong)
  - Problem: 22 snapshot cards. A "whenever a creature you control with power N or greater / of the chosen type /
    with flying / colorless … enters" trigger, or one for "an X or Y" (artifact or creature, Angel or Cleric, Squirrel
    or Food), never fires. 21 of them count as full, one is named in a test (Enduring Innocence). Examples: Garruk's
    Uprising #87, Kindred Discovery #334, Welcoming Vampire #426, Elemental Bond #543, Mentor of the Meek #674,
    Tocasia's Welcome #796, Dragon Tempest #833, Temur Ascendancy #898, Charismatic Conqueror #1055, Glaring Fleshraker
    #1186, Weftstalker Ardent #1267, Haliya #1328, Simulacrum Synthesizer #1625, Vaultborn Tyrant #1751, Righteous
    Valkyrie #1897, Bloodline Pretender #1909, Garruk's Packleader #1988, Kiora Behemoth Beckoner #2379, Molten Echoes
    #2474, Outcaster Trailblazer #2861, Fecund Greenshell #2919 (partial), Honored Dreyleader #3225, Canoptek Spyder #3359.
    These cards play weaker than printed, not stronger.
  - Evidence: `(H2 notes) h2/p1-enter-watchers.mjs`: 16 of 19 wrong (Elemental Bond + Craterhoof: hand +0; Dragon Tempest +
    Serra Angel: no haste; Glaring Fleshraker + Myr Retriever: opponent 40). The controls pass: Hero's Blade and Gimli
    work ("legendary creature" matches). `(H2 notes) h2/p2-enter-or.mjs`: 5 of 5 "X or Y" watchers wrong. The reader stores
    `what: "creature you control with power 4 or greater"`, `ctl: "any"`, and cuts "less" to "les" ("power 2 or les").
  - Where: `triggers.js` `watchMatches` case `'enter'` (~384) calls `g.isA(o, w.what)`, and `mana.js` `isA` (~418)
    needs every word to match. `triggers.fits` (~307) already knows " or ", colors, "modified" and the "with" clauses.
    The enter-watcher reader is in `effects.js`.
  - Fix idea: the reader splits `what` into type, controller (`ctl: 'you'`) and a `with` clause, and reads "of the
    chosen type" (`o.chosenType` is set: Kindred Discovery chose "bear"). The 'enter' case uses `g.fits(o, what, with)`.
    Rules 28. The same check is worth doing on every watcher event that calls `isA` with a reader string (`tapped`,
    `sac`, 367/370).
  - Done when: an `interactions.mjs` test per pattern (power, toughness>power, mana value, chosen type, flying,
    colorless, "X or Y") triggers, and the rules 27 twin doesn't. Add a coverage `MISREAD` check: a watcher whose
    `what` has words `isA` can't match.
  - Also: none found (ROADMAP 553 fixed only colors in `isA`).
- [ ] **523. Abilities read with no effect count as full (loyalty abilities, Altar of Dementia).** (M) — area: cards, code (coverage tool)
  - Problem: 14 full cards keep an ability whose `effects` is empty. The line counts as read, but the ability does
    nothing (or plays stronger):
    - Altar of Dementia #640: the sacrifice happens, nobody mills.
    - Oko, Thief of Crowns #2082: +1 raises loyalty and does nothing; −5 is empty.
    - Teferi, Time Raveler #1120: +1 is empty.
    - Ugin, the Spirit Dragon #1564: −X is read as a 0-cost ability that does nothing; the −10's "put up to seven
      permanents" is dropped.
    - **Tezzeret the Seeker #1772: −X costs 0 loyalty and tutors any artifact (stronger)**; −5 is empty.
    - Liliana Dreadhorde General #764 (−9), Elspeth Sun's Champion #765 (−7 emblem), Tezzeret Cruel Captain #1124,
      Vraska Betrayal's Sting #1238, Daretti Scrap Savant #2044, Liliana of the Dark Realms #2135, Saheeli Sublime
      Artificer #2467, Ajani Strength of the Pride #3053, Evolutionary Leap #3372.
    - 13 partial cards have more of these (Wrenn and Seven, Jace TMS, Liliana of the Veil, Nissa…).
  - Evidence: `(H2 notes) h2/empty.mjs` (scan), `(H2 notes) h2/pwx.mjs` (−X costs), `(H2 notes) h2/p8-empty-abilities.mjs`: 5 of 5 wrong (Altar: P2
    library 20 → 20; Oko: loyalty 4 → 5, Craterhoof still 5/5; Tezzeret: cost read 0, loyalty 4 → 4, Sol Ring fetched;
    Ugin: loyalty 7 → 7, Bears stay; Teferi +1: no flash. The Teferi board may need more setup, but its effects are empty anyway).
  - Where: `effects.js` planeswalker lines (the −X loyalty cost, emblems, "until your next turn" permissions) and
    `sacOutlet` (~2497, `effects: parseEffects(m[4])` can be `[]`); `tests/coverage.mjs` (an ability with no effects isn't unread).
  - Fix idea: (1) **coverage first**: any ability, loyalty ability, `sacOutlet` or watcher with `effects: []` counts its line as unread
    (S, no rules change; it will move these 14 out of "full"). (2) Read −X loyalty costs (X chosen, loyalty paid) and
    the common bodies: "target player mills cards equal to the sacrificed creature's power", Elk, emblems. (3) The AI
    shouldn't activate an empty ability. Rules 28 for (2).
  - Done when: the coverage scan lists no full card with an empty ability; Altar, Oko +1 and Tezzeret −X boards pass.
- [ ] **524. The "restriction" class counts the wrong cards.** (S) — area: code (coverage tool; no rules version)
  - Problem: of the 86 restriction cards, 25 have the whole restricted ability unread (it does nothing): Conduit of
    Worlds, Steel Hellkite, Mount Doom, Vorinclex Voice of Hunger, The Aetherspark, Toxrill, Stormtide Leviathan,
    Nowhere to Run, Soulless Jailer… Another ~17 lost an *upside* that contains a restriction word: Sundering Eruption,
    Taunt from the Rampart, Orim's Chant kicked, Koma, Domri Anarch, Boseiju, Creeping Tar Pit, Tamiyo, Repulsive
    Mutation, Planar Genesis / Risen Reef / Scholar ("if you don't put it onto the battlefield, put it into your hand").
    These play weaker. About 44 really play stronger (519, 520, cost floor, gift-control). Meanwhile 521's drawbacks are missing.
  - Evidence: `(H2 notes) h2/restr.mjs` (61 dropped vs 25 whole-line), `(H2 notes) h2/restr2.mjs` (activate-only 30, spend-only 8, cost-floor 4, other 18).
  - Where: `tests/coverage.mjs` (`restr` uses unread lines as well as dropped sentences).
  - Fix idea: restriction = a restriction or drawback sentence **dropped from a read ability**; whole-line unread →
    partial; upsides (can't be countered, can't block this turn, "if you don't …, put it into your hand") → partial.
  - Done when: the restriction list holds only cards whose read part plays stronger (about 44 plus 521's).
  - Also: AUDIT 213 / 218.
- [ ] **525. Unreadable "if" conditions: 20 cards counted "incorrect" though they play weaker.** (M) — area: cards, code (coverage)
  - Problem: the 20 cards whose current reading still has `{ c: '?' }` are counted **incorrect**, not partial
    and not full: Guardian Project #316, Arena of Glory #366, Springheart Nantuko #702, Padeem #885, Tataru Taru
    #973, Liberator #1252, Carpet of Flowers #1352, Phelia #1568, Valakut Exploration #1583, Brass's Tunnel-Grinder
    #1608, Alchemist's Talent #2038, Not of This World #2358, The Indomitable #2404, The Chain Veil #2526, Inga and
    Esika #2528, Roiling Vortex #2608, Lost Monarch of Ifnir #3026, Yenna #3046, Marauding Raptor #3067, Spirit Water
    Revival #3314. Since rules 17 that part does nothing (weaker). Combustible Gearhulk (from the old list) now reads
    its condition. Cards with `?` only in a rules-gated older entry (The One Ring, Bloodghast, Ophiomancer…) are
    correctly counted by their newer reading.
  - The largest sub-family is **"if mana of a kind was spent"** (Arena of Glory, Liberator, Alchemist's Talent, Inga
    and Esika, Roiling Vortex: 5 cards; also the partial "when that mana is spent" lines on Path of Ancestry #9,
    Boseiju, Hall of the Bandit Lord, Carnelian Orb, Biophagus).
  - Evidence: `(H2 notes) h2/curq.mjs` (current reading per card); coverage reason "an \"if\" the reader can't read".
  - Fix idea: count them as partial with the reason kept (coverage only), so "incorrect" means misread; read
    "mana spent" conditions by tagging mana with its source (shared with 520). Rules 28 for the reading.
  - Also: AUDIT 206 (done), finding 516 (the 17-card scan list).
- [ ] **526. Follow-up sentences dropped (partial: 15 to 20 cards per wording).** (M each) — area: cards
  - Problem: the main sentence is read and the next one is dropped. Families (`(H2 notes) h2/followups.mjs`):
    - choices and piles (20: Victimize #125, Fact or Fiction #695, Gifts Ungiven #1509, Intuition #2024)
    - the rest of a dig (18: Necropotence #520, Eldritch Evolution #766, Demonic Consultation #922, Abundance, Scroll Rack)
    - "untap it / they gain haste" (15: Elspeth Storm Slayer #628, Karlach #1062, Windcrag Siege, Mob Rule, Underrealm Lich)
    - reflexive "if you do" (12: Victimize, Sylvan Library #256, Ripples of Undeath, Braids)
    - gift and kicker riders (10: Sevinne's Reclamation #336, Dawn's Truce #353, Galadriel's Dismissal)
    - "becomes a <type> in addition" (9, mostly cosmetic)
    - extra combats (7)
    - "repeat this process" (5: Torment of Hailfire #623, Ad Nauseam)
  - Where: `effects.js` (Phase 2F "follow-up sentences" reader).
  - Fix idea: extend the follow-up reader one wording at a time, the biggest group first. Each card gets an
    `interactions.mjs` test. Rules 28 where a reading changes play.
  - Also: ROADMAP 2F items (completions); AUDIT "Sylvan Library read as scry 2".
- [ ] **527. Play or cast from exile windows (27 cards).** (M/L) — area: cards
  - Problem: "you may play/cast it this turn / for as long as it remains exiled", including others' cards:
    Dauthi Voidwalker #391, Opposition Agent #596, Urza Lord High Artificer #790, Ugin Eye of the Storms #1638,
    Hoarding Broodlord #1720, Sword of Forge and Frontier #1873, Fallen Shinobi #2121, Outpost Siege #2422.
  - Where: `effects.js`, `mana.js` (cast permission from exile), `zones.js`.
  - Also: AUDIT 214 (13 cards; this is the wider family).
- [ ] **528. Escalate and strive are read but never handled.** (S/M) — area: cards (unhandled)
  - Problem: Collective Resistance #749, Twinflame #1248, Call the Coppercoats #1655, Collective Effort #3192. Extra
    modes and extra targets with their extra cost. Strive also needs "any number of target creatures" (9 cards share
    that wording).
  - Evidence: coverage output "read but never handled: fx.escalate (2…); fx.strive (2…)".
  - Where: `effects.js` (fields set), `Game.cast` modes and targets, `mana.js` cost.
  - Also: ROADMAP 678 / 900 ("non-mana escalate", "strive" listed as open).
- [ ] **529. Counters that move between permanents (6+ cards).** (M) — area: cards
  - Problem: The Ozolith #300 (unsupported), Forgotten Ancient #384, Resourceful Defense #1532 (incorrect), Yuna,
    Zack Fair, Benevolent Hydra. "Move counters", and "if it had counters on it, put those counters on …" with
    last-known counters.
  - Where: `effects.js`, `resolve.js`; uses the last-known-information fix of finding 500.
- [ ] **530. Protection from other qualities.** (S) — area: cards (partial, weaker)
  - Problem: `protQualities` returns null for "protection from mana value 3 or less" (Reaver Titan #3106), "from the
    chosen card type" (Serra's Emissary #2199) and "from each of that creature's colors" (Éowyn #3307). The keyword is
    dropped and the card is partial (correctly counted).
  - Where: `effects.js` `protQualities` (~49); `Game.protectedFrom` (~591).
  - Fix idea: qualities `mv<=N`, `chosenType` and a chosen color list in `protectedFrom`. Rules 28.

### From H3 (AI quality)

The scripts, raw game results and the 11 proposed `tests/ai.mjs` cases (36–46, all failing today) are kept with the hunt
notes (folder `h3/`; `node h3/proposed-ai.mjs [filter]`, paste the block between its CUT lines into `tests/ai.mjs`).
Frequencies come from 1,598 seeded games: cEDH presets 500000–500399, random snapshot decks 600000–600399 (4 players)
and 800000–800199 (2 players), look-ahead 700000–700199, Kingdoms 930000 and 940000. Every AI change alters choices,
so it goes behind rules 28 (with rules 27 twins of the cases) and golden games at rules 27 stay identical.

- [ ] **531. The AI activates draw abilities with an empty library and loses.** (S) — area: AI
  - Problem: Thrasios (and other "draw a card" abilities) are activated with no library left. 41 eliminations right after
    such an activation in 400 cEDH games; the Thrasios deck decked itself in 58 of its 400 games; 8 Kingdoms King deaths.
  - Evidence: cEDH seed 500000, turn 26; proposed case 43.
  - Where: `ai.js` `effectValue` case "draw" (~1251).
  - Fix idea: a draw the player can't make is worth a loss (unless it wins first, e.g. Thassa's Oracle lines). Rules 28.
  - Done when: case 43 passes.
- [ ] **532. A lethal attack scores below a near-lethal one; the backswing counts players it eliminates.** (M) — area: AI
  - Problem: missed lethal in 36/400 cEDH, 85/398 random 4-player and 9/200 2-player games. A 2-player AI at 5 life with
    Hill Giant doesn't attack an opponent at 3 with no untapped creature; 16 of 20 power is sent at a player on 18.
  - Evidence: seed 500001, turn 25; seed 500086 (commander-damage kill skipped); proposed cases 36, 37.
  - Where: `combatai.js` `bestAttacks` `evaluate` (~212–245).
  - Fix idea: an attack that eliminates a player ranks above any that doesn't; a player it eliminates has no backswing. Rules 28.
  - Done when: cases 36 and 37 pass; missed-lethal count in the cEDH batch drops.
- [ ] **533. No second chump block when one block is not enough to survive.** (S) — area: AI
  - Problem: deaths a double chump would have prevented in 31/400 cEDH, 58/398 random and 10/200 2-player games.
  - Evidence: seed 500000, turn 33; proposed case 39 (three Hill Giants at the AI on 4 life, Elves and Bears in play: no blocks).
  - Where: `combatai.js` `lifeCost` (a flat 1000 once lethal, so one block and none look the same), `bestBlocks`.
  - Fix idea: score lethal damage by how far past lethal, so each extra block that saves the game counts. Rules 28.
  - Done when: case 39 passes.
- [ ] **534. A Vehicle is crewed in main phase 1 and then kept home, tapping the blockers.** (S) — area: AI
  - Problem: 43/398 random and 8/200 2-player games; the crew stays tapped through the opponents' turns, and the Equipment on
    the Vehicle falls off at cleanup (the H1 704.5n events).
  - Evidence: fuzz seed 90000, turn 39; proposed case 41 (crewing Reaver Titan taps the only blockers and the AI dies next turn).
  - Where: `ai.js` `crewPlan` / `bestPlay` (~1098); `combatai.js` backswing "home" list.
  - Fix idea: crew only in combat, for an attack the planner actually makes. Rules 28.
  - Done when: case 41 passes.
- [ ] **535. Pact of Negation is cast without the colors for its upkeep payment.** (S) — area: AI
  - Problem: the AI checks that it will have five mana, not {3}{U}{U}, and loses at its upkeep: 15/400 cEDH and 12/200
    look-ahead games; 3 Kingdoms King deaths.
  - Evidence: seeds 500012, 500333, 500045; proposed case 42 (seven mana, one blue source: the Pact is planned).
  - Where: `mana.js` `castMode` (~630) counts amounts and ignores colors (since 1.4.2).
  - Fix idea: plan the delayed cost with `planTagged` colors. Rules 28.
  - Done when: case 42 passes.
- [ ] **536. cEDH pilots keep mana creatures home even when attacking would finish a player.** (S) — area: AI
  - Problem: 12 decisions in 400 cEDH games.
  - Evidence: seeds 500100, 500214; proposed case 45 (two Elves, opponent at 2 with no creatures: no attack).
  - Where: `combatai.js` `keepHome` / `mayHit`.
  - Fix idea: the keep-home rule yields when the attack eliminates a player. Rules 28.
  - Done when: case 45 passes.
- [ ] **537. The attack planner only looks at nine attackers.** (S) — area: AI
  - Problem: wide boards (tokens, Elves) never attack with more than nine, missing lethal; 15 decisions in the random 4-player batch.
  - Evidence: proposed case 38 (twelve 1/1s, opponent at 10 with no creatures: no lethal attack).
  - Where: `combatai.js` (`slice(0, 9)`).
  - Fix idea: add an "everyone attacks" candidate and group identical creatures instead of cutting the list. Rules 28.
  - Done when: case 38 passes; the large-board perf time stays under its current 85 ms.
  - Also: the rules 11 `comboAlphaStrike` note mentions the limit.
- [ ] **538. Infect damage is scored as life loss in attacks and blocks.** (S/M) — area: AI
  - Problem: 6 missed-lethal decisions and 3 poison deaths that a block would have prevented, in the random batches.
  - Evidence: proposed case 40 (Skithiryx at the AI on 9 poison: no block with Giant Spider).
  - Where: `combatai.js` `simulate`; `ai.js` `lethalKey`.
  - Fix idea: track poison alongside life in the combat simulation. Rules 28.
  - Done when: case 40 passes.
- [ ] **539. The colors a held counterspell needs are spent in main phase 1.** (S) — area: AI
  - Problem: with Counterspell in hand, a creature is paid with an Island instead of the spare Forest; every time on the board.
  - Evidence: proposed case 46 (two Islands, two Forests; Grizzly Bears paid with Forest + Island).
  - Where: `ai.js` `bestPlay` (the `avoid` colors), `reserveFor`.
  - Fix idea: reserve the colors of the spell the AI is holding up, not only the amount. Rules 28.
  - Done when: case 46 passes.
- [ ] **540. Protection spells are offered for targets their words don't allow.** (S) — area: AI
  - Problem: Overprotect ("target creature you control") offered for Mirror Box; the log says "P3 protects Mirror Box", then
    the engine refuses the cast. About 1 game in 300.
  - Evidence: fuzz seed 90091; proposed case 44.
  - Where: `ai.js` `protectResponse` (needs `targetLegal`).
  - Fix idea: check `targetLegal` before offering, and log only casts that happen. Rules 28.
  - Done when: case 44 passes.
  - Also: same root cause as 510 and 512; AUDIT 209.
- [ ] **541. The built-in cEDH decks are far apart in strength.** (S/M) — area: AI, feature
  - Problem: over 400 4-player games each: Heliod 48.3% [43–53], Thrasios + Tymna 28.5%, Kinnan 18.3%, Kess 4.8% [3–7].
    Kess's Breach line never won; the Heliod list runs 57 Plains. Self-test and puzzle games built on these decks are lopsided.
  - Evidence: cEDH batch 500000–500399 (H3 notes `h3/cedh-500000-400.jsonl`).
  - Where: `presets.js` lists; `ai.js` combo lines for Kess (Underworld Breach).
  - Fix idea: check the lists against current cEDH lists (free sources only) and why the Breach line never fires; part may
    fall with 531 and 535 (Thrasios deck-outs, Pacts). Changing presets changes golden games: re-accept them deliberately.
  - Done when: a 400-game rerun puts every deck within 15–35%.
- [ ] **542. Ocelot Pride and Renewed Solidarity copy themselves every end step (games stall).** (M) — area: cards, engine
  - Problem: "for each token you control that entered this turn, create a token that's a copy of it" is read as a copy of
    the card itself, and Ocelot Pride does it even when no life was gained (the intervening "if", 603.4). One Ocelot becomes
    512 in nine end steps (at rules 20, 24 and 27). It's not legal growth. Games crawl and never finish: random-deck seeds
    600119, 600278 (H3), 710057, 730055 and 730907 (4,096 copies): 3 of 660 random games in H7.
  - Evidence: `node h7/ocelot.mjs` (H7 notes); `node h3/hang.mjs 600119 <index> 60`.
  - Where: `effects.js` (the end-step copy reading), `triggers.js` (intervening-if check of that trigger).
  - Fix idea: copy each token that entered this turn, and only "if you gained life this turn". `loops.js` is the wrong
    place: this is growth across turns, not a loop. Rules 28.
  - Done when: `h7/ocelot.mjs` copies only the tokens that entered, nothing on a turn without life gain; all five seeds finish.
  - Also: the slow target choice in the same games is 543.

### From H7 (performance and reliability)

Node side: three seeded 4-player sessions in one process (320 games 710000–710319, 200 with learning on 720000–720199,
1,000 games 730000–730999; cEDH presets and random decks); scripts and raw output in the H7 notes (`h7/`). Browser side:
the game page and `play.html` from `Spellbook Table.exe` in the browser pane (H7 browser notes, `h7b/`). Measured and
fine: heap flat over 1,000 games (44–50 MB, 2.8 KB a game), no slowdown across a session, game page DOMContentLoaded 628
ms, `/api/rules` fetch and parse 17 ms, table render median 1.4 ms (95% 6.4 ms), log DOM capped at 2,500 lines. The
engine keeps the whole game log (typical 537 entries / 98 KB, 99th percentile 1,356 / 252 KB). Replays are 171 KB (cEDH)
to 284 KB (random) as JSON, 88% card data; saved replays are downloaded files, so storage holds only the autosave.
Frame time was not measured (the pane was hidden, so animation frames were throttled).

- [ ] **543. Choosing a removal target is cubic in board size.** (M) — area: AI, performance
  - Problem: for each candidate, `bestEnemy` recomputes the opponent's next attack without it (`lethalKey`, `nextAttackOn`),
    outside the planning cache. 737 ms at 120 creatures, 11.5 s at 240, 57 s at 360 (test board under lethal pressure).
    In games: 9.2 s in seed 730055, 2.8 s a call in 730699, over 140 s in 600278; 1.1–1.4 s on 150 permanents (600324).
  - Evidence: `node h7/bestenemy.mjs`, `h7/evalcache.mjs`; proposed `tests/ai.mjs` case 48 (`h7/proposed-ai.mjs`, fails today: 734 ms).
  - Where: `ai.js` `bestEnemy`, `lethalKey`, `nextAttackOn`.
  - Fix idea: use the ROADMAP 171 planning cache (66 ms / 577 ms / 2.2 s; 40 of 40 games identical, so no rules version),
    then the pruning bound in the H7 notes that keeps the same answers.
  - Done when: case 48 passes and golden games are unchanged.
  - Also: ROADMAP 171; finding 542 (same games).
- [ ] **544. The city's blessing is lost when permanents drop below ten.** (S) — area: engine
  - Problem: once you have the city's blessing you keep it for the rest of the game (702.131b); the engine recounts it.
  - Evidence: `node h7/blessing.mjs`: ten permanents → blessing true; two Plains leave → false.
  - Where: the ascend / city's blessing check (`triggers.js` / `mana.js` condition reading).
  - Fix idea: a player flag set once and never cleared; also check ascend on instants and sorceries (702.131a, unproven). Rules 28.
  - Done when: the blessing board keeps it after the Plains leave.
- [ ] **545. Engine steps get quadratically slower on big boards.** (M) — area: performance
  - Problem: each state-based-actions pass reads every creature's toughness, and each read scans the board for
    attachments and anthems. The stall game runs 245 steps a second at 313 permanents and 4.7 at 1,025, with the AI idle;
    78.6% of the profile is under those toughness reads.
  - Evidence: `node h7/stall.mjs`, `h7/sbacurve.mjs`, `h7/profsum.mjs`.
  - Where: `triggers.js` state-based actions; the power/toughness getters (`rules.js`/`engine.js` anthem and attachment scans).
  - Fix idea: a per-pass cache of anthems and attachments (built once per SBA pass), which changes no game.
  - Done when: `sbacurve.mjs` shows near-linear steps a second up to 1,000 permanents; golden games unchanged.
- [ ] **546. `tests/perf.mjs`'s timing wrappers change the look-ahead games they time.** (M) — area: code (test tools)
  - Problem: the wrappers are bound to the real pilot, and look-ahead copies inherit them, so copies ignore their own
    `forcedAttacks` and `lookahead = false`. 7 of 8 perf seeds play differently; 82% of timed calls come from copies.
    H3's look-ahead runner has the same pattern (7 of 10 seeds 700000–700009 differ), so H3's look-ahead numbers (no edge,
    more missed lethals) are not trustworthy until rerun.
  - Evidence: `node h7/perfwrap.mjs`: "7 of 8 games play differently under the perf.mjs wrappers".
  - Where: `tests/perf.mjs` (instance wrappers); `lookahead.js` `simAgent` (copies own properties).
  - Fix idea: prototype wrappers that skip `g.sim` (code in the H7 notes); then rerun the H3 look-ahead batch.
  - Done when: `perfwrap.mjs` shows 8 of 8 identical with timing on.
- [ ] **547. Torrential Gearhulk with a blink spell in the graveyard overflows the AI's valuation.** (S) — area: AI, reliability
  - Problem: valuing Ghostly Flicker through Torrential Gearhulk's free cast recurses until the stack overflows; the game
    stops with a simulator error. 1 of 1,000 games (seed 730791).
  - Evidence: `node h7/gearhulk.mjs` ("RangeError: Maximum call stack size exceeded", `Agent.chooseTarget` < `effectValue`);
    proposed case 47 (fails today).
  - Where: `ai.js` `effectValue` / `chooseTarget` (no depth guard for free-cast chains).
  - Fix idea: a recursion depth or visited-set guard in valuation. Changes AI values only where it now crashes; rules 28 to be safe.
  - Done when: case 47 passes.
- [ ] **548. The autosave rewrites the whole replay every turn and every answer.** (S) — area: performance, saved data
  - Problem: card data included, about 11 MB serialised per all-AI game. The browser-side cost wasn't measured.
  - Evidence: H7 notes (`h7/session.mjs` autosave counter).
  - Where: `main.js` autosave (~950–965).
  - Fix idea: save the card data once per game and append answers, or save at turn starts only.
  - Done when: serialised bytes per game drop below 1 MB with Resume unchanged.
  - Also: 566 (one autosave slot).
- [ ] **549. When an IndexedDB save fails, the session keeps reading the unsaved value.** (S) — area: reliability, saved data
  - Problem: the page shows "Resume turn 9", but after a restart it's turn 3; nothing tells the player the save failed.
    `tests/storage.mjs` only covers the localStorage path.
  - Evidence: `node h7/idbfull.mjs`.
  - Where: `util.js` store / the IndexedDB layer (`ct-store`).
  - Fix idea: keep the last saved value on a failed write and raise the same `ct-store` event as localStorage does.
  - Done when: a `tests/storage.mjs` case with a failing IndexedDB passes.
- [ ] **550. Friends' pages download the whole table view every 600 ms.** (S/M) — area: performance, online
  - Problem: `play.html` polls `/api/room/view` every 600 ms, even before a code is entered and while the connection is
    failing (no backoff), and every reply is the full view, changed or not. A view averages about 20 KB (largest 20–33 KB),
    so each friend costs about 33 KB/s, roughly 120 MB an hour of the host's upload through the tunnel (and the friend's
    mobile data); three friends triple it. No response is compressed.
  - Evidence: H7 browser notes; `node h7b/viewsize.mjs 10` (seeds 710000–710009); browser pane network list on `play.html`.
  - Where: `remote.js` `poll` (~427); the `view` action in all three servers (`server.py` ~181, `SpellbookTable.cs` ~827, `server.ps1` ~169).
  - Fix idea: send the revision number with each poll and answer "unchanged" (all three servers); back off when there's
    no code or the connection fails; optionally gzip JSON. No rules version.
  - Done when: an idle table sends under 1 KB a poll; `tests/servers.mjs` and `tests/net.mjs` cover it on all three servers.
- [ ] **551. Each log line forces a page layout.** (S) — area: performance, interface
  - Problem: `addLog` reads `log.scrollHeight` before appending every line, forcing a layout (about 0.6 ms a line on a
    905-line log, more as the page grows). Over one 12-round game, adding log lines cost 1.09 s, five times all table rendering.
  - Evidence: H7 browser notes (timing wrappers on `TableView.render`/`sync`/`addLog`, seed game at speed 8).
  - Where: `ui.js` `addLog` (~644).
  - Fix idea: keep a "stuck to bottom" flag from the scroll event, and batch lines per animation frame during fast-forward.
  - Done when: `addLog` median under 0.3 ms on the same game.

### From H8 (features and play experience)

Played in the browser pane at 1280×800 as a first-time player (the pane's settings saved, cleared and put back): lesson 1,
a 4-player cEDH game seated as a person up to turn 8, and the puzzle "Burn them out". An `Explore` pass checked the code
against README and every roadmap for missing features. What works well: the welcome dialog with "I'm new to Magic",
seven lessons with a coach, Resume and Continue on the start menu, the setup tour, clear target prompts, the mulligan
prompt, the puzzle window, results with a game report. Complete (with file): London mulligan, undo, keyboard sheet,
stops and pass buttons, trigger and replacement ordering, library search, zone viewers, life and commander damage
history, timers, replays, spectators, deck import from eight sites and formats, deck stats, brackets, rematch, history.

- [ ] **552. The action bar covers your hand, and clicks on it miss the cards.** (M) — area: interface
  - Problem: at 1280×800 the hand row is y 672–764 and the bar, bottom centre, covers about y 700–790; only 8–20 px of
    each card shows. Clicking a card where you see it hits the bar: my land drop was lost (Yavimaya Coast stayed in hand,
    then a cleanup discard). Seen in the lesson, the 4-player game and the puzzle. The lesson's coach box also covers the
    bottom-left of your board, and the hover preview covers the bar while you choose a target.
  - Evidence: `document.elementFromPoint` at the middle of a hand card returns `#abText`; screenshots in the H8 play notes.
  - Where: `style.css` action bar (`#abText`, `#abButtons`), `main.js`/`human.js` bar placement, `tutorial.js` coach box.
  - Fix idea: dock the bar under your board by default (the part of DESIGN 294 not done), or lift the hand above it.
  - Done when: a uitest check finds every hand card's centre clickable at 1280×800 and 1366×768 with a prompt up.
  - Also: DESIGN 294 (ticked; its Done note says docking was not done).
- [ ] **553. The player named "You" gets wrong grammar, and other text slips.** (S) — area: interface
  - Problem: "You wins!", "(You's lead grew the most)", "You casts Lightning Bolt…" in the log, "1 turns over 1 rounds";
    the lesson's deck is labelled "Imported Limited (draft or sealed) deck" in its results.
  - Evidence: lesson 1 and puzzle results; `main.js` ~1043, ~1049, ~1055; log lines built as `${name} casts`.
  - Where: `main.js` results; `engine.js`/`resolve.js` log lines (`pn`); `i18n.js` pattern `/^(.+) wins!$/` must follow.
  - Fix idea: a `you` form of player names in log and results (second person), and plurals; log text isn't game state,
    but log hashes are in the golden games, so gate the log wording behind rules 28 or keep it in the view only.
  - Done when: the lesson result says "You win!" and the log "You cast…"; golden games unchanged.
- [ ] **554. A first-time Play seats nobody as you, and there's no one-click game.** (S) — area: interface, feature
  - Problem: all four seats default to "Auto style" (AI); "You play this seat" is option 7 of 8 in a menu labelled
    "Auto style"; "Load decks & shuffle up" starts an all-AI game, so a newcomer watches instead of playing. Play on the
    start menu only opens setup; no quick start exists.
  - Evidence: fresh profile in the browser pane; `main.js` ~112–117 (`style: … 'auto'`), ~4225.
  - Where: `main.js` seat defaults and start menu.
  - Fix idea: seat 1 defaults to "You" on a first start; a "Play now" button (you plus three random or precon decks).
  - Done when: on a fresh profile, Play → Load decks gives a game with a seat for you.
- [ ] **555. A seat with a pasted list still says "Empty seat".** (S) — area: interface
  - Problem: after "Seat a cEDH table" every seat shows a full list but the note says "Empty seat — a random deck will be generated."
  - Evidence: setup screen; `main.js` ~207 (the note shows whenever `s.deck` isn't loaded yet).
  - Where: `main.js` seat status.
  - Fix idea: "List ready: loads when you start" when the text box isn't empty.
  - Done when: the note matches the text box on every seat.
- [ ] **556. Lessons and puzzles count as games in the record, history and deck learning.** (S) — area: feature
  - Problem: after the one-turn lesson against a training dummy the start menu shows 1 played, 1 win, 100%; the dummy and
    puzzle decks are learned from too.
  - Evidence: fresh profile; `main.js` ~518 (`recordGame` and `addHistory` for every finished game except the interface test).
  - Where: `main.js` game-over handler.
  - Fix idea: skip lessons and puzzles (keep their own progress: lesson ticks, puzzle streak).
  - Done when: a lesson and a puzzle leave Your record unchanged.
- [ ] **557. Lesson 1 tells you to click "End turn" in main phase 1, where the button says "Go to combat".** (S) — area: interface
  - Problem: "End turn" only appears in main phase 2; a beginner has to guess.
  - Evidence: lesson 1; `tutorial.js` lesson text; action bar buttons in main 1.
  - Where: `tutorial.js` (~line 10 lesson), or `human.js` main-phase buttons.
  - Fix idea: say "click Go to combat, then End turn", or offer End turn in main 1 too.
  - Done when: lesson 1's steps match the buttons shown.
- [ ] **558. Puzzle results don't say solved, offer no next puzzle and no solution.** (S) — area: feature
  - Problem: after winning "Burn them out" the screen says "You wins!" with Try again, Watch replay, Change decks; no
    "Solved", no "Next puzzle" (lessons have "Next lesson"), and no way to see a solution or watch the AI solve it (daily
    puzzles are positions an AI was checked to win from).
  - Evidence: puzzle play-through; `main.js` ~2479/2497, `puzzles.js` 10–26 (hint lines only).
  - Where: `main.js` results for puzzles; `puzzles.js`.
  - Fix idea: a puzzle result panel (solved, streak, next) and "Show a solution" replaying the checked AI line.
  - Done when: winning a puzzle offers Next and a solution.
  - Also: DESIGN 347 (looks only).
- [ ] **559. Beginners get the full playtester toolbar.** (S/M) — area: interface
  - Problem: lessons and puzzles show Batch, Take over…, Spectators, Save replay, Share as web page, Save board as puzzle,
    Export log, the timeline, Reveal hands and Explain, and the label "AI playtester".
  - Evidence: screenshots in the H8 play notes.
  - Where: `main.js` top bar; `index.html`.
  - Fix idea: a "player" layout for lessons, puzzles and seated games that hides the playtester tools behind More.
  - Also: DESIGN 300 (its "clean" layout is not done), 301.
- [ ] **560. A person can't use activated abilities in response, or after blockers.** (M) — area: feature, engine
  - Problem: in the response window and after blockers the prompt offers instants, Walking Ballista and mana only: no
    sacrifice outlets in response to removal, no regeneration, pumps or untaps. The AI can (ROADMAP item 2).
  - Evidence: `human.js` ~956–988: `respond`, `combatTrick` and `respondToLoop` call `instantWindow(…, false, …)`; only
    stops, the end of turn and being attacked pass `true` (~478, 986, 1027).
  - Where: `human.js` `respond`, `combatTrick`, `respondToLoop` (reuse `instantAbilities`/`useAbility`).
  - Fix idea: pass `true` in those windows; recorded answers change, so rules 28.
  - Done when: a person can sacrifice to Viscera Seer in response to Murder (`tests/interactions.mjs` with a scripted person).
- [ ] **561. Ninjutsu, dredge and Abundance choices are AI-only.** (S/M) — area: feature, engine
  - Problem: a person is never offered ninjutsu or dredge, and Abundance always takes nonland for a person.
  - Evidence: `combat.js` ~144 (`if (!p.agent.human)` before ninjutsu), `replacements.js` ~141 and `zones.js` ~339 (dredge
    only for AI, "the draw can't wait"), `zones.js` ~395 (Abundance).
  - Where: those files plus prompts in `human.js` (async replacement prompts exist since rules 14).
  - Fix idea: ask the person (online seats too); rules 28.
  - Done when: a person can ninjutsu, dredge and choose land with Abundance.
  - Also: ROADMAP 194 ("still open" note on dredge for people).
- [ ] **562. Mulligan limits for a person.** (S) — area: engine, interface
  - Problem: mulligans stop at three (the fourth hand is kept unseen; 103.5 allows down to zero); who goes first is drawn
    after all mulligans (103.1 decides it first, so you decide without knowing if you're on the play); the Keep prompt
    doesn't say how many cards the next hand will bottom or that the first is free.
  - Evidence: `engine.js` ~2840 (`while (p.mulligans < 3 …)`), ~2854 (first player after mulligans); `human.js` ~1112.
  - Where: `engine.js` setup, `human.js` `keepHand`.
  - Fix idea: no cap; draw the first player before mulligans; say the cost in the prompt. Rules 28 (the comment notes old replays).
  - Done when: a person can mulligan to zero and sees "you're on the play" before keeping.
- [ ] **563. A person can't choose the order of cards put back on top (scry, Brainstorm).** (S) — area: feature, engine
  - Problem: scry asks Keep/Bottom per card and puts kept cards back in their old order; "put back in any order" is the same. Rule 701.22a.
  - Evidence: `human.js` ~1119–1130 (`chooseScryAsync`), `resolve.js` ~1124–1131.
  - Where: those functions.
  - Fix idea: an order step after Keep/Bottom (drag or arrow keys). Rules 28.
  - Done when: a person's scry 2 can put the second card on top.
- [ ] **564. No way to hold priority on one cast.** (S) — area: interface
  - Problem: responding to your own spell needs the table-wide Full control.
  - Evidence: `human.js` ~959; no "hold" option in `human.js`.
  - Where: `human.js` main-phase prompt (~701).
  - Fix idea: a modifier key or "Cast and hold" button for one cast.
  - Done when: a person can respond to their own spell without Full control.
- [ ] **565. The host's exile pile and viewer show face-down exiled cards.** (S) — area: interface (hidden information)
  - Problem: foretold, hideaway and other face-down exiled cards are shown face up, with their names on the pile's
    tooltip, to anyone at the host's screen (opponents' cards in hotseat games). The friend's page hides them.
  - Evidence: `ui.js` `openZone` (~698–748) draws every exiled card; the pile (~407–416) shows the top card's picture and
    name; `net.js` ~301 (`exName`) hides `faceDown`, `foretold`, `hiddenExile`.
  - Where: `ui.js`.
  - Fix idea: apply the `net.js` rule with `humanIdx`/`revealHands`. No rules version.
  - Done when: a foretold card shows as face down in another seat's exile viewer.
- [ ] **566. Only one unfinished game is kept, replaced without warning; modes can't be resumed.** (S/M) — area: feature
  - Problem: one `ct.autosave` key is written by any new game (watched AI games too) and replaced silently; Expedition,
    Gauntlet and Story games in progress aren't saved (README says so).
  - Evidence: `main.js` ~952–961 (`customSeats` skipped), ~4227.
  - Where: `main.js` autosave and new game.
  - Fix idea: warn before Play replaces an unfinished seated game (S); a slot per mode (M).
  - Also: 548.
- [ ] **567. The engine's Commander table is fixed at four players.** (M) — area: feature
  - Problem: no 3-, 5- or 6-player Commander with rules and AI; only the manual tabletop (no AI) and Kingdoms (5–9 seats) differ.
  - Evidence: `formats.js` ~15 (`seats: 4`); `main.js` ~126–131 (seat count varies only for manual formats).
  - Where: `formats.js`, `main.js` seat count and table layout; threat AI checked at 3/5/6 seats.
  - Done when: a 3- and a 6-player Commander game run with AI and pass the self-test checks.
- [ ] **568. No house rules on the engine table.** (M) — area: feature
  - Problem: no starting life, commander damage threshold, free-mulligan choice, chosen first player in a single game, or
    a table ban list (rule 0). The engine already takes `lifeBonus` and `firstPlayer`.
  - Evidence: `main.js` ~159 (starting life only for manual formats), `formats.js` 15–24 constants; no ban-list code.
  - Where: setup screen, `formats.js` overrides saved in the setup and replay, deck checks.
  - Done when: a game with house rules replays exactly with them.
- [ ] **569. New players aren't shown the table, the opponent's turn, or a "how to play" help page.** (S/M) — area: feature (onboarding)
  - Problem: the 8-step tour covers only the setup screen (nothing on the action bar, pass buttons, Stops, stack, timeline
    or Undo); all seven lessons are one turn of your own (no responding, counterspells or blocking); Help is README in
    file order, starting with Run it, Moving to another PC, Mac and Linux, Offline, Updates and Privacy, while "Playing a
    seat yourself" is far down with version notes; if `help.json` fails, Help silently doesn't open.
  - Evidence: `tour.js` 3–12; `tutorial.js` lesson ids (~10–85); `windows.js` ~11, 31–49.
  - Where: `tour.js` (a table tour on the first seated game), `tutorial.js` (a lesson where the opponent acts), `tools/help.mjs` (a "Start here" section first).
  - Also: DESIGN 358 (tours of the dashboard and builder), 359, 360.
- [ ] **570. The manual tabletop lacks basic table actions.** (M) — area: feature
  - Problem: no undo, one generic ±1 counter, no attaching Auras or Equipment, and free text uses the browser's `prompt()`.
  - Evidence: `manual.js` (no undo; ~79–84 counters; ~313 `prompt()`).
  - Where: `manual.js`.
  - Also: DESIGN 349 (restyle only).
- [ ] **571. Friends and hotseat seats lack the host's per-player settings.** (S/M) — area: feature, online
  - Problem: friends get no Stops, Full control, "Always" answers, tutor filter box, or Esc/A/U keys; all hotseat seats share one stop setting.
  - Evidence: `main.js` ~442–443 (`new HumanAgent(…, { orderTriggers })` for friends, shared `setup.stopOpts`); `net.js`
    ~172–194 (no `autoKey`); `remote.js` ~381–388 (keys).
  - Where: `net.js` RemoteUI, `remote.js`, `main.js`.
  - Also: DESIGN 352–356 (the friend page's look).

## Suggested order

_(written in H9)_
