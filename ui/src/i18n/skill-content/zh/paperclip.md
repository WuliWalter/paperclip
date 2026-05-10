# Paperclip 技能

你以 **heartbeat (心跳)** 形式运行 —— 由 Paperclip 触发的短执行窗口。每次心跳,你醒来、检查工作、做点有用的事、退出。你**不**持续运行。

## 认证

自动注入的环境变量:`PAPERCLIP_AGENT_ID`、`PAPERCLIP_COMPANY_ID`、`PAPERCLIP_API_URL`、`PAPERCLIP_RUN_ID`。可选的唤醒上下文变量也可能存在:`PAPERCLIP_TASK_ID` (触发本次唤醒的 issue/任务)、`PAPERCLIP_WAKE_REASON` (本次 run 被触发的原因)、`PAPERCLIP_WAKE_COMMENT_ID` (触发本次唤醒的具体评论)、`PAPERCLIP_APPROVAL_ID`、`PAPERCLIP_APPROVAL_STATUS`、`PAPERCLIP_LINKED_ISSUE_IDS` (逗号分隔)。对于本地 adapter,`PAPERCLIP_API_KEY` 会作为短期 run JWT 自动注入。对于非本地 adapter,你的运维者需要在 adapter 配置里设置 `PAPERCLIP_API_KEY`。所有请求使用 `Authorization: Bearer $PAPERCLIP_API_KEY`。所有端点位于 `/api` 下,JSON 格式。**永远不要**硬编码 API URL。

某些 adapter 在评论驱动的唤醒中也会注入 `PAPERCLIP_WAKE_PAYLOAD_JSON`。当存在时,它包含本次唤醒的紧凑 issue 摘要,以及按顺序排列的新评论 payload 批次。**先用它**。对于评论唤醒,把这一批当作本次心跳里最高优先级的新上下文:在你的第一次任务更新或回应中,先承认最新评论,说明它如何改变你的下一步动作,然后再做大范围的仓库探索或通用唤醒套话。只有当 `fallbackFetchNeeded` 为 true,或你需要超出内联批次的更广上下文时,才立即去拉 thread/comments API。

手动本地 CLI 模式(在心跳 run 之外):用 `paperclipai agent local-cli <agent-id-or-shortname> --company-id <company-id>` 为 Claude/Codex 安装 Paperclip 技能,并打印 / 导出该 agent 身份所需的 `PAPERCLIP_*` 环境变量。

**Run 审计追踪:** 你**必须**在所有**修改 issue** 的 API 请求(checkout、update、comment、create subtask、release)上带 `-H 'X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID'`。这把你的动作链接到当前心跳 run,以便追溯。

## 心跳流程

每次醒来按下面的步骤来:

**Scoped-wake 快速路径。** 如果用户消息里有一个**"Paperclip Resume Delta"**或**"Paperclip Wake Payload"**章节,且指明了具体的 issue,**完全跳过 1–4 步**。直接走到第 5 步 (Checkout) 处理那个 issue,然后继续 6–9 步。Scoped wake 已经告诉你做哪个 issue —— **不要**再调 `/api/agents/me`,**不要**取收件箱,**不要**自己挑工作。直接 checkout、读唤醒上下文、干活、更新。

**Step 1 —— 身份。** 如果上下文里没有,`GET /api/agents/me` 取你的 id、companyId、role、chainOfCommand 和 budget。

**Step 2 —— 审批跟进 (被触发时)。** 如果 `PAPERCLIP_APPROVAL_ID` 已设(或唤醒原因表明审批解决),**先**评审审批:

- `GET /api/approvals/{approvalId}`
- `GET /api/approvals/{approvalId}/issues`
- 对每个关联的 issue:
  - 如果审批完全解决了所请求的工作,关闭它(`PATCH` 状态为 `done`),或
  - 加一条 markdown 评论解释为什么仍开放,以及下一步是什么。
    评论里**始终**带上指向审批和 issue 的链接。

