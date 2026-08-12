# Tools

纯前端的在线开发者工具集（部署在中国大陆，含 ICP 备案）。每个工具是一个 Tab：**JSON 编辑器 / JSON 对比 / SQL 格式化 / 时间戳转换 / Base64**。无后端、无账号，所有数据只存在浏览器（localStorage）。

技术栈：**Vue 3.5（`<script setup>` + Composition API）+ Vite 7 + TypeScript**，编辑器基于 **CodeMirror 6**。**没有** Pinia、UI 组件库、CSS 框架——这些能力都是项目内手写的（见下），改动前务必了解，不要引入等价的第三方库。

## 常用命令

```sh
npm run dev          # 本地开发（Vite HMR）
npm run build        # 生产构建（先 vue-tsc 类型检查，再 vite build）
npm run test         # Vitest（watch 模式；加 run 变一次性：npm run test -- run）
npm run type-check   # 仅类型检查（vue-tsc --build）
npm run format       # Prettier 格式化 src/
```

## 架构与关键约定

这些是本项目区别于普通 Vue 模板的地方，改动相关功能时必须遵循：

- **路由 = vue-router 4**。使用 `createWebHistory`，路由定义在 [src/router/index.ts](src/router/index.ts)，5 个路由：`/`（json）、`/diff`（jsonDiff）、`/sql`、`/time`、`/base64`。视图切换在 [App.vue](src/App.vue) 里通过 `<router-view v-slot>` + `<KeepAlive>`（切 Tab 不销毁组件、保留输入）。导航使用 `<router-link>`，当前 Tab 高亮由 `route.name` 计算 `activeTab`。

- **国际化 = vue-i18n 10（Composition API 模式）**。配置在 [src/i18n/index.ts](src/i18n/index.ts)，`legacy: false`。所有 UI 文案必须走 `t('key')`（模板中用 `$t('key')`），禁止硬编码中英文。翻译表是文件内的 `messages` 对象——新增文案要**同时在 `en` 和 `zh` 里加**，只加一边会运行时回退到 key 本身。语言存 localStorage `json-editor-locale`，切换通过 `locale.value = next`。

- **状态管理 = composables（无 Pinia）**。注意共享范围的区别：
  - `useToast` 的 state（`toasts`）定义在**函数外**，是模块级**单例**，跨组件共享。
  - `useTheme` / `useHistory` 的 state 定义在**函数内**，每次调用都是新实例。

- **主题 = `composables/useTheme.ts`**。深色模式通过 `<html data-theme="dark">` 切换，存 localStorage `theme`。所有颜色/间距/圆角/阴影都用 `src/styles/` 里的 CSS 变量（如 `var(--bg-primary)` / `var(--accent-color)`），**不要写死颜色值**。[App.vue](src/App.vue) 的 `handleThemeToggle` 用 View Transitions API 做了圆形扩散切换动画。

- **图标 = `utils/icons.ts` + `<BaseIcon>`**。图标是集中注册的 SVG 内容（`viewBox="0 0 24 24"`，stroke 风格，源自 Lucide/Feather）。用 `<BaseIcon name="copy" :size="16" />` 渲染，`name` 有类型约束。新增图标先加到 `icons.ts`。

- **代码编辑器 = `<CodeMirrorEditor>`**（封装 CodeMirror 6）。用法：`<CodeMirrorEditor v-model="text" :extensions="[sql()]" :placeholder="..." :readonly="false" />`。会自动跟随主题（深色套用 oneDark）。语言高亮用 `@codemirror/lang-*` 的 extension 传入。

- **历史记录 = `composables/useHistory.ts`**。`useHistory('editor-key')` 返回 `{ history, hasHistory, addToHistory, clearHistory, ... }`，存 localStorage `tool-history-{key}`，上限 50 条、自动去重置顶。

- **提示 = `composables/useToast.ts`**。`showToast(msg, type?, duration?)`，`type` 为 `success|error|info|warning`。`<ToastContainer>` 已在 App.vue 挂载一次，各视图直接调 `showToast` 即可。

## 目录结构

```text
src/
  views/            # 每个工具一个视图组件（JsonEditor / SqlEditor / TimeTool / ...）
  components/base/  # 通用基础组件（BaseIcon / CodeMirrorEditor / ToastContainer）
  composables/      # 逻辑与状态（useTheme / useToast / useHistory）
  utils/            # 纯函数（jsonUtils / diffUtils / icons）
  router/           # vue-router 路由配置
  i18n/             # vue-i18n 国际化配置
  styles/           # 全局样式与 CSS 变量（main.css / variables.css）
  __tests__/        # Vitest 单测（主要覆盖 utils 纯函数）
```

路径别名 `@` → `src`（如 `@/composables/useTheme`）。[vite.config.ts](vite.config.ts) 里用 `manualChunks` 手动分包（vue / codemirror / sql-formatter 各自成 chunk）。

## 新增一个工具 Tab（完整步骤）

以加一个 `foo` 工具为例，需改动 5 处：

1. **`src/views/FooTool.vue`** — 新建视图。参考 [SqlEditor.vue](src/views/SqlEditor.vue) 的结构（`useI18n` / `useToast` / `useHistory` / `<CodeMirrorEditor>` / `<BaseIcon>` 的组合方式）。
2. **`src/router/index.ts`** — `routes` 数组加 `{ path: '/foo', name: 'foo', component: () => import('@/views/FooTool.vue') }`。
3. **`src/App.vue`** — `nav-tabs` 加一个 `<router-link to="/foo" class="nav-tab" :class="{ active: activeTab === 'foo' }">`。
4. **`src/i18n/index.ts`** — 在 `en` 和 `zh` 的 `messages` 里都加该工具用到的文案 key。
c5. **`src/utils/icons.ts`** — 加导航用的图标。

## 代码风格与测试

- **Prettier**（[.prettierrc.json](.prettierrc.json)）：**无分号、单引号、printWidth 100**。部分早期文件（`useTheme`、`CodeMirrorEditor`、`BaseIcon` 等）仍带分号、尚未统一——新代码请遵循上述配置，必要时 `npm run format`。
- **组件**统一 `<script setup lang="ts">`；props/emits 用类型化的 `defineProps<T>()` / `defineEmits<T>()`；样式用 `<style scoped>`。
- **测试**用 Vitest + `@vue/test-utils` + jsdom，放 `src/__tests__/`。业务逻辑尽量抽到 `utils/` 的纯函数里以便单测（见 [jsonUtils.spec.ts](src/__tests__/jsonUtils.spec.ts)）。
