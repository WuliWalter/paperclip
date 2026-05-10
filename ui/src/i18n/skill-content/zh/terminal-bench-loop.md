# Terminal-Bench Loop

把单个 Terminal-Bench 问题驱动到通过 smoke 的可重复操作技能,通过 Paperclip 完成,带有显式的 issue 拓扑、有界 run、董事会门控的产品修复、worktree 连续性。

这是一个**操作 + 诊断**技能,不是工程技能。它围绕一个 Terminal-Bench 循环协调 issue、artifact 与审批。它**不**授权代码改动 —— 每一个被接受的产品修复在董事会确认之后,作为单独的实施子 issue 落地。

权威执行模型:在启动一个循环或移动任何循环 issue 之前,读 `doc/execution-semantics.md`。每一个循环 issue 必须停在该文档允许的状态:terminal (`done`/`cancelled`)、explicitly live (活跃 run / 排队中的唤醒)、explicitly waiting (`in_review` 带参与者 / 交互 / 审批),或 explicit recovery/blocker (`blocked` 带 `blockedByIssueIds` 与命名所有者)。

## 何时使用

当指派的标题或正文匹配以下任一时触发:

- "run Terminal-Bench in a loop"、"loop \<task-name\> through Paperclip"
- "drive Terminal-Bench fix-git"、"iterate on Terminal-Bench until it passes"
- "Terminal-Bench smoke loop"、"bench loop"、"smoke loop on \<task-name\>"
- 附带链接到一个 Terminal-Bench 循环父 issue,并要求做下一次迭代

也用于:用户给你一个已存在的顶层循环 issue,并要求做下一次迭代、诊断或重跑。

## 何时不使用

- 任务是构建或改动 `paperclip-bench` 本身(Harbor adapter、wrapper、telemetry)。在那个仓库走正常工程流程。
- 任务是为了排名提交基准结果。本技能产出的是 smoke / 不可比较的 run —— 全套或可比较的 run 升级给 BenchmarkQualityManager。
- 任务是不由 Terminal-Bench loop 暴露出来的常规 Paperclip 产品 bug。走正常调查流程。
- 你**没有**被授权安装或分配公司技能,而请求方实际上要技能库变更。把那一步交给授权的技能库所有者。

## 你必须共同保持的三条不变量

每一次循环迭代和每一个提议的产品修复都必须**同时**满足这三条不变量。它们来自 `/diagnose-why-work-stopped`,用户在存活性工作上反复重申过:

1. **生产性工作继续。** 每个循环 issue 必须始终有一个清晰的下一步动作所有者 —— agent、董事会、用户或命名 blocker。没有沉默的 `in_review` 而其上没有任何等待。
2. **只有真正的 blocker 才停工。** 当某事确实无法继续时(董事会确认、QA、缺凭据、预算用尽)才停。伪停顿必须被识别并路由。
3. **没有死循环。** 迭代次数、墙钟预算、产品修复落地之前的董事会门,共同约束循环边界。

如果一次提议的迭代违反了三条中的任意一条,删掉或重写。在循环 issue 里**明确写出**本次迭代如何保住每一条不变量。

## 输入

在第 1 次迭代之前,把这些信息收集到顶层循环 issue 上。任何无法提供的输入都是 blocker —— 命名解阻所有者并停下。

