<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import type { CropConfig } from '@/utils/imageUtils'

defineOptions({ inheritAttrs: true })

const props = defineProps<{
  visible: boolean
  imageDataUrl: string
}>()

const emit = defineEmits<{
  confirm: [payload: { blob: Blob; config: CropConfig }]
  cancel: []
}>()

// Canvas refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const image = ref<HTMLImageElement | null>(null)
const imageLoaded = ref(false)

// Crop box state (relative to displayed image)
const cropBox = ref({
  x: 0,
  y: 0,
  width: 200,
  height: 200,
})

const rotation = ref(0) // 0, 90, 180, 270

// Display canvas dimensions
const displayWidth = ref(600)
const displayHeight = ref(400)

// Zoom scale for wheel zoom
const imageScale = ref(1)
const MIN_SCALE = 0.3
const MAX_SCALE = 3
const SCALE_STEP = 0.1

// Base dimensions (original fitted size)
const baseWidth = ref(600)
const baseHeight = ref(400)

// Drag state
const dragging = ref(false)
const dragType = ref<'resize' | 'create' | null>(null)
const dragStart = ref({ x: 0, y: 0 })
const dragStartBox = ref({ x: 0, y: 0, width: 0, height: 0 })
const resizeHandle = ref('')

const RESIZE_HANDLE_SIZE = 12
const MIN_CROP = 20

// Load image
watch(
  () => props.imageDataUrl,
  (url) => {
    if (!url) {
      image.value = null
      imageLoaded.value = false
      return
    }
    imageLoaded.value = false
    const img = new Image()
    img.onload = () => {
      image.value = img
      imageLoaded.value = true

      // Calculate display size to fit canvas area
      const maxW = 700
      const maxH = 500
      const w = img.naturalWidth
      const h = img.naturalHeight
      const fitScale = Math.min(maxW / w, maxH / h, 1)
      baseWidth.value = Math.round(w * fitScale)
      baseHeight.value = Math.round(h * fitScale)
      imageScale.value = 1
      displayWidth.value = baseWidth.value
      displayHeight.value = baseHeight.value

      rotation.value = 0
      recalcCropBox()
      nextTick(() => drawCanvas())
    }
    img.onerror = () => {
      console.error('Failed to load image')
      imageLoaded.value = false
    }
    img.src = url
  },
  { immediate: true },
)

// Whether current rotation is portrait (90 or 270)
function isRotatedPortrait() {
  return rotation.value === 90 || rotation.value === 270
}

// Get effective canvas dimensions considering rotation
function effectiveWidth() {
  return isRotatedPortrait() ? displayHeight.value : displayWidth.value
}

function effectiveHeight() {
  return isRotatedPortrait() ? displayWidth.value : displayHeight.value
}

// Draw canvas
function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !image.value) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // When rotated 90/270, swap canvas dimensions so the rotated image fits
  if (isRotatedPortrait()) {
    canvas.width = displayHeight.value
    canvas.height = displayWidth.value
  } else {
    canvas.width = displayWidth.value
    canvas.height = displayHeight.value
  }

  const cw = canvas.width
  const ch = canvas.height

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, cw, ch)

  // Draw image centered with rotation
  ctx.save()
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate((rotation.value * Math.PI) / 180)

  // Draw image: always use displayWidth × displayHeight (image native orientation)
  // After rotation, canvas already swapped so image fits perfectly
  ctx.drawImage(
    image.value,
    -displayWidth.value / 2,
    -displayHeight.value / 2,
    displayWidth.value,
    displayHeight.value,
  )
  ctx.restore()

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, cw, ch)

  // Clear crop area
  ctx.clearRect(cropBox.value.x, cropBox.value.y, cropBox.value.width, cropBox.value.height)

  // Redraw image only in crop area
  ctx.save()
  ctx.beginPath()
  ctx.rect(cropBox.value.x, cropBox.value.y, cropBox.value.width, cropBox.value.height)
  ctx.clip()

  ctx.translate(cw / 2, ch / 2)
  ctx.rotate((rotation.value * Math.PI) / 180)

  ctx.drawImage(
    image.value,
    -displayWidth.value / 2,
    -displayHeight.value / 2,
    displayWidth.value,
    displayHeight.value,
  )
  ctx.restore()

  // Draw crop border
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(cropBox.value.x, cropBox.value.y, cropBox.value.width, cropBox.value.height)

  // Draw resize handles
  ctx.fillStyle = '#fff'
  const h = RESIZE_HANDLE_SIZE
  const { x, y, width: w, height: bh } = cropBox.value
  const handles: [number, number][] = [
    [x - h / 2, y - h / 2],
    [x + w - h / 2, y - h / 2],
    [x - h / 2, y + bh - h / 2],
    [x + w - h / 2, y + bh - h / 2],
  ]
  for (const [hx, hy] of handles) {
    ctx.fillRect(hx, hy, h, h)
  }
}

