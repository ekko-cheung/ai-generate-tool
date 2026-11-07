import { chat } from '../../deepseek.js';

export function systemPrompt(lang) {
  const language = lang === 'zh' ? 'Chinese (中文)' : 'English';
  return `You write git commit messages from a diff.
Rules:
- Use Conventional Commits: type(scope): subject. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
- Subject: imperative, no trailing period, at most 72 characters.
- If useful, add a blank line then a short body (wrap meaningful points as lines starting with "- ").
- Write in ${language}. Keep the type keyword in English.
- Output ONLY the commit message. No code fences, no explanations.`;
}

/** Strip code fences / stray quotes and split into [subject, body?]. */
export function parseMessage(raw) {
  let text = raw.trim();
  text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
  const [subject, ...rest] = text.split(/\r?\n/);
  const body = rest.join('\n').trim();
  return body ? [subject.trim(), body] : [subject.trim()];
}

export async function generateMessage(diff, { model, lang }) {
  const content = await chat({
    model,
    system: systemPrompt(lang),
    user: `Write a commit message for this staged diff:\n\n${diff}`,
  });
  return parseMessage(content);
}