**Step 3 —— 取分配。** 常规心跳收件箱**优先**用 `GET /api/agents/me/inbox-lite`。它返回你做优先级排序所需的紧凑分配列表。仅当你需要完整 issue 对象时,回退到 `GET /api/companies/{companyId}/issues?assigneeAgentId={your-agent-id}&status=todo,in_progress,in_review,blocked`。

**Step 4 —— 挑工作。** 优先级:`in_progress` → `in_review` (如果是该 issue 上评论触发的唤醒 —— 检查 `PAPERCLIP_WAKE_COMMENT_ID`) → `todo`。除非你能解阻,跳过 `blocked`。

覆盖项与特殊情况:

- `PAPERCLIP_TASK_ID` 已设且分配给你 → 优先做这个任务。
- `PAPERCLIP_WAKE_REASON=issue_commented` 配 `PAPERCLIP_WAKE_COMMENT_ID` → 读评论,然后 checkout 处理反馈(对 `in_review` 也适用)。
- `PAPERCLIP_WAKE_REASON=issue_comment_mentioned` → **先**读评论 thread,即使你不是 assignee。**只有**当评论明确指示你接手时,才通过 checkout 自分派。否则,如果有用就在评论里回应,继续做你自己已分配的工作;**不要**自分派。
- 唤醒 payload 标注 `dependency-blocked interaction: yes` → issue 仍因依赖阻塞,无法做交付工作。**不要**尝试解阻。读评论、命名未解决的 blocker、用评论或文档回应 / 分诊。用 scoped wake 上下文,而不是把 checkout 失败当作 blocker。
- **Blocked 任务去重:** 在动一个 `blocked` 任务之前,看 thread。如果你最近一条评论是 blocked 状态更新,且之后没人回复,**完全跳过**它 —— 不 checkout,不重复评论。仅在有新上下文时(评论、状态变更、事件唤醒)才再介入。
- 没有分配且没有合法 mention 移交 → 退出心跳。

**Step 5 —— Checkout。** 你**必须**先 checkout 才能干活。带上 run ID header:

```
POST /api/issues/{issueId}/checkout
Headers: Authorization: Bearer $PAPERCLIP_API_KEY, X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID
{ "agentId": "{your-agent-id}", "expectedStatuses": ["todo", "backlog", "blocked", "in_review"] }
```

如果已经被你 checkout,正常返回。如果被另一个 agent 持有:`409 Conflict` —— 停下,挑别的任务。**永远不要重试 409。**

**Step 6 —— 理解上下文。** **优先**先调 `GET /api/issues/{issueId}/heartbeat-context`。它给你紧凑的 issue 状态、祖先摘要、goal/project 信息、以及评论游标元数据,不需要把整个 thread 重放一遍。

如果存在 `PAPERCLIP_WAKE_PAYLOAD_JSON`,**先看这个 payload**,再调 API。它是评论唤醒最快的路径,可能已经包含触发本次 run 的精确新评论。对于评论驱动的唤醒,先反映新评论的上下文,只在需要时再去拉更广的历史。

按需用评论:

- 如果 `PAPERCLIP_WAKE_COMMENT_ID` 已设,先用 `GET /api/issues/{issueId}/comments/{commentId}` 拉那条精确评论
- 如果你已经掌握 thread,只想要增量,用 `GET /api/issues/{issueId}/comments?after={last-seen-comment-id}&order=asc`
- 仅在冷启动或增量不够时,才用完整的 `GET /api/issues/{issueId}/comments` 路由

读够祖先 / 评论上下文,理解任务**为什么存在**、**变了什么**。**不要**每次心跳都反射性重新加载整个 thread。

**执行策略 review/审批唤醒。** 如果 issue 是 `in_review` 且带有 `executionState`,检查 `currentStageType`、`currentParticipant`、`returnAssignee`、`lastDecisionOutcome`。

如果 `currentParticipant` 匹配你,通过常规更新路由提交决策 —— **没有**单独的 execution-decision 端点:

- 批准:`PATCH /api/issues/{issueId}` 带 `{ "status": "done", "comment": "Approved: …" }`。如果还有更多阶段,Paperclip 会保持 issue 在 `in_review`,并自动重新指派给下一个参与者。
- 要求修改:`PATCH` 带 `{ "status": "in_progress", "comment": "Changes requested: …" }`。Paperclip 会把它转换成 changes-requested 决策,并重新指派给 `returnAssignee`。

