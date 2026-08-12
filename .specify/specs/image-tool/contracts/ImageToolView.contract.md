# UI Contract: ImageTool View

**Feature**: image-tool | **Date**: 2026-08-12 (updated 2026-08-13)

## Component Tree

```
ImageTool.vue (padding: 80px 24px 48px)
├── Left Column (280px, bg #f3f4f6)
│   ├── CardTypeSelector        # 证件类型下拉选择
│   ├── UploadSlots             # 上传区容器
│   │   └── UploadSlot (×1 or ×2)  # 单个上传槽位（缩略图 70% 尺寸）
│   ├── WatermarkPanel          # 水印配置面板（4 行纵向）
│   ├── Spacer (flex:1)         # 撑开剩余空间
│   └── ActionBar               # 操作栏（底部贴底，Reset 左 Export 右）
├── Right Column (flex:1)
│   └── PreviewArea             # 预览区（A4 纸，无滚轮缩放）
└── CropModal                   # 裁剪弹窗（条件渲染，Teleport to body）
```

## Route

```
path: '/card'
name: 'card'
component: () => import('@/views/ImageTool.vue')
```

## Component Props & Events

### CardTypeSelector

| Prop | Type | Description |
|------|------|-------------|
| `modelValue` | `string \| null` | 当前选中类型 ID |
| `types` | `CardType[]` | 可用类型列表 |

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string` | 类型变更 |

### UploadSlot

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | 槽位标签 |
| `thumbnail` | `string \| null` | 裁剪后缩略图 data URL |
| `disabled` | `boolean` | 是否禁用（未选类型时） |

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | — | 点击上传框 |

**Styling**: 容器 `height: 120px`；缩略图 wrapper `width: 70%; height: 70%` 居中。

### CropModal

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | 弹窗可见性 |
| `imageDataUrl` | `string` | 原始图片 data URL |

| Event | Payload | Description |
|-------|---------|-------------|
| `confirm` | `{ blob: Blob, config: CropConfig }` | 确认裁剪 |
| `cancel` | — | 取消裁剪 |

**Interaction**:
- 在 canvas 空白处按下鼠标拖动 → 绘制新裁剪框（自由比例，不锁定）
- 拖动四角手柄 → 微调裁剪框大小
- **不支持**裁剪框内部点击移动（点击内部也触发绘制新框）
- 鼠标超出 canvas 边界时仍能继续追踪（window 监听 mousemove/mouseup）
- 使用 `:key` 强制每次重新挂载（避免白屏 bug）
- `watch(imageDataUrl, ..., { immediate: true })` 确保首次挂载加载图片

### WatermarkPanel

**4 行纵向布局**：
1. Text 文字输入框
2. Density 密度滑块（Low..High）
3. Opacity 透明度滑块 + Size 字号选择（label 在上方同行）
4. Angle 倾斜度选择 + Color 颜色选择器

| Prop | Type | Description |
|------|------|-------------|
| `modelValue` | `WatermarkConfig` | 水印配置（双向绑定） |

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `WatermarkConfig` | 配置变更 |

**Defaults**: opacity 0.5, fontSize 20, density 0.7, angle -45

### PreviewArea

| Prop | Type | Description |
|------|------|-------------|
| `slots` | `ImageSlot[]` | 上传槽位数组 |
| `watermark` | `WatermarkConfig` | 水印配置 |
| `isDoubleSided` | `boolean` | 是否双面模式 |

**Features**:
- 内部调用 `composeOnA4` + `applyWatermark` 实时合成预览（200ms debounce）
- A4 纸：`aspect-ratio: 0.707`，`height: 85%`，白色 + 双层阴影
- 容器背景 `#f3f4f6`
- 空白时显示灰色占位框（`aspect-ratio: 1.586`，ID 卡比例）+ "A4 PAPER (210X297MM)" 标签
- **无滚轮缩放**（已移除）

### ActionBar

| Prop | Type | Description |
|------|------|-------------|
| `canExport` | `boolean` | 是否可导出（至少一个槽位已裁剪） |
| `exporting` | `boolean` | 是否正在导出 |

| Event | Payload | Description |
|-------|---------|-------------|
| `reset` | — | 重置所有状态 |
| `export` | — | 导出图片 |

