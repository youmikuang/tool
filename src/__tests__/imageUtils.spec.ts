import { describe, it, expect } from 'vitest'
import {
  validateImageFile,
  validateCropConfig,
  validateWatermarkConfig,
  createDefaultWatermarkConfig,
  CARD_TYPES,
} from '@/utils/imageUtils'

// ============================================================
// validateImageFile
// ============================================================

describe('validateImageFile', () => {
  it('should accept a valid JPEG file', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })

  it('should accept a valid PNG file', () => {
    const file = new File([''], 'test.png', { type: 'image/png' })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })

  it('should reject non-image files', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' })
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should reject files larger than 20MB', () => {
    const largeContent = new ArrayBuffer(21 * 1024 * 1024)
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
})

// ============================================================
// validateCropConfig
// ============================================================

describe('validateCropConfig', () => {
  it('should accept valid crop config', () => {
    const config = { x: 0, y: 0, width: 200, height: 150, rotation: 0, scale: 1 }
    const result = validateCropConfig(config)
    expect(result.valid).toBe(true)
  })

  it('should reject crop config with width < 100', () => {
    const config = { x: 0, y: 0, width: 99, height: 200, rotation: 0, scale: 1 }
    const result = validateCropConfig(config)
    expect(result.valid).toBe(false)
  })

  it('should reject crop config with height < 100', () => {
    const config = { x: 0, y: 0, width: 200, height: 99, rotation: 0, scale: 1 }
    const result = validateCropConfig(config)
    expect(result.valid).toBe(false)
  })
})

// ============================================================
// validateWatermarkConfig
// ============================================================

describe('validateWatermarkConfig', () => {
  it('should accept valid watermark config', () => {
    const config = createDefaultWatermarkConfig()
    config.text = 'For Test'
    const result = validateWatermarkConfig(config)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject text longer than 100 characters', () => {
    const config = createDefaultWatermarkConfig()
    config.text = 'x'.repeat(101)
    const result = validateWatermarkConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('100'))).toBe(true)
  })

  it('should reject opacity out of range', () => {
    const config = createDefaultWatermarkConfig()
    config.opacity = 1.5
    const result = validateWatermarkConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Opacity'))).toBe(true)

    config.opacity = 0.05
    const result2 = validateWatermarkConfig(config)
    expect(result2.valid).toBe(false)
  })

  it('should reject fontSize out of range', () => {
    const config = createDefaultWatermarkConfig()
    config.fontSize = 8
    const result = validateWatermarkConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Font size'))).toBe(true)

    config.fontSize = 200
    const result2 = validateWatermarkConfig(config)
    expect(result2.valid).toBe(false)
  })

  it('should reject invalid color format', () => {
    const config = createDefaultWatermarkConfig()
    config.color = 'red'
    const result = validateWatermarkConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('hex'))).toBe(true)
  })

  it('should accept valid hex color', () => {
    const config = createDefaultWatermarkConfig()
    config.color = '#FF5500'
    const result = validateWatermarkConfig(config)
    expect(result.valid).toBe(true)
  })
})

// ============================================================
// CARD_TYPES presets
// ============================================================

describe('CARD_TYPES presets', () => {
  it('should have 8 card types', () => {
    expect(CARD_TYPES).toHaveLength(8)
  })

  it('id_card should be double-sided with correct aspect ratio', () => {
    const idCard = CARD_TYPES.find((c) => c.id === 'id_card')
    expect(idCard).toBeDefined()
    expect(idCard!.sides).toBe('double')
    expect(idCard!.aspectRatio).toBeCloseTo(1.586)
  })

  it('degree_cert should be single-sided', () => {
    const degreeCert = CARD_TYPES.find((c) => c.id === 'degree_cert')
    expect(degreeCert).toBeDefined()
    expect(degreeCert!.sides).toBe('single')
  })

  it('custom type should have aspect ratio 1.0', () => {
    const custom = CARD_TYPES.find((c) => c.id === 'custom')
    expect(custom).toBeDefined()
    expect(custom!.aspectRatio).toBe(1.0)
  })

  it('passport should be single-sided', () => {
    const passport = CARD_TYPES.find((c) => c.id === 'passport')
    expect(passport).toBeDefined()
    expect(passport!.sides).toBe('single')
    expect(passport!.aspectRatio).toBeCloseTo(0.707)
  })
})

// ============================================================
// createDefaultWatermarkConfig
// ============================================================

describe('createDefaultWatermarkConfig', () => {
  it('should return default values', () => {
    const config = createDefaultWatermarkConfig()
    expect(config.text).toBe('')
    expect(config.opacity).toBe(0.3)
    expect(config.fontSize).toBe(48)
    expect(config.color).toBe('#000000')
    expect(config.position).toBe('tile')
    expect(config.tileGapX).toBe(200)
    expect(config.tileGapY).toBe(200)
    expect(config.angle).toBe(-45)
    expect(config.density).toBe(0.5)
  })
})
