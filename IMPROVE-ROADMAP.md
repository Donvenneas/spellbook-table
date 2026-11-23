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

- [ ] **H0. Setup and baseline.** (S)
  - Confirm the six agents are listed (ask Claude "which agents do you have?") and the plugins are installed.
  - Run every suite (the list is under "Testing" in CLAUDE.md), the browser self-test and `uitest.html?run` with the
    `test-spellbook-table` skill. Compare with "Baseline" above; anything that got worse since 2026-11-23 is finding 500 onward.

- [ ] **H1. Engine correctness.** (L) — `fuzz-triager`, then `rules-judge`
  - Fuzz: 300 games on new seeds (e.g. `--seed 90000`, `91000`, `92000`, 100 games each), plus 4-player games.
  - `node tests/audit-probes.mjs` and `--scan`: which probes still fail, which were fixed but not moved.
  - `rules-judge` over the modules with the most rules weight and least test cover: `stack.js`, `triggers.js`,
    `replacements.js`, `combat.js`, `zones.js`, layers and continuous effects (old items 90 / 212), the "known" tests in `tests/rules.mjs`.
  - Look especially at: simultaneous events, last-known information, copies and face-down cards, control changes,
    commander zone moves, multiplayer leaving the game (800.4a), timestamps.

- [ ] **H2. Card coverage.** (L) — `card-fixer` in survey mode, `rules-judge`
  - Refresh `node tests/coverage.mjs --report tests/card-coverage.md`.
  - Group the incorrect, partial, restriction, unhandled and unsupported cards into **families** (same unread wording),
    rank families by how many cards and how popular, and write one finding per family (cards repaired, example card, likely module).
  - Restriction cards first: they play **stronger** than printed, which changes game results.
  - Sample the "needs interaction test" class: the 100 most-played full cards with no test; write quick probes for 20 of them
    and file any that play wrong (this tells how much "full" can be trusted).
  - Formats beyond Commander: cards the 60-card and Limited generators pick (old item 98).

- [ ] **H3. AI quality.** (L) — `ai-evaluator`
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

- [ ] **H7. Performance and reliability.** (M) — `ai-evaluator`, browser pane
  - `node --expose-gc tests/perf.mjs`: large boards, long sessions, memory growth.
  - Page load time and size of the game page; first-game time on a cold start; image cache behaviour offline.
  - Long games (20+ turns, big boards) in the browser: frame time while animating, log size.
  - Saved data: storage use over many games, replay sizes, what happens when storage is full (`tests/storage.mjs` cases).

- [ ] **H8. Features and play experience.** (M) — feature-dev `code-architect`, `Explore`
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

_(empty until H0 runs)_

## Suggested order

_(written in H9)_
