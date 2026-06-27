<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/base/BaseIcon.vue'

const { t } = useI18n()
const { showToast } = useToast()

const activeTab = ref<'text' | 'image'>('text')

const textInput = ref('')
const textOutput = ref('')
const textMode = ref<'encode' | 'decode'>('encode')

const encodeText = () => {
  try {
    textOutput.value = btoa(unescape(encodeURIComponent(textInput.value)))
    showToast(t('encoded'))
  } catch (e) {
    showToast('Encode failed', 'error')
  }
}

const decodeText = () => {
  try {
    textOutput.value = decodeURIComponent(escape(atob(textInput.value)))
    showToast(t('decoded'))
  } catch (e) {
    showToast('Invalid Base64 string', 'error')
  }
}

const processText = () => {
  if (!textInput.value.trim()) {
    showToast('Please enter text', 'warning')
    return
  }
  if (textMode.value === 'encode') {
    encodeText()
  } else {
    decodeText()
  }
}

const swapText = () => {
  const temp = textInput.value
  textInput.value = textOutput.value
  textOutput.value = temp
  textMode.value = textMode.value === 'encode' ? 'decode' : 'encode'
}

const clearText = () => {
  textInput.value = ''
  textOutput.value = ''
  showToast(t('cleared'), 'info')
}

const copyTextOutput = async () => {
  if (!textOutput.value) return
  await navigator.clipboard.writeText(textOutput.value)
  showToast(t('copied'))
}

const imageBase64 = ref('')
const imageName = ref('')
const imageType = ref('')
const imageSize = ref(0)
const isImageValid = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const imageSrc = computed(() => {
  if (!imageBase64.value || !isImageValid.value) return ''
  return imageBase64.value.startsWith('data:image') ? imageBase64.value : `data:image/png;base64,${imageBase64.value}`
})

const base64Length = computed(() => imageBase64.value.length)

const validateBase64 = () => {
  if (!imageBase64.value.trim()) {
    isImageValid.value = false
    imageType.value = ''
    imageSize.value = 0
    return
  }

  const base64Str = imageBase64.value.trim()
  
  try {
    const hasDataPrefix = base64Str.startsWith('data:image')
    const pureBase64 = hasDataPrefix ? base64Str.split(',')[1] || '' : base64Str
    
    const decoded = atob(pureBase64)
    const byteArray = new Uint8Array(decoded.length)
    for (let i = 0; i < decoded.length; i++) {
      byteArray[i] = decoded.charCodeAt(i)
    }

    const blob = new Blob([byteArray])
    imageSize.value = blob.size
    
    if (hasDataPrefix) {
      const match = base64Str.match(/^data:image\/([a-zA-Z0-9+.-]+);/)
      imageType.value = match ? `image/${match[1]}` : 'image/unknown'
    } else {
      const header = byteArray.slice(0, 4)
      const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('')
      if (headerHex.startsWith('89504e47')) {
        imageType.value = 'image/png'
      } else if (headerHex.startsWith('ffd8ffe')) {
        imageType.value = 'image/jpeg'
      } else if (headerHex.startsWith('47494638')) {
        imageType.value = 'image/gif'
      } else if (headerHex.startsWith('424d')) {
        imageType.value = 'image/bmp'
      } else if (headerHex.startsWith('52494646')) {
        imageType.value = 'image/webp'
      } else {
        imageType.value = 'image/unknown'
      }
    }

    isImageValid.value = true
  } catch {
    isImageValid.value = false
    imageType.value = ''
    imageSize.value = 0
  }
}

const handleFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file', 'warning')
    return
  }

  imageName.value = file.name
  imageType.value = file.type
  imageSize.value = file.size

  const reader = new FileReader()
  reader.onload = (e) => {
    imageBase64.value = e.target?.result as string
    isImageValid.value = true
    showToast('Image loaded', 'info')
  }
  reader.onerror = () => {
    showToast('Failed to read image', 'error')
  }
  reader.readAsDataURL(file)
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  const file = files?.[0]
  if (file) {
    handleFile(file)
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const clearImage = () => {
  imageBase64.value = ''
  imageName.value = ''
  imageType.value = ''
  imageSize.value = 0
  isImageValid.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  showToast(t('cleared'), 'info')
}

const copyImageBase64 = async () => {
  if (!imageBase64.value) return
  await navigator.clipboard.writeText(imageBase64.value)
  showToast(t('copied'))
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const pasteFromClipboard = async () => {
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          const file = new File([blob], 'pasted-image', { type })
          handleFile(file)
          return
        }
      }
    }
    showToast('No image found in clipboard', 'warning')
  } catch (e) {
    showToast('Failed to read clipboard', 'error')
  }
}
</script>

