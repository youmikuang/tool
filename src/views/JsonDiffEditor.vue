<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CodeMirrorEditor from '@/components/base/CodeMirrorEditor.vue'
import BaseIcon from '@/components/base/BaseIcon.vue'
import { useI18n } from '@/composables/useI18n'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'

const { t } = useI18n()
const { showToast } = useToast()
const originalHistory = useHistory('json-diff-original')
const modifiedHistory = useHistory('json-diff-modified')

// History dropdown state
const showOriginalHistoryDropdown = ref(false)
const showModifiedHistoryDropdown = ref(false)
const originalHistoryWrapperRef = ref<HTMLElement | null>(null)
const modifiedHistoryWrapperRef = ref<HTMLElement | null>(null)

// Click outside to close dropdowns
const handleClickOutside = (event: MouseEvent) => {
  if (
    originalHistoryWrapperRef.value &&
    !originalHistoryWrapperRef.value.contains(event.target as Node)
  ) {
    showOriginalHistoryDropdown.value = false
  }
  if (
    modifiedHistoryWrapperRef.value &&
    !modifiedHistoryWrapperRef.value.contains(event.target as Node)
  ) {
    showModifiedHistoryDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const originalJson = ref('')
const modifiedJson = ref('')
const hasCompared = ref(false)
const error = ref<{ original?: string; modified?: string }>({})

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified'
  key?: string
  indent: number
  content: string
  oldValue?: string
  newValue?: string
  isStructural?: boolean // for { } [ ] characters
}

const diffLines = ref<DiffLine[]>([])

const stats = computed(() => ({
  added: diffLines.value.filter((l) => l.type === 'added').length,
  removed: diffLines.value.filter((l) => l.type === 'removed').length,
  modified: diffLines.value.filter((l) => l.type === 'modified').length,
}))

const inputStats = computed(() => ({
  size: new Blob([originalJson.value]).size,
  lines: originalJson.value ? originalJson.value.split('\n').length : 0,
}))

const outputStats = computed(() => ({
  size: new Blob([modifiedJson.value]).size,
  lines: modifiedJson.value ? modifiedJson.value.split('\n').length : 0,
}))

// Deep comparison and generate diff lines
const generateDiff = (original: any, modified: any, indent: number = 0): DiffLine[] => {
  const lines: DiffLine[] = []
  const indentStr = '  '.repeat(indent)

  // Handle null/undefined
  if (original === null && modified === null) return lines
  if (original === undefined && modified === undefined) return lines

  // Different types or primitives
  if (
    typeof original !== typeof modified ||
    typeof original !== 'object' ||
    original === null ||
    modified === null
  ) {
    // This case should be handled at the key level
    return lines
  }

  const isArray = Array.isArray(original) && Array.isArray(modified)
  const originalKeys = isArray ? original.map((_, i) => String(i)) : Object.keys(original)
  const modifiedKeys = isArray ? modified.map((_, i) => String(i)) : Object.keys(modified)
  const allKeys = Array.from(new Set([...originalKeys, ...modifiedKeys]))

  // Sort keys for consistent display (but arrays keep order)
  if (!isArray) {
    allKeys.sort()
  }

  for (const key of allKeys) {
    const origVal = isArray ? original[parseInt(key)] : original[key]
    const modVal = isArray ? modified[parseInt(key)] : modified[key]
    const keyDisplay = isArray ? '' : `"${key}": `

    const inOriginal = isArray ? parseInt(key) < original.length : key in original
    const inModified = isArray ? parseInt(key) < modified.length : key in modified

    if (!inOriginal) {
      // Added
      const valueStr = JSON.stringify(modVal)
      lines.push({
        type: 'added',
        key,
        indent,
        content: `${indentStr}${keyDisplay}${valueStr}`,
        newValue: valueStr,
      })
    } else if (!inModified) {
      // Removed
      const valueStr = JSON.stringify(origVal)
      lines.push({
        type: 'removed',
        key,
        indent,
        content: `${indentStr}${keyDisplay}${valueStr}`,
        oldValue: valueStr,
      })
    } else if (typeof origVal !== typeof modVal) {
      // Type changed - treat as modified
      lines.push({
        type: 'modified',
        key,
        indent,
        content: `${indentStr}${keyDisplay}`,
        oldValue: JSON.stringify(origVal),
        newValue: JSON.stringify(modVal),
      })
    } else if (typeof origVal === 'object' && origVal !== null && modVal !== null) {
      // Both are objects/arrays - recurse
      const isNestedArray = Array.isArray(origVal)
      lines.push({
        type: 'unchanged',
        indent,
        content: `${indentStr}${keyDisplay}${isNestedArray ? '[' : '{'}`,
        isStructural: true,
      })
      lines.push(...generateDiff(origVal, modVal, indent + 1))
      lines.push({
        type: 'unchanged',
        indent,
        content: `${indentStr}${isNestedArray ? ']' : '}'}`,
        isStructural: true,
      })
    } else if (origVal !== modVal) {
      // Primitive value changed
      lines.push({
        type: 'modified',
        key,
        indent,
        content: `${indentStr}${keyDisplay}`,
        oldValue: JSON.stringify(origVal),
        newValue: JSON.stringify(modVal),
      })
    } else {
      // Unchanged
      lines.push({
        type: 'unchanged',
        key,
        indent,
        content: `${indentStr}${keyDisplay}${JSON.stringify(origVal)}`,
      })
    }
  }

  return lines
}

const compare = () => {
  error.value = {}
  diffLines.value = []
  hasCompared.value = true

  let origData: any, modData: any

  try {
    origData = JSON.parse(originalJson.value || '{}')
  } catch (e: any) {
    error.value.original = e.message
  }

  try {
    modData = JSON.parse(modifiedJson.value || '{}')
  } catch (e: any) {
    error.value.modified = e.message
  }

  if (error.value.original || error.value.modified) return

  // Generate diff lines
  const isArray = Array.isArray(origData) && Array.isArray(modData)
  const lines: DiffLine[] = []

  lines.push({ type: 'unchanged', indent: 0, content: isArray ? '[' : '{', isStructural: true })
  lines.push(...generateDiff(origData, modData, 1))
  lines.push({ type: 'unchanged', indent: 0, content: isArray ? ']' : '}', isStructural: true })

  diffLines.value = lines

  // Save to history on successful compare
  if (!error.value.original && !error.value.modified) {
    if (originalJson.value.trim()) originalHistory.addToHistory(originalJson.value)
    if (modifiedJson.value.trim()) modifiedHistory.addToHistory(modifiedJson.value)
  }

  if (lines.length === 0) {
    showToast(t('noDiff'), 'info')
  } else {
    showToast(t('compareSuccess'))
  }
}

const swap = () => {
  const temp = originalJson.value
  originalJson.value = modifiedJson.value
  modifiedJson.value = temp
  if (hasCompared.value) compare()
  showToast(t('swapped'))
}

const clearAll = () => {
  originalJson.value = ''
  modifiedJson.value = ''
  diffLines.value = []
  error.value = {}
  hasCompared.value = false
  showToast(t('cleared'), 'info')
}

const loadFromOriginalHistory = (content: string) => {
  originalJson.value = content
  showOriginalHistoryDropdown.value = false
}

const loadFromModifiedHistory = (content: string) => {
  modifiedJson.value = content
  showModifiedHistoryDropdown.value = false
}

const handleClearOriginalHistory = () => {
  originalHistory.clearHistory()
  showToast(t('historyCleared'), 'info')
  showOriginalHistoryDropdown.value = false
}

const handleClearModifiedHistory = () => {
  modifiedHistory.clearHistory()
  showToast(t('historyCleared'), 'info')
  showModifiedHistoryDropdown.value = false
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}
</script>

<template>
  <div class="diff-container">
    <div class="diff-layout">
      <!-- Left: Original -->
      <div class="pane">
        <div class="pane-header">
          <div class="pane-title">
            <span class="status-dot" :class="{ active: originalJson.trim() }"></span>
            {{ t('originalJson') }}
          </div>
          <div class="pane-actions">
            <div ref="originalHistoryWrapperRef" class="history-wrapper">
              <button
                class="icon-action"
                @click="showOriginalHistoryDropdown = !showOriginalHistoryDropdown"
                :title="t('history')"
              >
                <BaseIcon name="clock" :size="16" />
                &nbsp;&nbsp;{{ t('history') }}&nbsp;&nbsp;
              </button>
              <div v-if="showOriginalHistoryDropdown" class="history-dropdown">
                <div class="history-header">
                  <span>{{ t('history') }}</span>
                  <button
                    v-if="originalHistory.hasHistory.value"
                    class="clear-btn"
                    @click="handleClearOriginalHistory"
                  >
                    {{ t('clearHistory') }}
                  </button>
                </div>
                <div v-if="!originalHistory.hasHistory.value" class="history-empty">
                  {{ t('noHistory') }}
                </div>
                <div v-else class="history-list">
                  <div
                    v-for="(item, index) in originalHistory.history.value"
                    :key="index"
                    class="history-item"
                    @click="loadFromOriginalHistory(item.content)"
                  >
                    <div class="history-preview">{{ item.preview }}</div>
                    <div class="history-time">{{ formatTime(item.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pane-meta">
              <span class="meta-text">{{ inputStats.size }} B</span>
              <span class="meta-divider">|</span>
              <span class="meta-text">{{ inputStats.lines }} {{ t('lines') }}</span>
            </div>
          </div>
        </div>
        <div class="editor-wrapper">
          <CodeMirrorEditor v-model="originalJson" :placeholder="t('pasteOriginal')" />
          <div v-if="error.original" class="error-badge">{{ t('invalid') }}</div>
        </div>
      </div>

      <!-- Center: Actions -->
      <div class="center-actions">
        <button class="action-btn primary" @click="compare">
          <BaseIcon name="search" :size="18" />
          {{ t('compare') }}
        </button>
        <button class="action-btn secondary" @click="swap">
          <BaseIcon name="swap" :size="18" />
          {{ t('swap') }}
        </button>
        <button class="action-btn danger" @click="clearAll">
          <BaseIcon name="clear" :size="16" />
          {{ t('clear') }}
        </button>
      </div>

      <!-- Right: Modified -->
      <div class="pane">
        <div class="pane-header">
          <div class="pane-title">
            <span class="status-dot" :class="{ active: modifiedJson.trim() }"></span>
            {{ t('modifiedJson') }}
          </div>
          <div class="pane-actions">
            <div ref="modifiedHistoryWrapperRef" class="history-wrapper">
              <button
                class="icon-action"
                @click="showModifiedHistoryDropdown = !showModifiedHistoryDropdown"
                :title="t('history')"
              >
                <BaseIcon name="clock" :size="16" />
                &nbsp;&nbsp;{{ t('history') }}&nbsp;&nbsp;
              </button>
              <div v-if="showModifiedHistoryDropdown" class="history-dropdown">
                <div class="history-header">
                  <span>{{ t('history') }}</span>
                  <button
                    v-if="modifiedHistory.hasHistory.value"
                    class="clear-btn"
                    @click="handleClearModifiedHistory"
                  >
                    {{ t('clearHistory') }}
                  </button>
                </div>
                <div v-if="!modifiedHistory.hasHistory.value" class="history-empty">
                  {{ t('noHistory') }}
                </div>
                <div v-else class="history-list">
                  <div
                    v-for="(item, index) in modifiedHistory.history.value"
                    :key="index"
                    class="history-item"
                    @click="loadFromModifiedHistory(item.content)"
                  >
                    <div class="history-preview">{{ item.preview }}</div>
                    <div class="history-time">{{ formatTime(item.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pane-meta">
              <span class="meta-text">{{ outputStats.size }} B</span>
              <span class="meta-divider">|</span>
              <span class="meta-text">{{ outputStats.lines }} {{ t('lines') }}</span>
            </div>
          </div>
        </div>
        <div class="editor-wrapper">
          <CodeMirrorEditor v-model="modifiedJson" :placeholder="t('pasteModified')" />
          <div v-if="error.modified" class="error-badge">{{ t('invalid') }}</div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="hasCompared" class="results-section">
      <div class="results-header">
        <div class="results-title">{{ t('comparisonResult') }}</div>
        <div class="results-legend">
          <span class="legend-item added"> <span class="legend-dot"></span> {{ t('added') }} </span>
          <span class="legend-item removed">
            <span class="legend-dot"></span> {{ t('removed') }}
          </span>
          <span class="legend-item modified">
            <span class="legend-dot"></span> {{ t('modified') }}
          </span>
        </div>
      </div>

      <div class="results-content">
        <div v-if="diffLines.length === 0" class="no-diff">✓ {{ t('noDifferences') }}</div>
        <div v-else class="diff-code">
          <div v-for="(line, index) in diffLines" :key="index" class="diff-line" :class="line.type">
            <span class="line-content">
              <template v-if="line.type === 'modified'">
                {{ line.content }}<span class="old-val">{{ line.oldValue }}</span> →
                <span class="new-val">{{ line.newValue }}</span
                >,
              </template>
              <template v-else>
                {{ line.content
                }}<template v-if="!line.isStructural && line.type !== 'unchanged'">,</template>
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-container {
  display: flex;
  flex-direction: column;
  width: 85%;
  height: 90%;
  margin: 0 auto;
  padding-top: 80px;
  gap: 20px;
}

.center-actions button {
  margin-bottom: 10px;
}

.diff-layout {
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 0;
}

.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  min-width: 0;
}

.pane-header {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
  flex-shrink: 0;
  justify-content: space-between;
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

.editor-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.error-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  background: var(--error-bg);
  color: var(--error-color);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}

/* Center Actions */
.center-actions {
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

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.action-btn.primary {
  background: var(--accent-color);
  color: white;
}
.action-btn.primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-color: var(--border-color);
}
.action-btn.secondary:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.action-btn.danger {
  background: var(--error-bg);
  color: var(--error-color);
}
.action-btn.danger:hover {
  background: var(--error-color);
  color: white;
}

/* Results Section */
.results-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  max-height: 350px;
  display: flex;
  flex-direction: column;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.results-title {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.results-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-item.added .legend-dot {
  background: #22c55e;
}
.legend-item.added {
  color: #22c55e;
}

.legend-item.removed .legend-dot {
  background: #ef4444;
}
.legend-item.removed {
  color: #ef4444;
}

.legend-item.modified .legend-dot {
  background: #f59e0b;
}
.legend-item.modified {
  color: #f59e0b;
}

.results-content {
  flex: 1;
  overflow-y: auto;
}

.no-diff {
  text-align: center;
  color: #22c55e;
  font-weight: 500;
  padding: 30px;
}

/* Pretty-printed Diff Code */
.diff-code {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.8;
}

.diff-line {
  padding: 2px 20px 2px 16px;
  border-left: 4px solid transparent;
  white-space: pre;
}

.diff-line.unchanged {
  color: var(--text-secondary);
  background: transparent;
}

.diff-line.added {
  background: rgba(34, 197, 94, 0.12);
  border-left-color: #22c55e;
  color: #16a34a;
}

.diff-line.removed {
  background: rgba(239, 68, 68, 0.12);
  border-left-color: #ef4444;
  color: #dc2626;
}

.diff-line.modified {
  background: rgba(245, 158, 11, 0.12);
  border-left-color: #f59e0b;
  color: var(--text-primary);
}

.old-val {
  text-decoration: line-through;
  color: #ef4444;
  opacity: 0.8;
}

.new-val {
  color: #22c55e;
  font-weight: 600;
}

/* History Dropdown */
.pane-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-wrapper {
  position: relative;
}

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
