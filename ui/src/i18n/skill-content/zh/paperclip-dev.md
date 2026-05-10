# Paperclip Dev

本技能涵盖开发与运维一个本地 Paperclip 实例的日常工作流。它假定你工作在 Paperclip 仓库的 checkout 中,且 `origin` 指向 `git@github.com:paperclipai/paperclip.git`。

> **开源卫生:** 本仓库面向公众。把任何推到 `origin` 的内容当作可发布的内容。**永远不要**提交或推送密钥、API key、token、私有日志、PII、客户数据,或那些应当保密的本地配置。git 历史也要保持整洁:避免推送一次性分支、噪声 checkpoint 提交,或不需要上游共享的探索性工作。

> **强制要求:** 在跑任何 CLI 命令、构建、测试或管理 worktree 之前,你**必须**先读 Paperclip 仓库里的 `doc/DEVELOPING.md`。它是所有 `paperclipai` CLI 命令、它们的选项、构建/测试工作流、数据库操作、worktree 管理与诊断的权威参考。**不要**猜测 flag 或选项 —— 先读文档。

## 常用命令速查

下面是最常用的命令。完整选项表与细节见 `doc/DEVELOPING.md`。

| 任务 | 命令 |
|------|---------|
| 启动 server (首次或常规) | `npx paperclipai run` |
| 带热更新的开发模式 | `pnpm dev` |
| 停止开发服务器 | `pnpm dev:stop` |
| 构建 | `pnpm build` |
| 类型检查 | `pnpm typecheck` |
| 跑测试 | `pnpm test` |
| 跑迁移 | `pnpm db:migrate` |
| 重新生成 Drizzle 客户端 | `pnpm db:generate` |
| 备份数据库 | `npx paperclipai db:backup` |
| 健康检查 | `npx paperclipai doctor --repair` |
| 打印环境变量 | `npx paperclipai env` |
| 触发 agent 心跳 | `npx paperclipai heartbeat run --agent-id <id>` |
| 本地安装 agent 技能 | `npx paperclipai agent local-cli <agent> --company-id <id>` |

## 从 master 拉取更新

```bash
git fetch origin && git pull origin master
pnpm install && pnpm build
```

如果 schema 有变更,再跑一遍 `pnpm db:generate && pnpm db:migrate`。

## Worktree

Paperclip worktree 把 git worktree 与隔离的 Paperclip 实例结合 —— 每个 worktree 有自己的数据库、server 端口、以及从主实例 seed 的环境。

> **强制要求:** 在创建或管理 worktree 之前,你**必须**先读 `doc/DEVELOPING.md` 中的 "Worktree-local Instances" 与 "Worktree CLI Reference" 章节。那是所有 worktree 命令、选项、seed 模式与环境变量的权威参考。

### 何时使用 worktree

- 启动一个需要独立 Paperclip 环境的 feature 分支
- 跑并行 agent 工作而不污染主实例
- 在合并前隔离测试 Paperclip 改动

### 命令概览

CLI 分两层(完整选项表见 `doc/DEVELOPING.md`):

| 命令 | 用途 |
|---------|---------|
| `worktree:make <name>` | 一步创建 worktree + 隔离实例 |
| `worktree:list` | 列出 worktree 与它们的 Paperclip 状态 |
| `worktree:merge-history` | 预览/导入 worktree 之间的 issue 历史 |
| `worktree:cleanup <name>` | 移除 worktree、分支、实例数据 |
| `worktree init` | 在已有 worktree 中引导实例 |
| `worktree env` | 打印 worktree 实例的 shell exports |
| `worktree reseed` | 用另一个实例刷新 worktree DB |
| `worktree repair` | 修复损坏 / 缺失的 worktree 实例元数据 |

### 典型工作流

```bash
# 1. 为 feature 创建 worktree
npx paperclipai worktree:make my-feature --start-point origin/main

# 2. 进入 worktree (worktree:make 会打印路径) 并 source 环境
cd <worktree-path>
eval "$(npx paperclipai worktree env)"

# 3. 启动隔离的 Paperclip 服务器
npx paperclipai run

# 4. 干你的活

# 5. 完成后,如果需要,把 issue 历史合回去
npx paperclipai worktree:merge-history --from paperclip-my-feature --to current --apply

# 6. 清理
npx paperclipai worktree:cleanup my-feature
```

## Forks —— 优先推到用户 fork

如果用户配置了一个指向 `paperclipai/paperclip` 个人 fork 的 git remote,把你的 feature 分支推到**那个 fork**,而不是在主仓库上直接建分支。这样上游分支列表保持干净,也符合标准的开源贡献流程。

