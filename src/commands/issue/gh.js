import { execFile } from 'node:child_process';

function run(args, input) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'gh',
      args,
      { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8', shell: false },
      (err, stdout, stderr) => {
        if (err) {
          if (err.code === 'ENOENT') {
            return reject(new Error('未找到 gh 命令,请先安装 GitHub CLI 并执行 gh auth login'));
          }
          return reject(new Error(`gh ${args.slice(0, 2).join(' ')} 失败: ${(stderr || err.message).trim()}`));
        }
        resolve(stdout);
      },
    );
    if (input !== undefined) child.stdin.end(input, 'utf8');
  });
}

export async function listRepos() {
  const out = await run(['repo', 'list', '--json', 'nameWithOwner,description', '--limit', '100']);
  return JSON.parse(out);
}

export async function listLabels(repo) {
  const out = await run(['label', 'list', '-R', repo, '--json', 'name,description', '--limit', '200']);
  return JSON.parse(out);
}

export async function createIssue({ repo, title, body, labels = [] }) {
  const args = ['issue', 'create', '-R', repo, '--title', title, '--body-file', '-'];
  for (const l of labels) args.push('--label', l);
  return (await run(args, body)).trim();
}