- **Source issue.** 请求做这个循环的 Paperclip issue。循环父 issue 链回到它。
- **Terminal-Bench task name.** 单任务标识符(例如 `terminal-bench/fix-git`)。多任务套件不在本技能范围。
- **迭代预算。** 必须在没有更多修复时停下的最大迭代次数(典型 3–5)。同时记录每次迭代的墙钟上限。
- **Paperclip App worktree issue.** 在 Paperclip App 项目下、其执行 workspace 持有隔离 worktree 的实施侧 issue。第 1 次迭代创建它;后续迭代通过 `inheritExecutionWorkspaceFromIssueId` (或等价机制)复用。
- **Benchmark 命令。** 精确的 `paperclip-bench` 调用,包括钉死到被测 Paperclip App worktree 的 `PAPERCLIPAI_CMD` (或等价命令绑定)。**逐字**记录在循环 issue 上。
- **Dispatch runner 配置。** 让 smoke 实际能启动 Paperclip 心跳所需的精确 Harbor/Paperclip runner dispatch 配置。当前 Harbor wrapper 下,**逐字**记录 `PAPERCLIP_HARBOR_RUNNER_CONFIG` JSON (或等价配置文件),足以保留:`assignee`、`heartbeat_strategy`、`agent_adapter` / `agent_adapters`、需要本地凭据时的 `reuse_host_home`、stop budget。一个把 `BEN-1` 创建为未指派的 `todo`、零个心跳启用 agent 的裸 Harbor 命令是 harness/setup 失败,**不**是有效产品诊断。
- **最新 artifact 根目录。** `paperclip-bench` 写入 run artifact 的文件系统或存储路径(manifest、`results.jsonl`、Harbor 原始 job 文件夹、脱敏 telemetry)。每次迭代追加,什么都不会被覆盖。
- **审批策略。** 在实施之前,谁必须接受一次提议的产品修复(默认:董事会通过 `request_confirmation`;委派时为 CTO;**永远不**是 loop 驱动者本人)。

把每个输入记录在顶层循环 issue (描述或单独的 `inputs` 文档)。如果任何输入在循环中途变更,记录变更与生效迭代。

## Issue 拓扑

循环必须能被表达为一棵树,而不是评论里的散文:

- **顶层循环 issue.** 长生命周期。持有输入、迭代计数、当前状态、指向每一个迭代子 issue 的链接、产品规则历史。当一次迭代正在 run 时停在 `in_progress`;**仅**在循环父 issue 上**直接**坐着一个类型化等待者(执行策略参与者、`request_confirmation` / `ask_user_questions` / `suggest_tasks` 交互、审批、命名人类所有者)时停在 `in_review`;当某个子 issue 是把守工作时,停在 `blocked` 带 `blockedByIssueIds` (持有 fix-proposal `request_confirmation` 的迭代子 issue,或实施、QA、CTO review 子 issue);通过时 `done`;董事会拒绝 / 预算耗尽时 `cancelled`。
- **迭代子 issue.** 一次迭代一个。每个携带:一个有界 run issue (smoke)、一个诊断 issue (套用 `/diagnose-why-work-stopped`)、一个带 `request_confirmation` 交互的 fix-proposal 文档,以及 —— **仅在接受之后** —— 实施、QA、CTO review、重跑子 issue。迭代子 issue 被它的前任阻塞,这样执行器按顺序唤醒它们。
- **Paperclip App 实施 issue.** 第 1 次迭代创建一个全新的 Paperclip App 子 issue,其 project policy 派生一个隔离 worktree。后续每次迭代的实施 / 重跑子 issue 通过 `inheritExecutionWorkspaceFromIssueId` 引用同一个执行 workspace,这样同一个 worktree 被增量改动并测试。

用 `blockedByIssueIds` 串依赖,**永远不要**用 "blocked by X" 这样的散文。当依赖子 issue `done`,执行器自动唤醒下一个。

## 流程

### 0. 阅读当前的执行契约

打开或推进循环之前,读 `doc/execution-semantics.md`。在分类循环 issue 状态时,使用该文档的术语:live path / waiting path / recovery path;运行后处置;有界续作;生产力评审;暂停挂起;看门狗。**不要**发明新状态。

### 1. 打开或复用顶层循环 issue

- 如果给定了一个已存在的循环 issue,**读它**:输入、迭代计数、上次迭代的停止原因、当前 Paperclip App worktree 指针、最新基准命令。
- 如果不存在,在 Paperclip App 项目(或 source issue 指向的 project)下创建一个。标题:`Terminal-Bench loop: <task-name>`。描述捕获上述输入、迭代预算、以及指向 source issue 的链接。
- 验证 worktree 指针仍能解析。如果记录的执行 workspace 已被丢弃(worktree 被剪枝、project 改动),循环被阻塞 —— 命名解阻所有者(CodexCoder 或 Paperclip App owner)并停下。

### 2. 打开迭代子 issue

