import { parseArgs } from 'node:util';
import readline from 'node:readline/promises';
import { getApiKey, missingKeyHelp } from '../../config.js';
import { getStagedDiff, stageAll, runCommit } from './git.js';
import { generateMessage } from './prompt.js';
import { buildCommand, defaultShell } from './command.js';
import { copy } from '../../clipboard.js';

export const HELP = `agt commit - generate a git commit command with AI (DeepSeek)

Usage: agt commit [options]
  -r, --run          run git commit directly (asks to confirm unless --yes)
  -y, --yes          skip the confirmation with --run
  -a, --all          git add -A before generating
      --lang <l>     message language: en (default) | zh
      --model <id>   DeepSeek model (default: deepseek-chat, env AGT_MODEL)
      --shell <s>    quoting style: ps | sh (default: by platform)
  -h, --help
Env: DEEPSEEK_API_KEY`;

export async function run(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      run: { type: 'boolean', short: 'r' },
      yes: { type: 'boolean', short: 'y' },
      all: { type: 'boolean', short: 'a' },
      lang: { type: 'string', default: 'en' },
      model: { type: 'string' },
      shell: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) return console.log(HELP);

  if (!getApiKey()) {
    console.error(missingKeyHelp());
    process.exit(1);
  }

  if (values.all) stageAll();
  const diff = getStagedDiff();

  console.error('Generating commit message...');
  const parts = await generateMessage(diff, { model: values.model, lang: values.lang });

  console.log('\n' + parts.join('\n\n') + '\n');

  if (values.run) {
    if (!values.yes) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
      const ans = (await rl.question('Commit with this message? [Y/n] ')).trim().toLowerCase();
      rl.close();
      if (ans && ans !== 'y' && ans !== 'yes') {
        console.error('Aborted.');
        process.exit(1);
      }
    }
    process.exit(runCommit(parts));
  }

  const cmd = buildCommand(parts, values.shell ?? defaultShell());
  console.log(cmd + '\n');
  console.error(copy(cmd) ? 'Command copied to clipboard.' : 'Could not copy to clipboard; copy the command above.');
}
