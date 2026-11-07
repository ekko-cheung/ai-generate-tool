import { parseArgs } from 'node:util';
import { input, select } from '@inquirer/prompts';
import { listRepos, listLabels, createIssue } from './gh.js';
import { generateIssue } from './generate.js';
import { getApiKey, missingKeyHelp } from '../../config.js';

export const HELP = `用法: agt issue [选项] ["自然语言描述"]

选项:
  -r, --repo <owner/name>  指定仓库(省略则从 gh repo list 中选择)
  -l, --lang <en|zh>       issue 输出语言,默认 en(自然语言会被翻译为英文)
  -y, --yes               跳过确认直接创建
  -n, --dry-run            只预览,不创建
  -h, --help               显示帮助

需要环境变量 DEEPSEEK_API_KEY,并已通过 gh auth login 登录。`;

function preview(issue) {
  console.log('\n──────── 预览 ────────');
  console.log(`类型:   ${issue.type}`);
  console.log(`Labels: ${issue.labels.length ? issue.labels.join(', ') : '(无)'}`);
  console.log(`标题:   ${issue.title}\n`);
  console.log(issue.body);
  console.log('──────────────────────\n');
}

export async function run(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      repo: { type: 'string', short: 'r' },
      yes: { type: 'boolean', short: 'y' },
      'dry-run': { type: 'boolean', short: 'n' },
      lang: { type: 'string', short: 'l', default: 'en' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) return console.log(HELP);
  const lang = values.lang.toLowerCase();
  if (!['en', 'zh'].includes(lang)) throw new Error('--lang 只支持 en 或 zh');
  if (!getApiKey()) throw new Error(missingKeyHelp());

  const text = positionals.join(' ').trim() || (await input({ message: '描述你的 issue:' })).trim();
  if (!text) throw new Error('描述不能为空');

  let repo = values.repo;
  if (!repo) {
    const repos = await listRepos();
    if (!repos.length) throw new Error('gh repo list 没有返回任何仓库,请用 --repo 指定');
    repo = await select({
      message: '选择仓库:',
      pageSize: 15,
      choices: repos.map((r) => ({
        name: r.description ? `${r.nameWithOwner} — ${r.description}` : r.nameWithOwner,
        value: r.nameWithOwner,
      })),
    });
  }

  const labels = await listLabels(repo);
  let extra;
  for (;;) {
    console.log('正在调用 DeepSeek 生成...');
    const issue = await generateIssue({ input: text, labels, extra, lang });
    preview(issue);
    if (values['dry-run']) return;

    let action = 'create';
    if (!values.yes) {
      action = await select({
        message: `在 ${repo} 创建此 issue?`,
        choices: [
          { name: '创建', value: 'create' },
          { name: '重新生成(可追加说明)', value: 'retry' },
          { name: '取消', value: 'cancel' },
        ],
      });
    }
    if (action === 'cancel') return console.log('已取消');
    if (action === 'retry') {
      extra = (await input({ message: '补充说明(可留空):' })).trim() || extra;
      continue;
    }
    const url = await createIssue({ repo, ...issue });
    console.log(`已创建: ${url}`);
    return;
  }
}