- 在循环 issue 上递增迭代计数。
- 创建一个标题为 `Iteration N: <task-name>` 的迭代子 issue。它的描述重复输入并引用循环父 issue。把它**阻塞**在前一次迭代的终止子 issue 上(如有),这样执行器不能并行启动两次迭代。
- 如果迭代计数会超过预算,**不要**创建子 issue。把循环 issue 移到 `cancelled` (预算用尽),或者如果用户必须决定是否扩预算,移到 `in_review`。

### 3. 跑有界 smoke

- 基准命令必须使用被测 Paperclip App worktree。把 `PAPERCLIPAI_CMD` (或等价命令绑定)设为该 worktree 内的 CLI 入口。**永远不要**让 smoke 跑在运维者当前的 Paperclip checkout 上。
- 同一命令块**必须**包含让基准 issue 可执行的 runner dispatch 配置。当前 Harbor wrapper 下,导出 `PAPERCLIP_HARBOR_RUNNER_CONFIG`,带预期的 assignee、heartbeat 策略、agent adapter、credential/home 模式、stop budget。**不要**把一个省略 dispatch 配置的裸 `uvx harbor run ...` 当成权威 smoke;把它记为 harness/setup 漏配,并用记录的配置重跑。
- 用墙钟和 Paperclip 的 run-budget 控制限制 run。如果 smoke 会超过每次迭代的上限,杀掉它并记录截断原因。
- 在迭代子 issue 或专门的 `run` 文档里捕获:
  - Paperclip run id 与心跳 run id
  - 基准 run id、manifest、`results.jsonl` 行、Harbor 原始 job 文件夹
  - 使用的 dispatch 配置(`PAPERCLIP_HARBOR_RUNNER_CONFIG` 或等价),含 assignee 与 adapter 类型
  - harness 报告的精确停止原因(pass、harness fail、verifier fail、timeout、agent gave up、infrastructure error)
  - Paperclip 暴露 telemetry 时,心跳启用 / 心跳被观察到的 agent 数量
  - 失败分类桶(task/model、Paperclip 产品、harness/setup、verifier/infrastructure、security、unclear)
  - 最新 artifact 根目录下的 artifact 路径
- 把这次迭代标记为 **smoke / non-comparable**。可比较的 run 不在本技能范围。

### 4. 诊断精确的停止点

把 `/diagnose-why-work-stopped` 模式套用到本次迭代的 run,**仅限于此循环** —— **不要**拉无关的调查模板进来。具体:

- 沿 smoke 在 Paperclip App worktree 下生成的 Paperclip issue 树**逐节点**走,找到把进度停住的精确 `(issue, status)` 组合。援引证据:run id、评论时间戳、状态切换。
- 给该子树里每个未推进 issue 分类为 **真的需要人 / 董事会介入**、**agent 可处理但目前未被路由**,或 **已经覆盖**。
- 说明失败属于 task/model、Paperclip 产品、harness/setup、verifier/infrastructure、security 还是 unclear。当证据是推断的(例如跨公司 API 边界阻挡了直读),**显式声明**。
- 如果失败是 Paperclip 产品缺口,把修复**框定为通用产品规则**,以合约形式陈述,并对照三条不变量。如果该规则会阻塞最近一次成功的生产 run,收紧它。

把诊断作为 `diagnosis` 文档记在迭代子 issue 上。**还不要**提议代码。

### 5. 决定下一步

基于诊断,迭代以下面**恰好一种**迭代-终止状态结束:

- **Pass.** Smoke verifier 报告通过。把迭代子 issue 与循环父 issue 推向 QA/CTO review (第 8 步)。
- **Product fix proposed.** 识别出一个 Paperclip 产品缺口。把修复方案作为 `plan` 文档写到迭代子 issue 上,然后到第 6 步。
- **Non-product failure with retry.** 失败属于 harness/setup/infrastructure 或模型不稳定,迭代预算未耗尽,且 loop 驱动者认为不改代码的重跑有信号(例如临时基础设施问题)。把理由记在迭代子 issue 上,无实施步骤直接到第 7 步。
- **Real blocker.** 命名外部 blocker (凭据、配额、第三方故障、安全审查)。把循环 issue 移到 `blocked`,把 `blockedByIssueIds` 设为 blocker issue (必要时新建一个),命名解阻所有者。停下。
- **Budget or board stop.** 迭代预算到达,或董事会拒绝下一次修复提议。把循环 issue 移到 `cancelled`,附评论总结 run 历史与停止原因。

