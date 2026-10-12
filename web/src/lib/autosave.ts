// Autosave — UX law #3: "Autosave every field on blur; closing the app loses nothing."
// Persists to localStorage under jk:autosave:<key>. Survives app close and idle expiry.

const PREFIX = "jk:autosave:";

export function autosaveSave(key: string, data: Record<string, unknown>): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    /* storage full or unavailable — never block the user */
  }
}

export function autosaveLoad<T = Record<string, unknown>>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return (JSON.parse(raw).data ?? null) as T | null;
  } catch {
    return null;
  }
}

export function autosaveClear(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Blur handler factory: call returned fn with the current form values. */
export function autosaveOnBlur(key: string) {
  return (data: Record<string, unknown>) => autosaveSave(key, data);
}
