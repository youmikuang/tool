# Implementation Plan: 证件/卡证图片处理与水印工具

**Branch**: `image-tool` | **Date**: 2026-08-12 (updated 2026-08-13) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/image-tool/spec.md`

## Summary

在 `/card` 路由下新增证件图片处理工具，支持选择证件类型（单面/双面）、
弹窗裁剪（自由绘制裁剪框，不锁定比例）、Canvas 动态水印、正反面合并导出。
全部基于浏览器 Canvas/HTML5 API 实现，不引入任何第三方依赖。

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) + Vue 3.5 (`<script setup>` + Composition API)

**Primary Dependencies**: vue-router 4 (路由), vue-i18n 10 (国际化), 无新增 npm 依赖

**Storage**: 浏览器内存（File/Blob/DataURL），不上传服务器，不持久化

**Testing**: Vitest 4 + @vue/test-utils + jsdom（纯函数单测放在 `src/__tests__/imageUtils.spec.ts`）

**Target Platform**: 桌面浏览器（Chrome/Edge/Firefox/Safari 最新两个主版本）

**Project Type**: 单页 Web 应用（Vue SPA 前端工具）

**Performance Goals**: 10MB 图片裁剪+水印 <3s；水印预览更新 <200ms（debounce）；页面懒加载 <2s

**Constraints**: 纯前端 Canvas API；无后端服务；不引入新 npm 依赖；所有 UI 文案 vue-i18n 双语；所有颜色 CSS 变量

**Scale/Scope**: 单视图组件 + 6 个子组件 + 1 个 utils 模块；约 1500-1800 行代码

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
| ----------- | -------- | ---------- |
| I. 纯前端零依赖架构 | ✅ PASS | 仅使用浏览器 Canvas/FileReader/Blob API，不引入任何新 npm 依赖 |
| II. 工具 Tab 模式 | ✅ PASS | `/card` 路由懒加载，独立视图组件，遵循标准 5 步新增流程 |
| III. 国际化优先 | ✅ PASS | 所有 UI 文案定义在 i18n 双语言表中，无硬编码字符串 |
| IV. CSS 变量主题 | ✅ PASS | 所有颜色使用项目已有 CSS 变量，支持深色/浅色模式 |
| V. 组件与工具分层 | ✅ PASS | 纯函数在 `utils/imageUtils.ts`，可复用组件在 `components/base/` 可考虑 |

**Post-Design Re-check**: ✅ 所有原则通过。数据模型、合约、快速验证指南均遵循宪章约束。

## Project Structure

### Documentation (this feature)

```text
.specify/specs/image-tool/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: 技术选型研究
├── data-model.md        # Phase 1: 数据模型
├── quickstart.md        # Phase 1: 验证指南
└── contracts/           # Phase 1: 接口合约
    ├── ImageToolView.contract.md   # 组件树与 i18n keys
    └── CanvasUtils.contract.md     # Canvas 工具函数签名
```

### Source Code (repository root)

```text
src/
├── views/
│   └── ImageTool.vue            # 主视图组件（路由入口 /card）
├── components/
│   ├── image/                   # 图片工具专属组件
│   │   ├── CardTypeSelector.vue # 证件类型下拉选择
│   │   ├── UploadSlot.vue       # 上传槽位（单面/双面各1个，缩略图 70% 尺寸）
│   │   ├── CropModal.vue        # 裁剪弹窗（自由绘制，window 监听拖动）
│   │   ├── WatermarkPanel.vue   # 水印配置面板（4 行纵向布局）
│   │   ├── PreviewArea.vue      # 预览区（A4 纸，无滚轮缩放）
│   │   └── ActionBar.vue        # 操作栏（位于左栏底部）
├── utils/
│   └── imageUtils.ts            # Canvas 图片处理纯函数
├── i18n/
│   └── index.ts                 # 新增 card 工具的所有 i18n keys
├── router/
│   └── index.ts                 # 新增 /card 路由
└── __tests__/
    └── imageUtils.spec.ts       # imageUtils 纯函数单测
```

**Structure Decision**: 图片工具组件放在 `src/components/image/` 子目录下，
与现有 `base/` 组件区分。纯函数放 `src/utils/imageUtils.ts`，遵循项目分层约定。

## Complexity Tracking

> 无违规项，此表为空。