### 6. 任何产品修复之前,申请董事会确认

当迭代以**Product fix proposed**结束时:

- 用提议的合约、三不变量检查、受影响的 Paperclip 表面、分阶段子任务(实施、QA、CTO review、重跑)更新迭代子 issue 的 `plan` 文档 —— 但**不要**创建那些子任务。
- 在**迭代子 issue** (持有 `plan` 文档的同一个 issue) 上对最新计划版本打开 `request_confirmation` 交互。幂等键:`confirmation:{iterationIssueId}:plan:{revisionId}`。把 `continuationPolicy` 设为 `wake_assignee`。
- 把**迭代子 issue** 移到 `in_review`。类型化等待者 —— `request_confirmation` 交互 —— 直接坐在它上面,所以它的 `in_review` 是健康的。评论链接 plan 文档并命名待回复的 confirmation。
- 把**循环父 issue** 移到 `blocked`,带 `blockedByIssueIds: [iterationChildId]`,附评论命名董事会(或审批策略指定的审批者)为解阻所有者。**不要**把循环父 issue 移到 `in_review`:类型化等待者在迭代子 issue 上,不在父 issue 上,所以父 issue 的等待路径**是**子 issue blocker。这与"循环父 issue 仅在直接附加到父 issue 上的类型化等待者存在时才坐 `in_review`"的拓扑规则一致。
- **等待接受**。如果董事会发了一条改变计划的覆盖性评论,修订文档,然后在迭代子 issue 上对新版本开一个新的 confirmation —— 旧的失效。循环父 issue 的 `blockedByIssueIds` 已经指向迭代子 issue,无需变更。
- **拒绝时**,按 **Budget or board stop** 规则结束循环;**不要**静默重试同一提议。
- **接受时**,按顺序串好 `blockedByIssueIds`,创建实施、QA、CTO review、重跑子 issue;并把循环父 issue 的 `blockedByIssueIds` 更新为指向新的把守子 issue (通常是实施子 issue),这样父 issue 仍然 `blocked` 在真实下游工作上。实施子 issue 必须**继承** Paperclip App 执行 workspace (`inheritExecutionWorkspaceFromIssueId` 指向持有 worktree 的 issue),这样修复落到与 smoke 跑过的同一个隔离 worktree 中。

### 7. 在同一个 worktree 上重跑

实施与 QA 完成后(或在 **non-product failure with retry** 情形下立即),重跑子 issue 用相同的 `paperclip-bench` 调用,`PAPERCLIPAI_CMD` 仍钉死在被测 Paperclip App worktree 上。

- 重跑**必须**用修复落地的同一个 worktree。如果 workspace 在迭代之间被重置,循环**无效** —— 在循环 issue 上开 blocker 并停下。
- 完成时,重跑子 issue 成为下次迭代的 run 记录。如果 smoke 现在通过,跳到第 8 步。否则回到第 4 步,开新迭代子 issue (受迭代预算约束)。

### 8. Pass: QA, CTO review, 关闭

当 smoke 通过时:

- 如果 QA 与 CTO review 子 issue 还不在依赖链中,创建它们(CTO review 被 QA 阻塞,链按顺序唤醒)。把循环父 issue 移到 `blocked`,把 `blockedByIssueIds` 设为 QA / CTO review 链,附评论命名 QA 与 CTO 为解阻所有者并链接子 issue。循环父 issue 保持 `blocked`(**不是** `in_review`),因为类型化等待者在子 issue 上,不在父 issue 上。
- 如果你**确实**想让循环父 issue 在这一阶段坐 `in_review` (例如因为某董事会用户**显式**主动接管 review),在父 issue 上**直接**附加一个类型化等待者 —— 执行策略参与者、`request_confirmation` / `ask_user_questions` / `suggest_tasks` 交互、审批、或命名人类所有者 —— **不要**仅靠子链。**不要**把父 issue 上的 `in_review` 与作为 blocker 的 QA/CTO 子 issue 组合;那正是本技能要防范的模糊 review 形态。
- QA 验证 artifact (manifest、`results.jsonl`、Harbor 原始 job、脱敏 telemetry),并在同一个 worktree 上验证重跑可重现性。
- CTO 评审循环过程中落地的产品修复的技术范围。
- QA + CTO 接受后,关闭循环 issue,并附董事会级别总结评论:任务名、迭代次数、停止原因(pass)、worktree 指针、最终 artifact 根目录链接、被接受的产品修复列表(每个带它的实施 issue id)。