<template>
  <div class="base64-tool-page">
    <div class="tool-container">

      <div class="tool-section">
        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'text' }"
            @click="activeTab = 'text'"
          >
            <BaseIcon name="fileText" :size="16" />
            {{ t('textToBase64') }} / {{ t('base64ToText') }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'image' }"
            @click="activeTab = 'image'"
          >
            <BaseIcon name="base64" :size="16" />
            {{ t('imageBase64') }}
          </button>
        </div>

        <div v-show="activeTab === 'text'" class="tab-content">
          <div class="mode-toggle">
            <button
              class="mode-btn"
              :class="{ active: textMode === 'encode' }"
              @click="textMode = 'encode'"
            >
              <BaseIcon name="escape" :size="14" />
              {{ t('encode') }}
            </button>
            <button
              class="mode-btn"
              :class="{ active: textMode === 'decode' }"
              @click="textMode = 'decode'"
            >
              <BaseIcon name="unescape" :size="14" />
              {{ t('decode') }}
            </button>
          </div>

          <div class="text-panes">
            <div class="text-pane">
              <div class="pane-header">
                <span class="pane-title">{{ t('inputText') }}</span>
                <button class="pane-action-btn" @click="clearText" :title="t('clear')">
                  <BaseIcon name="clear" :size="14" />
                </button>
              </div>
              <textarea
                v-model="textInput"
                class="text-area"
                :placeholder="textMode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'"
              ></textarea>
            </div>

            <div class="pane-divider">
              <button class="swap-btn" @click="swapText" title="Swap">
                <BaseIcon name="swap" :size="16" />
              </button>
            </div>

            <div class="text-pane">
              <div class="pane-header">
                <span class="pane-title">{{ t('outputText') }}</span>
                <button
                  class="pane-action-btn"
                  @click="copyTextOutput"
                  :disabled="!textOutput"
                  :title="t('copy')"
                >
                  <BaseIcon name="copy" :size="14" />
                </button>
              </div>
              <textarea
                v-model="textOutput"
                class="text-area output-area"
                readonly
                placeholder="Result will appear here..."
              ></textarea>
            </div>
          </div>

          <div class="action-bar">
            <button class="action-btn primary" @click="processText" :disabled="!textInput.trim()">
              <BaseIcon name="play" :size="16" />
              {{ textMode === 'encode' ? t('encode') : t('decode') }}
            </button>
            <div class="stats">
              <span>Input: {{ textInput.length }} chars</span>
              <span class="stat-divider">|</span>
              <span>Output: {{ textOutput.length }} chars</span>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'image'" class="tab-content">
          <div class="mode-toggle">
            <button class="mode-btn disabled">
              <BaseIcon name="base64" :size="14" />
              {{ t('imageBase64') }}
            </button>
            <button class="mode-btn disabled">
              <BaseIcon name="image" :size="14" />
              {{ t('preview') }}
            </button>
          </div>

          <div class="image-panes">
            <div class="image-pane">
              <div class="pane-header">
                <span class="pane-title">{{ t('base64String') }}{{ base64Length ? `：${base64Length} chars` : '' }}</span>
                <div class="pane-actions">
                  <button
                    class="pane-action-btn"
                    @click="copyImageBase64"
                    :disabled="!imageBase64"
                    :title="t('copy')"
                  >
                    <BaseIcon name="copy" :size="14" />
                  </button>
                  <button
                    class="pane-action-btn"
                    @click="clearImage"
                    :disabled="!imageBase64"
                    :title="t('clear')"
                  >
                    <BaseIcon name="clear" :size="14" />
                  </button>
                </div>
              </div>
              <textarea
                v-model="imageBase64"
                class="text-area base64-output"
                placeholder="Paste Base64 string here..."
                @input="validateBase64"
              ></textarea>
            </div>

            <div class="image-pane">
              <div class="pane-header">
                <span class="pane-title">{{ t('imagePreview') }}{{ imageType ? `：${imageType}` : '' }} {{ imageSize ? formatSize(imageSize) : '' }}</span>
                <div class="pane-actions">
                  <button class="pane-action-btn" @click="triggerFileInput" :title="t('uploadImage')">
                    <BaseIcon name="download" :size="14" />
                  </button>
                  <button class="pane-action-btn" @click="pasteFromClipboard" :title="t('pasteImage')">
                    <BaseIcon name="copy" :size="14" />
                  </button>
                </div>
              </div>

              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="file-input"
                @change="handleFileSelect"
              />

              <div class="image-preview-area">
                <template v-if="imageBase64 && isImageValid">
                  <img :src="imageSrc" :alt="imageName || 'Preview'" class="preview-image" />
                </template>
                <template v-else>
                  <div class="preview-placeholder">
                    <BaseIcon name="image" :size="48" class="drop-icon" />
                    <p class="drop-text">{{ imageBase64 && !isImageValid ? 'Invalid Base64 image' : 'Image preview will appear here...' }}</p>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.base64-tool-page {
  width: 100%;
  height: 100%;
  padding: 80px 24px 48px;
  overflow-y: auto;
}

.tool-container {
  max-width: 75%;
  margin: 0 auto;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 32px 0;
}

.tool-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding: 16px 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-weight: 600;
}

.tab-btn:hover:not(.active) {
  background: var(--bg-tertiary);
}

.tab-content {
  padding: 28px;
}

.mode-toggle {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.mode-btn:hover:not(.active) {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.mode-btn.disabled {
  cursor: default;
  opacity: 0.6;
}

.mode-btn.disabled:hover {
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.text-panes {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.text-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.pane-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pane-actions {
  display: flex;
  gap: 6px;
}

.pane-action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.pane-action-btn:hover {
  background: var(--bg-secondary);
  color: var(--accent-color);
}

.pane-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.text-area {
  flex: 1;
  min-height: 260px;
  padding: 16px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: var(--font-mono);
  resize: vertical;
  outline: none;
  line-height: 1.6;
}

.output-area {
  background: var(--bg-tertiary);
  cursor: default;
}

.pane-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.swap-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
  box-shadow: var(--shadow-sm);
}

.swap-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  transform: rotate(180deg);
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background: var(--bg-primary);
}

.action-btn.primary {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.stat-divider {
  opacity: 0.4;
}

.image-panes {
  display: flex;
  gap: 20px;
  align-items: stretch;
}

.image-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.file-input {
  display: none;
}

.image-preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
  min-height: 260px;
  max-height: 500px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-muted);
}

.drop-icon {
  color: var(--text-muted);
  margin-bottom: 20px;
}

.drop-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  text-align: center;
  margin: 0;
}

.base64-output {
  min-height: 340px;
  font-size: 0.75rem;
  word-break: break-all;
}

.base64-stats {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
