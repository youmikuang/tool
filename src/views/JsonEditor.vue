<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import CodeMirrorEditor from '@/components/base/CodeMirrorEditor.vue'
import { formatJson, minifyJson, escapeJson, unescapeJson } from '@/utils/jsonUtils'
import { useI18n } from '@/composables/useI18n'
import BaseIcon from '@/components/base/BaseIcon.vue'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'

const { t } = useI18n()
const { showToast } = useToast()
const { history, hasHistory, addToHistory, clearHistory } = useHistory('json-editor')

// History dropdown state
const showHistoryDropdown = ref(false)
const historyWrapperRef = ref<HTMLElement | null>(null)

// Click outside to close dropdown
const handleClickOutside = (event: MouseEvent) => {
  if (historyWrapperRef.value && !historyWrapperRef.value.contains(event.target as Node)) {
    showHistoryDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// State
const inputJson = ref('')
const outputJson = ref('')
const error = ref<string | null>(null)
const processing = ref(false)
const isValidJson = ref(false)

// Auto-parse JSON on input change
watch(inputJson, (newValue) => {
  if (!newValue.trim()) {
    outputJson.value = ''
    error.value = null
    isValidJson.value = false
    return
  }

  try {
    const parsed = JSON.parse(newValue)
    outputJson.value = JSON.stringify(parsed, null, 2)
    error.value = null
    isValidJson.value = true
  } catch (e) {
    outputJson.value = ''
    error.value = null // Don't show error during typing
    isValidJson.value = false
  }
})

// Stats
const stats = computed(() => ({
  size: new Blob([inputJson.value]).size,
  lines: inputJson.value ? inputJson.value.split('\n').length : 0,
}))

// Actions
const processJson = (mode: 'format' | 'minify' | 'escape' | 'unescape') => {
  if (!inputJson.value.trim()) return

  processing.value = true
  error.value = null

  try {
    switch (mode) {
      case 'format':
        outputJson.value = formatJson(inputJson.value)
        break
      case 'minify':
        outputJson.value = minifyJson(inputJson.value)
        break
      case 'escape':
        outputJson.value = escapeJson(inputJson.value)
        break
      case 'unescape':
        outputJson.value = unescapeJson(inputJson.value)
        break
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    setTimeout(() => {
      processing.value = false

      // Save to history on successful processing
      if (!error.value) {
        addToHistory(inputJson.value)
      }

      // Toast messages
      switch (mode) {
        case 'format':
          showToast(t('formatted'))
          break
        case 'minify':
          showToast(t('minified'))
          break
        case 'escape':
          showToast(t('escaped'))
          break
        case 'unescape':
          showToast(t('unescaped'))
          break
      }
    }, 200)
  }
}

const copyOutput = async () => {
  if (outputJson.value) {
    await navigator.clipboard.writeText(outputJson.value)
    showToast(t('copied'))
  }
}

const downloadOutput = () => {
  if (!outputJson.value) return
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `json-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const clearAll = () => {
  inputJson.value = ''
  outputJson.value = ''
  error.value = null
  showToast(t('cleared'), 'info')
}

const loadSample = () => {
  inputJson.value = JSON.stringify(
    {
      project: 'A Tool Website',
      features: ['Json', 'Json Diff', 'Sql Format'],
      active: true,
      version: 1.0,
    },
    null,
    2,
  )
  showToast(t('loaded'), 'info')
}

const loadFromHistory = (content: string) => {
  inputJson.value = content
  showHistoryDropdown.value = false
}

const handleClearHistory = () => {
  clearHistory()
  showToast(t('historyCleared'), 'info')
  showHistoryDropdown.value = false
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}
</script>

<template>
  <div class="editor-container">
    <div class="editor-layout">
      <!-- Left Pane: Input -->
      <div class="pane">
        <div class="pane-header">
          <div class="pane-title">
            <span class="status-dot" :class="{ active: inputJson.trim() }"></span>
            {{ t('inputJson') }}
          </div>
          <div class="pane-actions">
            <div ref="historyWrapperRef" class="history-wrapper">
              <button
                class="icon-action"
                @click="showHistoryDropdown = !showHistoryDropdown"
                :title="t('history')"
              >
                <BaseIcon name="clock" :size="16" />
                &nbsp;&nbsp;{{ t('history') }}&nbsp;&nbsp;
              </button>
              <div v-if="showHistoryDropdown" class="history-dropdown">
                <div class="history-header">
                  <span>{{ t('history') }}</span>
                  <button v-if="hasHistory" class="clear-btn" @click="handleClearHistory">
                    {{ t('clearHistory') }}
                  </button>
                </div>
                <div v-if="!hasHistory" class="history-empty">{{ t('noHistory') }}</div>
                <div v-else class="history-list">
                  <div
                    v-for="(item, index) in history"
                    :key="index"
                    class="history-item"
                    @click="loadFromHistory(item.content)"
                  >
                    <div class="history-preview">{{ item.preview }}</div>
                    <div class="history-time">{{ formatTime(item.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pane-meta">
              <span class="meta-text">{{ stats.size }} B</span>
              <span class="meta-divider">|</span>
              <span class="meta-text">{{ stats.lines }} {{ t('lines') }}</span>
            </div>
          </div>
        </div>
        <div class="editor-wrapper">
          <CodeMirrorEditor v-model="inputJson" :placeholder="t('pasteJsonHere')" />
        </div>
      </div>

      <!-- Center: Toolbar -->
      <div class="center-toolbar">
        <button class="format-btn" @click="processJson('format')">
          <BaseIcon name="json" :size="16" />
          {{ t('format') }}
        </button>

        <div class="tool-group">
          <button class="tool-btn" @click="processJson('escape')">
            <img src="@/assets/img/Serialize.svg" alt="serialize" width="25" height="25" />
            {{ t('escape') }}
          </button>
          <button class="tool-btn" @click="processJson('unescape')">
            <img src="@/assets/img/Deserialize.svg" alt="deserialize" width="25" height="25" />
            {{ t('unescape') }}
          </button>
          <button class="tool-btn" @click="processJson('minify')">
            <BaseIcon name="minify" :size="16" />
            {{ t('minify') }}
          </button>
        </div>
      </div>

      <!-- Right Pane: Output -->
      <div class="pane">
        <div class="pane-header">
          <div class="pane-title">
            {{ t('output') }}
            <span v-if="error" class="badge error">{{ t('invalid') }}</span>
            <span v-else-if="outputJson" class="badge success">{{ t('valid') }}</span>
          </div>
          <div class="pane-actions">
            <button class="icon-action" @click="copyOutput" :title="t('copy')">
              <BaseIcon name="copy" :size="16" />
              &nbsp;&nbsp;{{ t('copy') }}&nbsp;&nbsp;
            </button>
            <button class="icon-action" @click="downloadOutput" :title="t('download')">
              <BaseIcon name="download" :size="16" />
              &nbsp;&nbsp;{{ t('download') }}&nbsp;&nbsp;
            </button>
          </div>
        </div>
        <div class="editor-wrapper">
          <CodeMirrorEditor
            :model-value="outputJson"
            :readonly="true"
            :placeholder="t('resultWillAppear')"
          />

          <div v-if="error" class="error-toast">
            <div class="error-title">{{ t('parsingError') }}</div>
            <pre class="error-text">{{ error }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="bottom-actions">
      <button class="action-btn danger" @click="clearAll">
        <BaseIcon name="clear" :size="16" />
        {{ t('clear') }}
      </button>
      <button class="action-btn primary" @click="loadSample">
        <BaseIcon name="fileText" :size="16" />
        {{ t('loadSample') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  width: 85%;
  height: 90%;
  margin: 0 auto;
  padding-top: 80px;
  gap: 20px;
}

.editor-layout {
  display: flex;
  flex: 1;
  gap: 24px;
  min-height: 0;
}

.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  min-width: 0;
}

.pane-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
  flex-shrink: 0;
}

.pane-title {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: background 0.2s;
}

.status-dot.active {
  background: rgb(34 197 94 / var(--tw-bg-opacity, 1));
}

.pane-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.meta-divider {
  opacity: 0.4;
}

.pane-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Center Toolbar */
.center-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 120px;
  margin: 0 30px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.center-toolbar button {
  margin-bottom: 10px;
}

.format-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 16px;
  background: var(--accent-color);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-md);
}

.format-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.editor-layout {
  display: flex;
  gap: 8px;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 16px;
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background: var(--bg-secondary);
}

.icon-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
}

/* Badges */
.badge {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.badge.error {
  background: var(--error-bg);
  color: var(--error-color);
}
.badge.success {
  background: var(--accent-light);
  color: var(--accent-text);
}

/* Icon Actions */
.icon-action {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.icon-action:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

/* Bottom Actions */
.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 20px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 28px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.action-btn.danger {
  background: var(--error-bg);
  color: var(--error-color);
  border-color: transparent;
}
.action-btn.danger:hover {
  background: var(--error-color);
  color: white;
}

.action-btn.primary {
  background: var(--accent-light);
  color: var(--accent-color);
}
.action-btn.primary:hover {
  background: var(--accent-color);
  color: white;
}

/* Error Toast */
.error-toast {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 10;
  background: var(--error-bg);
  border: 1px solid var(--error-color);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease;
}

.error-title {
  color: var(--error-color);
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.error-text {
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-family: var(--font-mono);
  margin: 0;
  white-space: pre-wrap;
  max-height: 100px;
  overflow-y: auto;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* History Dropdown */
.history-wrapper {
  position: relative;
}

.history-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 300px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--error-color);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}
.clear-btn:hover {
  background: var(--error-bg);
}

.history-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.15s;
}
.history-item:last-child {
  border-bottom: none;
}
.history-item:hover {
  background: var(--bg-secondary);
}

.history-preview {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.history-time {
  font-size: 0.7rem;
  color: var(--text-muted);
}
</style>
