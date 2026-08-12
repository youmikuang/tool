<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CardType } from '@/utils/imageUtils'

defineOptions({ inheritAttrs: true })

const props = defineProps<{
  modelValue: string | null
  types: CardType[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { locale } = useI18n()

const currentValue = computed({
  get: () => props.modelValue,
  set: (val: string | null) => {
    if (val) emit('update:modelValue', val)
  },
})

function getLabel(type: CardType): string {
  return locale.value === 'zh' ? type.label.zh : type.label.en
}
</script>

<template>
  <div class="card-type-selector">
    <select
      class="type-select"
      :value="currentValue ?? ''"
      @change="currentValue = ($event.target as HTMLSelectElement).value"
    >
      <option value="" disabled>{{ $t('selectCardType') }}</option>
      <option v-for="type in types" :key="type.id" :value="type.id">
        {{ getLabel(type) }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.card-type-selector {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.selector-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-select {
  width: 100%;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}

.type-select:focus {
  border-color: var(--accent-color);
}

.type-select:hover {
  border-color: var(--accent-hover);
}

.type-select option {
  color: var(--text-primary);
  background: var(--bg-primary);
}
</style>
