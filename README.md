# ai-generate-tool (`agt`)

用 DeepSeek 生成 git commit 与 GitHub issue 的命令行工具(由 `git-commit-generate` 与 `issue-cli` 合并而来)。

## 安装
```powershell
pnpm install
pnpm link --global
setx DEEPSEEK_API_KEY "sk-..."    # 然后重开终端
```

## 子命令

### `agt commit` — 由暂存区 diff 生成 commit 命令
```
git add .
agt commit            # 打印并复制 `git commit -m '...'`,粘贴执行
agt commit --run      # 直接提交(会确认);加 -y 跳过确认
agt commit -a         # 先 git add -A
agt commit --lang zh  # 中文
```
选项:`-r/--run`、`-y/--yes`、`-a/--all`、`--lang <en|zh>`、`--model <id>`、`--shell <ps|sh>`。

### `agt issue` — 由自然语言生成 GitHub issue(通过 `gh` 创建)
```
agt issue "登录页在 Safari 下按钮点不了"
agt issue -r owner/name --dry-run "希望支持导出 CSV"
```
默认把输入翻译为英文;`--lang zh` 输出中文。
选项:`-r/--repo`、`-l/--lang <en|zh>`、`-y/--yes`、`-n/--dry-run`。需要已安装并登录 `gh`。

## 环境变量
- `DEEPSEEK_API_KEY`(必需)
- `AGT_MODEL`(可选,默认 `deepseek-chat`;兼容旧的 `GCG_MODEL`)

## 测试
```
pnpm test
```