### 9. 停止规则

下列任一为真时,循环**必须**停下,且状态显式记录在循环 issue 上:

- **Pass.** Smoke verifier 报告通过且 QA + CTO 接受 (第 8 步)。循环 issue → `done`。
- **Board rejection.** 董事会拒绝一次修复提议且不要求修订。循环 issue → `cancelled`。评论命名被拒提议与原因。
- **Iteration budget reached.** 迭代计数达到预算而未通过。循环 issue → `cancelled` (或者 `in_review`,如果用户必须决定是否扩预算)。**永远不要**静默启动第 N+1 次迭代。
- **Real blocker named.** 外部 blocker (凭据、配额、基础设施、安全、缺技能) loop 驱动者无法解决。循环 issue → `blocked` 带 `blockedByIssueIds` 指向 blocker issue,命名解阻所有者。

循环**永远不能**仅以散文评论结束。每次停止都是一次状态切换,且有命名的下一步动作所有者。

## Worktree 规则

循环**不得**测试心跳当前恰好在的 Paperclip checkout。它必须测试与提议修复落地相同的隔离 Paperclip App worktree。

- 第 1 次迭代创建 Paperclip App 实施子 issue;那个 project 的 git-worktree policy 派生一个全新 worktree。
- 循环 issue 记录持有 worktree 的 issue id 与 workspace 路径(或 workspace id)。
- 后续每个实施、QA、重跑子 issue 把 `inheritExecutionWorkspaceFromIssueId` 设为持有 worktree 的 issue,这样所有循环工作共用一个 workspace。
- 基准命令始终把 `PAPERCLIPAI_CMD` (或等价命令绑定) 设为该 worktree 内的 CLI 入口,并携带记录的 dispatch runner 配置 (`PAPERCLIP_HARBOR_RUNNER_CONFIG` 或等价),用以分配基准 issue 与启动心跳。循环 issue 上记录的基准命令是真理之源 —— 如果一次心跳要从另一个 shell 跑 smoke,**逐字**复制记录的命令块,而不是仅复制 Harbor 调用行。
- 如果 workspace 被剪枝或 worktree 路径不再解析,直到重建之前,循环都是无效的。把循环标记为 `blocked` 并命名解阻所有者(通常 CodexCoder 或 Paperclip App owner)。

## 存活性规则

每一个循环 issue,在**每次**心跳结束时,必须停留于以下之一:

- **Terminal:** `done` 或 `cancelled`。无后续动作。
- **Explicitly live:** `in_progress`,带活跃 run、即将到来的排队唤醒、或在它之下活跃执行的子 issue。
- **Explicitly waiting:** `in_review`,带类型化等待者 —— 执行策略参与者、`request_confirmation` / `ask_user_questions` / `suggest_tasks` 交互、审批、或命名人类所有者。
- **Explicit recovery / blocker:** `blocked`,带 `blockedByIssueIds` 指向真实阻塞 issue,加评论命名解阻所有者与所需动作。

如果循环 issue 在退出时**不**符合上述之一,心跳还**没**结束。先修状态再退出。

## 陷阱

