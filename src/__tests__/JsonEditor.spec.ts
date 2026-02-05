import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import JsonEditor from '@/views/JsonEditor.vue'

// Mock CodeMirrorEditor
vi.mock('@/components/base/CodeMirrorEditor.vue', () => ({
  default: {
    name: 'CodeMirrorEditor',
    props: ['modelValue', 'readonly', 'placeholder'],
    template:
      '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="mock-editor"></textarea>',
  },
}))

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn()
global.URL.revokeObjectURL = vi.fn()

describe('JsonEditor', () => {
  it('should render correctly', () => {
    const wrapper = mount(JsonEditor)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.editor-container').exists()).toBe(true)
  })

  it('should format json by default', async () => {
    const wrapper = mount(JsonEditor)
    const editorWrappers = wrapper.findAll('.editor-wrapper')
    const input = editorWrappers[0]!.find('.mock-editor')

    await input.setValue('{"key":"value"}')

    // Trigger format manually
    const formatBtn = wrapper.find('.format-btn')
    await formatBtn.trigger('click')

    const output = editorWrappers[1]!.find('.mock-editor')
    const element = output.element as HTMLTextAreaElement
    expect(element.value).toBe('{\n  "key": "value"\n}')
  })

  it('should handle invalid json manually', async () => {
    const wrapper = mount(JsonEditor)
    const editorWrappers = wrapper.findAll('.editor-wrapper')
    const input = editorWrappers[0]!.find('.mock-editor')

    await input.setValue('{"key": value}') // Invalid

    // Click format to trigger error
    const formatBtn = wrapper.find('.format-btn')
    await formatBtn.trigger('click')

    expect(wrapper.find('.error-toast').exists()).toBe(true)
  })

  it('should change mode to minify', async () => {
    const wrapper = mount(JsonEditor)
    const editorWrappers = wrapper.findAll('.editor-wrapper')
    const input = editorWrappers[0]!.find('.mock-editor')
    await input.setValue('{\n  "key": "value"\n}')

    const buttons = wrapper.findAll('.tool-group .tool-btn')
    const minifyBtn = buttons.find((b) => b.text().includes('Minify'))

    await minifyBtn?.trigger('click')

    const output = editorWrappers[1]!.find('.mock-editor')
    const element = output.element as HTMLTextAreaElement
    expect(element.value).toBe('{"key":"value"}')
  })

  it('should copy output', async () => {
    const wrapper = mount(JsonEditor)
    const editorWrappers = wrapper.findAll('.editor-wrapper')
    const input = editorWrappers[0]!.find('.mock-editor')
    await input.setValue('{"key":"value"}')

    await wrapper.find('.format-btn').trigger('click')

    const copyBtn = wrapper.findAll('.icon-action').find((b) => b.attributes('title') === 'Copy')
    await copyBtn?.trigger('click')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{\n  "key": "value"\n}')
  })

  it('should clear input', async () => {
    const wrapper = mount(JsonEditor)
    const editorWrappers = wrapper.findAll('.editor-wrapper')
    const input = editorWrappers[0]!.find('.mock-editor')
    await input.setValue('{"key":"value"}')

    const clearBtn = wrapper.find('.bottom-actions .action-btn.danger')
    await clearBtn.trigger('click')

    // Check internal state
    expect((wrapper.vm as any).inputJson).toBe('')
    expect((wrapper.vm as any).outputJson).toBe('')

    // Check DOM
    const inputElement = editorWrappers[0]!.find('.mock-editor').element as HTMLTextAreaElement
    expect(inputElement.value).toBe('')
  })
})