// Get resize handle
function getHandleAt(canvasX: number, canvasY: number): string {
  const h = RESIZE_HANDLE_SIZE
  const { x, y, width: w, height: bh } = cropBox.value
  const handles: [string, number, number][] = [
    ['nw', x - h / 2, y - h / 2],
    ['ne', x + w - h / 2, y - h / 2],
    ['sw', x - h / 2, y + bh - h / 2],
    ['se', x + w - h / 2, y + bh - h / 2],
  ]
  for (const [name, hx, hy] of handles) {
    if (canvasX >= hx && canvasX <= hx + h && canvasY >= hy && canvasY <= hy + h) {
      return name
    }
  }
  return ''
}

// Clamp crop box — use effective dimensions accounting for rotation
function clampBox(box: { x: number; y: number; width: number; height: number }) {
  const cw = effectiveWidth()
  const ch = effectiveHeight()

  box.x = Math.max(0, box.x)
  box.y = Math.max(0, box.y)
  box.width = Math.max(MIN_CROP, Math.min(box.width, cw))
  box.height = Math.max(MIN_CROP, Math.min(box.height, ch))

  if (box.x + box.width > cw) {
    box.x = cw - box.width
  }
  if (box.y + box.height > ch) {
    box.y = ch - box.height
  }
}

// Mouse down
function onMouseDown(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left) * (canvas.width / rect.width)
  const y = (e.clientY - rect.top) * (canvas.height / rect.height)

  const handle = getHandleAt(x, y)
  if (handle) {
    // Click on a corner handle: resize
    dragType.value = 'resize'
    resizeHandle.value = handle
    dragging.value = true
    dragStart.value = { x, y }
    dragStartBox.value = { ...cropBox.value }
  } else {
    // Click anywhere else (including inside current crop box): draw a new crop box
    dragType.value = 'create'
    dragging.value = true
    dragStart.value = { x, y }
    cropBox.value = { x, y, width: 0, height: 0 }
    dragStartBox.value = { x, y, width: 0, height: 0 }
  }

  // Attach global listeners so dragging continues outside the canvas
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// Convert client coordinates to canvas coordinates (not clamped)
function clientToCanvas(clientX: number, clientY: number) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  }
}

// Mouse move
function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return
  const { x, y } = clientToCanvas(e.clientX, e.clientY)

  if (dragType.value === 'create') {
    // Drawing a new crop box from dragStart to current cursor
    // Clamp cursor to canvas bounds so the box stays inside
    const cw = effectiveWidth()
    const ch = effectiveHeight()
    const cx = Math.max(0, Math.min(cw, x))
    const cy = Math.max(0, Math.min(ch, y))
    const sx = dragStart.value.x
    const sy = dragStart.value.y
    const nx = Math.min(sx, cx)
    const ny = Math.min(sy, cy)
    const nw = Math.abs(cx - sx)
    const nh = Math.abs(cy - sy)
    cropBox.value = { x: nx, y: ny, width: nw, height: nh }
    drawCanvas()
    return
  }

  const dx = x - dragStart.value.x
  const dy = y - dragStart.value.y
  const box = { ...dragStartBox.value }

  if (dragType.value === 'resize') {
    const h = resizeHandle.value
    if (h.includes('e')) box.width += dx
    if (h.includes('w')) {
      box.x += dx
      box.width -= dx
    }
    if (h.includes('s')) box.height += dy
    if (h.includes('n')) {
      box.y += dy
      box.height -= dy
    }
  }

  clampBox(box)
  cropBox.value = box
  drawCanvas()
}

// Mouse up
function onMouseUp() {
  if (!dragging.value) return
  dragging.value = false
  dragType.value = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// Wheel zoom
function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY < 0) {
    imageScale.value = Math.min(MAX_SCALE, imageScale.value + SCALE_STEP)
  } else {
    imageScale.value = Math.max(MIN_SCALE, imageScale.value - SCALE_STEP)
  }
  displayWidth.value = Math.round(baseWidth.value * imageScale.value)
  displayHeight.value = Math.round(baseHeight.value * imageScale.value)

  recalcCropBox()

  nextTick(() => drawCanvas())
}

// Touch events
function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  if (!touch) return
  onMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  if (!touch) return
  onMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
}

function onTouchEnd(e: TouchEvent) {
  e.preventDefault()
  onMouseUp()
}

// Recalculate crop box based on current effective canvas size
// Start with a large box covering ~92% of the canvas, so user can easily adjust
function recalcCropBox() {
  const cw = effectiveWidth()
  const ch = effectiveHeight()
  const margin = 24
  const boxW = cw - margin * 2
  const boxH = ch - margin * 2
  cropBox.value = {
    x: margin,
    y: margin,
    width: boxW,
    height: boxH,
  }
}

// Rotate left (counter-clockwise)
function handleRotateLeft() {
  rotation.value = (rotation.value + 270) % 360
  recalcCropBox()
  nextTick(() => drawCanvas())
}

