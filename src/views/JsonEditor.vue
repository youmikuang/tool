<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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

// Settings
const preserveEscape = ref(false)

// Resizable divider state
const leftPaneWidth = ref(30) // percentage - left 30%, right 70%
const isResizing = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// Click outside to close dropdown
const handleClickOutside = (event: MouseEvent) => {
  if (historyWrapperRef.value && !historyWrapperRef.value.contains(event.target as Node)) {
    showHistoryDropdown.value = false
  }
}

// Resizer handlers
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  document.addEventListener('mousemove', doResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}

const doResize = (e: MouseEvent) => {
  if (!isResizing.value || !containerRef.value) return
  const containerRect = containerRef.value.getBoundingClientRect()
  const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
  leftPaneWidth.value = Math.max(20, Math.min(80, newWidth))
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('keydown', handleKeyDown)
})

// Fullscreen state
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// Keyboard shortcut for fullscreen - only when not typing in an input
const handleKeyDown = (e: KeyboardEvent) => {
  // Check if user is typing in an input/textarea
  const activeElement = document.activeElement
  const isTyping =
    activeElement?.tagName === 'INPUT' ||
    activeElement?.tagName === 'TEXTAREA' ||
    activeElement?.classList.contains('cm-content')

  if (!isTyping && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    toggleFullscreen()
  }
}

// State
const inputJson = ref('')
const outputJson = ref('')
const error = ref<string | null>(null)
const processing = ref(false)
const isValidJson = ref(false)

// Sync control to prevent infinite loops
const isSyncing = ref(false)

// Last saved hash for deduplication
const lastSavedHash = ref('')

const getContentHash = (content: string): string => {
  return content.trim()
}

// Debounce timer for history saving
let historyDebounceTimer: ReturnType<typeof setTimeout> | null = null
const HISTORY_DEBOUNCE_MS = 1000

const saveToHistoryDebounced = (content: string) => {
  // Clear existing timer
  if (historyDebounceTimer) {
    clearTimeout(historyDebounceTimer)
  }

  // Set new timer - save after 1 second of inactivity
  historyDebounceTimer = setTimeout(() => {
    const currentHash = getContentHash(content)
    if (currentHash !== lastSavedHash.value) {
      addToHistory(content)
      lastSavedHash.value = currentHash
    }
  }, HISTORY_DEBOUNCE_MS)
}

// Auto-parse JSON on LEFT input change -> sync to RIGHT (formatted)
// Also handles escaped JSON by trying to unescape first (unless preserveEscape is checked)
watch(inputJson, (newValue) => {
  if (isSyncing.value) return

  if (!newValue.trim()) {
    isSyncing.value = true
    outputJson.value = ''
    nextTick(() => {
      isSyncing.value = false
    })
    error.value = null
    isValidJson.value = false
    return
  }

  let parsed: any
  let jsonToParse = newValue

  // Try direct parse first
  try {
    parsed = JSON.parse(jsonToParse)
  } catch (e) {
    // If direct parse fails, ALWAYS try to unescape and parse
    try {
      const unescaped = unescapeJson(newValue)
      parsed = JSON.parse(unescaped)
      jsonToParse = unescaped
    } catch (e2: any) {
      // Invalid - show error in output
      isSyncing.value = true
      // Prefer showing the unescaped error if possible, or fall back to generic
      outputJson.value = e2.message || (e as any).message || 'Invalid JSON'
      nextTick(() => {
        isSyncing.value = false
      })
      error.value = null
      isValidJson.value = false
      return
    }
  }

  const formatted = JSON.stringify(parsed, null, 2)
  isSyncing.value = true
  outputJson.value = formatted
  nextTick(() => {
    isSyncing.value = false
  })
  error.value = null
  isValidJson.value = true

  // Save to history when valid JSON is entered (debounced)
  saveToHistoryDebounced(formatted)
})

// Sync RIGHT output changes -> to LEFT input (only if valid JSON)
watch(outputJson, (newValue) => {
  if (isSyncing.value) return
  if (!newValue.trim()) return

  // Only sync if it's valid JSON
  try {
    JSON.parse(newValue)
    // Valid JSON - sync to left
    isSyncing.value = true
    inputJson.value = newValue
    nextTick(() => {
      isSyncing.value = false
    })
    saveToHistoryDebounced(newValue)
  } catch (e) {
    // Invalid JSON - don't sync to left, just keep it in output
  }
})

// Stats
const stats = computed(() => ({
  size: new Blob([inputJson.value]).size,
  lines: inputJson.value ? inputJson.value.split('\n').length : 0,
}))

