export function proxiedImageUrl(url: string | null | undefined) {
  if (!url) return url ?? null;

  const proxyPrefix = import.meta.env.DEV ? '/proxy' : '/api/proxy';

  if (import.meta.env.DEV) {
    return `${proxyPrefix}/image?url=${encodeURIComponent(url)}`;
  }

  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (!isLocal) return url;

  const proxyPort = typeof __PROXY_PORT__ === 'string' ? __PROXY_PORT__ : '3002';
  return `http://${host}:${proxyPort}/proxy/image?url=${encodeURIComponent(url)}`;
}

