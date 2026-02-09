import { ref, computed } from 'vue'

export type Locale = 'en' | 'zh'

const translations = {
  en: {
    // Header
    json: 'Json',
    jsonDiff: 'Json Diff',
    sqlFormat: 'SQL Format',
    chromeExtension: 'Chrome Extension',
    switchToLight: 'Switch to Light',
    switchToDark: 'Switch to Dark',

    // JsonEditor
    inputJson: 'INPUT JSON',
    output: 'OUTPUT',
    import: 'Import',
    format: 'Format',
    minify: 'Minify',
    escape: 'Escape',
    unescape: 'Unescape',
    fixJson: 'Fix JSON',
    clear: 'Clear',
    loadSample: 'Load Sample',
    copy: 'Copy',
    download: 'Download',
    lines: 'Lines',
    valid: 'Valid',
    invalid: 'Invalid',
    parsingError: 'Parsing Error',
    pasteJsonHere: 'Paste JSON here...',
    resultWillAppear: 'Result will appear here...',

    // DiffEditor
    originalJson: 'ORIGINAL JSON',
    modifiedJson: 'MODIFIED JSON',
    compare: 'Compare',
    swap: 'Swap',
    comparisonResult: 'COMPARISON RESULT',
    added: 'Added',
    removed: 'Removed',
    modified: 'Modified',
    noDifferences: 'No differences found',
    pasteOriginal: 'Paste original JSON...',
    pasteModified: 'Paste modified JSON...',

    // SqlEditor
    inputSql: 'INPUT SQL',
    outputSql: 'FORMATTED SQL',
    dialect: 'Dialect',
    formatSql: 'Format SQL',
    pasteSqlHere: 'Paste SQL here...',

    // Toast Messages
    copied: 'Copied to clipboard',
    formatted: 'Formatted successfully',
    minified: 'Minified successfully',
    escaped: 'Escaped successfully',
    unescaped: 'Unescaped successfully',
    cleared: 'Cleared',
    loaded: 'Sample loaded',
    noDiff: 'No differences found',
    compareSuccess: 'Comparison complete',
    swapped: 'Content swapped',

    // History
    history: 'History',
    noHistory: 'No history yet',
    clearHistory: 'Clear History',
    historyCleared: 'History cleared',

    // JsonEditor New
    preserveEscape: 'Preserve Escape',
    clickToEdit: 'Click key-value to edit',
    invalidJson: 'Invalid JSON',
  },
  zh: {
    // Header
    json: 'Json',
    jsonDiff: 'Json 对比',
    sqlFormat: 'SQL 格式化',
    chromeExtension: 'Chrome 扩展',
    switchToLight: '切换到浅色',
    switchToDark: '切换到深色',

    // JsonEditor
    inputJson: '输入 JSON',
    output: '输出',
    import: '导入',
    format: '格式化',
    minify: '压缩',
    escape: '转义',
    unescape: '反转义',
    fixJson: '修复 JSON',
    clear: '清空',
    loadSample: '加载示例',
    copy: '复制',
    download: '下载',
    lines: '行',
    valid: '有效',
    invalid: '无效',
    parsingError: '解析错误',
    pasteJsonHere: '在此粘贴 JSON...',
    resultWillAppear: '结果将显示在这里...',

    // DiffEditor
    originalJson: '原始 JSON',
    modifiedJson: '修改后 JSON',
    compare: '对比',
    swap: '交换',
    comparisonResult: '对比结果',
    added: '新增',
    removed: '删除',
    modified: '修改',
    noDifferences: '未发现差异',
    pasteOriginal: '粘贴原始 JSON...',
    pasteModified: '粘贴修改后的 JSON...',

    // SqlEditor
    inputSql: '输入 SQL',
    outputSql: '格式化后 SQL',
    dialect: '数据库方言',
    formatSql: '格式化 SQL',
    pasteSqlHere: '在此粘贴 SQL...',

    // Toast Messages
    copied: '已复制到剪贴板',
    formatted: '格式化成功',
    minified: '压缩成功',
    escaped: '转义成功',
    unescaped: '反转义成功',
    cleared: '已清空',
    loaded: '示例已加载',
    noDiff: '未发现差异',
    compareSuccess: '对比完成',
    swapped: '内容已交换',

    // History
    history: '历史记录',
    noHistory: '暂无历史记录',
    clearHistory: '清空历史',
    historyCleared: '历史已清空',

    // JsonEditor New
    preserveEscape: '保留转义',
    clickToEdit: '可点击键值进行编辑',
    invalidJson: '无效的 JSON',
  },
} as const

type TranslationKey = keyof typeof translations.en

const STORAGE_KEY = 'json-editor-locale'
// Get initial locale from storage or default to 'en'
const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null
const locale = ref<Locale>(savedLocale && ['en', 'zh'].includes(savedLocale) ? savedLocale : 'en')

// Watch for changes and save to storage
import { watch } from 'vue'
watch(locale, (newValue) => {
  localStorage.setItem(STORAGE_KEY, newValue)
})

export function useI18n() {
  const t = (key: TranslationKey): string => {
    return translations[locale.value][key] || key
  }

  const toggleLocale = () => {
    locale.value = locale.value === 'en' ? 'zh' : 'en'
  }

  const currentLocale = computed(() => locale.value)
  const localeLabel = computed(() => (locale.value === 'en' ? '中' : 'EN'))

  return {
    t,
    locale: currentLocale,
    localeLabel,
    toggleLocale,
  }
}
