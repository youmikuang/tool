<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CardType, ImageSlot, CropConfig, WatermarkConfig } from '@/utils/imageUtils'
import {
  CARD_TYPES,
  createDefaultWatermarkConfig,
  blobToDataUrl,
  downloadBlob,
  applyWatermark,
  composeOnA4,
  validateImageFile,
} from '@/utils/imageUtils'
import CardTypeSelector from '@/components/image/CardTypeSelector.vue'
import UploadSlot from '@/components/image/UploadSlot.vue'
import CropModal from '@/components/image/CropModal.vue'
import WatermarkPanel from '@/components/image/WatermarkPanel.vue'
import PreviewArea from '@/components/image/PreviewArea.vue'
import ActionBar from '@/components/image/ActionBar.vue'

const { t, locale } = useI18n()

// ============================================================
// State
// ============================================================

const selectedCardTypeId = ref<string | null>(null)
const slots = ref<ImageSlot[]>([])
const watermark = ref<WatermarkConfig>(createDefaultWatermarkConfig())
const isCropping = ref(false)
const croppingSlotIndex = ref(-1)
const cropImageDataUrl = ref('')
const cropModalKey = ref(0)
const exporting = ref(false)

// Canvas support check
const canvasSupported = ref(true)
try {
  const c = document.createElement('canvas')
  if (!c.getContext('2d')) canvasSupported.value = false
} catch {
  canvasSupported.value = false
}

// ============================================================
// Computed
// ============================================================

const currentCardType = computed<CardType | undefined>(() =>
  CARD_TYPES.find((ct) => ct.id === selectedCardTypeId.value),
)

const isDoubleSided = computed(() => currentCardType.value?.sides === 'double')

const canExport = computed(() => {
  if (slots.value.length === 0) return false
  if (isDoubleSided.value) {
    return slots.value.some((s) => s.croppedBlob !== null)
  }
  return slots.value[0]?.croppedBlob !== null
})

function getSlotLabel(index: number, cardType: CardType): string {
  const isZh = locale.value === 'zh'
  if (cardType.sides === 'double') {
    const side = index === 0 ? cardType.sideLabels.front : cardType.sideLabels.back
    if (side) return isZh ? side.zh : side.en
    return index === 0 ? (isZh ? '正面' : 'Front') : isZh ? '反面' : 'Back'
  }
  if (cardType.sideLabels?.front) {
    return isZh ? cardType.sideLabels.front.zh : cardType.sideLabels.front.en
  }
  return isZh ? '上传图片' : 'Upload Image'
}

// ============================================================
// Card Type Selection
// ============================================================

function handleCardTypeChange(newId: string) {
  if (selectedCardTypeId.value && selectedCardTypeId.value !== newId) {
    const hasData = slots.value.some((s) => s.croppedBlob || s.originalFile)
    if (hasData) {
      const confirmed = window.confirm(t('switchTypeWarning'))
      if (!confirmed) return
    }
  }

  selectedCardTypeId.value = newId
  const cardType = CARD_TYPES.find((ct) => ct.id === newId)
  if (!cardType) return

  const count = cardType.sides === 'double' ? 2 : 1
  slots.value = Array.from({ length: count }, (_, i) => ({
    originalFile: null,
    originalDataUrl: null,
    croppedBlob: null,
    croppedDataUrl: null,
    cropConfig: null,
    label: getSlotLabel(i, cardType),
  }))
}

// ============================================================
// Locale change updates labels
// ============================================================

watch(locale, () => {
  if (!selectedCardTypeId.value) return
  const cardType = CARD_TYPES.find((ct) => ct.id === selectedCardTypeId.value)
  if (!cardType) return
  slots.value.forEach((slot, i) => {
    slot.label = getSlotLabel(i, cardType)
  })
})

// ============================================================
// Upload & Crop Flow
// ============================================================

function handleSlotClick(index: number) {
  if (!selectedCardTypeId.value) return

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png'

  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      const errKey =
        validation.error === 'Image too large, please compress before upload'
          ? 'fileTooLarge'
          : 'invalidImageType'
      alert(t(errKey))
      return
    }

    try {
      const dataUrl = await blobToDataUrl(file)
      cropImageDataUrl.value = dataUrl
      croppingSlotIndex.value = index
      cropModalKey.value++
      isCropping.value = true

      slots.value[index].originalFile = file
      slots.value[index].originalDataUrl = dataUrl
    } catch {
      alert(t('invalidImageType'))
    }
  }

  input.click()
}

function handleCropConfirm({ blob, config }: { blob: Blob; config: CropConfig }) {
  const index = croppingSlotIndex.value
  if (index < 0 || index >= slots.value.length) return

  blobToDataUrl(blob).then((dataUrl) => {
    slots.value[index].croppedBlob = blob
    slots.value[index].croppedDataUrl = dataUrl
    slots.value[index].cropConfig = config
  })

  isCropping.value = false
  croppingSlotIndex.value = -1
}

