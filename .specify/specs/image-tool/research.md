# Research: 证件/卡证图片处理与水印工具

**Feature**: image-tool | **Date**: 2026-08-12

## 1. Canvas 裁剪组件实现方案

**Decision**: 使用原生 Canvas API + 自定义 Vue 组件实现裁剪弹窗

**Rationale**:

- 项目 Constitution 禁止引入 UI 组件库，裁剪功能需手写
- Canvas API 在主流浏览器中性能足够处理 10MB 级别图片
- 自定义组件可精确控制裁剪框锁定比例、拖拽、缩放行为

**Alternatives considered**:

- cropperjs: 成熟库但引入额外依赖，违反"评估必要性"原则
- 纯 CSS transform + clip-path: 无法精确获取裁剪像素数据，导出受限
- `<input type="file" accept="image/*">` + Image 元素 + Canvas 裁剪: 最简方案，选此

**Implementation notes**:

- 裁剪弹窗 = 全屏遮罩 Modal + 内嵌 Canvas
- 裁剪框: 使用 mousedown/mousemove/mouseup 事件实现拖拽移动和缩放
- 锁定宽高比: 根据证件类型预设比例约束裁剪框尺寸
- 旋转: Canvas 的 `ctx.rotate()` 或 Image 元素的 CSS transform
- 输出: `ctx.drawImage()` 裁剪区域 → `canvas.toBlob()`

## 2. Canvas 水印合成方案

**Decision**: 在 Canvas 上逐行/逐块绘制半透明文字作为水印

**Rationale**:

- 无需任何第三方库，纯 Canvas API 即可实现
- 支持平铺、定位、透明度、颜色、字号全部可调
- 实时预览：Vue 的响应式数据绑定 + Canvas 重绘

**Alternatives considered**:

- SVG overlay: 更灵活但无法直接导出为图片，需额外合成步骤
- CSS overlay: 预览方便但导出时需重新绘制，双重维护
- watermark.js: 库太小众，功能可能不满足

**Implementation notes**:

- 水印模式: `tile`（平铺）| `center` | `topLeft` | `topRight` | `bottomLeft` | `bottomRight`
- 倾斜度: `ctx.translate(x,y)` + `ctx.rotate(angleRad)` 实现文字旋转，默认 -45°
- 平铺: 计算文字宽度，按间距在 Canvas 上重复绘制
- 定位: 根据位置计算文字起始坐标
- 透明度: `ctx.globalAlpha`
- 颜色: `ctx.fillStyle`
- 字体: `ctx.font = "{size}px sans-serif"`
- 实时更新: watch 水印配置对象 → 触发 Canvas 重绘

## 3. 双面合并方案

**Decision**: 双面图片上下拼接为一张大图，中间留白分隔

**Rationale**:

- 打印场景最自然的方式：A4 纸上下排列正反面
- 实现简单：创建合并 Canvas → 分别 drawImage 正面和反面
- 用户无需额外操作，导出即合并

**Implementation notes**:

- 合并 Canvas 宽度 = max(正面宽, 反面宽)
- 合并 Canvas 高度 = 正面高 + 分隔间距(20px) + 反面高
- 水印在合并后的 Canvas 上统一绘制
- 导出格式: PNG（保留透明度，方便后续处理）

## 4. A4 排版打印方案

**Decision**: 在合并图上添加 A4 尺寸参考框，导出时按 300 DPI 渲染

**Rationale**:

- 用户提到"打印"需求，A4 是标准打印尺寸
- 300 DPI 确保打印清晰度
- 在预览区显示 A4 比例参考线，帮助用户判断证件在纸上的位置

**Implementation notes**:

- A4 尺寸: 210mm × 297mm
- 300 DPI 对应: 2480 × 3508 px
- 证件照在 A4 画布上居中排列
- 单面: 1 张证件照居中
- 双面: 正反面上半部分、下半部分各一张
- 实际实现时，先按原始分辨率处理，导出时缩放至 300 DPI 等效尺寸

## 5. 图片格式与兼容性

**Decision**: 支持 JPEG 和 PNG 输入，统一 PNG 输出

**Rationale**:

- JPEG: 照片最常见格式
- PNG: 无损输出，适合证件打印
- 不需要支持 GIF/BMP/WebP（使用场景极少）

**Browser compatibility**:

- Canvas API: Chrome 4+, Edge 12+, Safari 4+, Firefox 3.6+ — 全覆盖
- FileReader API: 同上
- `toBlob()`: Chrome 50+, Edge 79+, Safari 11+, Firefox 19+ — 需要 polyfill 考虑
- 降级: 使用 `canvas.toDataURL()` + base64 → Blob 转换

## 6. 文件大小与性能

**Decision**: 限制单张图片 20MB，不引入 Web Worker

**Rationale**:

- 20MB 限制平衡了证件照片的实际大小（通常 2-5MB）和浏览器内存
- Web Worker 中无法直接操作 DOM/Canvas（需 OffscreenCanvas），增加复杂度
- 简单场景无需 Worker，主线程处理足够

**Performance targets**:

- 10MB 图片裁剪 + 水印: <3s
- 双面合并 + 水印: <5s
- 实时预览更新: <200ms（防抖处理）

## 7. 无第三方依赖确认

**Decision**: 不引入任何新 npm 依赖

**Rationale**: Constitution I 要求"评估必要性"。Canvas API + FileReader API + Blob API 均为浏览器原生能力，无需额外库。

**Confirmed**: 以下库不需要引入:

- cropperjs (裁剪) — 手写
- watermark.js (水印) — Canvas 手写
- JSZip (批量下载) — 单张导出，无需 ZIP
- jspdf (PDF导出) — 导出 PNG，无需 PDF
- file-saver — 使用原生 `URL.createObjectURL` + `<a download>`