### 检测 fork remote

推送或创建 PR 之前,列出 remote,找一个指向非 `paperclipai` GitHub fork 的:

```bash
git remote -v
```

把任何 URL 指向 `github.com:<user>/paperclip` (或 `github.com/<user>/paperclip.git`) 的 remote 当作用户的 fork。常见名字是 `fork`、`<username>`、`myfork`。指向 `paperclipai/paperclip` 的 `origin` 或 `upstream` 是权威上游 —— 如果存在 fork,**不要**把 feature 分支推到那里。

### 推到 fork

```bash
# 把当前分支推到用户 fork 并设置 upstream
git push -u <fork-remote> HEAD
```

然后从 fork 分支创建 PR:

```bash
gh pr create --repo paperclipai/paperclip --head <fork-owner>:<branch-name> ...
```

当你站在跟踪 fork 的分支上跑 `gh pr create` 时,它通常能自动判断 head ref;`--head <owner>:<branch>` 显式形式是兜底的可靠写法。

### 没有 fork 的情况

如果 `git remote -v` 只显示 `paperclipai/paperclip` 的 remote (没有用户 fork),回退到把分支推到 `origin`。**不要**替用户创建 fork —— 先问。

### 让 fork 与上游保持同步

指向 `paperclipai/paperclip` 的权威 remote,根据用户的仓库设置可能叫 `origin` **也可能**叫 `upstream`。用上面"检测 fork remote"步骤里同样的方法找出它,然后从那个 remote fetch 并 push,这样在两种约定下都能工作:

```bash
UPSTREAM_REMOTE=$(git remote -v | awk '/paperclipai\/paperclip.*\(fetch\)/{print $1; exit}')
git fetch "$UPSTREAM_REMOTE"
git push <fork-remote> "${UPSTREAM_REMOTE}/master:master"
```

## Pull Request

> **必读前置:** 创建任何 PR 之前,你**必须**先读下面列出的权威源文件。**不要**在你读过这些文件、并核对过 PR body 中每个必需小节都齐全之前,跑 `gh pr create`。

### 第 1 步 —— 读权威文件

创建 PR 之前必须读完这三份文件:

1. **`.github/PULL_REQUEST_TEMPLATE.md`** —— 必需的 PR body 结构
2. **`CONTRIBUTING.md`** —— 贡献约定、PR 要求、思考路径示例
3. **`.github/workflows/pr.yml`** —— 把守合并的 CI 检查

### 第 2 步 —— 用清单核对你的 PR body

读完模板之后,核对你的 `--body` 是否包含下列每一节(名字必须**完全一致**):

- [ ] `## Thinking Path` —— 引用块格式,5–8 步推理
- [ ] `## What Changed` —— 具体改动的项目列表
- [ ] `## Verification` —— reviewer 怎么验证它工作
- [ ] `## Risks` —— 可能出错的地方
- [ ] `## Model Used` —— provider、model ID、版本、能力
- [ ] `## Checklist` —— 从模板复制,勾选项

任何小节缺失或为空,**不要**提交 PR。回去补全。

### 第 3 步 —— 创建 PR

只有完成第 1、2 步之后,跑 `gh pr create`。把模板内容作为 `--body` 的结构 —— **不要**写自由格式的总结。

## 硬规则 —— 不可绕过

这些规则之所以存在,是因为 agent 在 CLI 失败时即兴发挥造成过真实损失。**严格**遵守。

1. **CLI 是 worktree 与数据库的唯一接口。** 所有 worktree 与数据库操作**必须**走 `npx paperclipai` / `pnpm paperclipai` 命令。**绝不**:
   - 跑 `pg_dump`、`pg_restore`、`psql`、`createdb`、`dropdb` 或任何裸 postgres 命令
   - 手动设置 `DATABASE_URL` 让 worktree server 指向另一个实例的数据库
   - 对任何 `.paperclip/`、`.paperclip-worktrees/` 或 `db/` 目录跑 `rm -rf`
   - 直接操作内嵌 postgres 数据目录
   - 通过 PID 杀 postgres 进程

2. **CLI 命令失败时,停下并报告。** **不要**尝试绕过。如果 `worktree:make`、`worktree reseed`、`worktree init`、`worktree:cleanup` 或任何其他 `paperclipai` 命令失败:
   - 在你的任务评论里报告**精确**的错误信息
   - 把任务设置为 `blocked`
   - 建议跑 `npx paperclipai doctor --repair` 或者从头重建 worktree
   - **不要**手动复刻 CLI 的行为