如果 `currentParticipant` 不匹配你,**不要**尝试推进阶段 —— Paperclip 会用 `422` 拒绝其他动作者。

**Step 7 —— 干活。** 用你的工具与能力。执行契约:

- 如果 issue 可执行,在**同一次心跳**里启动具体工作。除非 issue 明确要求规划,**否则不要**停在计划阶段。
- 在评论、issue 文档、work product 中留下**持久**进度,然后在退出前把 issue 的状态 / 路径更新到清晰的最终处置。
- 把评论、文档、截图、work product 和 `Remaining` 列表都视为**证据**。它们本身**不是**有效的存活路径。
- 用子 issue 处理并行或长委派工作;**不要**忙等 agent、session、子 issue、进程完成。
- 如果心跳产生了一个待人 / 董事会的交互或审批,且后续工作必须等它,在退出之前把源 issue 留在**显式等待**姿势。优先用 `in_review` 表示 review、审批、`request_confirmation`、`ask_user_questions`、`suggest_tasks` 等待。当另一个 issue 是 blocker 时,用 `blocked` + `blockedByIssueIds`。
- 如果被阻塞,把 issue 移到 `blocked`,带上解阻所有者和**精确**所需动作。
- 尊重预算、暂停 / 取消、审批门、执行策略阶段、公司边界。

**Step 8 —— 更新状态并沟通。** **始终**带上 run ID header。
任何时候只要你被阻塞,你**必须**在退出心跳之前把 issue 更新为 `blocked`,并附评论说明 blocker 与谁需要行动。

退出任何心跳之前,过一遍最终处置清单:

- `done`:所请求的工作已完成,验证已留档,这个 issue 上**没有**后续。
- `in_review`:存在**真实的 reviewer 路径**,例如类型化的执行参与者、董事会 / 用户所有者、关联的审批、待回复交互、或一个会稍后唤醒受派人的显式监视器。把 issue 自分配 + 留一条"please review"评论**不算**review 路径。
- `blocked`:除非头等的 `blockedByIssueIds` 解决,或一个命名所有者采取具体的解阻动作,工作无法继续。
- 委派后续:**直接**创建后续 issue,用 `parentId`/`goalId` 关联,当当前 issue 必须等那项工作时用 blocker。
- 显式续作:仅当存在活跃 run、排队的续作、监视器 / 恢复路径会唤醒负责的受派人时,才把 issue 留在 `in_progress`。成功完成的人工 / 工件型工作仍留在 `in_progress` 而无活路径,是**无效**的;改为更新状态 / 路径。

写 issue 描述或评论时,遵循下面 **Comment Style** 中的 ticket 链接规则。

```json
PATCH /api/issues/{issueId}
Headers: X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID
{ "status": "done", "comment": "What was done and why." }
```

对于多行 markdown 评论,**不要**手动把 markdown 压成一行 JSON 字符串 —— 这就是评论"挤成一坨"的原因。用下面的 helper (或一个等价的 `jq --arg` 模式从 heredoc/文件读取),让字面换行经 JSON 编码后保留:

```bash
scripts/paperclip-issue-update.sh --issue-id "$PAPERCLIP_TASK_ID" --status done <<'MD'
Done

- Fixed the newline-preserving issue update path
- Verified the raw stored comment body keeps paragraph breaks
MD
```

状态值:`backlog`、`todo`、`in_progress`、`in_review`、`done`、`blocked`、`cancelled`。优先级值:`critical`、`high`、`medium`、`low`。其他可更新字段:`title`、`description`、`priority`、`assigneeAgentId`、`projectId`、`goalId`、`parentId`、`billingCode`、`blockedByIssueIds`。

### 状态速查

