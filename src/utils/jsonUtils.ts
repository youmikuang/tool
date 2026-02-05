export const formatJson = (json: string, indent: number = 2): string => {
  try {
    const obj = JSON.parse(json);
    return JSON.stringify(obj, null, indent);
  } catch (e) {
    throw e;
  }
};

export const minifyJson = (json: string): string => {
  try {
    const obj = JSON.parse(json);
    return JSON.stringify(obj);
  } catch (e) {
    throw e;
  }
};

export const validateJson = (json: string): { isValid: boolean; error: string | null } => {
  try {
    JSON.parse(json);
    return { isValid: true, error: null };
  } catch (e: any) {
    return { isValid: false, error: e.message };
  }
};

export const escapeJson = (json: string): string => {
  return json.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

export const unescapeJson = (json: string): string => {
  return json.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
};
