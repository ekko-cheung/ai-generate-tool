import { chat } from '../../deepseek.js';

export const TYPES = ['bug', 'feature', 'docs', 'question', 'chore'];

// Preferred repo label names for each issue type (first existing one wins).
export const TYPE_LABELS = {
  bug: ['bug'],
  feature: ['enhancement', 'feature'],
  docs: ['documentation', 'docs'],
  question: ['question'],
  chore: ['chore', 'maintenance'],
};

function systemPrompt(labels, lang) {
  const labelList = labels.length
    ? labels.map((l) => `- ${l.name}${l.description ? `: ${l.description}` : ''}`).join('\n')
    : '(该仓库没有任何 label)';
  return `你是一个帮助开发者撰写 GitHub issue 的助手。根据用户的自然语言描述,输出一个 JSON 对象,字段如下:
{
  "type": "${TYPES.join(' | ')}",
  "title": "简洁明确的标题,不超过 80 字符,不要带类型前缀",
  "body": "Markdown 正文",
  "labels": ["仅从下方可用 label 中选择,可为空数组"]
}
要求:
- type 说明: bug=缺陷, feature=新功能/改进, docs=文档, question=提问, chore=杂务/重构/依赖等。
- body 按类型组织: bug 包含「问题描述 / 复现步骤 / 期望行为 / 实际行为 / 环境」;feature 包含「背景 / 期望的方案 / 备选方案」;其他类型简明描述即可。
- 不要编造用户未提供的具体事实(版本号、报错信息等);信息缺失时写「待补充」。
- ${lang === 'zh' ? 'title 和 body 一律使用中文(必要时将用户输入翻译为中文,代码、命令、报错原文保持不变)。' : 'title 和 body 一律使用英文(无论用户输入是什么语言,都要翻译为自然、准确的英文;代码、命令、报错原文保持不变)。'}
- 只输出 JSON。

可用 label:
${labelList}`;
}

async function callOnce(system, user) {
  const content = await chat({ system, user, json: true });
  const parsed = JSON.parse(content);
  if (typeof parsed.title !== 'string' || !parsed.title.trim() || typeof parsed.body !== 'string') {
    throw new Error('模型返回缺少 title/body');
  }
  return parsed;
}

export async function generateIssue({ input, labels, extra, lang = 'en' }) {
  const user = extra ? `${input}\n\n补充说明: ${extra}` : input;
  const system = systemPrompt(labels, lang);
  let parsed;
  try {
    parsed = await callOnce(system, user);
  } catch (e) {
    if (e instanceof SyntaxError || e.message.startsWith('模型返回')) parsed = await callOnce(system, user);
    else throw e;
  }

  const existing = new Map(labels.map((l) => [l.name.toLowerCase(), l.name]));
  const type = TYPES.includes(parsed.type) ? parsed.type : 'chore';
  const chosen = new Set();
  for (const l of Array.isArray(parsed.labels) ? parsed.labels : []) {
    const real = existing.get(String(l).toLowerCase());
    if (real) chosen.add(real);
  }
  // Map type -> an existing repo label if none picked yet.
  const hasTypeLabel = (TYPE_LABELS[type] || []).some((n) => chosen.has(existing.get(n)));
  if (!hasTypeLabel) {
    const real = (TYPE_LABELS[type] || []).map((n) => existing.get(n)).find(Boolean);
    if (real) chosen.add(real);
  }
  return { type, title: parsed.title.trim(), body: parsed.body, labels: [...chosen] };
}
