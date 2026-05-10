# PARA 记忆文件

按 Tiago Forte 的 PARA 方法组织的、基于文件的持久化记忆系统。三层结构:知识图谱、每日笔记、隐性知识。所有路径相对于 `$AGENT_HOME`。

## 三层记忆

### 第一层:知识图谱 (`$AGENT_HOME/life/` —— PARA)

按实体存储。每个实体一个文件夹,两层:

1. `summary.md` —— 快速上下文,先加载。
2. `items.yaml` —— 原子事实,按需加载。

```text
$AGENT_HOME/life/
  projects/          # 有明确目标 / 截止日期的活跃工作
    <name>/
      summary.md
      items.yaml
  areas/             # 持续的责任,无截止日期
    people/<name>/
    companies/<name>/
  resources/         # 参考资料,感兴趣的主题
    <topic>/
  archives/          # 来自前三类的非活跃项
  index.md
```

**PARA 规则:**

- **Projects** —— 有目标或截止日期的活跃工作。完成后移到 archives。
- **Areas** —— 持续的责任(人、公司、岗位)。无截止日期。
- **Resources** —— 参考资料、兴趣主题。
- **Archives** —— 任何类别中的非活跃项。

**事实规则:**

- 持久事实立即写入 `items.yaml`。
- 每周:从活跃事实重写 `summary.md`。
- 永不删除事实。改用替代(`status: superseded`,加 `superseded_by`)。
- 当一个实体变为非活跃,把它的文件夹移到 `$AGENT_HOME/life/archives/`。

**何时创建实体:**

- 被提及 3 次或以上,或
- 与用户有直接关系(家人、同事、伴侣、客户),或
- 是用户生活中的重要项目或公司。
- 否则,只在每日笔记中记录。

原子事实的 YAML schema 与记忆衰减规则,见 [references/schemas.md](references/schemas.md)。

### 第二层:每日笔记 (`$AGENT_HOME/memory/YYYY-MM-DD.md`)

事件的原始时间线 —— "何时"层。

- 对话期间持续写入。
- 心跳期间提取持久事实到第一层。

### 第三层:隐性知识 (`$AGENT_HOME/MEMORY.md`)

用户怎么运作 —— 模式、偏好、教训。

- 不是关于世界的事实;是关于用户的事实。
- 学到新的运作模式时随时更新。

## 写下来 —— 不要靠脑记

记忆撑不过会话重启。文件可以。

- 想记住某事 -> 写到文件里。
- "记住这件事" -> 更新 `$AGENT_HOME/memory/YYYY-MM-DD.md` 或对应实体文件。
- 学到一条教训 -> 更新 AGENTS.md、TOOLS.md 或对应技能文件。
- 犯了错 -> 把它写下来,让未来的自己不再重蹈覆辙。
- 落到磁盘的文本文件永远好过临时上下文。

## 记忆召回 —— 用 qmd

用 `qmd`,不要 grep 文件:

```bash
qmd query "what happened at Christmas"   # 带重排序的语义搜索
qmd search "specific phrase"              # BM25 关键词搜索
qmd vsearch "conceptual question"         # 纯向量相似
```

为你的个人目录建索引:`qmd index $AGENT_HOME`

向量 + BM25 + 重排序,即使措辞不同也能找到。

## 计划

把计划放在项目根目录下 `plans/` 中带时间戳的文件里(在个人记忆之外,这样其他 agent 也能访问)。用 `qmd` 搜索计划。计划会过期 —— 如果有更新版本,不要被旧版本误导。当你注意到过期,更新文件标注 `supersededBy`。
