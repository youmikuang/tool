import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import JsonEditor from '@/components/business/JsonEditor.vue';

// Mock CodeMirrorEditor
vi.mock('@/components/base/CodeMirrorEditor.vue', () => ({
  default: {
    name: 'CodeMirrorEditor',
    props: ['modelValue', 'readonly', 'placeholder'],
    template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="mock-editor"></textarea>'
  }
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
class MockFileReader {
  onload: ((e: any) => void) | null = null;
  readAsText(file: any) {
    if (this.onload) {
      this.onload({ target: { result: '{"imported":"json"}' } });
    }
  }
}
global.FileReader = MockFileReader as any;

describe('JsonEditor', () => {
  it('should render correctly', () => {
    const wrapper = mount(JsonEditor);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.json-editor-container').exists()).toBe(true);
  });

  it('should format json by default', async () => {
    const wrapper = mount(JsonEditor);
    const input = wrapper.find('.input-pane .mock-editor');
    
    await input.setValue('{"key":"value"}');
    
    const output = wrapper.find('.output-pane .mock-editor');
    const element = output.element as HTMLTextAreaElement;
    expect(element.value).toBe('{\n  "key": "value"\n}');
  });

  it('should handle invalid json', async () => {
    const wrapper = mount(JsonEditor);
    const input = wrapper.find('.input-pane .mock-editor');
    
    await input.setValue('{"key": value}'); // Invalid
    
    expect(wrapper.find('.error-overlay').exists()).toBe(true);
    expect(wrapper.find('.error-content').text()).toContain('Error');
  });

  it('should change mode', async () => {
    const wrapper = mount(JsonEditor);
    const input = wrapper.find('.input-pane .mock-editor');
    await input.setValue('{\n  "key": "value"\n}');
    
    // Switch to minify
    const buttons = wrapper.findAll('.toolbar-group button');
    const minifyBtn = buttons.find(b => b.text() === 'Minify');
    await minifyBtn?.trigger('click');
    
    const output = wrapper.find('.output-pane .mock-editor');
    const element = output.element as HTMLTextAreaElement;
    expect(element.value).toBe('{"key":"value"}');
  });

  it('should copy output', async () => {
    const wrapper = mount(JsonEditor);
    const input = wrapper.find('.input-pane .mock-editor');
    await input.setValue('{"key":"value"}');
    
    const copyBtn = wrapper.findAll('.toolbar-group button').find(b => b.text() === 'Copy');
    await copyBtn?.trigger('click');
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{\n  "key": "value"\n}');
  });

  it('should clear input', async () => {
    const wrapper = mount(JsonEditor);
    const input = wrapper.find('.input-pane .mock-editor');
    await input.setValue('{"key":"value"}');
    
    const clearBtn = wrapper.findAll('.toolbar-group button').find(b => b.text() === 'Clear');
    await clearBtn?.trigger('click');
    
    // Check internal state
    expect((wrapper.vm as any).inputJson).toBe('');
    expect((wrapper.vm as any).outputJson).toBe('');
    
    // Check DOM
    const inputElement = wrapper.find('.input-pane .mock-editor').element as HTMLTextAreaElement;
    expect(inputElement.value).toBe('');
  });

  it('should trigger import', async () => {
    const wrapper = mount(JsonEditor);
    const fileInput = wrapper.find('input[type="file"]');
    
    // Define files property on the element
    const file = new File(['{"imported":"json"}'], 'test.json', { type: 'application/json' });
    const inputElement = fileInput.element as HTMLInputElement;
    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    });
    
    await fileInput.trigger('change');
    
    // Wait for FileReader
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect((wrapper.vm as any).inputJson).toBe('{"imported":"json"}');
  });

  it('should trigger export', async () => {
    const wrapper = mount(JsonEditor);
    const input = wrapper.find('.input-pane .mock-editor');
    await input.setValue('{"key":"value"}');
    
    const exportBtn = wrapper.findAll('.toolbar-group button').find(b => b.text() === 'Export');
    
    // Mock document.createElement('a')
    const clickSpy = vi.fn();
    const removeChildSpy = vi.fn();
    const appendChildSpy = vi.fn();
    
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildSpy);
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildSpy);
    
    await exportBtn?.trigger('click');
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});