- **smoke 跑在运维者的 Paperclip checkout 上。** worktree 规则的全部意义在于:bench 测试修复落地的 worktree。**始终**设 `PAPERCLIPAI_CMD` 并在启动 run 之前**校验路径**。
- **丢掉 dispatch 配置。** 一次省略 `PAPERCLIP_HARBOR_RUNNER_CONFIG` (或等价) 的 Harbor run 可能启动 Paperclip 并创建 `BEN-1`,但留它未指派、零个心跳启用 agent。那**不**是 Terminal-Bench 产品信号。**完整保留并重跑**整段命令块,含 assignee 与 adapter 配置。
- **审批前写代码。** 在董事会确认接受迭代的 `plan` 文档之前,**不存在**实施子 issue。**不要**在诊断阶段提交代码。
- **跳过近期工作调研。** 提议 Paperclip 产品规则时,看看最近几天受影响存活性 / 执行领域已经出货了什么。一条与上周已接受合约相矛盾的规则是返工。
- **把 `in_review` 当成 done。** 一个 `in_review` 但无参与者、无交互、无审批、无人类所有者的循环或迭代子 issue 是**停止**,不是进展。当作存活性违规处理并路由它。
- **静默 N+1 次迭代。** 如果迭代预算到达,**永远不要**在没有显式预算扩展记录在循环 issue 上的情况下,启动新迭代。
- **comparable run 漂移。** 本技能**仅**产出 smoke run。如果请求方要可比较基准提交,移交给 BenchmarkQualityManager 与 BenchmarkForensics —— **不要**把 smoke 重新标为 comparable。
- **递归恢复。** 滞留工作恢复又恢复了它自己的 recovery issue,是教科书式的死循环。如果诊断在 smoke 子树里发现它,拒绝继续往下钻,并路由到 `/diagnose-why-work-stopped` 走产品规则修复。
- **技能库变更。** 本技能**永远不**作为循环迭代的一部分安装、编辑或分配公司技能。库改动通过单独的 issue 交给授权的技能库所有者。
- **隐藏链条。** **不要**静默删除或隐藏失败的迭代子 issue、被撤回的提议、被拒的 confirmation。审计链是循环的证据。

## 验证清单(在退出触及循环的心跳之前)

- [ ] 所有输入都记录在顶层循环 issue 上,包括精确的基准命令、`PAPERCLIPAI_CMD` 绑定、dispatch runner 配置。
- [ ] 迭代计数已是最新,且在预算内。
- [ ] Paperclip App worktree 指针仍解析,且本次迭代的 run/实施/重跑子 issue 共用该 workspace。
- [ ] smoke run 已捕获 run id、manifest、`results.jsonl`、Harbor 原始 job 文件夹、停止原因。
- [ ] Paperclip telemetry 显示基准 issue 已被分配且心跳被启用 / 被观察,或者本次迭代被显式分类为 harness/setup no-dispatch。
- [ ] 诊断套用 `/diagnose-why-work-stopped` 模式,分类每一个未推进 issue,核对三不变量。
- [ ] 不存在为未审批修复提议而生的实施子 issue;若提议了,已对最新计划版本打开 `request_confirmation`。
- [ ] 每一个循环和迭代 issue 都停在 terminal、explicitly-live、explicitly-waiting、或 named-blocker 状态。
- [ ] 如果循环本心跳停了,停止原因是 pass、董事会拒绝、预算耗尽、命名 real blocker 之一。
- [ ] 本心跳没有任何公司技能库变更。

## 确定性 smoke

安装或修改技能后,把它当作活 Terminal-Bench 循环可用之前,跑这个 smoke:

```sh
pnpm smoke:terminal-bench-loop-skill
```

该命令使用 `PAPERCLIP_API_URL`、`PAPERCLIP_API_KEY`、`PAPERCLIP_COMPANY_ID` 中当前的 Paperclip API token 与公司。当 `PAPERCLIP_TASK_ID` 已设,它把 smoke issue 挂到该 source issue 之下,并继承其 project/goal 上下文。默认在验证完成后取消短生命周期的 smoke issue;传 `-- --keep` 保留通过验证的 `blocked` 循环父 issue、`in_review` 迭代子 issue,以及待回复的 confirmation,供人工检查。

smoke 是确定性的、有意非可比较的。它**不**启动 Terminal-Bench、Harbor、agent 模型或 provider runtime。它只验证控制平面形状:

- 本地 `skills/terminal-bench-loop/SKILL.md` 含循环合约术语;
- 顶层循环 issue 可被创建并更新到 blocker 姿势;
- 在循环父下可创建迭代子 issue;
- mocked 基准 artifact 路径被记到 `run` 文档上;
- `diagnosis` 文档命名了精确停止点与下一步动作所有者;
- `request_confirmation` 交互被创建,迭代子 issue 停在 `in_review` 带类型化等待路径,而不是沉默 review。
