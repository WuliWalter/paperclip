# 诊断工作为什么停滞

针对一类反复出现的问题的可重复流程:用户(或经理)指着一个停滞的 / 死循环的 / 过度恢复的 issue 树,问"为什么停了 / 为什么在循环 / 怎么保证以后不再发生?"

这是一个**诊断 + 产品设计**技能,不是工程技能。产出物是书面根因 + 已批准的计划。本技能不会带出任何代码改动。

权威执行模型:在诊断或提议任何新的存活性 / 恢复规则之前,先读 `doc/execution-semantics.md`。把这份文档作为状态、行动路径(action-path)、运行后处置、有界续作、生产力评审、暂停挂起、看门狗、以及显式恢复语义的真理之源。如果调查发现了一个真正的产品规则缺口,计划里要说明 `doc/execution-semantics.md` 是否需要同步更新。

## 何时使用

当指派的标题或正文匹配以下任一时触发:

- "why did this work stop"、"why did this stall"、"why did this just stop"
- "infinite loop"、"looping"、"spinning"、"going too deep"、"recovery went too deep"
- "liveness — what happened here"、"this tree stopped working"、"stuck"
- "approach it from a product perspective"、"general product principle / rule"
- 附带链接到一棵具体的停滞 / 死循环 / 过度恢复的 issue 树

也用于:用户在任何产品改动**之前**要求做调查、根因或书面分析。

## 何时不使用

- 任务要求你直接出代码修改。走正常工程流程。
- 任务是针对某个具体功能的常规 bug 报告。走正常的调查流程。
- 你是被原作者要求修自己的 bug。走正常的 debug 流程。

## 你必须共同保持的三条不变量

每一次诊断和每一条提议出来的规则都必须**同时**满足这三条不变量。用户在至少四个 issue 上反复重申过它们;把它们当作承重墙:

1. **生产性工作继续。** 有清晰下一步动作的 agent 必须继续工作,不需要用户来唤醒。([PAP-2674](/PAP/issues/PAP-2674)、[PAP-2708](/PAP/issues/PAP-2708))
2. **只有真正的 blocker 才停工。** 当某事确实无法推进时(缺审批、缺依赖、需要人来处理)才停。伪停顿(没有动作路径的 in_review、被 cancel 的叶子、畸形元数据)必须被识别并路由,而不是默默放在那里。([PAP-2335](/PAP/issues/PAP-2335)、[PAP-2674](/PAP/issues/PAP-2674))
3. **没有死循环。** 滞留工作的恢复以及续作循环必须有界,且能与真正生产性的续作区分开。([PAP-2602](/PAP/issues/PAP-2602)、[PAP-2486](/PAP/issues/PAP-2486))

如果一条提议的规则违反了三条中的任意一条,删掉或重写。在计划里**明确写出**每一条不变量是如何被维持的。

## 流程

### 0. 阅读当前的执行契约

走树之前先读 `doc/execution-semantics.md`,并保留它的术语:

- live path(存活路径) / waiting path(等待路径) / recovery path(恢复路径)
- 运行后处置: terminal、explicitly live、explicitly waiting、invalid
- 有界 `run_liveness_continuation`
- productivity review vs liveness recovery
- 活跃子树暂停挂起
- 静默 active-run 看门狗

在你能明确说出和现有执行语义文档的差异之前,不要发明新规则。

### 1. 先对指定的树做调查 —— 别的事情都先放下

在同一次心跳里完成。在你拿到具体停止点之前,不要提议规则。

- 打开链接的 issue (以及它的 blocker 链、parent、recovery 兄弟、最近的 run)。
- 逐节点遍历这棵树,找到把世界停住的那个 (issue, status) 组合。目前公司见过的常见形态:
  - `in_review` 但没有类型化的执行参与者、没有活跃 run、没有 pending 交互、没有 recovery issue ([PAP-2335](/PAP/issues/PAP-2335)、[PAP-2674](/PAP/issues/PAP-2674))。
  - 一次成功 run 之后停在 `in_progress`,但没有未来动作路径排队 ([PAP-2674](/PAP/issues/PAP-2674))。
  - blocker 链的叶子是 `cancelled` / 畸形 / 跨公司不可访问 ([PAP-2602](/PAP/issues/PAP-2602))。
  - `issue.continuation_recovery` 在多次成功 run 之后反复唤醒同一个 issue 超过 N 次 ([PAP-2602](/PAP/issues/PAP-2602))。
  - 滞留工作恢复把它自己的 recovery issue 当成新的可恢复源工作 ([PAP-2486](/PAP/issues/PAP-2486))。
- 援引证据:run id、评论时间戳、状态切换。"推断"只在 API 边界阻挡了直接证据时才被接受 —— 这种情况要明确说明,并把结论标记为暂定 ([PAP-2631](/PAP/issues/PAP-2631))。

尊重 API 边界。如果链接的 issue 在另一个公司,你的 agent token 返回 403,**不要**绕过作用域。要么申请董事会批准的诊断路径,要么从 PAP 一侧的推断证据出发并显式标记。

### 2. 调研近期相关工作

提议新产品规则之前,先看看本周已经在同一个领域出货的内容。用户曾明确强调:([PAP-2602](/PAP/issues/PAP-2602)) "review our recent work on liveness that we shipped in the last couple of days."(评审我们最近几天在 liveness 上出货的工作。)一条与 48 小时前合并的代码相矛盾的新规则,是返工,不是改进。

快速调研:

- 受影响领域近期合并的 PR。
- 标题提及 liveness、recovery、productivity、continuation 或受影响子系统的近期 done issue。
- 父 issue 上活跃的计划文档。修复方案可能属于对现有计划的修订,而不是一个全新的顶层提议。

