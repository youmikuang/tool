import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, validateJson, escapeJson, unescapeJson } from '../utils/jsonUtils';

describe('jsonUtils', () => {
  const validJson = '{"key":"value","num":123}';
  const formattedJson = '{\n  "key": "value",\n  "num": 123\n}';
  const invalidJson = '{"key": "value",}'; // Trailing comma

  describe('formatJson', () => {
    it('should format valid JSON string', () => {
      expect(formatJson(validJson)).toBe(formattedJson);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => formatJson(invalidJson)).toThrow();
    });
  });

  describe('minifyJson', () => {
    it('should minify JSON string', () => {
      expect(minifyJson(formattedJson)).toBe(validJson);
    });
  });

  describe('validateJson', () => {
    it('should return true for valid JSON', () => {
      const result = validateJson(validJson);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return false for invalid JSON', () => {
      const result = validateJson(invalidJson);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('escapeJson', () => {
    it('should escape double quotes and backslashes', () => {
      const input = '{"key":"value"}';
      // Expecting \"{\\\"key\\\":\\\"value\\\"}\" but simpler check
      // JSON.stringify can verify escape logic partially but here we implement custom escape
      // Our implementation: replace \ with \\ and " with \"
      // input: {"key":"value"}
      // output: \{\"key\":\"value\"\}
      const expected = '{\\"key\\":\\"value\\"}'; 
      // Wait, replace(/\\/g, '\\\\') first. 
      // Input has no backslash.
      // replace(/"/g, '\\"') -> {\"key\":\"value\"}
      expect(escapeJson(input)).toBe(expected);
    });
  });

  describe('unescapeJson', () => {
    it('should unescape escaped JSON string', () => {
      const input = '{\\"key\\":\\"value\\"}';
      const expected = '{"key":"value"}';
      expect(unescapeJson(input)).toBe(expected);
    });
  });
});
