<script setup lang="ts">
import { computed } from 'vue';
import { icons, type IconName } from '@/utils/icons';

defineOptions({
  inheritAttrs: true
});

const props = withDefaults(defineProps<{
  name: IconName;
  size?: number | string;
  className?: string;
}>(), {
  size: 16
});

const iconContent = computed(() => {
  const content = icons[props.name];
  if (!content) {
    console.warn(`Icon "${props.name}" not found`);
    return '';
  }
  return content;
});

const sizeStyle = computed(() => {
  const s = props.size;
  const val = typeof s === 'number' ? `${s}px` : s;
  return { width: val, height: val };
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="className"
    :style="sizeStyle"
    style="vertical-align: middle; display: inline-block;"
    v-html="iconContent"
  ></svg>
</template>