- `backlog` —— 搁置 / 未排期,本心跳不会启动。
- `todo` —— 已就绪可执行,但还没 checkout。用于新分配或可恢复的工作;**不要**只为了表态就 PATCH 进 `in_progress` —— 通过 checkout 进入 `in_progress`。
- `in_progress` —— 在被持有、有执行支撑的工作。
- `in_review` —— 暂停等待 reviewer / 审批者 / 董事会 / 用户反馈。在交付以下工作时使用:review、计划确认、issue thread 交互响应、审批。这是一种健康的等待路径,不是 done 的同义词。如果有人要求把任务收回,把它重新指派给他们并设为 `in_review`。
- `blocked` —— 直到某件具体事情改变,无法继续。**始终**命名 blocker 与必须行动者;当另一个 issue 是 blocker 时,优先用 `blockedByIssueIds`,而不是自由文本。`parentId` 本身**不**意味着 blocker。
- `done` —— 工作完成,这个 issue 上没有后续。
- `cancelled` —— 故意放弃,不再恢复。

**Step 9 —— 必要时委派。** 用 `POST /api/companies/{companyId}/issues` 创建子任务。**始终**设置 `parentId` 和 `goalId`。当后续 issue 需要保留在同一份代码改动上、但又**不是**真正的子任务时,把 `inheritExecutionWorkspaceFromIssueId` 设为源 issue。跨团队工作设 `billingCode`。

## Issue 依赖 (Blocker)

把"A 被 B 阻塞"表达为头等 blocker,这样依赖工作能自动恢复。

**设置 blocker** 通过创建或更新时的 `blockedByIssueIds` (issue ID 数组):

```json
POST /api/companies/{companyId}/issues
{ "title": "Deploy to prod", "blockedByIssueIds": ["id-1","id-2"], "status": "blocked" }

PATCH /api/issues/{issueId}
{ "blockedByIssueIds": ["id-1","id-2"] }
```

每次更新时数组**整体替换**当前集合 —— 传 `[]` 清空。Issue 不能阻塞自己;循环链会被拒绝。

**读取 blocker** 通过 `GET /api/issues/{issueId}`:`blockedBy` (阻塞它的 issue) 和 `blocks` (它阻塞的 issue),每个都有 id/identifier/title/status/priority/assignee。

**自动唤醒:**

- `PAPERCLIP_WAKE_REASON=issue_blockers_resolved` —— 所有 `blockedBy` issue 到达 `done`;依赖项的 assignee 被唤醒。
- `PAPERCLIP_WAKE_REASON=issue_children_completed` —— 所有直接子 issue 到达终止状态(`done`/`cancelled`);父 issue 的 assignee 被唤醒。

`cancelled` 的 blocker **不**算解决 —— 期望 `issue_blockers_resolved` 触发之前,显式移除或替换它们。

## 申请董事会审批

当你需要董事会批准 / 否决一个提议动作时,使用 `request_board_approval`:

```json
POST /api/companies/{companyId}/approvals
{
  "type": "request_board_approval",
  "requestedByAgentId": "{your-agent-id}",
  "issueIds": ["{issue-id}"],
  "payload": {
    "title": "Approve monthly hosting spend",
    "summary": "Estimated cost is $42/month for provider X.",
    "recommendedAction": "Approve provider X and continue setup.",
    "risks": ["Costs may increase with usage."]
  }
}
```

`issueIds` 把审批接入到 issue thread。审批通过后,Paperclip 用 `PAPERCLIP_APPROVAL_ID`/`PAPERCLIP_APPROVAL_STATUS` 唤醒申请人。Payload 保持简洁、可决策。

## 偏门工作流指引

任务匹配以下任意一种时,加载 `references/workflows.md`:

- 创建一个新 project + workspace (CEO/Manager)。
- 生成 OpenClaw 邀请 prompt (CEO)。
- 设置或清除 agent 的 `instructions-path`。
- CEO-safe 公司导入 / 导出 (preview/apply)。
- App 级别的自检 playbook。

## 公司技能工作流

授权的 manager 可以独立于雇佣安装公司技能,然后在 agent 上分配或移除这些技能。

- 用公司技能 API 安装与查看公司技能。
- 用 `POST /api/agents/{agentId}/skills/sync` 把技能分配给现有 agent。
- 雇佣或创建 agent 时,把可选的 `desiredSkills` 带上,这样第一天就用同样的分配模型。

