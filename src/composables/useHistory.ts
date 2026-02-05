import { ref, computed } from 'vue'

export interface HistoryItem {
  content: string
  timestamp: number
  preview: string
}

const MAX_HISTORY_ITEMS = 50

function getStorageKey(editorKey: string): string {
  return `tool-history-${editorKey}`
}

function loadHistory(editorKey: string): HistoryItem[] {
  try {
    const stored = localStorage.getItem(getStorageKey(editorKey))
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHistory(editorKey: string, items: HistoryItem[]): void {
  try {
    localStorage.setItem(getStorageKey(editorKey), JSON.stringify(items))
  } catch {
    // localStorage might be full or disabled
  }
}

function createPreview(content: string): string {
  const trimmed = content.trim()
  if (trimmed.length <= 50) return trimmed
  return trimmed.substring(0, 50) + '...'
}

export function useHistory(editorKey: string) {
  const history = ref<HistoryItem[]>(loadHistory(editorKey))

  const addToHistory = (content: string) => {
    if (!content.trim()) return

    // Check if content already exists (avoid duplicates)
    const existingIndex = history.value.findIndex((item) => item.content === content)
    if (existingIndex !== -1) {
      // Move to top
      const existing = history.value[existingIndex]!
      history.value.splice(existingIndex, 1)
      existing.timestamp = Date.now()
      history.value.unshift(existing)
    } else {
      // Add new item
      history.value.unshift({
        content,
        timestamp: Date.now(),
        preview: createPreview(content),
      })

      // Limit to max items
      if (history.value.length > MAX_HISTORY_ITEMS) {
        history.value = history.value.slice(0, MAX_HISTORY_ITEMS)
      }
    }

    saveHistory(editorKey, history.value)
  }

  const removeFromHistory = (index: number) => {
    history.value.splice(index, 1)
    saveHistory(editorKey, history.value)
  }

  const clearHistory = () => {
    history.value = []
    saveHistory(editorKey, [])
  }

  const hasHistory = computed(() => history.value.length > 0)

  return {
    history,
    hasHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}
