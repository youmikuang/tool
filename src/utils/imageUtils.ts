// ============================================================
// Types
// ============================================================

export interface CardTypeI18n {
  en: string
  zh: string
}

export interface CardType {
  id: string
  label: CardTypeI18n
  sides: 'single' | 'double'
  aspectRatio: number
  sideLabels: {
    front: CardTypeI18n
    back?: CardTypeI18n
  }
  defaultSize: { width: number; height: number }
}

export interface CropConfig {
  x: number
  y: number
  width: number
  height: number
  rotation: number // 0 | 90 | 180 | 270
  scale: number
}

export interface ImageSlot {
  originalFile: File | null
  originalDataUrl: string | null
  croppedBlob: Blob | null
  croppedDataUrl: string | null
  cropConfig: CropConfig | null
  label: string
}

export type WatermarkPosition =
  | 'tile'
  | 'center'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'

export interface WatermarkConfig {
  text: string
  opacity: number
  fontSize: number
  color: string
  position: WatermarkPosition
  tileGapX: number
  tileGapY: number
  angle: number
  density: number // 0..1, controls watermark tile density (Low..High)
}

export interface PageState {
  selectedCardType: string | null
  slots: ImageSlot[]
  watermark: WatermarkConfig
  previewDataUrl: string | null
  isCropping: boolean
  croppingSlotIndex: number
}

// ============================================================
// Preset Card Types
// ============================================================

export const CARD_TYPES: CardType[] = [
  {
    id: 'id_card',
    label: { en: 'ID Card', zh: '身份证' },
    sides: 'double',
    aspectRatio: 1.586,
    sideLabels: {
      front: { en: 'Front (Photo Side)', zh: '正面（人像面）' },
      back: { en: 'Back (Emblem Side)', zh: '反面（国徽面）' },
    },
    defaultSize: { width: 85.6, height: 54 },
  },
  {
    id: 'degree_cert',
    label: { en: 'Degree Certificate', zh: '学历证' },
    sides: 'single',
    aspectRatio: 1.414,
    sideLabels: {
      front: { en: 'Upload Certificate', zh: '上传证书' },
    },
    defaultSize: { width: 297, height: 210 },
  },
  {
    id: 'diploma',
    label: { en: 'Diploma', zh: '学位证' },
    sides: 'single',
    aspectRatio: 1.414,
    sideLabels: {
      front: { en: 'Upload Diploma', zh: '上传学位证' },
    },
    defaultSize: { width: 297, height: 210 },
  },
  {
    id: 'bank_card',
    label: { en: 'Bank Card', zh: '银行卡' },
    sides: 'single',
    aspectRatio: 1.586,
    sideLabels: {
      front: { en: 'Upload Bank Card', zh: '上传银行卡' },
    },
    defaultSize: { width: 85.6, height: 54 },
  },
  {
    id: 'social_card',
    label: { en: 'Social Security Card', zh: '社保卡' },
    sides: 'single',
    aspectRatio: 1.586,
    sideLabels: {
      front: { en: 'Upload Social Security Card', zh: '上传社保卡' },
    },
    defaultSize: { width: 85.6, height: 54 },
  },
  {
    id: 'driver_license',
    label: { en: 'Driver License', zh: '驾驶证' },
    sides: 'double',
    aspectRatio: 1.586,
    sideLabels: {
      front: { en: 'Front (Photo)', zh: '正面（照片）' },
      back: { en: 'Back (Info)', zh: '反面（信息）' },
    },
    defaultSize: { width: 85.6, height: 54 },
  },
  {
    id: 'passport',
    label: { en: 'Passport', zh: '护照' },
    sides: 'single',
    aspectRatio: 0.707,
    sideLabels: {
      front: { en: 'Upload Passport', zh: '上传护照' },
    },
    defaultSize: { width: 88, height: 125 },
  },
  {
    id: 'custom',
    label: { en: 'Custom', zh: '自定义' },
    sides: 'single',
    aspectRatio: 1.0,
    sideLabels: {
      front: { en: 'Upload Image', zh: '上传图片' },
    },
    defaultSize: { width: 100, height: 100 },
  },
]

// ============================================================
// Default Watermark Config
// ============================================================

export function createDefaultWatermarkConfig(): WatermarkConfig {
  return {
    text: '',
    opacity: 0.5,
    fontSize: 48,
    color: '#838383',
    position: 'tile',
    tileGapX: 200,
    tileGapY: 200,
    angle: -45,
    density: 0.5,
  }
}

// ============================================================
// Helper: Blob <-> DataURL
// ============================================================

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}

// ============================================================
// Helper: File -> HTMLImageElement
// ============================================================

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

// ============================================================
// Helper: Blob -> HTMLImageElement
// ============================================================

export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const dataUrl = await blobToDataUrl(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image from blob'))
    img.src = dataUrl
  })
}

