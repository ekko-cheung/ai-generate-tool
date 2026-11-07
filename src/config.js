export const ENV_NAME = 'DEEPSEEK_API_KEY';

export function getApiKey() {
  const key = process.env[ENV_NAME]?.trim();
  return key || null;
}

/** AGT_MODEL > GCG_MODEL (legacy) > deepseek-chat */
export function getModel() {
  return process.env.AGT_MODEL?.trim() || process.env.GCG_MODEL?.trim() || 'deepseek-chat';
}

export function missingKeyHelp() {
  return `${ENV_NAME} is not set.
Get a key at https://platform.deepseek.com/api_keys then set it:

  PowerShell (persistent): setx ${ENV_NAME} "sk-..."   (then reopen the terminal)
  PowerShell (session):    $env:${ENV_NAME}="sk-..."
  bash/zsh:                export ${ENV_NAME}=sk-...`;
}