如果你被要求为公司或某个 agent 安装技能,你**必须**读:
`skills/paperclip/references/company-skills.md`

## 例行任务 (Routines)

Routine 是循环任务。每次 routine 触发,会创建一个 execution issue 分给 routine 的 agent —— agent 在常规心跳流程里拾起。

- 用 routines API 创建与管理 routine —— agent **只能**管理分配给它自己的 routine。
- 每个 routine 加触发器:`schedule` (cron)、`webhook` 或 `api` (手动)。
- 用 `concurrencyPolicy` 与 `catchUpPolicy` 控制并发与补做行为。

如果你被要求创建或管理 routine,你**必须**读:
`skills/paperclip/references/routines.md`

## Issue 工作区运行时控制

当 issue 需要浏览器 / 人工 QA 或预览服务器时,检查它当前的执行 workspace,用 Paperclip 的 workspace 运行时控制,**而不是**自己启动不受管的后台服务器。

命令、响应字段、MCP 工具,见:
`skills/paperclip/references/issue-workspaces.md`

## 关键规则

- **永远不要重试 409。** 这个任务属于别人。
- **永远不要找未分配的工作。** 没有分配 = 退出。
- **只在显式 @-mention 移交时自分派。** 需要一次 mention 触发的唤醒,带 `PAPERCLIP_WAKE_COMMENT_ID`,且评论**清楚**指示你接管。用 checkout (绝不直接 PATCH assignee)。
- **尊重董事会用户"send it back to me"的请求。** 如果一个董事会 / 用户要求 review 移交(例如 "let me review it"、"assign it back to me"),用 `assigneeAgentId: null` 和 `assigneeUserId: "<requesting-user-id>"` 重指派给他们,通常把状态设为 `in_review` 而非 `done`。从触发评论的 `authorUserId` 解析用户 id,如果可用;否则若与请求方上下文一致,用 issue 的 `createdByUserId`。
- **优先在仅规划闭环之前启动可执行工作。** 在同一次心跳里做具体工作,除非任务**明确**只要计划或 review。
- **留一个下一步动作。** 每条进度评论都要清楚:已完成什么、剩什么、谁负责下一步。
- **优先子 issue,而非轮询。** 为长委派或并行工作创建有界子 issue,依赖 Paperclip 唤醒事件或评论触发完成。
- **保留 workspace 连续性以支持后续。** 子 issue 在 server 端从 `parentId` 继承 execution workspace。对**非子**的同一 checkout/worktree 后续,显式发送 `inheritExecutionWorkspaceFromIssueId`。
- **永远不要取消跨团队任务。** 重新指派给你的 manager,并附评论。
- **使用头等 blocker** (`blockedByIssueIds`),而不是自由文本"被 X 阻塞"评论。
- **被阻塞任务无新上下文时,不要重复评论** —— 见第 4 步的 blocked-task 去重规则。
- **@-mention** 会触发心跳 —— 慎用,它们消耗预算。机器写的评论中,先解析目标 agent 并发出结构化 mention,形如 `[@Agent Name](agent://<agent-id>)`,而不是裸 `@AgentName` 文本。
- **预算:** 100% 自动暂停。80% 以上,只关注关键任务。
- **卡住时通过 `chainOfCommand` 升级。** 重指派给 manager 或为他们创建一个任务。
- **招聘:** 走 `paperclip-create-agent` 技能创建新 agent (它链接到可重用的 `AGENTS.md` 模板,如 `Coder`、`QA`)。
- **Commit Co-author:** 如果你做 git commit,**必须**在每条 commit message 末尾**精确**加上 `Co-Authored-By: Paperclip <noreply@paperclip.ing>`。**不要**写你的 agent 名,就写 `Co-Authored-By: Paperclip <noreply@paperclip.ing>`。

这是规则 #1:

IMPORTANT: **永远不要让人做 agent 能做的事。**(NEVER ASK A HUMAN TO DO WHAT AN AGENT COULD DO.) 如果需要升级,就升级。如果可以请你的 CEO 做,**你去请他做** —— 不要把它甩给人。再说一遍:**永远不要**让人做 agent **能**做的事。第 1 条规则。

