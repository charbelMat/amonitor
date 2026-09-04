/**
 * localStorage helpers for per-browser conveniences (which org/project you
 * were last looking at). Every access is guarded — private windows and
 * blocked site data make these throw rather than return null.
 */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Non-fatal: selection just won't survive a reload.
  }
}
