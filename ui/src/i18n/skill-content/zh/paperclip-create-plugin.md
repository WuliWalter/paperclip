# 创建一个 Paperclip 插件

当任务是创建、脚手架或者编写 Paperclip 插件文档时,使用本技能。

## 1. 基本规则

需要时先读这些:

1. `doc/plugins/PLUGIN_AUTHORING_GUIDE.md`
2. `packages/plugins/sdk/README.md`
3. `doc/plugins/PLUGIN_SPEC.md` 仅作为面向未来的上下文

当前运行时假设:

- 插件 worker 是受信任的代码
- 插件 UI 是同源宿主中的受信任代码
- worker API 受能力(capability)门控
- 插件 UI **不**会被 manifest 能力沙盒化
- 目前还**没有**宿主提供的共享插件 UI 组件库
- `ctx.assets` 在当前运行时**不被支持**

## 2. 推荐工作流

使用脚手架包,而不是手写样板代码:

```bash
pnpm --filter @paperclipai/create-paperclip-plugin build
node packages/plugins/create-paperclip-plugin/dist/index.js <npm-package-name> --output <target-dir>
```

如果插件不在 Paperclip 仓库内,传入 `--sdk-path`,让脚手架把本地 SDK / shared 包快照到 `.paperclip-sdk/`:

```bash
pnpm --filter @paperclipai/create-paperclip-plugin build
node packages/plugins/create-paperclip-plugin/dist/index.js @acme/plugin-name \
  --output /absolute/path/to/plugin-repos \
  --sdk-path /absolute/path/to/paperclip/packages/plugins/sdk
```

仓库内推荐位置:

- `packages/plugins/examples/` 用于示例插件
- 单独的 `packages/plugins/<name>/` 目录,如果它正在演化成正式包

## 3. 脚手架之后

检查并调整:

- `src/manifest.ts`
- `src/worker.ts`
- `src/ui/index.tsx`
- `tests/plugin.spec.ts`
- `package.json`

确保插件:

- 仅声明受支持的能力
- 不使用 `ctx.assets`
- 不引用宿主 UI 组件桩
- UI 自包含
- 仅在 `page` slot 上使用 `routePath`
- 开发期通过本地绝对路径安装到 Paperclip

## 4. 如果插件需要在 app 中可见

要让示例/可发现行为成为内置内容,更新对应的宿主接线:

- `server/src/routes/plugins.ts` 中的内置示例列表
- 任何列出仓库内示例的文档

只有用户希望把这个插件作为内置示例曝光时才做这一步。

## 5. 验证

务必运行:

```bash
pnpm --filter <plugin-package> typecheck
pnpm --filter <plugin-package> test
pnpm --filter <plugin-package> build
```

如果你也修改了 SDK / 宿主 / 插件运行时代码,根据情况运行更广的仓库检查。

## 6. 文档要求

撰写或更新插件文档时:

- 区分当前实现与未来 spec 设想
- 明确说明受信任代码模型
- 不要承诺宿主 UI 组件或 asset API
- 生产部署上,优先推荐 npm 包发布,而不是仓库内工作流
