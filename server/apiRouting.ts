// Restore Vercel's routing parameter while preserving application query values.
export function restoreApiUrl(raw: string, matched?: string): string {
  const url = new URL(raw, 'http://localhost');
  if (url.pathname !== '/api' && url.pathname !== '/api/') return url.pathname + url.search;
  const route = url.searchParams.get('path');
  url.searchParams.delete('path');
  if (route) url.pathname = `/api/${route.replace(/^\/+/, '').split('?')[0]}`;
  else if (matched?.startsWith('/api/')) {
    const original = new URL(matched, 'http://localhost');
    url.pathname = original.pathname;
    original.searchParams.forEach((value, key) => { if (!url.searchParams.has(key)) url.searchParams.append(key, value); });
  }
  return url.pathname + url.search;
}
