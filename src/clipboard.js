import { spawnSync } from 'node:child_process';

function pipe(cmd, args, input) {
  const r = spawnSync(cmd, args, { input });
  return !r.error && r.status === 0;
}

/** Copy text to the system clipboard. Returns true on success. */
export function copy(text) {
  switch (process.platform) {
    case 'win32':
      // clip.exe reads UTF-16LE (with BOM) correctly, keeping non-ASCII intact.
      return pipe('clip', [], Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]));
    case 'darwin':
      return pipe('pbcopy', [], text);
    default:
      return (
        pipe('wl-copy', [], text) ||
        pipe('xclip', ['-selection', 'clipboard'], text) ||
        pipe('xsel', ['--clipboard', '--input'], text)
      );
  }
}
