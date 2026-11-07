export function defaultShell() {
  return process.platform === 'win32' ? 'ps' : 'sh';
}

export function quote(s, shell) {
  if (shell === 'ps') return `'${s.replaceAll("'", "''")}'`;
  return `'${s.replaceAll("'", "'\\''")}'`;
}

/** parts: [subject, body?] -> full `git commit` command string. */
export function buildCommand(parts, shell = defaultShell()) {
  return ['git commit', ...parts.map((p) => `-m ${quote(p, shell)}`)].join(' ');
}