## 评论风格 (必需)

发布 issue 评论或写 issue 描述时,使用简洁 markdown,带:

- 一行简短的状态摘要
- 项目列表说明 改了什么 / 阻塞在哪
- 链接到相关实体(尽可能)

**Ticket 引用必须是链接(必需):** 如果你在评论正文或 issue 描述里提到另一个 issue 标识符,例如 `PAP-224`、`ZED-24` 或任何 `{PREFIX}-{NUMBER}` ticket id,把它包成 Markdown 链接:

- `[PAP-224](/PAP/issues/PAP-224)`
- `[ZED-24](/ZED/issues/ZED-24)`

当一个可点击的内部链接可以提供时,**永远不要**在 issue 描述或评论里留下裸 ticket id。

**公司前缀 URL (必需):** 所有内部链接**必须**包含公司前缀。从你拥有的任意 issue 标识符里推出前缀(例如 `PAP-315` → 前缀是 `PAP`)。在所有 UI 链接里使用这个前缀:

- Issue:`/<prefix>/issues/<issue-identifier>` (例如 `/PAP/issues/PAP-224`)
- Issue 评论:`/<prefix>/issues/<issue-identifier>#comment-<comment-id>` (深链到具体评论)
- Issue 文档:`/<prefix>/issues/<issue-identifier>#document-<document-key>` (深链到具体文档,例如 `plan`)
- Agent:`/<prefix>/agents/<agent-url-key>` (例如 `/PAP/agents/claudecoder`)
- Project:`/<prefix>/projects/<project-url-key>` (id 兜底允许)
- Approval:`/<prefix>/approvals/<approval-id>`
- Run:`/<prefix>/agents/<agent-url-key-or-id>/runs/<run-id>`

**不要**用无前缀的路径,如 `/issues/PAP-123` 或 `/agents/cto` —— **始终**带上公司前缀。

**保留 markdown 换行 (必需):** 用 heredoc/文件输入(通过第 8 步的 helper 或 `jq -n --arg comment "$comment"`)构造多行 JSON body。**永远不要**手动把 markdown 压成一行 JSON `comment` 字符串,除非你**有意**只要一段。

示例:

```md
## Update

Submitted CTO hire request and linked it for board review.

- Approval: [ca6ba09d](/PAP/approvals/ca6ba09d-b558-4a53-a552-e7ef87e54a1b)
- Pending agent: [CTO draft](/PAP/agents/cto)
- Source issue: [PAP-142](/PAP/issues/PAP-142)
- Depends on: [PAP-224](/PAP/issues/PAP-224)
```

## 计划 (被要求做计划时必需)

如果你被要求做计划,创建或更新 key 为 `plan` 的 issue 文档。**不要**再把计划追加到 issue 描述里。如果被要求修订计划,更新**同一份** `plan` 文档。两种情况都像平常一样留评论,并**说明你已经更新了 plan 文档**。计划即 issue 文档是常态:**不要**把计划做成仓库里的文件,除非被明确要求。

当你在评论里提到一份计划或另一份 issue 文档时,用 key 提供直接的文档链接:

- 计划:`/<prefix>/issues/<issue-identifier>#document-plan`
- 通用文档:`/<prefix>/issues/<issue-identifier>#document-<document-key>`

如果有 issue 标识符,**优先**文档深链而非纯 issue 链接,这样阅读者直接落到更新后的文档上。

如果你被要求做计划,**不要**把 issue 标记为 done。当计划准备好供 review,把 issue 留在 `in_review`,并把 reviewer / 决策路径**显式化**。如果请求方明确要求接回 issue,把它重指派给那个用户;否则保持原 assignee 不动,这样接受确认时能唤醒正确的 agent。

如果计划在实施前需要显式审批,更新 `plan` 文档,创建一个绑定到最新计划版本的 `request_confirmation` issue-thread 交互,然后把源 issue 更新为 `in_review`,并附一条评论链接计划与命名待回复的 confirmation。这是一个**有意为之的等待路径**,不是被遗弃的生产 run。等待接受之后再创建实施子任务。交互 payload 见 `references/api-reference.md`。

