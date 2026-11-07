const HELP = `agt - AI generate tool (DeepSeek)

Usage: agt <command> [options]

Commands:
  commit   generate a git commit command from the staged diff
  issue    generate a GitHub issue from a natural-language description

Run \`agt <command> --help\` for command options.
Env: DEEPSEEK_API_KEY (required), AGT_MODEL (optional, legacy GCG_MODEL also read)`;

const COMMANDS = {
  commit: () => import('./commands/commit/index.js'),
  issue: () => import('./commands/issue/index.js'),
};

/** Dispatch to a subcommand. Returns the process exit code. */
export async function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
    console.log(HELP);
    return 0;
  }
  const load = Object.hasOwn(COMMANDS, cmd) ? COMMANDS[cmd] : null;
  if (!load) {
    console.error(`Unknown command: ${cmd}\n\n${HELP}`);
    return 1;
  }
  try {
    await (await load()).run(rest);
    return 0;
  } catch (e) {
    if (e?.name === 'ExitPromptError') return 130;
    console.error(`Error: ${e.message}`);
    return 1;
  }
}