// Actions
const processJson = (mode: 'minify' | 'escape' | 'unescape') => {
  if (!inputJson.value.trim()) return

  processing.value = true
  error.value = null

  try {
    let contentToProcess = inputJson.value

    // If input is not valid JSON, try to unescape it first (for minify/format operations)
    if (mode === 'minify') {
      try {
        JSON.parse(contentToProcess)
      } catch (e) {
        // If direct parse fails, try to unescape
        try {
          const unescaped = unescapeJson(contentToProcess)
          JSON.parse(unescaped)
          contentToProcess = unescaped
        } catch (e2) {
          // Cannot fix, proceed with original (will fail in minifyJson)
        }
      }
    }

    let result = ''
    switch (mode) {
      case 'minify':
        // Expects valid JSON string or unescaped valid JSON
        result = minifyJson(contentToProcess)
        break
      case 'escape':
        result = escapeJson(contentToProcess)
        break
      case 'unescape':
        result = unescapeJson(contentToProcess)
        break
    }

    // Verify if result is valid JSON
    let isValidResult = false
    try {
      JSON.parse(result)
      isValidResult = true
    } catch (e) {
      isValidResult = false
    }

    // Always update output
    isSyncing.value = true
    outputJson.value = result

    // Update input:
    // - If MINIFY/UNESCAPE: only if valid JSON
    // - If ESCAPE: always update (as it produces a string)
    if (mode === 'escape' || isValidResult) {
      inputJson.value = result
    }

    nextTick(() => {
      isSyncing.value = false
    })

    // Show appropriate toast
    const modeText = {
      minify: t('minified'),
      escape: t('escaped'),
      unescape: t('unescaped'),
    }

    if (isValidResult) {
      showToast(modeText[mode])
    } else {
      // For escape, "Invalid JSON" is expected (it's a string now)
      if (mode === 'escape') {
        showToast(modeText[mode])
      } else {
        showToast(`${modeText[mode]} (${t('invalidJson')})`, 'warning')
      }
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    processing.value = false
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
  lastSavedHash.value = ''
  showToast(t('cleared'), 'info')
}

const loadSample = () => {
  inputJson.value = JSON.stringify(
    {
      project: 'A Tool Website',
      features: ['Json', 'Json Diff', 'Sql Format'],
      active: true,
      version: 1.1,
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
  <div class="json-editor-page" :class="{ fullscreen: isFullscreen }" ref="containerRef">
    <!-- Left Pane: Input -->
    <div class="input-pane" :style="{ width: leftPaneWidth + '%' }">
      <div class="editor-area">
        <CodeMirrorEditor v-model="inputJson" :placeholder="t('pasteJsonHere')" />
      </div>
    </div>

    <!-- Resizable Divider -->
    <div class="pane-divider" :class="{ dragging: isResizing }" @mousedown="startResize"></div>

    <!-- Right Pane: Toolbar + Output -->
    <div class="output-pane" :style="{ width: 100 - leftPaneWidth + '%' }">
      <!-- Horizontal Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="toolbar-btn" @click="processJson('minify')" :title="t('minify')">
            <img src="@/assets/img/compress.svg" alt="compress" width="23" height="23" />
          </button>
          <button class="toolbar-btn" @click="processJson('escape')" :title="t('escape')">
            <img src="@/assets/img/Serialize.svg" alt="serialize" width="20" height="20" />
          </button>
          <button class="toolbar-btn" @click="processJson('unescape')" :title="t('unescape')">
            <img src="@/assets/img/Deserialize.svg" alt="deserialize" width="20" height="20" />
          </button>
          <button class="toolbar-btn danger" @click="clearAll" :title="t('clear')">
            <BaseIcon name="clear" :size="20" />
          </button>
          <button class="toolbar-btn" @click="copyOutput" :title="t('copy')">
            <BaseIcon name="copy" :size="20" />
          </button>
          <button class="toolbar-btn" @click="downloadOutput" :title="t('download')">
            <BaseIcon name="download" :size="20" />
          </button>
          <button class="toolbar-btn" @click="loadSample" :title="t('loadSample')">
            <BaseIcon name="fileText" :size="20" />
          </button>

          <!-- History Button -->
          <div ref="historyWrapperRef" class="history-wrapper">
            <button
              class="toolbar-btn"
              @click="showHistoryDropdown = !showHistoryDropdown"
              :title="t('history')"
            >
              <BaseIcon name="clock" :size="20" />
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
        </div>

        <div class="toolbar-right">
          <!-- Preserve Escape Checkbox -->
          <label class="checkbox-label">
            <input type="checkbox" v-model="preserveEscape" />
            <span class="checkmark"></span>
            {{ t('preserveEscape') }}
          </label>

          <!-- Fullscreen Button -->
          <button
            class="toolbar-btn"
            @click="toggleFullscreen"
            :title="isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'"
          >
            <BaseIcon :name="isFullscreen ? 'shrink' : 'expand'" :size="20" />
          </button>
        </div>
      </div>

      <!-- Output Editor (Editable) -->
      <div class="editor-area">
        <CodeMirrorEditor v-model="outputJson" :placeholder="t('clickToEdit')" />

        <div v-if="error" class="error-toast">
          <div class="error-title">{{ t('parsingError') }}</div>
          <pre class="error-text">{{ error }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.json-editor-page {
  display: flex;
  width: 85%;
  height: 95%;
  margin: 0 auto;
  padding-top: 80px;
  background: var(--bg-app);
  user-select: none;
  transition: all 0.3s ease;
}

.json-editor-page.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  z-index: 9999;
  background: var(--bg-app);
}

.input-pane {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  margin: 16px;
  margin-right: 0;
  overflow: hidden;
}

.pane-divider {
  width: 8px;
  background: var(--border-color);
  margin: 16px 0;
  cursor: col-resize;
  transition: background 0.2s;
  flex-shrink: 0;
}

.pane-divider:hover,
.pane-divider.dragging {
  background: var(--accent-color);
}

.output-pane {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  margin: 16px;
  margin-left: 0;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.editor-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: var(--bg-secondary);
  color: var(--accent-color);
}

.toolbar-btn.danger:hover {
  color: var(--error-color);
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 1px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-color);
  cursor: pointer;
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
  left: 0;
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
