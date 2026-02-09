<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/base/BaseIcon.vue'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="toast.type"
        @click="removeToast(toast.id)"
      >
        <BaseIcon v-if="toast.type === 'success'" name="check" :size="18" />
        <BaseIcon v-else-if="toast.type === 'error'" name="alertCircle" :size="18" />
        <BaseIcon v-else-if="toast.type === 'warning'" name="alertCircle" :size="18" />
        <BaseIcon v-else name="info" :size="18" />
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  min-width: 200px;
  padding: 12px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toast-item.success {
  border-left: 4px solid var(--accent-color);
}

.toast-item.error {
  border-left: 4px solid var(--error-color);
}

.toast-item.warning {
  border-left: 4px solid var(--warning-color);
}

.toast-item.info {
  border-left: 4px solid var(--text-secondary);
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
