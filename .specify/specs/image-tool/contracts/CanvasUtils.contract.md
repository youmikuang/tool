# Utils Contract: Canvas 图片处理工具

**Feature**: image-tool | **Date**: 2026-08-12 (updated 2026-08-13)

所有函数放在 `src/utils/imageUtils.ts`，纯函数，无副作用，可单测。

## Constants

- `A4_WIDTH = 794` (A4 纸宽度 px，96 DPI)
- `A4_HEIGHT = 1123` (A4 纸高度 px，96 DPI)

## Functions

### `cropImage(image: HTMLImageElement, config: CropConfig): Promise<Blob>`

从原图按裁剪参数截取区域，返回 PNG blob。

**Params**:
- `image`: 已加载的 HTMLImageElement
- `config`: 裁剪配置 { x, y, width, height, rotation }

**Returns**: `Promise<Blob>` — PNG 格式的裁剪后图片 blob

**Behavior**:
- 创建临时 Canvas，尺寸 = config.width × config.height
- 若 rotation ≠ 0，先旋转 Canvas 再 drawImage
- 使用 `canvas.toBlob('image/png')`

### `composeOnA4(images: Blob[], isDoubleSided: boolean): Promise<Blob>`

将图片合成到 A4 纸（794×1123 px）上，返回 PNG blob。

**Params**:
- `images`: 裁剪后的图片 blob 数组
- `isDoubleSided`: 是否双面模式

**Returns**: `Promise<Blob>` — A4 尺寸 PNG blob

**Behavior**:
- 创建 A4 尺寸 Canvas，白色背景
- **单面模式**：图片占 A4 80% 宽 × 50% 高，居中绘制（保持原宽高比）
- **双面模式**：
  - 每张卡片占 A4 70% 宽，按 ID 卡比例 1.586 推导高度
  - 正面在上半部分垂直居中
  - 反面在下半部分垂直居中

### `applyWatermark(imageBlob: Blob, config: WatermarkConfig): Promise<Blob>`

在图片上叠加水印。

**Params**:
- `imageBlob`: 原图（单面或已合并的 blob）
- `config`: 水印配置

**Returns**: `Promise<Blob>` — 带水印的 PNG blob

**Behavior**:
- 创建与原图同尺寸的 Canvas
- 先 drawImage 原图
- 设置 ctx.globalAlpha = config.opacity
- 设置 ctx.fillStyle = config.color
- 设置 ctx.font = `${config.fontSize}px sans-serif`
- 根据 config.angle 使用 ctx.translate + ctx.rotate 实现文字倾斜
- 根据 config.position 计算水印位置并绘制

**Position modes**:
- `tile`: 间距由 density 推导：`baseGap = 60 + (1 - density) * 340`，从 (gap/2, gap/2) 开始平铺
- `center`: 测量文字宽度，居中绘制
- `topLeft`: (padding, padding + fontSize)
- `topRight`: (width - textWidth - padding, padding + fontSize)
- `bottomLeft`: (padding, height - padding)
- `bottomRight`: (width - textWidth - padding, height - padding)

### `mergeDoubleSided(frontBlob: Blob, backBlob: Blob): Promise<Blob>`

将正反面图片上下拼接为一张图。

**Params**:
- `frontBlob`: 正面裁剪后图片
- `backBlob`: 反面裁剪后图片

**Returns**: `Promise<Blob>` — PNG 合并图

**Behavior**:
- 合并宽度 = max(front.width, back.width)
- 合并高度 = front.height + 20px gap + back.height
- 正面绘制在 (0, 0)，反面绘制在 (0, front.height + 20)
- 空白区域填充白色背景

### `createDefaultWatermarkConfig(): WatermarkConfig`

返回水印配置默认值。

**Defaults**:
- `text: ''`
- `opacity: 0.5`
- `fontSize: 20`
- `color: '#000000'`
- `position: 'tile'`
- `angle: -45`
- `density: 0.7`
- `tileGapX: 200`, `tileGapY: 200`

### `blobToDataUrl(blob: Blob): Promise<string>`

Blob 转 data URL，用于 `<img>` 显示。

### `blobToImage(blob: Blob): Promise<HTMLImageElement>`

Blob 加载为 HTMLImageElement。

### `downloadBlob(blob: Blob, filename: string): void`

触发浏览器下载 blob。

**Behavior**:
- `URL.createObjectURL(blob)` → 创建 `<a>` → `click()` → `revokeObjectURL()`

## Validation Functions

### `validateImageFile(file: File): { valid: boolean; error?: string }`

校验上传文件是否合法。

**Rules**:
- 类型必须是 `image/jpeg` 或 `image/png`
- 大小不超过 20MB (20971520 bytes)
