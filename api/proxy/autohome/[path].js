// Vercel Serverless Function: /api/proxy/autohome/[path].js
// Proxies requests to https://www.autohome.com.cn/*
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function detectEncoding(buffer) {
  if (buffer.length < 3) return 'utf-8';
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) return 'utf-8';
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) return 'utf-16le';
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) return 'utf-16be';
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 2000));
  const charsetMatch = text.match(/charset=["']?([\w-]+)/i);
  if (charsetMatch) {
    const detected = charsetMatch[1].toLowerCase();
    if (detected.includes('gbk') || detected.includes('gb2312')) return 'gb18030';
  }
  return 'utf-8';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract path after /api/proxy/autohome/
  const suffix = req.url.replace(/^\/api\/proxy\/autohome\//, '');
  const targetUrl = `https://www.autohome.com.cn/${suffix}`;
  console.log(`[Proxy autohome] GET ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`[Proxy autohome] Upstream ${response.status}`);
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

    const encoding = detectEncoding(buffer);
    const text = new TextDecoder(encoding, { fatal: false }).decode(buffer);

    res.setHeader('Content-Type', `text/html; charset=${encoding}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(text);
  } catch (error) {
    console.error(`[Proxy autohome] Error:`, error.message);
    res.status(502).json({ error: error.message });
  }
}
