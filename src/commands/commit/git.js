import { spawnSync } from 'node:child_process';

const MAX_DIFF = 30000;

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`Failed to run git: ${r.error.message}`);
  return r;
}

export function stageAll() {
  const r = git(['add', '-A']);
  if (r.status !== 0) throw new Error(r.stderr.trim() || 'git add -A failed');
}

/** Returns the staged diff (stat + patch), truncated if huge. Throws friendly errors. */
export function getStagedDiff() {
  const inside = git(['rev-parse', '--is-inside-work-tree']);
  if (inside.status !== 0) throw new Error('Not inside a git repository.');

  const diff = git(['diff', '--staged']);
  if (diff.status !== 0) throw new Error(diff.stderr.trim() || 'git diff failed');
  if (!diff.stdout.trim()) {
    throw new Error('No staged changes. Run `git add <files>` first (or use `agt commit --all`).');
  }
  const stat = git(['diff', '--staged', '--stat']).stdout;
  let patch = diff.stdout;
  if (patch.length > MAX_DIFF) {
    patch = patch.slice(0, MAX_DIFF) + '\n\n[... diff truncated ...]';
  }
  return `${stat}\n${patch}`;
}

/** Run `git commit` with the message parts as separate -m args (no shell quoting). */
export function runCommit(parts) {
  const args = ['commit', ...parts.flatMap((p) => ['-m', p])];
  const r = spawnSync('git', args, { stdio: 'inherit' });
  return r.status ?? 1;
}
