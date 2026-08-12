# Data Model: 证件/卡证图片处理工具

**Feature**: image-tool | **Date**: 2026-08-12

## Entities

### CardType

证件类型定义。静态配置，不参与运行时状态变更。

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | 唯一标识，如 `'id_card'`、`'degree_cert'` |
| `label` | `{ en: string, zh: string }` | 显示名称（国际化） |
| `sides` | `'single' \| 'double'` | 单面 / 双面 |
| `aspectRatio` | `number` | 裁剪宽高比（width/height），如 1.586 |
| `sideLabels` | `{ front: { en, zh }, back?: { en, zh } }` | 正反面标注文字 |
| `defaultSize` | `{ width: number, height: number }` | 预设裁剪尺寸（mm），如身份证 85.6×54 |

**Preset values**:

| id | sides | aspectRatio | size (mm) |
|----|-------|-------------|-----------|
| `id_card` | double | 1.586 | 85.6×54 |
| `degree_cert` | single | 1.414 | 297×210 |
| `diploma` | single | 1.414 | 297×210 |
| `bank_card` | single | 1.586 | 85.6×54 |
| `social_card` | single | 1.586 | 85.6×54 |
| `driver_license` | double | 1.586 | 85.6×54 |
| `passport` | single | 0.707 | 88×125 |
| `custom` | single | 1.0 (free) | — |

### ImageSlot

单个上传槽位的状态。页面内最多 2 个实例（正/反面）。

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `originalFile` | `File \| null` | `null` | 用户选择的原始文件对象 |
| `originalDataUrl` | `string \| null` | `null` | 原始图片的 data URL（用于 Canvas 绘制） |
| `croppedBlob` | `Blob \| null` | `null` | 裁剪后的图片 blob |
| `croppedDataUrl` | `string \| null` | `null` | 裁剪后的 data URL（用于缩略图显示） |
| `cropConfig` | `CropConfig \| null` | `null` | 裁剪参数 |
| `label` | `string` | — | 槽位标签（如"正面·人像面"） |

### CropConfig

裁剪操作参数。

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `x` | `number` | 0 | 裁剪区域左上角 X（相对于原图） |
| `y` | `number` | 0 | 裁剪区域左上角 Y |
| `width` | `number` | — | 裁剪区域宽度（px） |
| `height` | `number` | — | 裁剪区域高度（px） |
| `rotation` | `number` | 0 | 旋转角度（0/90/180/270） |
| `scale` | `number` | 1 | 缩放比例 |

### WatermarkConfig

水印配置。用户修改任一字段后触发预览重绘。

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | `string` | `''` | 水印文字内容 |
| `opacity` | `number` | 0.5 | 透明度（0.1 - 0.9） |
| `fontSize` | `number` | 20 | 字号（px） |
| `color` | `string` | `'#000000'` | 文字颜色（hex） |
| `position` | `'tile' \| 'center' \| 'topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight'` | `'tile'` | 水印位置模式 |
| `angle` | `number` | -45 | 水印倾斜角度（-45~45） |
| `density` | `number` | 0.7 | 密度（0..1，控制平铺间距，高密度=小间距） |
| `tileGapX` | `number` | 200 | 平铺模式水平间距（px，由 density 推导） |
| `tileGapY` | `number` | 200 | 平铺模式垂直间距（px，由 density 推导） |

### PageState

工具页面顶层状态。

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectedCardType` | `string \| null` | `null` | 当前选中证件类型 ID |
| `slots` | `ImageSlot[]` | `[]` | 上传槽位数组（1 或 2 个） |
| `watermark` | `WatermarkConfig` | 默认值 | 水印配置 |
| `previewDataUrl` | `string \| null` | `null` | 预览区显示的合成图 data URL |
| `isCropping` | `boolean` | `false` | 是否正在裁剪弹窗中 |
| `croppingSlotIndex` | `number` | -1 | 当前正在裁剪的槽位索引 |

## State Transitions

### 证件类型切换

```
selectedCardType: null → 'id_card' (双面)
  → slots 重新创建为 2 个空 ImageSlot
  → watermark 保持不变（不重置）
  → previewDataUrl 重置为 null

selectedCardType: 'id_card' → 'degree_cert' (单面)
  → 弹出确认对话框
  → 确认后 slots 重新创建为 1 个空 ImageSlot
  → watermark 保持不变
```

### 上传裁剪流程

```
slot.croppedBlob: null
  → 用户点击上传框 → 选择文件
  → slot.originalFile = file
  → slot.originalDataUrl = readAsDataURL(file)
  → isCropping = true, croppingSlotIndex = i
  → 弹窗中调整 cropConfig
  → 确认裁剪 → Canvas 裁剪 → slot.croppedBlob = croppedBlob
  → isCropping = false
  → 触发 previewDataUrl 更新
```

### 水印变更 → 预览更新

```
watermark.text 变更 (或其他字段)
  → watch(watermark, deep) 触发
  → debounce(200ms)
  → 检查所有 required slots 是否有 croppedBlob
  → 单面: 1 张图 + 水印 → Canvas 合成 → previewDataUrl
  → 双面: 2 张图上下拼接 + 水印 → Canvas 合成 → previewDataUrl
```

## Validation Rules

- `WatermarkConfig.text`: 最大 100 字符，超出自动截断
- `WatermarkConfig.opacity`: 范围 [0.1, 0.9]
- `WatermarkConfig.fontSize`: 范围 [12, 120] px
- `WatermarkConfig.angle`: 范围 [-45, 45] 度
- `WatermarkConfig.color`: 合法 hex 颜色 `#RRGGBB`
- `CropConfig.width` / `CropConfig.height`: 最小 100px，防止裁剪过小
- `ImageSlot.originalFile.size`: 最大 20MB
- `ImageSlot.originalFile.type`: 必须是 `image/jpeg` 或 `image/png`
