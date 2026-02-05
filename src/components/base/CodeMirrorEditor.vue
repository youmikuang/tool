<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, highlightActiveLine, highlightActiveLineGutter, lineNumbers } from '@codemirror/view';
import { useTheme } from '@/composables/useTheme';

const props = defineProps<{
  modelValue: string;
  readonly?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

const { isDark } = useTheme();

const extensions = computed(() => {
  const exts = [json(), EditorView.lineWrapping, lineNumbers(), highlightActiveLine(), highlightActiveLineGutter()];
  if (isDark.value) {
    exts.push(oneDark);
  }
  if (props.readonly) {
    exts.push(EditorView.editable.of(false));
  }
  return exts;
});

const handleChange = (value: string) => {
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<template>
  <div class="editor-wrapper" :class="{ 'is-readonly': readonly }">
    <Codemirror
      :model-value="modelValue"
      :placeholder="placeholder"
      :style="{ height: '100%', width: '100%' }"
      :autofocus="!readonly"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.editor-wrapper {
  height: 100%;
  width: 100%;
  font-family: var(--font-mono);
  font-size: 14px;
  background-color: var(--editor-bg);
  overflow: hidden;
}

:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-scroller) {
  overflow: auto;
  font-family: inherit;
  padding: var(--space-3);
}

:deep(.cm-gutters) {
  background: var(--editor-gutter);
  border-right: 1px solid var(--editor-border);
}

:deep(.cm-activeLineGutter) {
  color: var(--accent-color);
}

:deep(.cm-selectionBackground) {
  background: var(--editor-selection) !important;
}
</style>