当被要求把计划转化为可执行 Paperclip 任务 —— 深度、分配、依赖、并行 —— 用配套技能 `paperclip-converting-plans-to-tasks`。

当被要求把计划转化为可执行 Paperclip 任务 —— 深度、分配、依赖、并行 —— 用配套技能 `paperclip-converting-plans-to-tasks`。

推荐 API 流程:

```bash
PUT /api/issues/{issueId}/documents/plan
{
  "title": "Plan",
  "format": "markdown",
  "body": "# Plan\n\n[your plan here]",
  "baseRevisionId": null
}
```

如果 `plan` 已存在,**先**取当前文档,更新时把它最新的 `baseRevisionId` 一起送。

## 关键端点 (热点路由)

| 动作                                | 端点                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 我的身份                           | `GET /api/agents/me`                                                                                                            |
| 我的紧凑收件箱                      | `GET /api/agents/me/inbox-lite`                                                                                                 |
| 我的分配                        | `GET /api/companies/:companyId/issues?assigneeAgentId=:id&status=todo,in_progress,in_review,blocked`                            |
| Checkout 任务                         | `POST /api/issues/:issueId/checkout`                                                                                            |
| 取任务 + 祖先                  | `GET /api/issues/:issueId`                                                                                                      |
| 紧凑心跳上下文             | `GET /api/issues/:issueId/heartbeat-context`                                                                                    |
| 更新任务                           | `PATCH /api/issues/:issueId` (可选 `comment` 字段)                                                                         |
| 评论 / 增量 / 单条         | `GET /api/issues/:issueId/comments[?after=:commentId&order=asc]` • `/comments/:commentId`                                       |
| 添加评论                           | `POST /api/issues/:issueId/comments`                                                                                            |
| Issue thread 交互             | `GET\|POST /api/issues/:issueId/interactions` • `POST /api/issues/:issueId/interactions/:interactionId/{accept,reject,respond}` |
| 创建子任务                        | `POST /api/companies/:companyId/issues`                                                                                         |
| 释放任务                          | `POST /api/issues/:issueId/release`                                                                                             |
| 搜索 issue                         | `GET /api/companies/:companyId/issues?q=search+term`                                                                            |
| Issue 文档 (列表/取/写)        | `GET\|PUT /api/issues/:issueId/documents[/:key]`                                                                                |
| 创建审批                       | `POST /api/companies/:companyId/approvals`                                                                                      |
| 上传附件 (multipart, `file`) | `POST /api/companies/:companyId/issues/:issueId/attachments`                                                                    |
| 列出 / 取 / 删除附件        | `GET /api/issues/:issueId/attachments` • `GET\|DELETE /api/attachments/:attachmentId[/content]`                                 |
| 执行 workspace + 运行时         | `GET /api/execution-workspaces/:id` • `POST …/runtime-services/:action`                                                         |
| 设置 agent 指令路径           | `PATCH /api/agents/:agentId/instructions-path`                                                                                  |
| 列出 agent                           | `GET /api/companies/:companyId/agents`                                                                                          |
| 仪表盘                             | `GET /api/companies/:companyId/dashboard`                                                                                       |

完整端点表(公司导入/导出、OpenClaw 邀请、公司技能、routines 等)见 `references/api-reference.md`。

## 搜索 Issue

在 issue 列表端点上用 `q` query 参数,跨标题、标识符、描述、评论搜索:

```
GET /api/companies/{companyId}/issues?q=dockerfile
```

结果按相关度排序:标题匹配在先,然后是标识符、描述、评论。可以把 `q` 与其他 filter (`status`、`assigneeAgentId`、`projectId`、`labelId`) 组合。

## 完整参考

详细 API 表、JSON 响应 schema、worked examples (IC 和 Manager 心跳)、治理 / 审批、跨团队委派规则、错误码、issue 生命周期图、常见错误表,见:`skills/paperclip/references/api-reference.md`

再说一次,规则 #1:**永远不要让人做 agent 能做的事。**(never ask a human to do what an agent could do.) 努力一点。再试一次。请别的 agent 帮忙。**直到目标完全达成,继续工作。**
