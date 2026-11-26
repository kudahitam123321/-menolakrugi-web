// Tab aktif dashboard member & admin panel disimpan di URL hash (/member#jurnal)
// supaya reload tetap di tab yang sama. Dicek: node scripts/check-tab-url.mjs

/** Id tab dari hash URL kalau termasuk daftar tab yang valid; selain itu null. */
export function tabDariHash(hash: string, valid: readonly string[]): string | null {
  let id = (hash || '').replace(/^#/, '');
  try { id = decodeURIComponent(id); } catch { return null; }
  return id && valid.includes(id) ? id : null;
}

/** URL (path + query + hash) untuk tab aktif; tab default tidak memakai hash. */
export function urlUntukTab(pathname: string, search: string, tab: string, defaultTab: string): string {
  return pathname + (search || '') + (tab && tab !== defaultTab ? '#' + encodeURIComponent(tab) : '');
}

/** Ganti URL di address bar tanpa menambah riwayat browser. */
export function simpanTabDiUrl(tab: string, defaultTab: string): void {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  const url = urlUntukTab(pathname, search, tab, defaultTab);
  if (url !== pathname + search + window.location.hash) window.history.replaceState(window.history.state, '', url);
}
