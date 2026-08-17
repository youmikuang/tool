<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { WatermarkConfig, WatermarkPosition } from '@/utils/imageUtils'

defineOptions({ inheritAttrs: true })

const props = defineProps<{
  modelValue: WatermarkConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [value: WatermarkConfig]
}>()

const { t } = useI18n()

const text = computed({
  get: () => props.modelValue.text,
  set: (v: string) => emit('update:modelValue', { ...props.modelValue, text: v }),
})

const opacity = computed({
  get: () => props.modelValue.opacity,
  set: (v: number) => emit('update:modelValue', { ...props.modelValue, opacity: v }),
})

const fontSize = computed({
  get: () => props.modelValue.fontSize,
  set: (v: number) => emit('update:modelValue', { ...props.modelValue, fontSize: v }),
})

const color = computed({
  get: () => props.modelValue.color,
  set: (v: string) => emit('update:modelValue', { ...props.modelValue, color: v }),
})

const position = computed({
  get: () => props.modelValue.position,
  set: (v: WatermarkPosition) => emit('update:modelValue', { ...props.modelValue, position: v }),
})

const angle = computed({
  get: () => props.modelValue.angle,
  set: (v: number) => emit('update:modelValue', { ...props.modelValue, angle: v }),
})

const density = computed({
  get: () => props.modelValue.density,
  set: (v: number) => emit('update:modelValue', { ...props.modelValue, density: v }),
})

const opacityPercent = computed(() => Math.round(opacity.value * 100))
const densityPercent = computed(() => Math.round(density.value * 100))
</script>

<template>
  <div class="watermark-panel">
    <h3 class="panel-title">{{ $t('watermarkConfig') || '水印配置 (WATERMARK CONFIG)' }}</h3>

    <div class="config-list">
      <!-- Text -->
      <div class="config-item">
        <label class="config-label">Text</label>
        <input
          type="text"
          class="text-input"
          :value="text"
          :placeholder="$t('watermarkPlaceholder')"
          @input="text = ($event.target as HTMLInputElement).value"
          maxlength="100"
        />
      </div>

      <!-- Density -->
      <div class="config-item">
        <div class="slider-row">
          <label class="config-label">{{ $t('density') }}</label>
          <span class="config-val">{{ densityPercent }}%</span>
        </div>
        <div class="slider-row">
          <input
            type="range"
            class="slider"
            min="0"
            max="100"
            :value="densityPercent"
            @input="density = Number(($event.target as HTMLInputElement).value) / 100"
          />
        </div>
      </div>

      <!-- Scale on A4 removed: moved to upload area below -->

      <!-- Opacity + Size row -->
      <div class="config-item">
        <div class="slider-row">
          <label class="config-label">{{ $t('opacity') }}</label>
          <label class="config-label size-label-top">{{ $t('fontSize') }}</label>
        </div>
        <div class="slider-row">
          <input
            type="range"
            class="slider"
            min="0"
            max="100"
            :value="opacityPercent"
            @input="opacity = Number(($event.target as HTMLInputElement).value) / 100"
          />
          <select
            class="select-sm"
            :value="fontSize"
            @change="fontSize = Number(($event.target as HTMLSelectElement).value)"
          >
            <option :value="12">12</option>
            <option :value="16">16</option>
            <option :value="20">20</option>
            <option :value="24">24</option>
            <option :value="32">32</option>
            <option :value="48">48</option>
            <option :value="64">64</option>
            <option :value="80">80</option>
            <option :value="96">96</option>
            <option :value="120">120</option>
          </select>
        </div>
      </div>

      <!-- Angle + Color row -->
      <div class="config-item">
        <div class="row-2">
          <div class="col">
            <label class="config-label">{{ $t('angle') }}</label>
            <select
              class="select-full"
              :value="angle"
              @change="angle = Number(($event.target as HTMLSelectElement).value)"
            >
              <option :value="0">0°</option>
              <option :value="-15">-15°</option>
              <option :value="-30">-30°</option>
              <option :value="-45">-45°</option>
              <option :value="15">15°</option>
              <option :value="30">30°</option>
              <option :value="45">45°</option>
            </select>
          </div>
          <div class="col">
            <label class="config-label">{{ $t('color') }}</label>
            <div class="color-row">
              <input
                type="color"
                class="color-picker"
                :value="color"
                @input="color = ($event.target as HTMLInputElement).value"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.watermark-panel {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}

.panel-title {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.config-val {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-edge {
  font-size: 0.7rem;
  color: var(--text-muted);
  min-width: 24px;
}

.slider {
  flex: 1;
  cursor: pointer;
  accent-color: var(--accent-color);
}

.size-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  white-space: nowrap;
}

.size-label-top {
  margin-left: auto;
}

.text-input {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  box-sizing: border-box;
}

.text-input:focus {
  border-color: var(--accent-color);
}

.text-input::placeholder {
  color: var(--text-muted);
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.select-sm {
  padding: 4px 8px;
  font-size: 0.8rem;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  cursor: pointer;
  min-width: 64px;
}

.select-full {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
}

.select-full:focus,
.select-sm:focus {
  border-color: var(--accent-color);
}

.color-row {
  display: flex;
  align-items: center;
}

.color-picker {
  width: 100%;
  height: 30px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 2px;
  background: var(--bg-secondary);
}
</style>
