import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PROXY_PORT || 3002;

const MAX_IMAGE_INFLIGHT = Number(process.env.PROXY_MAX_IMAGE_INFLIGHT || 16);
let imageInflight = 0;
const imageQueue = [];

function acquireImageSlot() {
  if (imageInflight < MAX_IMAGE_INFLIGHT) {
    imageInflight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => imageQueue.push(resolve));
}

function releaseImageSlot() {
  const next = imageQueue.shift();
  if (next) {
    next();
    return;
  }
  imageInflight = Math.max(0, imageInflight - 1);
}

app.use(express.json());

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function detectEncoding(buffer) {
  if (buffer.length < 3) return 'utf-8';

  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf-8';
  }

  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'utf-16le';
  }

  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'utf-16be';
  }

  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 2000));
  const charsetMatch = text.match(/charset=["']?([\w-]+)/i);
  if (charsetMatch) {
    const detected = charsetMatch[1].toLowerCase();
    if (detected.includes('gbk') || detected.includes('gb2312')) {
      return 'gb18030';
    }
  }

  return 'utf-8';
}

app.get('/proxy/autohome/*', async (req, res) => {
  const suffix = req.originalUrl.replace(/^\/proxy\/autohome\//, '');
  const targetUrl = `https://www.autohome.com.cn/${suffix}`;

  console.log(`[Proxy] GET ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const encoding = detectEncoding(buffer);
    const html = new TextDecoder(encoding, { fatal: false }).decode(buffer);

    console.log(`[Proxy] Response length: ${html.length}, encoding: ${encoding}`);

    res.setHeader('Content-Type', `text/html; charset=${encoding}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(html);
  } catch (error) {
    console.error(`[Proxy] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/proxy/pano/*', async (req, res) => {
  const suffix = req.originalUrl.replace(/^\/proxy\/pano\//, '');
  const targetUrl = `https://pano.autohome.com.cn/${suffix}`;

  console.log(`[Proxy] GET ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.json(data);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(text);
  } catch (error) {
    console.error(`[Proxy] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/proxy/image', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  console.log(`[Proxy] Image GET ${imageUrl}`);

  try {
    await acquireImageSlot();
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://www.autohome.com.cn/',
      },
    });

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      res.status(response.status).send(text || `Upstream error: HTTP ${response.status}`);
      return;
    }

    if (response.body) {
      Readable.fromWeb(response.body).on('error', (e) => {
        console.error(`[Proxy] Image Stream Error: ${e?.message || e}`);
        if (!res.headersSent) res.status(500);
        res.end();
      }).pipe(res);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    console.error(`[Proxy] Image Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    releaseImageSlot();
  }
});

app.listen(PORT, () => {
  console.log(`[Proxy Server] Running on http://localhost:${PORT}`);
  console.log(`[Proxy Server] Endpoints:`);
  console.log(`  - GET /proxy/autohome/* -> https://www.autohome.com.cn/*`);
  console.log(`  - GET /proxy/pano/* -> https://pano.autohome.com.cn/*`);
  console.log(`  - GET /proxy/image?url=<image_url>`);
});
