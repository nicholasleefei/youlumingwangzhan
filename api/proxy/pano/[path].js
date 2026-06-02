// Vercel Serverless Function: /api/proxy/pano/[path].js
// Proxies requests to https://pano.autohome.com.cn/*
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract path after /api/proxy/pano/
  const suffix = req.url.replace(/^\/api\/proxy\/pano\//, '');
  const targetUrl = `https://pano.autohome.com.cn/${suffix}`;
  console.log(`[Proxy pano] GET ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`[Proxy pano] Upstream ${response.status}`);
      return res.status(response.status).send(await response.text().catch(() => ''));
    }

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (contentType.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.json(JSON.parse(new TextDecoder('utf-8').decode(buffer)));
    }

    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(text);
  } catch (error) {
    console.error(`[Proxy pano] Error:`, error.message);
    res.status(502).json({ error: error.message });
  }
}
