// utils/resolveTemplate.js
export function resolveTemplate(text, candidate, variables) {
  let resolved = text;

  // candidate row (from CSV)
  if (candidate) {
    Object.entries(candidate).forEach(([key, value]) => {
      resolved = resolved.replaceAll(`{${key}}`, value || "");
    });
  }

  // global/custom variables
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      resolved = resolved.replaceAll(`{${key}}`, value || "");
    });
  }

  return resolved;
}