// ============================================================
// Helper: Download Blob
// ============================================================

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ============================================================
// Validation Functions
// ============================================================

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png']
  const maxSize = 20 * 1024 * 1024 // 20MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload JPG or PNG images' }
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'Image too large, please compress before upload' }
  }
  return { valid: true }
}

export function validateCropConfig(config: CropConfig): { valid: boolean; error?: string } {
  if (config.width < 100 || config.height < 100) {
    return { valid: false, error: 'Crop area too small, may affect print quality' }
  }
  return { valid: true }
}

export function validateWatermarkConfig(config: WatermarkConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.text.length > 100) {
    errors.push('Watermark text exceeds 100 characters')
  }
  if (config.opacity < 0.1 || config.opacity > 0.9) {
    errors.push('Opacity must be between 0.1 and 0.9')
  }
  if (config.fontSize < 12 || config.fontSize > 120) {
    errors.push('Font size must be between 12 and 120')
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(config.color)) {
    errors.push('Color must be a valid hex color (#RRGGBB)')
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================
// Core: Crop Image
// ============================================================
// config.x, y, width, height define the crop region in the ORIGINAL image.
// config.rotation tells the desired output orientation (0/90/180/270).
// For 90/270, the output canvas is swapped (w↔h) so the result is "upright".
// The source rect drawn at (-dw/2, -dh/2) must also be swapped so that
// after rotation the crop region fills the output canvas correctly.

export function cropImage(image: HTMLImageElement, config: CropConfig): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const isVertical = config.rotation === 90 || config.rotation === 270

    // Output canvas: swapped for 90/270 so result is upright
    const canvas = document.createElement('canvas')
    canvas.width = isVertical ? config.height : config.width
    canvas.height = isVertical ? config.width : config.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas 2D context not available'))
      return
    }

    if (config.rotation !== 0) {
      const rad = (config.rotation * Math.PI) / 180
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rad)

      // Source: crop region from original image
      // Destination: centered. The output canvas is already swapped for 90/270,
      // so drawing the source at its natural size will fill canvas correctly after rotation.
      ctx.drawImage(
        image,
        config.x,
        config.y,
        config.width,
        config.height,
        -config.width / 2,
        -config.height / 2,
        config.width,
        config.height,
      )
      ctx.restore()
    } else {
      ctx.drawImage(
        image,
        config.x,
        config.y,
        config.width,
        config.height,
        0,
        0,
        config.width,
        config.height,
      )
    }

    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create blob from canvas'))
    }, 'image/png')
  })
}

// ============================================================
// Core: Apply Watermark
// ============================================================

