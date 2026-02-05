export interface DiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  path: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Deep compare two JSON objects and return differences
 */
export function compareJson(original: any, modified: any, path: string = ''): DiffResult[] {
  const results: DiffResult[] = [];

  // Handle null/undefined
  if (original === null || original === undefined) {
    if (modified !== null && modified !== undefined) {
      results.push({ type: 'added', path: path || 'root', newValue: modified });
    }
    return results;
  }

  if (modified === null || modified === undefined) {
    results.push({ type: 'removed', path: path || 'root', oldValue: original });
    return results;
  }

  // Different types
  if (typeof original !== typeof modified) {
    results.push({ type: 'modified', path: path || 'root', oldValue: original, newValue: modified });
    return results;
  }

  // Primitives
  if (typeof original !== 'object') {
    if (original !== modified) {
      results.push({ type: 'modified', path: path || 'root', oldValue: original, newValue: modified });
    }
    return results;
  }

  // Arrays
  if (Array.isArray(original) && Array.isArray(modified)) {
    const maxLength = Math.max(original.length, modified.length);
    for (let i = 0; i < maxLength; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      if (i >= original.length) {
        results.push({ type: 'added', path: itemPath, newValue: modified[i] });
      } else if (i >= modified.length) {
        results.push({ type: 'removed', path: itemPath, oldValue: original[i] });
      } else {
        results.push(...compareJson(original[i], modified[i], itemPath));
      }
    }
    return results;
  }

  // Objects
  const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(modified)]));
  for (const key of allKeys) {
    const keyPath = path ? `${path}.${key}` : key;
    if (!(key in original)) {
      results.push({ type: 'added', path: keyPath, newValue: modified[key] });
    } else if (!(key in modified)) {
      results.push({ type: 'removed', path: keyPath, oldValue: original[key] });
    } else {
      results.push(...compareJson(original[key], modified[key], keyPath));
    }
  }

  return results;
}

/**
 * Parse JSON safely
 */
export function safeParseJson(str: string): { data: any; error: string | null } {
  try {
    const data = JSON.parse(str);
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}
