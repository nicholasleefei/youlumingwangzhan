// Vercel Serverless Function: /api/proxy/image.js
// Proxies image requests with proper referrer headers to bypass autohome hotlink protection

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export default async function handler(req, res) {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  console.log(`[Proxy image] GET ${imageUrl}`);

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://www.autohome.com.cn/',
      },
    });

    if (!response.ok) {
      console.error(`[Proxy image] Upstream ${response.status} for ${imageUrl}`);
      return res.status(response.status).send(await response.text().catch(() => ''));
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.status(200).send(buffer);
  } catch (error) {
    console.error(`[Proxy image] Error:`, error.message);
    res.status(502).json({ error: error.message });
  }
}
