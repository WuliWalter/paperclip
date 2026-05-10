import diagnoseBody from "./zh/diagnose-why-work-stopped.md?raw";
import paperclipConvertingPlansBody from "./zh/paperclip-converting-plans-to-tasks.md?raw";
import paperclipCreateAgentBody from "./zh/paperclip-create-agent.md?raw";
import paperclipCreatePluginBody from "./zh/paperclip-create-plugin.md?raw";
import paperclipDevBody from "./zh/paperclip-dev.md?raw";
import paperclipBody from "./zh/paperclip.md?raw";
import paraMemoryFilesBody from "./zh/para-memory-files.md?raw";
import terminalBenchLoopBody from "./zh/terminal-bench-loop.md?raw";

import type { SkillTranslationMap } from "./types";

export const zhSkillTranslations: SkillTranslationMap = {
  "diagnose-why-work-stopped": {
    name: "诊断工作为什么停滞",
    description:
      "处理「为什么这件事停了 / 为什么在循环?」类指派的方法。先在指定的 issue 树上做调查,定位精确停止点,把修复框定为同时满足三条不变量的通用产品规则(生产性工作继续、只有真正的 blocker 才停工、没有死循环),交付一份计划 —— 不带代码改动 —— 在创建子 issue 之前由董事会 / CTO 审批门控。每当 issue 标题或正文要求对一棵停滞、循环或「过度恢复」的树做调查时使用。",
    body: diagnoseBody,
  },
  "paperclip-converting-plans-to-tasks": {
    name: "Paperclip — 把计划拆成任务",
    description:
      "Paperclip 把计划转化为可执行任务的方法。每当你被要求在 Paperclip 公司内做计划、定义范围或拆分工作时使用。这是行业无关的指引,讲如何把计划翻译成带正确专长、依赖、并行度的已分配 issue,让 Paperclip 的执行器能拾起工作 —— 它**不**规定计划格式。与 `paperclip` 技能配合使用,后者覆盖写计划文档与重新指派 issue 的具体操作。",
    body: paperclipConvertingPlansBody,
  },
  "paperclip-create-agent": {
    name: "Paperclip 创建 Agent",
    description:
      "在 Paperclip 中以治理感知方式雇佣并创建新 agent。当你需要查看 adapter 配置项、对比现有 agent 配置、起草新 agent 的 prompt/配置、并提交雇佣申请时使用。",
    body: paperclipCreateAgentBody,
  },
  "paperclip-create-plugin": {
    name: "Paperclip 创建插件",
    description:
      "用当前 alpha SDK / runtime 创建新的 Paperclip 插件。在脚手架插件包、新增示例插件或更新插件作者文档时使用。涵盖受支持的 worker / UI 表面、路由约定、脚手架流程与验证步骤。",
    body: paperclipCreatePluginBody,
  },
  "paperclip-dev": {
    name: "Paperclip 开发与运维",
    description:
      "开发与运维一个本地 Paperclip 实例 —— 启停服务器、从 master 拉更新、跑构建与测试、管理 worktree、备份数据库、诊断问题。每当你需要在 Paperclip 代码库本身上工作或保持运行实例健康时使用。",
    body: paperclipDevBody,
  },
  paperclip: {
    name: "Paperclip 控制平面",
    description:
      "通过 Paperclip 控制平面 API 管理任务、与其他 agent 协作并遵循公司治理。当你需要查看分配、更新任务状态、委派工作、发评论、设置或管理 routine (循环排程任务),或调用任何 Paperclip API 端点时使用。**不要**用它做实际的领域工作(写代码、研究等)—— 仅用于 Paperclip 协调。",
    body: paperclipBody,
  },
  "para-memory-files": {
    name: "PARA 记忆文件",
    description:
      "采用 Tiago Forte 的 PARA 方法、基于文件的记忆系统。每当你需要跨会话存储、检索、更新或组织知识时使用。涵盖三层记忆:(1) PARA 文件夹中的知识图谱,以原子 YAML 事实组织;(2) 每日笔记作为原始时间线;(3) 关于用户行为模式的隐性知识。还覆盖计划文件、记忆衰减、每周综合、以及通过 qmd 召回。任何记忆操作都触发它:保存事实、写每日笔记、创建实体、跑每周综合、召回过往上下文、管理计划。",
    body: paraMemoryFilesBody,
  },
  "terminal-bench-loop": {
    name: "Terminal-Bench 循环",
    description:
      "通过 Paperclip 在一个有界、有人参与的改进循环里跑单个 Terminal-Bench 问题,直到 smoke 通过、董事会拒绝下一次修复、迭代预算耗尽,或命名了真实 blocker。每次迭代在隔离的 Paperclip App worktree 上跑一次有界 smoke,捕获 artifact,用 `/diagnose-why-work-stopped` 诊断精确停止点,在任何产品修复之前申请董事会确认,然后在同一个 worktree 上重跑。每当 issue 要求「在循环里跑 Terminal-Bench」、「驱动 Terminal-Bench 直到通过」、「通过 Paperclip 循环 fix-git」,或者其他指向 Terminal-Bench 任务并要求带诊断的有界迭代时使用。",
    body: terminalBenchLoopBody,
  },
};
