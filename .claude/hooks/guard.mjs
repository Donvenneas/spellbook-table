// PreToolUse guard for Claude Code (see .claude/settings.json).
// Enforces two hard rules from CLAUDE.md before a tool runs:
//   1. Never read, edit or ship data/ (private browser profile, deck library, image cache).
//   2. Never use or launch Microsoft Edge.
// Exit code 2 blocks the tool call and shows the message to Claude; exit 0 lets it run.
import path from 'node:path';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw); } catch { process.exit(0); }

const tool = input.tool_name || '';
const args = input.tool_input || {};
const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());
const cwd = path.resolve(input.cwd || root);

function block(msg) {
  process.stderr.write(msg + '\n');
  process.exit(2);
}

function inData(p) {
  if (typeof p !== 'string' || !p) return false;
  const rel = path.relative(root, path.resolve(cwd, p));
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
  const first = rel.split(/[\\/]/)[0];
  return first.toLowerCase() === 'data';
}

const DATA_MSG = 'Blocked by .claude/hooks/guard.mjs: data/ is private (browser profile, deck library, image cache). ' +
  'CLAUDE.md: never read for sharing, commit or ship data/. Work without it, or ask the user to look themselves.';

if (['Read', 'Edit', 'Write', 'NotebookEdit', 'MultiEdit'].includes(tool)) {
  if (inData(args.file_path) || inData(args.notebook_path)) block(DATA_MSG);
}
if (tool === 'Glob' || tool === 'Grep') {
  if (inData(args.path)) block(DATA_MSG);
  if (typeof args.pattern === 'string' && tool === 'Glob' && /^(\.[\\/])?data[\\/]/i.test(args.pattern)) block(DATA_MSG);
}

if (tool === 'Bash' || tool === 'PowerShell') {
  const cmd = String(args.command || '');
  // Launching it: the msedge executable, the microsoft-edge: link, or Start-Process ... edge. Plain mentions in text pass.
  if (/msedge|microsoft-edge:|\bedge\.exe\b|\bStart-Process\b[^;|&\n]*\bedge\b/i.test(cmd)) {
    block('Blocked by .claude/hooks/guard.mjs: CLAUDE.md says never use or launch Microsoft Edge. ' +
      'Use the built-in browser pane, or Chrome/Firefox for tests/browsers.mjs.');
  }
  // A path token that starts at the project's data folder: data/x, ./data/x, "data\x"
  if (/(^|[\s"'=(;|&])(\.[\\/])?data[\\/]/i.test(cmd)) block(DATA_MSG);
  const absData = (root + path.sep + 'data' + path.sep).toLowerCase();
  const norm = cmd.replace(/\//g, path.sep).toLowerCase();
  if (norm.includes(absData)) block(DATA_MSG);
}

process.exit(0);
