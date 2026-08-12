<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineOptions({ inheritAttrs: true })

defineProps<{
  canExport: boolean
  exporting: boolean
}>()

const emit = defineEmits<{
  reset: []
  export: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="action-bar">
    <button class="btn btn-reset" @click="emit('reset')">
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
      {{ $t('reset') }}
    </button>

    <button class="btn btn-export" :disabled="!canExport || exporting" @click="emit('export')">
      <svg
        v-if="!exporting"
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span v-if="exporting" class="spinner" />
      {{ exporting ? $t('exporting') : $t('exportImage') }}
    </button>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 12px 0 0 0;
  border-top: 1px solid var(--border-color);
  margin-top: 4px;
  flex-shrink: 0;
}

.action-bar .btn {
  padding: 8px 18px;
  font-size: 0.85rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  font-size: 0.9rem;
  font-family: inherit;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset {
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.btn-reset:hover {
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.btn-export {
  color: #fff;
  background: var(--accent-color);
  box-shadow: var(--shadow-sm);
}

.btn-export:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
