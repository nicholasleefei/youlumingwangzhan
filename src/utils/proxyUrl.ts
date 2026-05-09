export function proxiedImageUrl(url: string | null | undefined) {
  if (!url) return url ?? null;

  if (import.meta.env.DEV) {
    return `/proxy/image?url=${encodeURIComponent(url)}`;
  }

  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (!isLocal) return url;

  const proxyPort = typeof __PROXY_PORT__ === 'string' ? __PROXY_PORT__ : '3002';
  return `http://${host}:${proxyPort}/proxy/image?url=${encodeURIComponent(url)}`;
}

