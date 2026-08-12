<!--
  Sync Impact Report
  ==================
  Version change: N/A (template) → 1.0.0 (initial ratification)
  Principles defined:
    - I. 纯前端零依赖架构 (new)
    - II. 工具 Tab 模式 (new)
    - III. 国际化优先 (new)
    - IV. CSS 变量主题 (new)
    - V. 组件与工具分层 (new)
  Added sections:
    - 技术栈约束
    - 开发工作流
  Removed sections: none (template was empty)
  Deferred TODOs: none
  Follow-up: none
-->

# Tools Constitution

纯前端在线开发者工具集的治理宪章。本项目部署于中国大陆（含 ICP 备案），每个工具为一个 Tab，无后端、无账号，所有数据仅存于浏览器 localStorage。

## Core Principles

### I. 纯前端零依赖架构

本项目 MUST 保持纯前端架构，不得引入后端服务、数据库或用户账号系统。
MUST NOT 引入 Pinia、UI 组件库（如 Element Plus、Ant Design）或 CSS 框架（如 Tailwind CSS）。
所有第三方依赖引入前 MUST 评估必要性——优先使用项目内手写实现。

**Rationale**: 项目定位为轻量工具集，零依赖架构确保部署简单、无服务器成本、用户数据隐私安全。

### II. 工具 Tab 模式

每个工具 MUST 作为独立视图组件（`src/views/`）存在，通过 vue-router 4 懒加载路由挂载。
新增工具 MUST 遵循标准 5 步流程：创建视图 → 添加路由 → 更新导航 → 添加 i18n 文案 → 添加图标。
视图切换 MUST 使用 `<KeepAlive>` 保持组件状态，用户输入不丢失。

**Rationale**: 统一的 Tab 模式降低新增工具的学习成本，KeepAlive 提升用户体验。

### III. 国际化优先

所有面向用户的 UI 文案 MUST 通过 vue-i18n（`t('key')` 或模板 `$t('key')`）输出。
新增文案 MUST 同时在 `en` 和 `zh` 翻译表中添加，禁止硬编码中英文字符串。
语言偏好 MUST 持久化至 localStorage（key: `json-editor-locale`）。

**Rationale**: 项目面向中英文用户，国际化优先避免后期返工。

### IV. CSS 变量主题

所有颜色、间距、圆角、阴影 MUST 使用 `src/styles/` 中定义的 CSS 变量（如 `var(--bg-primary)`、`var(--accent-color)`）。
MUST NOT 在组件中写死颜色值。深色/浅色模式通过 `<html data-theme="dark">` 切换。
主题切换 SHOULD 使用 View Transitions API 提供平滑动画过渡。

**Rationale**: CSS 变量确保主题一致性和可维护性，View Transitions API 提升视觉体验。

### V. 组件与工具分层

代码 MUST 遵循以下分层：

- `composables/` — 可复用状态逻辑（useTheme、useToast、useHistory）
- `utils/` — 纯函数工具（jsonUtils、diffUtils、icons），无副作用，可独立单测
- `components/base/` — 通用基础组件（BaseIcon、CodeMirrorEditor、ToastContainer）
- `views/` — 各工具页面，组合 composables + base 组件

业务逻辑 SHOULD 尽量抽到 `utils/` 的纯函数中以支持单元测试。

**Rationale**: 清晰的分层降低耦合度，纯函数易于测试和维护。

## 技术栈约束

- **框架**: Vue 3.5（`<script setup>` + Composition API）
- **构建**: Vite 7
- **语言**: TypeScript 5.9（strict mode）
- **路由**: vue-router 4（createWebHistory）
- **国际化**: vue-i18n 10（Composition API 模式，legacy: false）
- **编辑器**: CodeMirror 6（通过 vue-codemirror 封装）
- **SQL 格式化**: sql-formatter
- **测试**: Vitest 4 + @vue/test-utils + jsdom
- **格式化**: Prettier 3.8（无分号、单引号、printWidth 100）
- **包管理**: npm（engines: node ^20.19.0 || >=22.12.0）
- **分包策略**: manualChunks 手动分离 vendor-vue、vendor-codemirror、vendor-utils

## 开发工作流

1. **开发**: `npm run dev`（Vite HMR）
2. **构建**: `npm run build`（先 vue-tsc 类型检查，再 vite build）
3. **测试**: `npm run test`（Vitest watch 模式；`npm run test -- run` 一次性运行）
4. **格式化**: `npm run format`（Prettier 格式化 src/）
5. **类型检查**: `npm run type-check`（vue-tsc --build）

新增工具 Tab 的标准步骤：

1. 创建 `src/views/NewTool.vue`
2. 在 `src/router/index.ts` 添加路由
3. 在 `src/App.vue` 添加导航 `<router-link>`
4. 在 `src/i18n/index.ts` 的 `en` 和 `zh` 中添加文案
5. 在 `src/utils/icons.ts` 添加导航图标

## Governance

本宪章是项目最高治理文件，所有代码变更 MUST 符合宪章规定。
宪章修订 MUST 遵循以下流程：

1. 提出修订议案并说明理由
2. 更新宪章文件并递增版本号（语义化版本）
3. 在 Sync Impact Report 中记录变更

合规性审查：每个 PR MUST 验证是否违反核心原则，特别是：

- 是否引入被禁用的第三方依赖（Pinia、UI 库、CSS 框架）
- 是否硬编码 UI 文案（必须走 i18n）
- 是否写死颜色值（必须用 CSS 变量）
- 新增工具是否遵循标准 5 步流程

**Version**: 1.0.0 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-08-12
