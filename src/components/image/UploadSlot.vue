<script setup lang="ts">
defineOptions({ inheritAttrs: true })

defineProps<{
  label: string
  thumbnail: string | null
  disabled: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <div class="upload-slot" :class="{ disabled }" @click="disabled ? undefined : handleClick()">
    <div v-if="thumbnail" class="thumbnail-wrapper">
      <img :src="thumbnail" alt="cropped preview" class="thumbnail" />
      <div class="overlay">
        <span class="re-crop-text">{{ $t('reCrop') }}</span>
      </div>
    </div>
    <div v-else class="placeholder">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="upload-icon"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span class="label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.upload-slot {
  width: 100%;
  height: 120px;
  min-height: 120px;
  border: 1.5px dashed #c8c7cd;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  position: relative;
  background: #f3f4f6;
}

.upload-slot:not(.disabled):hover {
  border-color: var(--accent-color);
  background: var(--accent-light);
}

.upload-slot.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
}

.upload-icon {
  color: var(--text-muted);
}

.label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-align: center;
}

.thumbnail-wrapper {
  position: relative;
  width: 70%;
  height: 70%;
  min-height: 84px;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.upload-slot:not(.disabled):hover .overlay {
  opacity: 1;
}

.re-crop-text {
  color: #fff;
  font-size: 0.78rem;
  font-weight: 500;
}
</style>
