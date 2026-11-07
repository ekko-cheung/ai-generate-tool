import { getApiKey, getModel, missingKeyHelp } from './config.js';

const API_URL = 'https://api.deepseek.com/chat/completions';

const HTTP_HINTS = {
  401: 'Invalid API key (401). Check DEEPSEEK_API_KEY.',
  402: 'Insufficient DeepSeek balance (402).',
  429: 'Rate limited (429). Try again shortly.',
};

/** Single chat completion. Returns the message content string. */
export async function chat({ system, user, json = false, model } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error(missingKeyHelp());

  const body = {
    model: model ?? getModel(),
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  if (json) body.response_format = { type: 'json_object' };

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`Network error calling DeepSeek: ${e.message}`);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(HTTP_HINTS[res.status] ?? `DeepSeek API error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error('DeepSeek returned an empty response.');
  return content;
}