function handleCropCancel() {
  const index = croppingSlotIndex.value
  isCropping.value = false
  croppingSlotIndex.value = -1

  if (index >= 0 && index < slots.value.length && !slots.value[index]?.croppedBlob) {
    slots.value[index].originalFile = null
    slots.value[index].originalDataUrl = null
  }
}

// ============================================================
// Export
// ============================================================

async function handleExport() {
  if (!canExport.value) return

  const activeSlots = slots.value.filter((s) => s.croppedBlob)
  if (activeSlots.length === 0) return

  if (isDoubleSided.value && activeSlots.length === 1) {
    const confirmed = window.confirm(t('partialExport'))
    if (!confirmed) return
  }

  if (!watermark.value.text.trim()) {
    const confirmed = window.confirm(t('noWatermarkWarning'))
    if (!confirmed) return
  }

  exporting.value = true

  try {
    const blobs = activeSlots.map((s) => s.croppedBlob!)
    const a4Blob = await composeOnA4(blobs, isDoubleSided.value)
    const watermarked = await applyWatermark(a4Blob, watermark.value)
    const timestamp = new Date().toISOString().slice(0, 10)
    const cardType = currentCardType.value
    const prefix = cardType?.id ?? 'image'
    downloadBlob(watermarked, `${prefix}_${timestamp}.png`)
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    exporting.value = false
  }
}

// ============================================================
// Reset
// ============================================================

function handleReset() {
  selectedCardTypeId.value = null
  slots.value = []
  watermark.value = createDefaultWatermarkConfig()
  isCropping.value = false
  croppingSlotIndex.value = -1
}

onUnmounted(() => {
  // cleanup if needed
})
</script>

<template>
  <div class="image-tool">
    <!-- Canvas support check -->
    <div v-if="!canvasSupported" class="error-banner">
      {{ $t('browserNotSupported') }}
    </div>

    <template v-else>
      <!-- Main: Left (type + upload + watermark) | Right (preview) -->
      <div class="main-layout">
        <!-- Left Column -->
        <div class="left-col">
          <!-- Card Type Selector (inside left column) -->
          <section class="section">
            <CardTypeSelector
              :model-value="selectedCardTypeId"
              :types="CARD_TYPES"
              @update:model-value="handleCardTypeChange"
            />
          </section>

          <!-- Upload Slots -->
          <section class="section upload-section">
            <div v-if="!selectedCardTypeId" class="upload-hint">
              <span class="hint-text">{{ $t('selectCardTypeFirst') }}</span>
            </div>
            <div v-else class="upload-grid" :class="{ double: isDoubleSided }">
              <UploadSlot
                v-for="(slot, index) in slots"
                :key="index"
                :label="slot.label"
                :thumbnail="slot.croppedDataUrl"
                :disabled="!selectedCardTypeId"
                @click="handleSlotClick(index)"
              />
            </div>
          </section>

          <!-- Watermark Panel -->
          <section class="section">
            <WatermarkPanel v-model="watermark" />
          </section>

          <!-- Spacer pushes action bar to bottom -->
          <div class="left-spacer"></div>

          <!-- Action Bar (left column bottom, matches design) -->
          <ActionBar
            :can-export="canExport"
            :exporting="exporting"
            @reset="handleReset"
            @export="handleExport"
          />
        </div>

        <!-- Right Column: Preview -->
        <div class="right-col">
          <PreviewArea :slots="slots" :watermark="watermark" :is-double-sided="isDoubleSided" />
        </div>
      </div>
    </template>

    <!-- Crop Modal -->
    <CropModal
      :key="cropModalKey"
      :visible="isCropping"
      :image-data-url="cropImageDataUrl"
      @confirm="handleCropConfirm"
      @cancel="handleCropCancel"
    />
  </div>
</template>

<style scoped>
.image-tool {
  width: 100%;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 80px 24px 48px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-layout {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

/* Left column: light gray panel background (matches design #f3f4f6) */
.left-col {
  flex: 0 0 280px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  min-height: 0;
}

.left-spacer {
  flex: 1;
  min-height: 0;
}

.right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.right-col > :deep(.preview-area) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section {
  flex-shrink: 0;
}

.upload-section {
  width: 100%;
}

.upload-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 16px;
  background: var(--bg-primary);
  border: 1.5px dashed var(--border-hover);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.upload-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.upload-grid.double {
  grid-template-columns: 1fr 1fr;
}

.error-banner {
  padding: 16px 20px;
  background: var(--error-bg);
  color: var(--error-color);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }

  .left-col {
    flex: none;
    width: 100%;
  }

  .right-col {
    flex: none;
    min-height: 240px;
  }
}
</style>
