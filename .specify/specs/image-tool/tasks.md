# Tasks: 证件/卡证图片处理与水印工具

> 图片布局参考 image-high.png, image-two.png, image-width.png 三个图片

**Input**: Design documents from `.specify/specs/image-tool/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, image-high.png, image-two.png, image-width.png

**Tests**: 纯函数单测（`imageUtils.spec.ts`），覆盖裁剪、合并、水印合成、校验函数。

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 路由注册、i18n 文案、图标——项目集成骨架

- [x] T001 Add `/image` route with lazy-load in `src/router/index.ts`
- [x] T002 [P] Add `image` navigation icon SVG in `src/utils/icons.ts`
- [x] T003 [P] Add all image-tool i18n keys to both `en` and `zh` in `src/i18n/index.ts`
- [x] T004 Add `<router-link to="/image">` nav tab in `src/App.vue`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 类型定义 + Canvas 纯函数工具——所有用户故事的前置依赖

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Define TypeScript types (CardType, ImageSlot, CropConfig, WatermarkConfig) in `src/utils/imageUtils.ts`
- [x] T006 [P] Implement `blobToDataUrl` and `fileToImage` helper functions in `src/utils/imageUtils.ts`
- [x] T007 [P] Implement `downloadBlob` helper function in `src/utils/imageUtils.ts`
- [x] T008 [P] Implement validation functions (`validateImageFile`, `validateCropConfig`, `validateWatermarkConfig`) in `src/utils/imageUtils.ts`
- [x] T009 Implement `cropImage(image, config): Promise<Blob>` in `src/utils/imageUtils.ts`
- [x] T010 [P] Implement `applyWatermark(imageBlob, config): Promise<Blob>` in `src/utils/imageUtils.ts`
- [x] T011 [P] Implement `mergeDoubleSided(frontBlob, backBlob): Promise<Blob>` in `src/utils/imageUtils.ts`
- [x] T012 [P] Write unit tests for `imageUtils.ts` pure functions in `src/__tests__/imageUtils.spec.ts`

**Checkpoint**: Foundation ready — all Canvas utils + types + validators available, user story implementation can begin

---

## Phase 3: User Story 1 - 单面证件处理 (Priority: P1) 🎯 MVP

**Goal**: 用户选择单面证件类型 → 上传裁剪 → 加水印 → 预览 → 导出。覆盖学历证、学位证、银行卡等所有单面类型。

**Independent Test**: 主页下拉选"学历证" → 点击上传框 → 弹窗裁剪确认 → 水印区输入文字 → 预览区确认 → 导出下载。

### Implementation for User Story 1

- [x] T013 [P] [US1] Create `CardTypeSelector.vue` — card type dropdown with v-model in `src/components/image/CardTypeSelector.vue`
- [x] T014 [P] [US1] Create `UploadSlot.vue` — single upload box with thumbnail preview in `src/components/image/UploadSlot.vue`
- [x] T015 [P] [US1] Create `WatermarkPanel.vue` — watermark config form (text, opacity, font size, position, color) in `src/components/image/WatermarkPanel.vue`
- [x] T016 [P] [US1] Create `PreviewArea.vue` — single preview image display in `src/components/image/PreviewArea.vue`
- [x] T017 [US1] Create `CropModal.vue` — fullscreen crop dialog with locked aspect ratio, drag/resize/rotate left/right/reset in `src/components/image/CropModal.vue`
- [x] T018 [US1] Create `ActionBar.vue` — reset and export buttons in `src/components/image/ActionBar.vue`
- [x] T019 [US1] Create `ImageTool.vue` main view — compose all sub-components, manage PageState (single-sided flow), wire up crop modal open/close, preview update on watermark change, export flow in `src/views/ImageTool.vue`
- [x] T020 [US1] Implement card type switch flow: single-sided → 1 slot, with confirmation dialog on switch in `src/views/ImageTool.vue`

**Checkpoint**: User Story 1 fully functional — single-sided card processing complete (MVP!)

---

## Phase 4: User Story 2 - 双面证件处理 (Priority: P2)

**Goal**: 扩展 US1 支持双面证件（身份证等）→ 正反面分别裁剪 → 上下合并预览 → 合并导出。

**Independent Test**: 主页下拉选"身份证" → 正面框上传裁剪 → 反面框上传裁剪 → 水印区输入文字 → 预览区显示正反面合并效果 → 导出。

### Implementation for User Story 2

- [x] T021 [US2] Extend `ImageTool.vue` to support double-sided mode: 2 UploadSlots with front/back labels, conditional merge logic in `src/views/ImageTool.vue`
- [x] T022 [US2] Extend `PreviewArea.vue` to display merged double-sided preview (top: front, bottom: back with gap) in `src/components/image/PreviewArea.vue`
- [x] T023 [US2] Implement double-sided export: call `mergeDoubleSided` then `applyWatermark` then `downloadBlob` in `src/views/ImageTool.vue`
- [x] T024 [US2] Handle partial upload edge case: only one side uploaded → export available side with toast warning in `src/views/ImageTool.vue`

**Checkpoint**: User Stories 1 AND 2 both independently functional

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error handling, UI polish, validation

- [x] T025 [P] Add edge case handling: file type validation, file size limit (20MB), crop size minimum (100px), browser Canvas support check in `src/views/ImageTool.vue`
- [x] T026 [P] Add watermark empty-text handling: allow export without watermark or show confirmation toast in `src/views/ImageTool.vue`
- [x] T027 [P] Add card type switch confirmation dialog with `window.confirm` or custom modal in `src/views/ImageTool.vue`
- [x] T028 Add reset functionality: clear all slots, reset watermark to defaults in `src/views/ImageTool.vue`
- [x] T029 Run quickstart.md validation scenarios (all 7 scenarios) manually
- [x] T030 [P] Run `npm run type-check` and fix any TypeScript errors
- [x] T031 [P] Run `npm run format` to ensure Prettier compliance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001 for route, T003 for i18n) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on US1 (extends ImageTool.vue, PreviewArea.vue)
- **Polish (Phase 5)**: Depends on US1 and US2 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 completion (extends same components)

### Within Each User Story

- Sub-components marked [P] can be created in parallel (different files)
- `CropModal.vue` before `ImageTool.vue` (T017 → T019)
- `ImageTool.vue` is the integration point, done last in each story phase

### Parallel Opportunities

- T002, T003 in Setup can run in parallel
- T006, T007, T008 in Foundational can run in parallel
- T009, T010, T011 in Foundational can run in parallel (after T005 types)
- T013, T014, T015, T016 in US1 can run in parallel (independent components)
- T025, T026, T027 in Polish can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all independent sub-components together:
Task: "Create CardTypeSelector.vue in src/components/image/CardTypeSelector.vue"
Task: "Create UploadSlot.vue in src/components/image/UploadSlot.vue"
Task: "Create WatermarkPanel.vue in src/components/image/WatermarkPanel.vue"
Task: "Create PreviewArea.vue in src/components/image/PreviewArea.vue"

# Then sequentially:
Task: "Create CropModal.vue in src/components/image/CropModal.vue"
Task: "Create ActionBar.vue in src/components/image/ActionBar.vue"

# Finally integrate:
Task: "Create ImageTool.vue main view in src/views/ImageTool.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T012)
3. Complete Phase 3: User Story 1 (T013-T020)
4. **STOP and VALIDATE**: Test single-sided flow independently per quickstart.md Scenario 1
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP!)
3. Add User Story 2 → Test independently → Deploy
4. Polish → Final validation → Release

---

## Notes

- [P] tasks = different files, no dependencies
- [US1]/[US2] labels map tasks to specific user story for traceability
- Each user story is independently completable and testable
- No new npm dependencies required — all Canvas/FileReader/Blob APIs are native
- All colors use existing CSS variables, no hardcoded values
- All UI text uses vue-i18n `t('key')`, en + zh required
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Phase 6: Bugfix & Polish (Post-Implementation)

**Purpose**: 修复上线后发现的交互问题和体验优化

- [x] T032 [BUG] Fix crop modal dismiss: overlay click (`@mousedown.self`), X button (`@click.stop`), ESC key — all close properly in `src/components/image/CropModal.vue`
- [x] T033 [BUG] Fix cancel crop clearing original file: move `index` capture before `croppingSlotIndex = -1` in `handleCropCancel` in `src/views/ImageTool.vue`
- [x] T034 [UX] Split rotate into left-rotate (270°) and right-rotate (90°) as two separate buttons in `src/components/image/CropModal.vue`
- [x] T035 [UX] Add mouse wheel zoom (20%-500%) to PreviewArea with scale percentage display and reset button in `src/components/image/PreviewArea.vue`
- [x] T036 [FIX] CardTypeSelector binding: use `@update:model-value` event instead of `v-model` to trigger `handleCardTypeChange` (which initializes slots) in `src/views/ImageTool.vue`
- [x] T037 [UX] Show upload area hint ("Please select card type first") when no type selected, instead of hiding the section entirely in `src/views/ImageTool.vue`

---

## Phase 7: Layout & Feature Enhancement

**Purpose**: 布局优化、水印倾斜度、裁剪滚轮缩放

- [x] T038 [FEAT] Add `angle` field to `WatermarkConfig` (default -45°), implement rotated text drawing in `applyWatermark` in `src/utils/imageUtils.ts`
- [x] T039 [FEAT] Add angle selector (-45°~45°) to WatermarkPanel in `src/components/image/WatermarkPanel.vue`
- [x] T040 [UX] Redesign WatermarkPanel as single-row layout with all controls inline in `src/components/image/WatermarkPanel.vue`
- [x] T041 [FEAT] Add wheel zoom (30%-300%) to CropModal for scaling the displayed image in `src/components/image/CropModal.vue`
- [x] T042 [UX] Redesign ImageTool layout as left-right two-column: left (380px) = type selector + upload + watermark, right (flex:1) = preview in `src/views/ImageTool.vue`
- [x] T043 [UX] Compact UploadSlot sizes (min-height 110px) and PreviewArea to fit without vertical scrollbar in `src/components/image/UploadSlot.vue`, `src/components/image/PreviewArea.vue`
- [x] T044 [i18n] Add `angle` i18n key (en: "Angle" / zh: "倾斜度") in `src/i18n/index.ts`

---

## Phase 8: Layout Redesign (Reference image-high/image-two/image-width)

**Purpose**: 严格按照 3 张参考图片重做布局：左栏 280px 纵向 4 控件水印面板 / 右栏 A4 纸预览

- [x] T045 [FEAT] Add `density` field to `WatermarkConfig` (0..1, controls watermark tile spacing Low..High) in `src/utils/imageUtils.ts`
- [x] T046 [FEAT] `applyWatermark` tile mode uses density to compute spacing: `60 + (1 - density) * 340` px in `src/utils/imageUtils.ts`
- [x] T047 [UX] Rewrite `WatermarkPanel.vue` as **vertical 4-row layout**: Text + Density (Low/High) + Opacity/Size + Angle/Color in `src/components/image/WatermarkPanel.vue`
- [x] T048 [UX] Rewrite `UploadSlot.vue` — icon above label, dashed 1.5px border #b8c2d0, min-height 90px in `src/components/image/UploadSlot.vue`
- [x] T049 [UX] Rewrite `PreviewArea.vue` — **A4 paper (794×1123 px) live preview**, accepts `slots`/`watermark`/`isDoubleSided` props, gray placeholder + "A4 PAPER (210X297MM)" label when empty, white background with shadow when filled in `src/components/image/PreviewArea.vue`
- [x] T050 [UX] Rewrite `ImageTool.vue` — left column 280px, right column flex:1, PreviewArea now self-composes A4 internally from slots+watermark in `src/views/ImageTool.vue`
- [x] T051 [i18n] Add `density` (en/zh), `a4Paper` (en/zh), `watermarkConfig` (en/zh) i18n keys in `src/i18n/index.ts`
- [x] T052 [TEST] Update `createDefaultWatermarkConfig` test to include `angle: -45` and `density: 0.5` in `src/__tests__/imageUtils.spec.ts`

---

## Phase 9: Route Rename & Layout Finalization (2026-08-13)

**Purpose**: 路由重命名、裁剪交互重构、布局精修

- [x] T053 [FEAT] Rename route `/image` → `/card`, name `image` → `card` in `src/router/index.ts`
- [x] T054 [i18n] Add `card` key (en: "Card" / zh: "证件") in `src/i18n/index.ts`, update App.vue nav-link
- [x] T055 [UX] Move ActionBar from full-width bottom bar into left column bottom in `src/views/ImageTool.vue`
- [x] T056 [FIX] Fix crop modal white screen: add `{ immediate: true }` to `watch(imageDataUrl)` in `src/components/image/CropModal.vue`
- [x] T057 [UX] Remove wheel zoom from PreviewArea (scale state, onWheel, resetZoom, zoom-info UI) in `src/components/image/PreviewArea.vue`
- [x] T058 [UX] CropModal: free-draw crop box (no aspect ratio lock), click empty area to draw new box, remove move mode in `src/components/image/CropModal.vue`
- [x] T059 [UX] CropModal: window-level mousemove/mouseup listeners so dragging continues outside canvas in `src/components/image/CropModal.vue`
- [x] T060 [UX] UploadSlot: thumbnail wrapper 70% width/height centered in `src/components/image/UploadSlot.vue`
- [x] T061 [FEAT] `composeOnA4` single-sided: 80% width × 50% height; double-sided: 70% width, ID ratio 1.586 in `src/utils/imageUtils.ts`
- [x] T062 [UX] PreviewArea placeholder: `aspect-ratio: 1.586`, border `#c3c6d7`, 80% width in `src/components/image/PreviewArea.vue`
- [x] T063 [UX] ImageTool padding `80px 24px 48px` (align with other tool pages) in `src/views/ImageTool.vue`
- [x] T064 [FEAT] Update default watermark config: opacity 0.3→0.5, fontSize 48→20, density 0.5→0.7 in `src/utils/imageUtils.ts`
- [x] T065 [UX] WatermarkPanel: add "字号" label above select (same row as "透明度") in `src/components/image/WatermarkPanel.vue`
- [x] T066 [FIX] Fix TypeScript errors in `imageUtils.ts`: `drawRotatedText` arrow function with ctx param, `loadedImages[0]!` non-null assertion
