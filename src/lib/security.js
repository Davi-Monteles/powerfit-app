const SENSITIVE_EXPORT_FIELDS = new Set(['password', 'senha']);

export function stripSensitiveSessionFields(user) {
  if (!user || typeof user !== 'object') return user || null;

  return stripSensitiveFieldsDeep(user);
}

function stripSensitiveFieldsDeep(value) {
  if (Array.isArray(value)) {
    return value.map(stripSensitiveFieldsDeep);
  }

  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_EXPORT_FIELDS.has(key.toLowerCase()))
      .map(([key, item]) => [key, stripSensitiveFieldsDeep(item)])
  );
}

export function sanitizeExportData(data) {
  return stripSensitiveFieldsDeep(data);
}

export function sanitizeImportData(data) {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  for (const field of ['powerfit_current_user', 'current_user', 'currentUser']) {
    if (sanitized[field]) sanitized[field] = stripSensitiveSessionFields(sanitized[field]);
  }
  return sanitized;
}
