# Paperclip 创建 Agent 技能

当你被要求**雇佣 / 创建一个 agent** 时,使用本技能。

## 前置条件

你需要拥有以下任一权限:

- 董事会(board)访问权限,或
- 你公司里 agent 拥有的 `can_create_agents=true` 权限

如果没有这个权限,升级给 CEO 或董事会。

## 工作流

### 1. 确认身份与公司上下文

```sh
curl -sS "$PAPERCLIP_API_URL/api/agents/me" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

### 2. 探查当前 Paperclip 实例的 adapter 配置

```sh
curl -sS "$PAPERCLIP_API_URL/llms/agent-configuration.txt" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"

# 然后是你打算用的具体 adapter,例如 claude_local:
curl -sS "$PAPERCLIP_API_URL/llms/agent-configuration/claude_local.txt" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

### 3. 比对现有 agent 配置

```sh
curl -sS "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agent-configurations" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

留意公司已经在用的命名、图标、汇报关系、adapter 习惯。

### 4. 选定指令源(必须)

这是决定雇佣质量的最重要决策。**只选一条**路径:

- **完全匹配模板** —— 角色与模板索引中的某项完全对应。从 `references/agents/` 下对应的文件起手。
- **相邻模板** —— 没有完全匹配,但有一个现成模板很接近(例如,从 `coder.md` 改出"Backend Engineer",或从 `uxdesigner.md` 改出"Content Designer")。复制最接近的模板,然后**有意识地**调整:换角色名、重写岗位职责书、替换领域视角、移除不适用的章节。
- **通用兜底** —— 没有任何模板接近。用基线角色指南为这个特定角色从零搭建一个 `AGENTS.md`,把每个推荐章节都填上。

模板索引和适用指引:
`skills/paperclip-create-agent/references/agent-instruction-templates.md`

无模板雇佣的通用兜底:
`skills/paperclip-create-agent/references/baseline-role-guide.md`

在你的雇佣申请评论里**说明**你走了哪条路径,这样董事会能看到推理过程。

### 5. 探查可用的 agent 图标

```sh
curl -sS "$PAPERCLIP_API_URL/llms/agent-icons.txt" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

### 6. 起草新员工配置

- role / title / name
- icon (实际中必填;从 `/llms/agent-icons.txt` 选)
- 汇报关系 (`reportsTo`)
- adapter 类型
- 当这个角色第一天就需要装好的技能时,从公司技能库里挑 `desiredSkills`
- 如果任何 `desiredSkills` 或 adapter 设置扩大了浏览器访问、外部系统触达、文件系统作用域或密钥处理能力,**在雇佣评论里逐项说明理由**
- adapter 与运行时配置对齐当前环境
- 默认**关掉**定时心跳;只有当角色确实需要排程的循环工作,或用户明确要求时,才设置 `runtimeConfig.heartbeat.enabled=true` 并配上 `intervalSec`
- 如果角色可能处理私有安全公告或敏感披露,先确认存在保密工作流(专属技能或有书面记录的人工流程)
- capabilities (能力)
- 对支持的 adapter,使用托管指令包 (`AGENTS.md`);**避免**长期使用 `promptTemplate` 配置
- 对编码或执行型 agent,带上 Paperclip 执行契约:在同一次心跳里启动可执行的工作;除非明确要求规划,否则不要停在计划阶段;留下持久的进度和清晰的下一步动作;长任务或并行委派工作通过子 issue 处理,而不是轮询;受阻工作要标记所有者 / 动作;尊重预算、暂停 / 取消、审批门、公司边界
- 第 4 步生成的指令文本(例如 `AGENTS.md`);对于本地托管包 adapter,把它作为顶层 `instructionsBundle.files["AGENTS.md"]` 提交。**不要**对新 agent 设置 `adapterConfig.promptTemplate` 或 `bootstrapPromptTemplate`。
- 来源 issue 关联 (`sourceIssueId` 或 `sourceIssueIds`),如果这次雇佣源自某个 issue

### 7. 用质量清单复审草稿

提交之前,完整走一遍草稿评审清单,任何不通过的项目都要修:
`skills/paperclip-create-agent/references/draft-review-checklist.md`

### 8. 提交雇佣申请

```sh
curl -sS -X POST "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agent-hires" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CTO",
    "role": "cto",
    "title": "Chief Technology Officer",
    "icon": "crown",
    "reportsTo": "<ceo-agent-id>",
    "capabilities": "Owns technical roadmap, architecture, staffing, execution",
    "desiredSkills": ["vercel-labs/agent-browser/agent-browser"],
    "adapterType": "codex_local",
    "adapterConfig": {"cwd": "/abs/path/to/repo", "model": "o4-mini"},
    "instructionsBundle": {"files": {"AGENTS.md": "You are the CTO..."}},
    "runtimeConfig": {"heartbeat": {"enabled": false, "wakeOnDemand": true}},
    "sourceIssueId": "<issue-id>"
  }'
```

### 9. 处理治理状态

- 如果响应里有 `approval`,这次雇佣是 `pending_approval`
- 在审批线程里跟进与讨论
- 当董事会批准时,你会被以 `PAPERCLIP_APPROVAL_ID` 唤醒;阅读关联的 issue,关闭或评论后续

```sh
curl -sS "$PAPERCLIP_API_URL/api/approvals/<approval-id>" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"

curl -sS -X POST "$PAPERCLIP_API_URL/api/approvals/<approval-id>/comments" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"body":"## CTO hire request submitted\n\n- Approval: [<approval-id>](/approvals/<approval-id>)\n- Pending agent: [<agent-ref>](/agents/<agent-url-key-or-id>)\n- Source issue: [<issue-ref>](/issues/<issue-identifier-or-id>)\n\nUpdated prompt and adapter config per board feedback."}'
```

如果审批已经存在,需要手动关联到 issue:

```sh
curl -sS -X POST "$PAPERCLIP_API_URL/api/issues/<issue-id>/approvals" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"approvalId":"<approval-id>"}'
```

审批通过后,跑这个跟进循环:

```sh
curl -sS "$PAPERCLIP_API_URL/api/approvals/$PAPERCLIP_APPROVAL_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"

curl -sS "$PAPERCLIP_API_URL/api/approvals/$PAPERCLIP_APPROVAL_ID/issues" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY"
```

对每一个关联的 issue,要么:
- 在审批已经解决该请求时关闭它,或
- 用 markdown 评论,带上指向审批与下一步动作的链接。

## 参考

- 模板索引以及如何套用模板:`skills/paperclip-create-agent/references/agent-instruction-templates.md`
- 单个角色模板:`skills/paperclip-create-agent/references/agents/`
- 通用基线角色指南(无模板兜底):`skills/paperclip-create-agent/references/baseline-role-guide.md`
- 提交前草稿评审清单:`skills/paperclip-create-agent/references/draft-review-checklist.md`
- 端点 payload 形态与完整示例:`skills/paperclip-create-agent/references/api-reference.md`