// Rotate right (clockwise)
function handleRotateRight() {
  rotation.value = (rotation.value + 90) % 360
  recalcCropBox()
  nextTick(() => drawCanvas())
}

// Reset
function handleReset() {
  if (!image.value) return
  rotation.value = 0
  displayWidth.value = baseWidth.value
  displayHeight.value = baseHeight.value
  imageScale.value = 1
  recalcCropBox()
  nextTick(() => drawCanvas())
}

// Confirm crop — output at the ORIGINAL image's full resolution.
//
// Strategy (verified to match the preview exactly): rebuild the SAME
// transform as drawCanvas() on a temp canvas sized to the native image,
// then map the crop box from the preview canvas to that full-res canvas
// using the CURRENT (possibly wheel-zoomed) display size. The browser
// performs the forward transform, so the mapping is exact and the output
// keeps every native pixel.
async function handleConfirm() {
  const img = image.value
  if (!img) return

  const imgW = img.naturalWidth
  const imgH = img.naturalHeight
  const cb = cropBox.value
  const isVertical = rotation.value === 90 || rotation.value === 270

  // Step 1: temp canvas at FULL resolution with the SAME transform
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = isVertical ? imgH : imgW
  tempCanvas.height = isVertical ? imgW : imgH
  const tctx = tempCanvas.getContext('2d')
  if (!tctx) return

  tctx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
  tctx.rotate((rotation.value * Math.PI) / 180)
  tctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH)

  // Step 2: map cropBox from the preview canvas to this full-res canvas.
  // effectiveWidth()/effectiveHeight() reflect the LIVE display size, so
  // any wheel zoom is correctly accounted for.
  const cw = effectiveWidth()
  const ch = effectiveHeight()
  const ratioW = tempCanvas.width / cw
  const ratioH = tempCanvas.height / ch

  const srcX = Math.round(cb.x * ratioW)
  const srcY = Math.round(cb.y * ratioH)
  const srcW = Math.round(cb.width * ratioW)
  const srcH = Math.round(cb.height * ratioH)

  // Step 3: output canvas sized to the cropped region (native resolution).
  const outCanvas = document.createElement('canvas')
  outCanvas.width = Math.max(1, srcW)
  outCanvas.height = Math.max(1, srcH)
  const outCtx = outCanvas.getContext('2d')
  if (!outCtx) return

  outCtx.imageSmoothingEnabled = true
  outCtx.imageSmoothingQuality = 'high'

  outCtx.drawImage(tempCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)

  outCanvas.toBlob((blob) => {
    if (!blob) return
    emit('confirm', {
      blob,
      config: {
        x: 0,
        y: 0,
        width: outCanvas.width,
        height: outCanvas.height,
        rotation: 0,
        scale: 1,
      },
    })
  }, 'image/png')
}

// Handle cancel
function handleCancel() {
  emit('cancel')
}

// Keyboard shortcut
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleCancel()
  } else if (e.key === 'Enter') {
    handleConfirm()
  }
}

// Add/remove keyboard listener
watch(
  () => props.visible,
  (v) => {
    if (v) {
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="crop-modal-overlay" @mousedown.self="handleCancel">
      <div class="crop-modal" @mousedown.stop>
        <div class="crop-header">
          <span class="crop-title">{{ $t('confirmCrop') }}</span>
          <button class="close-btn" @click.stop="handleCancel">&times;</button>
        </div>

        <div class="crop-canvas-container">
          <canvas
            ref="canvasRef"
            class="crop-canvas"
            :style="{ cursor: dragging ? 'crosshair' : 'crosshair' }"
            @mousedown="onMouseDown"
            @wheel.prevent="onWheel"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend.prevent="onTouchEnd"
          />
        </div>

        <div class="crop-controls">
          <div class="controls-left">
            <button class="ctrl-btn" @click="handleRotateLeft" title="Rotate left">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button class="ctrl-btn" @click="handleRotateRight" title="Rotate right">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
            <button class="ctrl-btn" @click="handleReset">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              {{ $t('resetCrop') }}
            </button>
          </div>
          <div class="controls-right">
            <button class="btn btn-secondary" @click="handleCancel">
              {{ $t('cancelCrop') }}
            </button>
            <button class="btn btn-primary" @click="handleConfirm">
              {{ $t('confirmCrop') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.crop-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.crop-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  width: 90vw;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.crop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.crop-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
}

.crop-canvas-container {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--bg-secondary);
}

.crop-canvas {
  max-width: 100%;
  max-height: 100%;
}

.crop-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 8px;
}

.controls-left {
  display: flex;
  gap: 8px;
}

.controls-right {
  display: flex;
  gap: 8px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.btn {
  padding: 8px 20px;
  font-size: 0.9rem;
  font-family: inherit;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  color: #fff;
  background: var(--accent-color);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  color: var(--text-primary);
  border-color: var(--accent-color);
}
</style>
