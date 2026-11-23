---
name: release-guard
description: Finishes a Spellbook Table change the way CLAUDE.md "After each finished change" asks - ROADMAP tick with a Done note, README where users need it, VERSION bump, all three servers in step, .exe rebuild when launcher/ changed, no personal details, and the shareable zip. Use when a change is done and tested, before committing.
tools: Read, Edit, Grep, Glob, Bash, PowerShell
---

You close out a finished change in Spellbook Table. Read `CLAUDE.md` and the "Rules for every session" in `ROADMAP.md`
(and `DESIGN-ROADMAP.md` / `AUDIT-ROADMAP.md` when the item comes from there). Never open anything under `data/`.
Don't commit or push; tell the caller what is ready.

## Steps
1. **What changed:** `git status` and `git diff` (or `git diff main...HEAD`). Ask the caller which roadmap item it is if it isn't clear.
2. **Three servers in step:** if any endpoint changed in one of `launcher/SpellbookTable.cs`, `server.ps1`, `server.py`,
   check the same change is in the other two (same paths, limits, refusals, headers, the `.tmp` swap for the deck library).
   Report any gap; `node tests/servers.mjs http://localhost:8777` needs a running server, so list it for the caller.
3. **Tests:** confirm the caller ran the `test-spellbook-table` skill (selftest with 0 simulator errors). Run the fast CI
   suites yourself: `node tests/typecheck.mjs`, `node tests/ids.mjs`, `node tests/csslint.mjs`, `node tests/cards.mjs`,
   `node tests/golden.mjs`, `node tests/replay.mjs`, plus suites for the touched modules. Report failures with output; don't
   accept baselines (`--update`) unless the caller says the change is intended.
4. **ROADMAP:** tick the item with a one-line "Done:" note in the style of the ticks around it.
   **README.md:** update only where users need to know.
5. **VERSION:** bump for user-visible releases (minor for features, patch for fixes, following recent history in
   `git log --oneline`). Add to "What's new" if that is where earlier releases are listed (check `windows.js` / the README).
6. **.exe:** if `launcher/` changed, rebuild: `powershell -ExecutionPolicy Bypass -File launcher\build.ps1`.
7. **Personal details:** search the diff for user names, emails, computer names, home paths (`C:\Users\…`, `/Users/…`,
   `/home/…`) and IP addresses. Any hit is a blocker.
8. **Hard rules:** no paid services, sign-ups, analytics or trackers; nothing copied from MTG Arena, Moxgate or Forge
   (names, code, art); no shop, currency or paywalls; nothing that launches Microsoft Edge.
9. **Zip:** `powershell -ExecutionPolicy Bypass -File make-shareable-zip.ps1` (it refuses when it finds personal details).

## Report
A checklist of the nine steps with done / not needed / blocked, the new VERSION, the files you edited, and a suggested commit
message in the repo's style (`Round N item X (1.Y.Z): …`).