3. **永远不要在实例之间共享数据库。** 每个 worktree 实例都有自己的隔离数据库。永远不要把 `DATABASE_URL` 改成指向另一个实例的数据库。这会摧毁隔离性,还可能污染生产数据。

4. **在 worktree 启动开发服务器之前需要先准备好。** 正确顺序是:
   ```bash
   # 如果 worktree 已存在,但没有运行实例:
   cd <worktree-path>
   eval "$(npx paperclipai worktree env)"
   pnpm install && pnpm build
   npx paperclipai run          # 或 pnpm dev

   # 如果 worktree 需要全新数据库:
   npx paperclipai worktree reseed --seed-mode full

   # 如果 worktree 已经无可挽救:
   npx paperclipai worktree:cleanup <name>
   npx paperclipai worktree:make <name> --seed-mode full
   ```
   任何一步失败,遵循规则 2 —— 停下并报告。

5. **Seeding 是 CLI 操作。** 当被要求从主实例 seed 一个 worktree 数据库时,用 `worktree reseed`,或者用 `worktree:make --seed-mode full` 重建。完整选项表见 `doc/DEVELOPING.md`。**永远不要**尝试手动复制数据库。

## 持久开发服务器(用于人工测试)

当 agent 需要启动一个**活过当前心跳**的开发服务器 —— 比如让人或 QA agent 手动测试 —— 进程**必须**在 detached session 里启动。一个直接从心跳 shell 启动的进程,会在心跳退出时被杀。

### 用 `tmux` 启动持久服务器

```bash
# 1. cd 进 worktree (或主仓库) 并 source 环境
cd <worktree-path>
eval "$(npx paperclipai worktree env)"   # 主实例上跳过这一步

# 2. 在带名字的 detached tmux session 里启动开发服务器
tmux new-session -d -s <session-name> 'pnpm dev'

# 名字应当具有描述性:
tmux new-session -d -s auth-fix-3102 'pnpm dev'
```

### 管理 session

| 任务 | 命令 |
|------|---------|
| 查 session 是否还活着 | `tmux has-session -t <session-name> 2>/dev/null && echo running` |
| 查看服务器输出 | `tmux capture-pane -t <session-name> -p` |
| 杀掉 session | `tmux kill-session -t <session-name>` |
| 列出所有 tmux session | `tmux list-sessions` |

### 验证服务器可达

启动之后,**报告"成功"之前**先确认端口正在监听:

```bash
# 等启动一会儿,然后验证
sleep 3
curl -sf http://127.0.0.1:<port>/api/health && echo "Server is up"
lsof -nP -iTCP:<port> -sTCP:LISTEN
```

### 关键规则

1. **总是用 `tmux` (或等价工具)**,当开发服务器需要在心跳结束之后继续运行时。直接从 agent shell 启动的服务器,即使刚刚看上去健康,心跳一退也会死。
2. **命名要具有描述性** —— 包含 worktree 名和端口(例如 `auth-fix-3102`)。
3. 在向任何人**报告 URL 之前**,先验证服务器在监听。
4. **不要**只用 `nohup` 或 `&` —— 对于可能整组进程被杀的 agent shell,它们不可靠。
5. **完成后清理** —— 测试结束时杀掉 tmux session。

## 常见错误

| 错误 | 修复 |
|---------|-----|
| Server 启不起来 | 跑 `npx paperclipai doctor --repair` 自动诊断与修复 |
| 忘了 source worktree env | cd 进 worktree 后跑 `eval "$(npx paperclipai worktree env)"` |
| pull 后依赖过期 | pull 完跑 `pnpm install && pnpm build` |
| pull 后 schema 过期 | 跑 `pnpm db:generate && pnpm db:migrate` |
| 在目标 DB 还运行时 reseed | 先停目标 server,或用 `--allow-live-target` |
| 清理时还有未合并的 commit | 先合并或推送,或者明知故犯地用 `--force` |
| 把 agent 跑在错误的实例上 | 确认 `PAPERCLIP_API_URL` 指向正确的端口 |
| CLI 命令失败 | **不要**绕过 —— 报告错误并 block (见上面"硬规则") |
| Agent 尝试手动 postgres 操作 | **永远不要** —— 所有 DB 操作走 CLI (见上面"硬规则") |
| 心跳之间开发服务器死了 | 在 detached `tmux` session 里启动 —— 见上面"持久开发服务器" |
| 在有 fork 的情况下把分支推到了 `paperclipai/paperclip` | 推到用户的 fork remote —— 见上面 "Forks" |
