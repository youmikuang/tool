<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { ImageSlot, WatermarkConfig } from '@/utils/imageUtils'
import {
  A4_WIDTH,
  A4_HEIGHT,
  composeOnA4Canvas,
  createWatermarkOverlay,
  blobToDataUrl,
} from '@/utils/imageUtils'

defineOptions({ inheritAttrs: true })

const props = defineProps<{
  slots: ImageSlot[]
  watermark: WatermarkConfig
  isDoubleSided: boolean
  imageScale: number
}>()

// Live preview data URL
const previewDataUrl = ref<string | null>(null)
let previewTimer: ReturnType<typeof setTimeout> | null = null

// Cache the watermark overlay. The overlay only depends on the watermark
// config and the fixed A4 canvas size, NOT on the image layout. So when only
// the zoom (imageScale) changes we reuse the cached layer and skip the
// expensive tile rendering — making the zoom slider much more responsive.
let overlayCache: { key: string; canvas: HTMLCanvasElement } | null = null

async function getWatermarkOverlay(): Promise<HTMLCanvasElement | null> {
  if (!props.watermark.text.trim()) {
    overlayCache = null
    return null
  }
  const key = JSON.stringify(props.watermark)
  if (!overlayCache || overlayCache.key !== key) {
    overlayCache = {
      key,
      canvas: await createWatermarkOverlay(A4_WIDTH, A4_HEIGHT, props.watermark),
    }
  }
  return overlayCache.canvas
}

async function regeneratePreview() {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(async () => {
    const activeSlots = props.slots.filter((s) => s.croppedBlob)
    if (activeSlots.length === 0) {
      previewDataUrl.value = null
      return
    }
    try {
      const blobs = activeSlots.map((s) => s.croppedBlob!)
      // Get the composed A4 canvas directly (no encode/decode round-trip).
      const a4Canvas = await composeOnA4Canvas(
        blobs,
        props.isDoubleSided,
        props.imageScale ?? 0.5,
      )
      const ctx = a4Canvas.getContext('2d')
      if (!ctx) return
      // Stamp the (cached) watermark overlay, then encode only ONCE.
      const overlay = await getWatermarkOverlay()
      if (overlay) ctx.drawImage(overlay, 0, 0)
      const blob = await new Promise<Blob>((resolve, reject) =>
        a4Canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          'image/png',
        ),
      )
      previewDataUrl.value = await blobToDataUrl(blob)
    } catch (err) {
      console.error('Preview generation failed:', err)
    }
  }, 80)
}

watch(() => [props.slots, props.watermark, props.isDoubleSided, props.imageScale], regeneratePreview, { deep: true })

const hasContent = computed(() => props.slots.some((s) => s.croppedBlob))

onUnmounted(() => {
  if (previewTimer) clearTimeout(previewTimer)
})
</script>

<template>
    <!-- Gray background area with centered A4 paper -->
    <div class="preview-area">
      <!-- When image loaded: A4 paper with image -->
      <template v-if="hasContent && previewDataUrl">
        <div class="a4-paper">
          <img :src="previewDataUrl" class="a4-image" alt="A4 preview" />
          <div class="a4-label">{{ $t('a4Paper') || 'A4 PAPER (210X297MM)' }}</div>
        </div>
      </template>

      <!-- Empty placeholder -->
      <template v-else>
        <div class="a4-placeholder">
          <!-- Front slot -->
          <div class="ph-slot">
            <span class="ph-label">{{
              isDoubleSided ? 'Front Upload' : 'Certificate Upload'
            }}</span>
          </div>
          <!-- Back slot (double-sided only) -->
          <div v-if="isDoubleSided" class="ph-slot">
            <span class="ph-label">Back Upload</span>
          </div>
          <div class="a4-label">{{ $t('a4Paper') || 'A4 PAPER (210X297MM)' }}</div>
        </div>
      </template>
    </div>
</template>

<style scoped>
/* Container: light gray background (use theme variable so it adapts to dark mode),
   centered A4 paper with shadow */
.preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  min-height: 0;
  overflow: auto;
  padding: 32px;
}

/* A4 paper: white rectangle with stronger shadow to stand out from white bg */
.a4-paper,
.a4-placeholder {
  aspect-ratio: 0.707;
  /* A4 portrait */
  height: 85%;
  max-height: 85%;
  width: auto;
  background: #ffffff;
  border-radius: 4px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.a4-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

/* Placeholder slots inside A4 paper */
.a4-placeholder {
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px;
}

.ph-slot {
  width: 80%;
  max-width: 480px;
  aspect-ratio: 1.586;
  /* ID card 85.6×53.98 ≈ 1.586 */
  border: 1.5px solid #c3c6d7;
  border-radius: var(--radius-sm);
  background: #f3f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #a4abb8;
}

.ph-icon {
  opacity: 0.5;
}

.ph-label {
  font-size: 0.58rem;
  color: #a4abb8;
  font-weight: 500;
}

/* A4 label at bottom-right */
.a4-label {
  position: absolute;
  bottom: 10px;
  right: 14px;
  font-size: 0.65rem;
  color: #b0b8c4;
  letter-spacing: 0.3px;
  user-select: none;
}
</style>