export async function applyWatermark(imageBlob: Blob, config: WatermarkConfig): Promise<Blob> {
  const img = await blobToImage(imageBlob)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // Draw original image
  ctx.drawImage(img, 0, 0)

  // If watermark text is empty, return original image
  if (!config.text.trim()) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      }, 'image/png')
    })
  }

  // Setup watermark style
  ctx.globalAlpha = config.opacity
  ctx.fillStyle = config.color
  ctx.font = `${config.fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const textWidth = ctx.measureText(config.text).width
  const textHeight = config.fontSize
  const padding = 20
  const angleRad = (config.angle * Math.PI) / 180

  // Helper to draw rotated text at a point (use ctxCtx to satisfy TS null-narrowing in closure)
  const drawRotatedText = (cx: CanvasRenderingContext2D, x: number, y: number) => {
    cx.save()
    cx.translate(x, y)
    cx.rotate(angleRad)
    cx.fillText(config.text, 0, 0)
    cx.restore()
  }

  switch (config.position) {
    case 'tile': {
      // Density 0..1 controls how tight the watermark tiles are.
      // gap is expressed as a multiple of fontSize so the spacing reads
      // consistently regardless of font size and canvas resolution.
      //   density = 1 (max)  -> factor 1.5  -> very dense
      //   density = 0 (min)  -> factor 28   -> very sparse
      // Linear in between so the whole 0..100 slider is perceptible.
      const factor = 1.5 + (1 - config.density) * 26.5
      const gapX = config.fontSize * factor
      const gapY = config.fontSize * factor
      for (let y = gapY / 2; y < canvas.height; y += gapY) {
        for (let x = gapX / 2; x < canvas.width; x += gapX) {
          drawRotatedText(ctx, x, y)
        }
      }
      break
    }
    case 'center': {
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      drawRotatedText(ctx, cx, cy)
      break
    }
    case 'topLeft': {
      drawRotatedText(ctx, padding + textWidth / 2, padding + textHeight / 2)
      break
    }
    case 'topRight': {
      drawRotatedText(ctx, canvas.width - textWidth / 2 - padding, padding + textHeight / 2)
      break
    }
    case 'bottomLeft': {
      drawRotatedText(ctx, padding + textWidth / 2, canvas.height - textHeight / 2 - padding)
      break
    }
    case 'bottomRight': {
      drawRotatedText(
        ctx,
        canvas.width - textWidth / 2 - padding,
        canvas.height - textHeight / 2 - padding,
      )
      break
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create blob from canvas'))
    }, 'image/png')
  })
}

// ============================================================
// Core: Merge Double-Sided
// ============================================================

const DOUBLE_SIDE_GAP = 20

export async function mergeDoubleSided(frontBlob: Blob, backBlob: Blob): Promise<Blob> {
  const [frontImg, backImg] = await Promise.all([blobToImage(frontBlob), blobToImage(backBlob)])

  const maxWidth = Math.max(frontImg.naturalWidth, backImg.naturalWidth)
  const totalHeight = frontImg.naturalHeight + DOUBLE_SIDE_GAP + backImg.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = maxWidth
  canvas.height = totalHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, maxWidth, totalHeight)

  // Draw front (top), centered horizontally
  const frontX = (maxWidth - frontImg.naturalWidth) / 2
  ctx.drawImage(frontImg, frontX, 0)

  // Draw back (bottom), centered horizontally
  const backY = frontImg.naturalHeight + DOUBLE_SIDE_GAP
  const backX = (maxWidth - backImg.naturalWidth) / 2
  ctx.drawImage(backImg, backX, backY)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create blob from canvas'))
    }, 'image/png')
  })
}

// ============================================================
// Core: Compose onto A4 Canvas
// ============================================================
// Standard A4 sheet at 300 DPI: 2480 × 3508 px (portrait).
// Source images are placed on the fixed A4 canvas.
// - High-res sources (>= target area) are only downscaled → always sharp.
// - Low-res sources are upscaled to FILL the target area so they don't look
//   tiny, but capped at MAX_UPSCALE to avoid extreme interpolation blur.

export const A4_WIDTH = 2480
export const A4_HEIGHT = 3508

// For low-resolution sources, the image is allowed to be upscaled to fill the
// A4 target area — but capped at this multiple to avoid extreme interpolation
// blur when the source is tiny.
const MAX_UPSCALE = 2

// Compose one or more image blobs onto a fixed A4 canvas (white background).
// For double-sided, front is placed in the upper half, back in the lower half.
// Images are scaled down to fit when needed, but never scaled up.
export async function composeOnA4(images: Blob[], isDoubleSided: boolean): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = A4_WIDTH
  canvas.height = A4_HEIGHT
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // High-quality downscaling (only used when source > target).
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // White background (A4 paper)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT)

  if (images.length === 0) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      }, 'image/png')
    })
  }

  const loadedImages = await Promise.all(images.map((b) => blobToImage(b)))

  if (isDoubleSided && loadedImages.length === 2) {
    // Double-sided: front in upper half, back in lower half
    const halfH = A4_HEIGHT / 2
    // Larger target area so the cards appear bigger on the A4 sheet.
    const cardTargetW = A4_WIDTH
    const cardTargetH = halfH

    // Helper: scale that FILLS the target area (may be > 1 for low-res sources),
    // but capped at MAX_UPSCALE so a tiny source is not stretched absurdly.
    // High-res sources stay at <=1 (downscaled only → always sharp).
    const fitScale = (img: HTMLImageElement) =>
      Math.min(
        cardTargetW / img.naturalWidth,
        cardTargetH / img.naturalHeight,
        (img.naturalWidth < cardTargetW || img.naturalHeight < cardTargetH) ? MAX_UPSCALE : 1,
      )

    // Front (top half) — vertically centered in upper half.
    const front = loadedImages[0]!
    const frontScale = fitScale(front)
    const fw = front.naturalWidth * frontScale
    const fh = front.naturalHeight * frontScale
    ctx.drawImage(front, (A4_WIDTH - fw) / 2, (halfH - fh) / 2, fw, fh)

    // Back (bottom half) — vertically centered in lower half
    const back = loadedImages[1]!
    const backScale = fitScale(back)
    const bw = back.naturalWidth * backScale
    const bh = back.naturalHeight * backScale
    ctx.drawImage(back, (A4_WIDTH - bw) / 2, halfH + (halfH - bh) / 2, bw, bh)
  } else {
    // Single image: centered on A4.
    // Use a large target area so the image appears prominently on the sheet.
    // For low-res sources, allow upscaling to FILL the target area (capped at
    // MAX_UPSCALE) so they don't look tiny; for high-res sources only downscale.
    const img = loadedImages[0]!
    const targetW = A4_WIDTH * 0.9
    const targetH = A4_HEIGHT * 0.8
    const scale = Math.min(
      targetW / img.naturalWidth,
      targetH / img.naturalHeight,
      img.naturalWidth < targetW || img.naturalHeight < targetH ? MAX_UPSCALE : 1,
    )
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.drawImage(img, (A4_WIDTH - w) / 2, (A4_HEIGHT - h) / 2, w, h)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create blob from canvas'))
    }, 'image/png')
  })
}