**Styling**: `justify-content: flex-start`，两按钮靠左并排；上方 `border-top` 分隔线。

## i18n Keys Required

```typescript
// 新增 i18n keys（需同时添加到 en 和 zh）
{
  // Header nav
  image: 'Image' / '图片',  // 保留，其他地方使用
  card: 'Card' / '证件',     // 导航栏标签

  // Card type selector
  selectCardType: 'Select Card Type' / '选择证件类型',
  cardType_id_card: 'ID Card' / '身份证',
  cardType_degree_cert: 'Degree Certificate' / '学历证',
  cardType_diploma: 'Diploma' / '学位证',
  cardType_bank_card: 'Bank Card' / '银行卡',
  cardType_social_card: 'Social Security Card' / '社保卡',
  cardType_driver_license: 'Driver License' / '驾驶证',
  cardType_passport: 'Passport' / '护照',
  cardType_custom: 'Custom' / '自定义',

  // Upload slots
  uploadFront: 'Click to upload front side' / '点击上传正面',
  uploadBack: 'Click to upload back side' / '点击上传反面',
  frontSide: 'Front (Photo Side)' / '正面（人像面）',
  backSide: 'Back (Emblem Side)' / '反面（国徽面）',
  reCrop: 'Click to re-crop' / '点击重新裁剪',
  selectCardTypeFirst: 'Please select card type first' / '请先选择证件类型',

  // Crop modal
  confirmCrop: 'Confirm Crop' / '确认裁剪',
  cancelCrop: 'Cancel' / '取消',
  resetCrop: 'Reset' / '重置',
  rotateLeftCrop: 'Rotate Left' / '左旋',
  rotateRightCrop: 'Rotate Right' / '右旋',

  // Watermark
  watermarkText: 'Watermark Text' / '水印文字',
  watermarkPlaceholder: 'e.g. For XX Use Only' / '例如：仅供XX办理使用',
  watermarkConfig: 'Watermark Config' / '水印配置',
  opacity: 'Opacity' / '透明度',
  fontSize: 'Font Size' / '字号',
  density: 'Density' / '密度',
  angle: 'Angle' / '倾斜度',
  color: 'Color' / '颜色',

  // Preview & Export
  preview: 'Preview' / '预览',
  a4Paper: 'A4 PAPER (210X297MM)' / 'A4 PAPER (210X297MM)',
  exportImage: 'Export Image' / '导出图片',
  reset: 'Reset' / '重置',
  exporting: 'Exporting...' / '导出中...',
  switchTypeWarning: 'Switching type will clear uploaded images. Continue?' / '切换类型将清空已上传的图片，是否继续？',
  noWatermarkWarning: 'No watermark text entered, continue?' / '未输入水印文字，是否继续？',
  partialExport: 'Only exported uploaded sides' / '仅导出了已上传面',
  fileTooLarge: 'Image too large, please compress before upload' / '图片过大，请压缩后上传',
  invalidImageType: 'Please upload JPG or PNG images' / '请上传 JPG 或 PNG 格式的图片',
  browserNotSupported: 'Please use Chrome or Edge browser' / '请使用 Chrome/Edge 浏览器',
}
```

## CSS Variables Used

所有颜色必须使用项目已有 CSS 变量，不新增变量：

- 背景: `var(--bg-primary)`, `var(--bg-secondary)`, `var(--bg-app)`
- 文字: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
- 边框: `var(--border-color)`
- 强调色: `var(--accent-color)`, `var(--accent-hover)`
- 错误色: `var(--error-color)`, `var(--error-bg)`
- 圆角: `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`
- 阴影: `var(--shadow-sm)`, `var(--shadow-md)`, `var(--shadow-lg)`
- 间距: `var(--space-*)`
- 字体: `var(--font-mono)` (水印预览)

## Hardcoded Colors (Design-specific)

以下颜色为设计图精确采样值，不使用 CSS 变量（与原型图 1:1 匹配）：

- 左栏背景: `#f3f4f6`
- 右栏内层背景: `#f3f4f6`
- A4 纸: `#ffffff`
- 占位框边框: `#c3c6d7`
- 占位框背景: `#f3f5f9`
- A4 标签文字: `#b0b8c4`
