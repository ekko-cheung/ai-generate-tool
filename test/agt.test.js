import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCommand } from '../src/commands/commit/command.js';
import { parseMessage } from '../src/commands/commit/prompt.js';
import { getModel } from '../src/config.js';

const BIN = fileURLToPath(new URL('../bin/agt.js', import.meta.url));
const agt = (...args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });

test('PowerShell quoting doubles single quotes', () => {
  assert.equal(buildCommand(["fix: it's $x"], 'ps'), "git commit -m 'fix: it''s $x'");
});

test('POSIX quoting escapes single quotes', () => {
  assert.equal(buildCommand(["fix: it's"], 'sh'), "git commit -m 'fix: it'\\''s'");
});

test('subject + body become two -m', () => {
  assert.equal(buildCommand(['a', 'b'], 'sh'), "git commit -m 'a' -m 'b'");
});

test('parseMessage strips fences and splits body', () => {
  assert.deepEqual(parseMessage('```\nfeat: x\n\n- y\n```'), ['feat: x', '- y']);
  assert.deepEqual(parseMessage('feat: x'), ['feat: x']);
});

test('getModel precedence: AGT_MODEL > GCG_MODEL > default', () => {
  const saved = { a: process.env.AGT_MODEL, g: process.env.GCG_MODEL };
  try {
    delete process.env.AGT_MODEL;
    delete process.env.GCG_MODEL;
    assert.equal(getModel(), 'deepseek-chat');
    process.env.GCG_MODEL = 'old';
    assert.equal(getModel(), 'old');
    process.env.AGT_MODEL = 'new';
    assert.equal(getModel(), 'new');
  } finally {
    if (saved.a === undefined) delete process.env.AGT_MODEL; else process.env.AGT_MODEL = saved.a;
    if (saved.g === undefined) delete process.env.GCG_MODEL; else process.env.GCG_MODEL = saved.g;
  }
});

test('agt --help lists commands', () => {
  const r = agt('--help');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /commit/);
  assert.match(r.stdout, /issue/);
});

test('unknown command exits 1', () => {
  const r = agt('foo');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Unknown command/);
});

test('subcommand --help works', () => {
  assert.match(agt('commit', '-h').stdout, /agt commit/);
  assert.match(agt('issue', '-h').stdout, /agt issue/);
});