在调查报告里写明:"我看了 X、Y、Z。新发现的缺口是……"

### 3. 给树里每一个未推进的 issue 分类

对受影响树里每一个不是 `done` / `cancelled` / 正在运行的 issue,做一个判断:

- **真的需要人或董事会介入** —— 命名所有者和动作。
- **agent 可处理但目前未被路由** —— 命名本应路由它的规则,以及本应被唤醒的 agent。
- **已经覆盖** —— 指向活跃 run、排队中的唤醒、recovery issue、或 pending 交互。

这就是用户反复要的那张表 ([PAP-2335](/PAP/issues/PAP-2335))。没有它,计划是抽象的。

### 4. 把它框定为通用产品规则

用户**不**想要针对指定树打的一次性补丁。他们要规则。两条检查:

- 规则**像合约一样陈述**,而不是像 if/else 补丁。示例合约:"every agent-owned non-terminal issue must finish each heartbeat with a terminal state, an explicit waiting path, or an explicit live path"(每一个由 agent 持有的非终止 issue 必须以终止状态、显式等待路径或显式存活路径结束每次心跳)([PAP-2674](/PAP/issues/PAP-2674))。
- 规则与 `doc/execution-semantics.md` 对齐。优先引用并应用现有合约;只在文档不完整或与已被接受/已实现的行为相矛盾时才提议文档变更。
- 规则**显式保住上面三条不变量**。把过程写出来。

如果这条规则会阻塞最近一次成功的生产 run,删掉它或者收紧。

### 5. 做计划,别写代码

把计划写进 issue 的 `plan` 文档。涵盖:

- 调查摘要(根因 + 证据)。
- 通用产品规则,以合约形式陈述。
- 现有的 `doc/execution-semantics.md` 合约是否已经覆盖,或需要哪些精确的文档更新。
- 分阶段子任务:通常 `Phase 0` 处理被指定的活树(谨慎,不破坏证据),`Phase 1` 把合约写入文档,然后是检测、恢复、UI 呈现、安全评审、QA 和 CTO 评审的实施阶段。
- 每个阶段显式指派受派人;按团队专长就近分(server 用 CodexCoder,FE 用 ClaudeCoder,可见状态用 UXDesigner,所有权/权限用 SecurityEngineer,验证用 QA)。
- 阻塞依赖通过 `blockedByIssueIds` 接好,识别可并行分支。

**不要**现在就创建子 issue。**不要**提交代码。

### 6. 申请审批,然后再分解

- 针对最新计划版本打开 `request_confirmation` 交互。幂等键 `confirmation:{issueId}:plan:{revisionId}`。
- 等待董事会 / CTO 接受。如果用户发了一条新评论替代了旧计划,先前的 confirmation 失效 —— 针对新版本开一个新的 confirmation ([PAP-2602](/PAP/issues/PAP-2602) 走过三轮版本;这是允许的)。
- **接受之后**才创建分阶段子 issue,带正确的受派人和依赖,然后让父 issue 阻塞在最终的 QA / CTO review issue 上,这样父 issue 只在链条结束时被唤醒。

### 7. 对指定树执行 Phase 0 卫生整理

Phase 0 在不掩盖证据的前提下清理活树:

- 把没有参与者的停滞 `in_review` 叶子移回 `todo`,带上精确的下一步动作和命名所有者 ([PAP-2335](/PAP/issues/PAP-2335))。
- 把那些一直挟持链条的、被 cancel 或死掉的 blocker 摘下来;**不要**为了清理 backlog 静默地把 issue 标记为 `done`。
- 在原始指定 issue 上留一条评论,概述改了什么、为什么;**永远不要**藏起 recovery 链的历史。

### 8. 最终收尾

阶段链完成后,在父 issue 上发一条董事会级别的总结评论:改了什么、新合约是什么、上线步骤是什么(例如"重启控制平面以拾取新的响应形状")、被指定的树的活跃状态。然后关闭父 issue。

## 陷阱

- **审批前写代码。** 用户在最近所有诊断 issue 上都说了"先做计划"。在调查阶段产出代码会浪费往返。
- **以牺牲一条不变量为代价重申另一条。** 续作收得太紧,生产性工作停滞;恢复放得太松,死循环回归。**永远**三条都查。
- **跳过近期工作调研。** 提议一条与 24 小时前出货代码冲突的合约,是计划被否的最快方式。
- **把 "in_review" 当成 done。** 一个被指派给另一个 agent、没有参与者也没有活跃 run 的叶子不是进展;按停止处理。
- **绕过公司作用域。** 跨公司调查需要董事会批准的诊断路径,而不是数据库直读。
- **递归恢复。** 滞留工作恢复又恢复了它自己的 recovery issue,这是教科书式的死循环 ([PAP-2486](/PAP/issues/PAP-2486))。识别它,拒绝继续往下钻。
- **隐藏链条。** 不要静默删除或隐藏症状性的 recovery issue —— 操作员需要审计链。

## 验证清单(发布计划之前)

- [ ] 指定树里的精确停止点已用 run id / 评论 id 定位。
- [ ] 同一领域近期出货的工作已经被调研并在文中引用。
- [ ] 每一个未推进的 issue 都被分类为 需要人 / agent 可处理 / 已覆盖。
- [ ] 提议的规则以合约形式陈述,而不是补丁。
- [ ] 三条不变量都被显式保住。
- [ ] 本心跳没有任何代码改动落地。
- [ ] 已对最新计划版本打开 `request_confirmation`。
- [ ] 计划的 Phase 0 在不破坏证据的情况下处理了活的指定树。
- [ ] 实施阶段命名了与专长匹配的受派人,以及 `blockedByIssueIds` 依赖。
