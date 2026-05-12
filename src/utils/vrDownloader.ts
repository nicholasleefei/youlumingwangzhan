import { compressImage } from "./imageCompression";
import { maybeReplacePlateLogoBlob } from "./plateLogoReplace";

export interface VRColorGroup {
  color_code: string;
  color_name: string;
  images: string[];
}

export interface VRInteriorPositionGroup {
  position: "driver" | "passenger" | "rear" | "third_row" | "trunk";
  position_name: string;
  images: string[];
}

export interface VRInteriorColorGroup {
  color_name: string;
  color_value?: string;
  positions: VRInteriorPositionGroup[];
}

export interface VRInteriorDownloadResult {
  success: boolean;
  colorGroups: VRInteriorColorGroup[];
  errors: string[];
}

export interface VRDownloadProgress {
  stage: "searching" | "collecting" | "downloading" | "compressing" | "replacing" | "done" | "error";
  current: number;
  total: number;
  message: string;
  colorGroup?: VRColorGroup;
  positionGroup?: VRInteriorPositionGroup;
}

export type VRDownloadProgressCallback = (progress: VRDownloadProgress) => void;

export type PlateLogoReplaceOptions = {
  enabled: boolean;
  apiBaseUrl?: string;
  logoBlob?: Blob;
  timeoutMs?: number;
  scene?: "exterior" | "interior";
  conf?: number;
  imgsz?: number;
  maxDet?: number;
};

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const runnerCount = Math.max(1, Math.min(items.length, Math.floor(limit || 1)));

  const runners = Array.from({ length: runnerCount }, async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });

  await Promise.all(runners);
  return results;
}

function calcSpanProgress(base: number, span: number, done: number, total: number): number {
  if (total <= 0) return base;
  const p = done >= total ? 1 : Math.max(0, Math.min(1, done / total));
  return Math.round(base + p * span);
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('blobToDataUrl failed'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(blob);
  });
}

const PROXY_BASE = '';

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeoutMs = 30000,
  cacheBust = true
): Promise<Response> {
  let proxyUrl = url;

  if (url.startsWith('https://www.autohome.com.cn')) {
    const path = url.replace('https://www.autohome.com.cn/', '');
    proxyUrl = `/proxy/autohome/${path}`;
  } else if (url.startsWith('https://m.autohome.com.cn')) {
    const path = url.replace('https://m.autohome.com.cn/', '');
    proxyUrl = `/proxy/autohome/${path}`;
  } else if (url.startsWith('https://pano.autohome.com.cn')) {
    const path = url.replace('https://pano.autohome.com.cn/', '');
    proxyUrl = `/proxy/pano/${path}`;
  }

  if (cacheBust) {
    const ts = `_t=${Date.now()}`;
    proxyUrl += proxyUrl.includes('?') ? `&${ts}` : `?${ts}`;
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(proxyUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent": getRandomUserAgent(),
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept": "*/*",
          ...(cacheBust
            ? {
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
              }
            : {}),
          ...options.headers,
        },
      });

      clearTimeout(timer);

      if (response.ok) {
        return response;
      }

      const shouldRetryStatus = response.status === 429 || response.status === 408 || response.status === 425 || response.status >= 500;
      if (shouldRetryStatus && i < retries) {
        const retryAfter = response.headers.get('retry-after');
        const retryAfterMs = retryAfter && /^[0-9]+$/.test(retryAfter) ? Number(retryAfter) * 1000 : 0;
        const backoffMs = 800 * Math.pow(2, i);
        await sleep(Math.max(backoffMs, retryAfterMs));
        continue;
      }

      return response;
    } catch (e: any) {
      console.warn(`[VR] fetch error (retry ${i}/${retries}):`, e.message || e);
      if (i === retries) {
        throw new Error(`Failed to fetch ${proxyUrl}: ${e.message || e}`);
      }
      await sleep(1000 * Math.pow(2, i));
    }
  }
  throw new Error("Failed to fetch");
}

function getImageProxyUrl(url: string): string {
  return `/proxy/image?url=${encodeURIComponent(url)}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithRetry(url, {
    headers: {
      "Accept": "application/json",
    },
  });
  const data = await response.json();
  return data as T;
}

function decodeGBK(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder("gb18030");
  return decoder.decode(buffer);
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetchWithRetry(url);
  const buffer = await response.arrayBuffer();

  const bytes = new Uint8Array(buffer);
  let encoding = 'utf-8';

  if (bytes.length > 3) {
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      encoding = 'utf-8';
    } else if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
      encoding = 'utf-16le';
    } else if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
      encoding = 'utf-16be';
    } else {
      const htmlStart = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, Math.min(1000, bytes.length)));
      const charsetMatch = htmlStart.match(/charset=["']?([\w-]+)/i);
      if (charsetMatch) {
        const detected = charsetMatch[1].toLowerCase();
        if (detected.includes('gb') || detected.includes('gbk') || detected.includes('gb2312')) {
          encoding = 'gb18030';
        } else if (detected.includes('utf-8') || detected.includes('utf8')) {
          encoding = 'utf-8';
        }
      }
    }
  }

  const decoder = new TextDecoder(encoding, { fatal: false });
  return decoder.decode(buffer);
}

function toHexColor(v: string): string {
  const raw = (v || '').trim().replace(/^#/, '').toUpperCase();
  if (/^[0-9A-F]{6}$/.test(raw)) return `#${raw}`;
  if (/^[0-9A-F]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  }
  return '#FFFFFF';
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function normalizeImageUrl(url: string): string {
  let u = url.trim();
  if (u.startsWith('//')) u = `https:${u}`;

  const m = u.match(/\/(\d+x\d+|\d+x0)_/);
  if (m) {
    u = u.replace(m[0], '/0x0_');
  }

  return u;
}

function normalizeAutohomeImageUrl(url: string): string {
  let u = normalizeImageUrl(url);
  u = u.replace(/_(?:t|s|m|small|thumb)(\.(?:jpg|jpeg|png))(\?|$)/i, '$1$2');
  return u;
}

function isLikelyMaterialImageUrl(rawUrl: string): boolean {
  let u = rawUrl.trim();
  if (u.startsWith('//')) u = `https:${u}`;
  if (!/^https?:/i.test(u)) return false;

  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (!/^(?:pic|car\d+|img\d+|panovr)\.autoimg\.cn$/.test(host)) return false;

  const p = parsed.pathname.toLowerCase();
  if (!/\.(?:jpg|jpeg|png)$/.test(p)) return false;

  const denyParts = ['logo', 'icon', 'sprite', 'banner', 'advert', 'ad_', '/ad/', 'btn', 'button', 'qrcode', 'app', 'wap', 'wechat', 'weixin', 'gif'];
  if (denyParts.some((k) => p.includes(k))) return false;

  return true;
}

function safeFileName(input: string): string {
  const cleaned = input
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 120) || 'file';
}

function parseNextDataFromHtml(html: string): any {
  try {
    const startStr = '<script id="__NEXT_DATA__" type="application/json">';
    const startIdx = html.indexOf(startStr);
    if (startIdx > -1) {
      const jsonStart = startIdx + startStr.length;
      const endIdx = html.indexOf('</script>', jsonStart);
      if (endIdx > -1) {
        const jsonStr = html.slice(jsonStart, endIdx).trim();
        return JSON.parse(jsonStr);
      }
    }
    
    // Fallback regex if exact string match fails
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch (e) {
    console.error("[VR] Error parsing __NEXT_DATA__ JSON", e);
  }
  return null;
}

interface AutohomeExtBaseInfo {
  ext: {
    Id: number;
    SeriesId: number;
    SeriesName: string;
    SpecId: number;
    SpecName: string;
  };
  color_info: Array<{
    ColorName: string;
    ColorValue: string;
    Hori?: {
      Normal?: Array<{ Seq: number; Url: string }>;
    };
  }>;
  image_root?: string;
}

interface ImglistVrInfoItem {
  vrcover?: string;
  vrurl?: string;
  type?: number;
  sepcid?: number;
  specname?: string;
}

async function resolveExtIdFromSpecId(specId: number): Promise<number | null> {
  const url = `https://pano.autohome.com.cn/car/ext/${specId}`;

  try {
    const response = await fetchWithRetry(url);
    const text = await response.text();

    const gcStart = text.indexOf('globalConfig');
    if (gcStart >= 0) {
      const afterGc = text.slice(gcStart);
      const idMatch = afterGc.match(/id\s*:\s*"?(\d+)"?/);
      if (idMatch?.[1]) {
        return Number(idMatch[1]);
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchExtBaseInfo(extId: number): Promise<AutohomeExtBaseInfo | null> {
  const url = `https://pano.autohome.com.cn/api/ext/baseinfo/${extId}?src=m&category=car&deviceId=`;

  try {
    const response = await fetchWithRetry(url, {
      headers: { "Accept": "application/json" },
    });
    const data = await response.json();
    return data as AutohomeExtBaseInfo;
  } catch {
    return null;
  }
}

async function fetchImglistPageProps(seriesId: number, specId: number | null, page: number = 1): Promise<any | null> {
  const specPart = specId && specId > 0 ? String(specId) : 'x';
  const pageNo = Math.max(1, Math.floor(Number(page) || 1));
  // 尝试几种不同的 URL 模式 (汽车之家最新和旧版的不同拼接方式)
  const urlsToTry = unique<string>([
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-x-${pageNo}.html`,
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-x-x-${pageNo}.html`,
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-${pageNo}.html`,
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-x-${pageNo}-1.html`,
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-x-x-${pageNo}-1.html`,
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-x-x-1.html?page=${pageNo}`,
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-x-1.html?page=${pageNo}`,
    pageNo === 1 ? `https://car.autohome.com.cn/pic/series/${seriesId}.html` : null,
  ].filter(Boolean) as string[]);

  let text = '';
  let url = '';
  
  for (const testUrl of urlsToTry) {
    try {
      console.log(`[VR] Trying URL: ${testUrl}`);
      const currentText = await fetchPage(testUrl);
      
      // If it has NEXT_DATA AND SeriesPicList, it's a valid imglist page
      if (currentText.includes('__NEXT_DATA__') && currentText.includes('SeriesPicList')) {
        text = currentText;
        url = testUrl;
        break;
      }
      
      // If it has the pano URL regex, it's also a good page (old style)
      if (currentText.match(/href=["'](https?:\/\/pano\.autohome\.com\.cn\/car\/ext\/\d+[^"']*)["']/i)) {
        text = currentText;
        url = testUrl;
        break;
      }
      
      console.warn(`[VR] URL ${testUrl} fetched but didn't contain valid VR info (might be 404 page)`);
    } catch (e) {
      console.warn(`[VR] URL failed: ${testUrl}`, e);
    }
  }

  if (!text) {
    console.warn('[VR] All URLs failed to fetch a valid page');
    return null;
  }

  const next = parseNextDataFromHtml(text);

  if (!next) {
    console.warn('[VR] __NEXT_DATA__ not found in HTML. Snippet:', text.slice(0, 200));
    // Check if it's the old style car.autohome.com.cn
    const extMatch = text.match(/href=["'](https?:\/\/pano\.autohome\.com\.cn\/car\/ext\/\d+[^"']*)["']/i);
    const panoMatch = text.match(/href=["'](https?:\/\/pano\.autohome\.com\.cn\/car\/pano\/\d+[^"']*)["']/i);
    
    if (extMatch) {
      console.log('[VR] Found exterior URL via regex fallback:', extMatch[1]);
      return {
        SeriesPicList: {
          vrinfo: [
            {
              type: 1,
              vrurl: extMatch[1]
            },
            ...(panoMatch ? [{ type: 2, vrurl: panoMatch[1] }] : [])
          ]
        }
      };
    }
    
    return { SeriesPicList: { vrinfo: [] }, rawHtml: text.slice(0, 5000) };
  }

  const pageProps = next?.props?.pageProps;
  
  console.log('[VR] Successfully parsed pageProps. Has SeriesPicList?', !!pageProps?.SeriesPicList);
  if (pageProps?.SeriesPicList) {
    console.log('[VR] vrinfo length:', pageProps.SeriesPicList.vrinfo?.length);
  }

  return pageProps || null;
}

function extractVrInfoFromImglistPageProps(pp: any): {
  specId: number | null;
  specName: string;
  exteriorUrl: string | null;
  interiorPanoUrl: string | null;
  vrinfo: any[];
} {
  const vrinfo = (pp?.SeriesPicList?.vrinfo || []) as ImglistVrInfoItem[];

  const specId = Number((vrinfo[0] as any)?.sepcid);
  const specName = String((vrinfo[0] as any)?.specname || '').trim();
  let exteriorUrl: string | null = null;
  let interiorPanoUrl: string | null = null;

  for (const v of vrinfo) {
    const u = String(v?.vrurl || '').trim();
    if (!u) continue;
    if (Number(v?.type) === 1 && u.includes('/car/ext/')) exteriorUrl = u;
    if (Number(v?.type) === 2 && u.includes('/car/pano/')) interiorPanoUrl = u;
  }

  return {
    specId: Number.isFinite(specId) && specId > 0 ? specId : null,
    specName: specName || '未知车型',
    exteriorUrl,
    interiorPanoUrl,
    vrinfo,
  };
}

function buildExteriorVrItems(baseInfo: AutohomeExtBaseInfo): Array<{ url: string; colorName: string; colorHex: string; seq: number }> {
  const root = (baseInfo.image_root || '').trim() || 'https://img3.autoimg.cn/pano';
  const items: Array<{ url: string; colorName: string; colorHex: string; seq: number }> = [];

  for (const c of baseInfo.color_info || []) {
    const colorName = String(c.ColorName || '').trim() || '默认';
    const colorHex = toHexColor(String(c.ColorValue || ''));
    const frames = (c.Hori?.Normal || []).slice().sort((a, b) => (a.Seq ?? 0) - (b.Seq ?? 0));

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const rel = String(f.Url || '').trim();
      if (!rel) continue;

      let fullUrl = rel.startsWith('http') ? rel : `${root.replace(/\/$/, '')}/${rel.replace(/^\//, '')}`;
      fullUrl = normalizeAutohomeImageUrl(fullUrl);

      if (isLikelyMaterialImageUrl(fullUrl)) {
        items.push({
          url: fullUrl,
          colorName,
          colorHex,
          seq: i,
        });
      }
    }
  }

  return items;
}

async function searchAutohomeSeriesId(brandName: string, seriesName: string): Promise<number | null> {
  try {
    const brandsUrl = 'https://www.autohome.com.cn/ashx/AjaxIndexCarFind.ashx?type=11';
    const brandsRes = await fetchJson<any>(brandsUrl);
    if (!brandsRes || !brandsRes.result || !brandsRes.result.branditems) {
      throw new Error('Invalid brands response');
    }

    const brands = brandsRes.result.branditems;
    
    const bName = brandName.replace(/\s+/g, '').toLowerCase();
    let matchedBrand = brands.find((b: any) => b.name.replace(/\s+/g, '').toLowerCase() === bName);
    
    if (!matchedBrand) {
      matchedBrand = brands.find((b: any) => {
        const ahName = b.name.replace(/\s+/g, '').toLowerCase();
        return ahName.includes(bName) || bName.includes(ahName);
      });
    }

    if (!matchedBrand) {
      return fallbackKnownIds(seriesName);
    }

    const seriesUrl = `https://www.autohome.com.cn/ashx/AjaxIndexCarFind.ashx?type=3&value=${matchedBrand.id}`;
    const seriesRes = await fetchJson<any>(seriesUrl);
    if (!seriesRes || !seriesRes.result || !seriesRes.result.factoryitems) {
      throw new Error('Invalid series response');
    }

    let matchedSeries: any = null;
    const sName = seriesName.replace(/\s+/g, '').toLowerCase();

    for (const factory of seriesRes.result.factoryitems) {
      if (!factory.seriesitems) continue;
      
      matchedSeries = factory.seriesitems.find((s: any) => s.name.replace(/\s+/g, '').toLowerCase() === sName);
      if (matchedSeries) break;

      matchedSeries = factory.seriesitems.find((s: any) => {
        const ahSName = s.name.replace(/\s+/g, '').toLowerCase();
        return ahSName.includes(sName) || sName.includes(ahSName);
      });
      if (matchedSeries) break;
    }

    if (!matchedSeries) {
      return fallbackKnownIds(seriesName);
    }
    return matchedSeries.id;
  } catch (e) {
    return fallbackKnownIds(seriesName);
  }
}

function fallbackKnownIds(seriesName: string): number | null {
  const knownIds: Record<string, number> = {
    '问界M5': 6388,
    '问界M7': 6929,
    '问界M9': 7927,
  };

  for (const [key, id] of Object.entries(knownIds)) {
    if (seriesName.includes(key) || key.includes(seriesName)) {
      return id;
    }
  }
  return null;
}

const autohomeSeriesIdCache = new Map<string, number>();

async function resolveAutohomeSeriesId(seriesJmId: number, brandName: string, seriesName: string): Promise<number> {
  const cacheKey = `${seriesJmId}|${normalizeForMatch(brandName)}|${normalizeForMatch(seriesName)}`;
  const cached = autohomeSeriesIdCache.get(cacheKey);
  if (cached) return cached;

  const searchId = await searchAutohomeSeriesId(brandName, seriesName);
  if (searchId) {
    autohomeSeriesIdCache.set(cacheKey, searchId);
    return searchId;
  }

  if (seriesJmId > 0) {
    try {
      const pp = await fetchImglistPageProps(seriesJmId, null);
      const paramsSeriesId = Number(pp?.params?.seriesId);
      const looksLikeSeriesPage = Number.isFinite(paramsSeriesId) && paramsSeriesId === seriesJmId;
      if (looksLikeSeriesPage) {
        autohomeSeriesIdCache.set(cacheKey, seriesJmId);
        return seriesJmId;
      }
    } catch {
    }
  }

  autohomeSeriesIdCache.set(cacheKey, seriesJmId);
  return seriesJmId;
}

async function checkIfValidAutohomeId(seriesId: number): Promise<boolean> {
  try {
    const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-x-x-x-x-x-x-1.html`;
    const response = await fetchWithRetry(url, {}, 1, 10000);
    if (response.ok) {
      const text = await response.text();
      return text.includes('__NEXT_DATA__') || text.length > 5000;
    }
  } catch {
  }
  return false;
}

export async function downloadExteriorVRImages(
  seriesId: number,
  brandName: string,
  seriesName: string,
  onProgress?: VRDownloadProgressCallback,
  plateLogo?: PlateLogoReplaceOptions
): Promise<{ colorGroups: VRColorGroup[]; errors: string[] }> {
  const colorGroups: VRColorGroup[] = [];
  const errors: string[] = [];
  let plateReplaceServiceDegraded = false;
  const plateReplaceErrors: string[] = [];
  let plateReplaceErrorCount = 0;

  onProgress?.({
    stage: "searching",
    current: 0,
    total: 100,
    message: `正在查找汽车之家车系ID: ${brandName} ${seriesName}`,
  });

  let autohomeSeriesId = seriesId;
  autohomeSeriesId = await resolveAutohomeSeriesId(seriesId, brandName, seriesName);

  onProgress?.({
    stage: "collecting",
    current: 0,
    total: 100,
    message: `开始收集汽车之家外观VR (车系ID: ${autohomeSeriesId})`,
  });

  try {
    onProgress?.({
      stage: "collecting",
      current: 10,
      total: 100,
      message: `获取车型列表...`,
    });

    const pp = await fetchImglistPageProps(autohomeSeriesId, null);

    if (!pp) {
      errors.push("无法获取车型列表");
      onProgress?.({
        stage: "error",
        current: 0,
        total: 100,
        message: "无法获取车型列表",
      });
      return { colorGroups, errors };
    }

    const vrInfo = extractVrInfoFromImglistPageProps(pp);

    if (!vrInfo.exteriorUrl) {
      const debugInfo = `(Found vrinfo items: ${vrInfo.vrinfo?.length || 0}, types: ${vrInfo.vrinfo?.map(v => v?.type).join(',') || 'none'}, urls: ${vrInfo.vrinfo?.map(v => v?.vrurl).join(',') || 'none'})`;
      if (autohomeSeriesId !== seriesId) {
        errors.push(`已找到汽车之家ID: ${autohomeSeriesId}，但该车系没有外观VR数据 ${debugInfo}`);
        onProgress?.({
          stage: "error",
          current: 0,
          total: 100,
          message: `已找到汽车之家ID: ${autohomeSeriesId}，但该车系没有外观VR数据 ${debugInfo}`,
        });
      } else {
        errors.push(`该车系没有外观VR数据 (ID: ${autohomeSeriesId}) ${debugInfo}`);
        onProgress?.({
          stage: "error",
          current: 0,
          total: 100,
          message: `该车系没有外观VR数据 (ID: ${autohomeSeriesId}) ${debugInfo}`,
        });
      }
      return { colorGroups, errors };
    }

    const extSpecIdMatch = vrInfo.exteriorUrl.match(/\/car\/ext\/(\d+)/i);
    const extSpecId = extSpecIdMatch ? Number(extSpecIdMatch[1]) : null;

    if (!extSpecId) {
      errors.push("无法解析外观VR的specId");
      return { colorGroups, errors };
    }

    onProgress?.({
      stage: "collecting",
      current: 30,
      total: 100,
      message: `解析外观VR，specId: ${extSpecId}`,
    });

    const extId = await resolveExtIdFromSpecId(extSpecId);
    if (!extId) {
      errors.push("无法解析extId");
      return { colorGroups, errors };
    }

    onProgress?.({
      stage: "collecting",
      current: 50,
      total: 100,
      message: `获取VR基础信息，extId: ${extId}`,
    });

    const baseInfo = await fetchExtBaseInfo(extId);
    if (!baseInfo || !baseInfo.color_info || baseInfo.color_info.length === 0) {
      errors.push("无法获取颜色信息");
      return { colorGroups, errors };
    }

    const vrItems = buildExteriorVrItems(baseInfo);
    if (vrItems.length === 0) {
      errors.push("未找到VR图片");
      return { colorGroups, errors };
    }

    const colorGroupsMap = new Map<string, { colorHex: string; images: string[] }>();

    for (const item of vrItems) {
      if (!colorGroupsMap.has(item.colorName)) {
        colorGroupsMap.set(item.colorName, {
          colorHex: item.colorHex,
          images: [],
        });
      }
      colorGroupsMap.get(item.colorName)!.images.push(item.url);
    }

    const totalImages = vrItems.length;
    let downloadedCount = 0;
    let compressedCount = 0;
    let replacedCount = 0;

    const concurrency = Math.max(1, Math.min(10, Math.floor(Number(plateLogo?.enabled ? 4 : 6))));

    for (const [colorName, groupData] of Array.from(colorGroupsMap.entries())) {
      const blobs = new Array<Blob | null>(groupData.images.length).fill(null);
      const compressedBlobs = new Array<Blob | null>(groupData.images.length).fill(null);
      const compressedDataUrls = new Array<string | null>(groupData.images.length).fill(null);
      const replacedDataUrls = new Array<string | null>(groupData.images.length).fill(null);

      await mapLimit(groupData.images, concurrency, async (url, idx) => {
        const proxyImageUrl = getImageProxyUrl(url);
        onProgress?.({
          stage: "downloading",
          current: calcSpanProgress(50, 13, downloadedCount, totalImages),
          total: 100,
          message: `下载 ${colorName} - ${downloadedCount + 1}/${totalImages}`,
          colorGroup: {
            color_code: groupData.colorHex,
            color_name: colorName,
            images: replacedDataUrls.filter(Boolean) as string[],
          },
        });

        try {
          const response = await fetchWithRetry(
            proxyImageUrl,
            {
              headers: {
                Referer: "https://www.autohome.com.cn/",
              },
            },
            3,
            60000,
            false
          );

          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          if (blob.size <= 100) throw new Error("Empty image");
          blobs[idx] = blob;
        } catch (e) {
          errors.push(`下载图片失败: ${url} - ${e}`);
        } finally {
          downloadedCount++;
        }
      });

      await mapLimit(blobs, concurrency, async (blob, idx) => {
        if (!blob) {
          compressedDataUrls[idx] = null;
          compressedBlobs[idx] = null;
          return;
        }

        onProgress?.({
          stage: "compressing",
          current: calcSpanProgress(63, 13, compressedCount, totalImages),
          total: 100,
          message: `压缩 ${colorName} - ${compressedCount + 1}/${totalImages}`,
          colorGroup: {
            color_code: groupData.colorHex,
            color_name: colorName,
            images: replacedDataUrls.filter(Boolean) as string[],
          },
        });

        try {
          const compressed = await compressImage(blob, {
            maxSizeMB: 0.6,
            maxWidthOrHeight: 2048,
            initialQuality: 0.85,
            step: 0.15,
          });
          compressedBlobs[idx] = compressed.blob;
          compressedDataUrls[idx] = compressed.dataUrl;
        } catch (e) {
          compressedBlobs[idx] = null;
          compressedDataUrls[idx] = null;
        } finally {
          compressedCount++;
        }
      });

      for (let idx = 0; idx < compressedDataUrls.length; idx++) {
        const dataUrl = compressedDataUrls[idx];

        if (!dataUrl) {
          replacedDataUrls[idx] = null;
          continue;
        }

        const currentIdx = ++replacedCount;

        if (!plateLogo?.enabled) {
          replacedDataUrls[idx] = dataUrl;
          continue;
        }

        onProgress?.({
          stage: "replacing",
          current: calcSpanProgress(76, 14, currentIdx, totalImages),
          total: 100,
          message: `车牌替换 ${colorName} - ${currentIdx}/${totalImages}`,
          colorGroup: {
            color_code: groupData.colorHex,
            color_name: colorName,
            images: replacedDataUrls.filter(Boolean) as string[],
          },
        });

        const blob = compressedBlobs[idx];
        if (!blob) {
          replacedDataUrls[idx] = dataUrl;
          continue;
        }

        const replaced = await maybeReplacePlateLogoBlob(blob, {
          enabled: plateLogo.enabled,
          apiBaseUrl: plateLogo.apiBaseUrl,
          logoBlob: plateLogo.logoBlob,
          timeoutMs: plateLogo.timeoutMs ?? 60000,
          scene: plateLogo.scene ?? "exterior",
          conf: plateLogo.conf,
          imgsz: plateLogo.imgsz,
          maxDet: plateLogo.maxDet,
        });

        let nextDataUrl = dataUrl;
        if (replaced.replaced) nextDataUrl = await blobToDataUrl(replaced.blob);
        if (replaced.error) {
          plateReplaceServiceDegraded = true;
          plateReplaceErrorCount++;
          if (plateReplaceErrors.length < 5) {
            plateReplaceErrors.push(`车牌替换失败（${colorName} ${currentIdx}/${totalImages}）：${replaced.error}`);
          }
        }
        replacedDataUrls[idx] = nextDataUrl;
      }

      const finalImages = replacedDataUrls.filter(Boolean) as string[];
      if (finalImages.length > 0) {
        colorGroups.push({
          color_code: groupData.colorHex,
          color_name: colorName,
          images: finalImages,
        });
      }
    }

    onProgress?.({
      stage: "done",
      current: 100,
      total: 100,
      message: `完成！共 ${colorGroups.length} 个颜色分组`,
    });

    if (plateReplaceServiceDegraded) {
      onProgress?.({
        stage: "done",
        current: 100,
        total: 100,
        message: `车牌替换服务本次有异常（失败 ${plateReplaceErrorCount} 张），已自动跳过并使用原图继续`,
      });
      if (plateReplaceErrors.length > 0) {
        errors.push(...plateReplaceErrors);
      }
    }

    return { colorGroups, errors };
  } catch (error) {
    const errorMsg = `下载外观VR失败: ${error}`;
    errors.push(errorMsg);
    onProgress?.({
      stage: "error",
      current: 0,
      total: 100,
      message: errorMsg,
    });
    return { colorGroups, errors };
  }
}

export async function downloadExteriorVRForSeries(
  seriesJmId: number,
  brandName: string,
  seriesName: string,
  options?: {
    plateLogo?: PlateLogoReplaceOptions;
  },
  onProgress?: VRDownloadProgressCallback
): Promise<{ colorGroups: VRColorGroup[]; errors: string[] }> {
  onProgress?.({
    stage: "searching",
    current: 0,
    total: 100,
    message: `使用汽车之家下载: ${brandName} ${seriesName} (ID: ${seriesJmId})`,
  });

  return downloadExteriorVRImages(seriesJmId, brandName, seriesName, onProgress, options?.plateLogo);
}

function normalizeForMatch(input: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()（）【】\[\]{}]/g, '')
    .replace(/[-_·•]/g, '')
    .replace(/款/g, '')
    .trim();
}

function flattenAutohomeSpecList(pp: any): Array<{ specid: number; specname: string; year?: string | number }> {
  const out: Array<{ specid: number; specname: string; year?: string | number }> = [];
  const specList = pp?.specList;
  if (!Array.isArray(specList)) return out;
  for (const yearGroup of specList) {
    const year = yearGroup?.year;
    const list = yearGroup?.list;
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const specid = Number(item?.specid);
      const specname = String(item?.specname || '').trim();
      if (Number.isFinite(specid) && specid > 0 && specname) {
        out.push({ specid, specname, year });
      }
    }
  }
  return out;
}

function pickBestSpecId(specs: Array<{ specid: number; specname: string; year?: string | number }>, modelName: string): number | null {
  if (specs.length === 0) return null;
  const m = normalizeForMatch(modelName);
  if (!m) return specs[0].specid;

  let best: { specid: number; score: number } | null = null;
  for (const s of specs) {
    const sn = normalizeForMatch(s.specname);
    if (!sn) continue;
    let score = 0;
    if (m === sn) score = 1000;
    else if (m.includes(sn) || sn.includes(m)) score = 500 + Math.min(m.length, sn.length);
    else {
      const yearStr = s.year != null ? String(s.year) : '';
      const withYear = normalizeForMatch(`${yearStr}款${s.specname}`);
      if (withYear && (m.includes(withYear) || withYear.includes(m))) score = 400 + Math.min(m.length, withYear.length);
    }
    if (!best || score > best.score) best = { specid: s.specid, score };
  }
  return best?.specid ?? specs[0].specid;
}

export type ModelImageCategory = "exterior" | "interior" | "official";

function getModelImageCategoryLabel(category: ModelImageCategory): string {
  if (category === "exterior") return "外观图";
  if (category === "interior") return "内饰图";
  return "官方图";
}

function pickCallistCategory(callist: any[], category: ModelImageCategory): any | null {
  const name = (v: any) => String(v?.name || "").trim();
  const byName = (keys: string[]) => callist.find((c: any) => keys.some((k) => name(c).includes(k))) ?? null;

  if (category === "exterior") {
    return byName(["外观"]) ?? callist.find((c: any) => Number(c?.claid) === 1) ?? callist[0] ?? null;
  }
  if (category === "interior") {
    return byName(["内饰"]) ?? callist.find((c: any) => Number(c?.claid) === 2) ?? null;
  }
  return byName(["官图", "官方图", "官方"]) ?? null;
}

export async function downloadImagesForModelCategory(
  seriesId: number,
  brandName: string,
  seriesName: string,
  modelName: string,
  category: ModelImageCategory,
  opts?: { limit?: number; concurrency?: number },
  onProgress?: VRDownloadProgressCallback,
  plateLogo?: PlateLogoReplaceOptions
): Promise<{ images: string[]; errors: string[]; autohomeSeriesId: number; specId: number | null }> {
  const errors: string[] = [];
  let plateReplaceServiceDegraded = false;
  const plateReplaceErrors: string[] = [];
  let plateReplaceErrorCount = 0;
  const images: string[] = [];
  const limit = Math.max(1, Math.min(60, Number(opts?.limit ?? 24)));
  const concurrency = Math.max(1, Math.min(8, Math.floor(Number(opts?.concurrency ?? 4))));
  const label = getModelImageCategoryLabel(category);

  onProgress?.({
    stage: "searching",
    current: 0,
    total: 100,
    message: `正在查找汽车之家车系ID: ${brandName} ${seriesName}`,
  });

  const autohomeSeriesId = await resolveAutohomeSeriesId(seriesId, brandName, seriesName);

  onProgress?.({
    stage: "collecting",
    current: 10,
    total: 100,
    message: `获取车型列表 (车系ID: ${autohomeSeriesId})`,
  });

  const pp0 = await fetchImglistPageProps(autohomeSeriesId, null, 1);
  if (!pp0) {
    errors.push("无法获取图片列表页面数据");
    onProgress?.({ stage: "error", current: 0, total: 100, message: "无法获取图片列表页面数据" });
    return { images, errors, autohomeSeriesId, specId: null };
  }

  const specs = flattenAutohomeSpecList(pp0);
  const specId = pickBestSpecId(specs, modelName);

  if (!specId) {
    errors.push("未找到可用的车型specId");
    onProgress?.({ stage: "error", current: 0, total: 100, message: "未找到可用的车型specId" });
    return { images, errors, autohomeSeriesId, specId: null };
  }

  onProgress?.({
    stage: "collecting",
    current: 20,
    total: 100,
    message: `读取${label}列表 (specId: ${specId})`,
  });

  const urls: string[] = [];
  const urlSet = new Set<string>();
  const maxPages = Math.max(1, Math.min(20, Math.ceil(limit / 10) + 6));
  let pageNo = 1;

  while (urls.length < limit && pageNo <= maxPages) {
    onProgress?.({
      stage: "collecting",
      current: Math.min(29, 20 + Math.round((pageNo / maxPages) * 9)),
      total: 100,
      message: `读取${label}列表页 ${pageNo}/${maxPages}`,
    });

    const pp = await fetchImglistPageProps(autohomeSeriesId, specId, pageNo);
    if (!pp) break;

    const callist = pp?.SeriesPicList?.picinfo?.callist;
    if (!Array.isArray(callist) || callist.length === 0) break;

    const targetCat = pickCallistCategory(callist, category);
    if (!targetCat) break;

    const rawList = Array.isArray(targetCat?.list) ? targetCat.list : [];
    const pageUrls = rawList
      .map((x: any) => String(x?.picpath || "").trim())
      .filter((u: string) => u && isLikelyMaterialImageUrl(u))
      .map(normalizeAutohomeImageUrl);

    let added = 0;
    for (const u0 of pageUrls) {
      if (urls.length >= limit) break;
      const u = String(u0 || "").trim();
      if (!u) continue;
      if (urlSet.has(u)) continue;
      urlSet.add(u);
      urls.push(u);
      added++;
    }

    if (added === 0) break;
    pageNo++;
  }

  if (urls.length === 0) {
    errors.push(`未找到${label}URL`);
    onProgress?.({ stage: "error", current: 0, total: 100, message: `未找到${label}URL` });
    return { images, errors, autohomeSeriesId, specId };
  }

  onProgress?.({
    stage: "downloading",
    current: 30,
    total: 100,
    message: `开始下载${label}：${urls.length} 张`,
  });

  const blobs = new Array<Blob | null>(urls.length).fill(null);
  const compressedBlobs = new Array<Blob | null>(urls.length).fill(null);
  const compressedDataUrls = new Array<string | null>(urls.length).fill(null);
  const replacedDataUrls = new Array<string | null>(urls.length).fill(null);

  let downloadedCount = 0;
  let compressedCount = 0;
  let replacedCount = 0;

  await mapLimit(urls, concurrency, async (url, i) => {
    const proxyImageUrl = getImageProxyUrl(url);
    onProgress?.({
      stage: "downloading",
      current: calcSpanProgress(30, 17, downloadedCount, urls.length),
      total: 100,
      message: `下载图片 ${downloadedCount + 1}/${urls.length}`,
    });

    try {
      const response = await fetchWithRetry(
        proxyImageUrl,
        {
          headers: {
            Referer: "https://www.autohome.com.cn/",
          },
        },
        3,
        60000,
        false
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (blob.size <= 100) throw new Error("Empty image");
      blobs[i] = blob;
    } catch (e: any) {
      errors.push(`下载失败: ${url} - ${e?.message || e}`);
      blobs[i] = null;
    } finally {
      downloadedCount++;
    }
  });

  await mapLimit(blobs, concurrency, async (blob, i) => {
    if (!blob) {
      compressedDataUrls[i] = null;
      compressedBlobs[i] = null;
      return;
    }

    onProgress?.({
      stage: "compressing",
      current: calcSpanProgress(47, 17, compressedCount, urls.length),
      total: 100,
      message: `压缩图片 ${compressedCount + 1}/${urls.length}`,
    });

    try {
      const compressed = await compressImage(blob, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 2048,
        initialQuality: 0.85,
        step: 0.15,
      });
      compressedBlobs[i] = compressed.blob;
      compressedDataUrls[i] = compressed.dataUrl;
    } catch {
      compressedBlobs[i] = null;
      compressedDataUrls[i] = null;
    } finally {
      compressedCount++;
    }
  });

  for (let i = 0; i < compressedDataUrls.length; i++) {
    const dataUrl = compressedDataUrls[i];

    if (!dataUrl) {
      replacedDataUrls[i] = null;
      continue;
    }

    const currentIdx = ++replacedCount;

    if (!plateLogo?.enabled) {
      replacedDataUrls[i] = dataUrl;
      continue;
    }

    onProgress?.({
      stage: "replacing",
      current: calcSpanProgress(64, 16, currentIdx, urls.length),
      total: 100,
      message: `车牌替换 ${currentIdx}/${urls.length}`,
    });

    const blob = compressedBlobs[i];
    if (!blob) {
      replacedDataUrls[i] = dataUrl;
      continue;
    }

    const replaced = await maybeReplacePlateLogoBlob(blob, {
      enabled: plateLogo.enabled,
      apiBaseUrl: plateLogo.apiBaseUrl,
      logoBlob: plateLogo.logoBlob,
      timeoutMs: plateLogo.timeoutMs ?? 60000,
      scene: plateLogo.scene ?? "exterior",
      conf: plateLogo.conf,
      imgsz: plateLogo.imgsz,
      maxDet: plateLogo.maxDet,
    });

    let nextDataUrl = dataUrl;
    if (replaced.replaced) nextDataUrl = await blobToDataUrl(replaced.blob);
    if (replaced.error) {
      plateReplaceServiceDegraded = true;
      plateReplaceErrorCount++;
      if (plateReplaceErrors.length < 5) {
        plateReplaceErrors.push(`车牌替换失败（${label} ${currentIdx}/${urls.length}）：${replaced.error}`);
      }
    }
    replacedDataUrls[i] = nextDataUrl;
  }

  images.push(...(replacedDataUrls.filter(Boolean) as string[]));

  onProgress?.({
    stage: "done",
    current: 100,
    total: 100,
    message: `${label}完成：成功 ${images.length} 张`,
  });

  if (plateReplaceServiceDegraded) {
    onProgress?.({
      stage: "done",
      current: 100,
      total: 100,
      message: `车牌替换服务本次有异常（失败 ${plateReplaceErrorCount} 张），已自动跳过并使用原图继续`,
    });
    if (plateReplaceErrors.length > 0) {
      errors.push(...plateReplaceErrors);
    }
  }

  return { images, errors, autohomeSeriesId, specId };
}

export async function downloadOfficialImagesForSeries(
  seriesId: number,
  brandName: string,
  seriesName: string,
  opts?: { limit?: number; concurrency?: number },
  onProgress?: VRDownloadProgressCallback
): Promise<{ images: string[]; errors: string[]; autohomeSeriesId: number }> {
  const errors: string[] = [];
  const images: string[] = [];
  const limit = Math.max(1, Math.min(80, Number(opts?.limit ?? 60)));
  const concurrency = Math.max(1, Math.min(8, Math.floor(Number(opts?.concurrency ?? 4))));

  onProgress?.({
    stage: "searching",
    current: 0,
    total: 100,
    message: `正在查找汽车之家车系ID: ${brandName} ${seriesName}`,
  });

  const autohomeSeriesId = await resolveAutohomeSeriesId(seriesId, brandName, seriesName);

  onProgress?.({
    stage: "collecting",
    current: 10,
    total: 100,
    message: `读取车系官图列表 (车系ID: ${autohomeSeriesId})`,
  });

  const urls: string[] = [];
  const urlSet = new Set<string>();
  const maxPages = Math.max(1, Math.min(20, Math.ceil(limit / 10) + 6));
  let pageNo = 1;
  let categoryTotal = 0;

  while (urls.length < limit && pageNo <= maxPages) {
    onProgress?.({
      stage: "collecting",
      current: Math.min(29, 10 + Math.round((pageNo / maxPages) * 19)),
      total: 100,
      message: `读取车系官图列表页 ${pageNo}/${maxPages}`,
    });

    const pp = await fetchImglistPageProps(autohomeSeriesId, null, pageNo);
    if (!pp) break;

    const callist = pp?.SeriesPicList?.picinfo?.callist;
    if (!Array.isArray(callist) || callist.length === 0) break;

    const targetCat = pickCallistCategory(callist, "official");
    if (!targetCat) break;

    if (pageNo === 1) {
      const t = Number((targetCat as any)?.total || 0);
      categoryTotal = Number.isFinite(t) && t > 0 ? t : 0;
      onProgress?.({
        stage: "collecting",
        current: 20,
        total: 100,
        message: `官图总数(汽车之家): ${categoryTotal || '未知'}，目标抓取: ${limit}`,
      });
    }

    const rawList = Array.isArray(targetCat?.list) ? targetCat.list : [];
    const pageUrls = rawList
      .map((x: any) => String(x?.picpath || "").trim())
      .filter((u: string) => u && isLikelyMaterialImageUrl(u))
      .map(normalizeAutohomeImageUrl);

    let added = 0;
    for (const u0 of pageUrls) {
      if (urls.length >= limit) break;
      const u = String(u0 || "").trim();
      if (!u) continue;
      if (urlSet.has(u)) continue;
      urlSet.add(u);
      urls.push(u);
      added++;
    }

    if (added === 0) break;
    pageNo++;
  }

  if (urls.length === 0) {
    errors.push("未找到官图URL");
    onProgress?.({ stage: "error", current: 0, total: 100, message: "未找到官图URL" });
    return { images, errors, autohomeSeriesId };
  }

  onProgress?.({
    stage: "downloading",
    current: 30,
    total: 100,
    message: `开始下载官图：${urls.length} 张`,
  });

  const output = new Array<string | null>(urls.length).fill(null);
  let processed = 0;

  await mapLimit(urls, concurrency, async (url, i) => {
    const proxyImageUrl = getImageProxyUrl(url);

    onProgress?.({
      stage: "downloading",
      current: 30 + Math.round((processed / urls.length) * 50),
      total: 100,
      message: `下载图片 ${i + 1}/${urls.length}`,
    });

    try {
      const response = await fetchWithRetry(
        proxyImageUrl,
        {
          headers: {
            Referer: "https://www.autohome.com.cn/",
          },
        },
        3,
        60000,
        false
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (blob.size <= 100) throw new Error("Empty image");

      onProgress?.({
        stage: "compressing",
        current: 30 + Math.round((processed / urls.length) * 50),
        total: 100,
        message: `压缩图片 ${i + 1}/${urls.length}`,
      });

      const compressed = await compressImage(blob, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 2048,
        initialQuality: 0.85,
        step: 0.15,
      });

      output[i] = compressed.dataUrl;
    } catch (e: any) {
      errors.push(`下载失败: ${url} - ${e?.message || e}`);
    } finally {
      processed++;
    }
  });

  images.push(...(output.filter(Boolean) as string[]));

  onProgress?.({
    stage: "done",
    current: 100,
    total: 100,
    message: `官图完成：成功 ${images.length} 张${categoryTotal ? `（汽车之家总数 ${categoryTotal}）` : ''}`,
  });

  return { images, errors, autohomeSeriesId };
}

export async function downloadExteriorImagesForModel(
  seriesId: number,
  brandName: string,
  seriesName: string,
  modelName: string,
  opts?: { limit?: number },
  onProgress?: VRDownloadProgressCallback
): Promise<{ images: string[]; errors: string[]; autohomeSeriesId: number; specId: number | null }> {
  return downloadImagesForModelCategory(seriesId, brandName, seriesName, modelName, "exterior", opts, onProgress);
}

export async function downloadInteriorVRImages(
  seriesId: number,
  brandName: string,
  seriesName: string,
  onProgress?: VRDownloadProgressCallback,
  plateLogo?: PlateLogoReplaceOptions
): Promise<{ colorGroups: VRInteriorColorGroup[]; errors: string[] }> {
  const colorGroups: VRInteriorColorGroup[] = [];
  const errors: string[] = [];
  let plateReplaceServiceDegraded = false;
  const plateReplaceErrors: string[] = [];
  let plateReplaceErrorCount = 0;

  onProgress?.({
    stage: "searching",
    current: 0,
    total: 100,
    message: `正在查找汽车之家车系ID: ${brandName} ${seriesName}`,
  });

  let autohomeSeriesId = seriesId;
  autohomeSeriesId = await resolveAutohomeSeriesId(seriesId, brandName, seriesName);

  onProgress?.({
    stage: "collecting",
    current: 0,
    total: 100,
    message: `开始收集汽车之家内饰VR (车系ID: ${autohomeSeriesId})`,
  });

  try {
    onProgress?.({
      stage: "collecting",
      current: 10,
      total: 100,
      message: `获取车型列表...`,
    });

    const pp = await fetchImglistPageProps(autohomeSeriesId, null);

    if (!pp) {
      errors.push("无法获取车型列表");
      onProgress?.({
        stage: "error",
        current: 0,
        total: 100,
        message: "无法获取车型列表",
      });
      return { colorGroups, errors };
    }

    const vrInfo = extractVrInfoFromImglistPageProps(pp);

    if (!vrInfo.interiorPanoUrl) {
      const debugInfo = `(Found vrinfo items: ${vrInfo.vrinfo?.length || 0})`;
      errors.push(`该车系没有内饰VR数据 (ID: ${autohomeSeriesId}) ${debugInfo}`);
      onProgress?.({
        stage: "error",
        current: 0,
        total: 100,
        message: `该车系没有内饰VR数据 (ID: ${autohomeSeriesId}) ${debugInfo}`,
      });
      return { colorGroups, errors };
    }

    const panoSpecIdMatch = vrInfo.interiorPanoUrl.match(/\/car\/pano\/(\d+)/i);
    const panoSpecId = panoSpecIdMatch ? Number(panoSpecIdMatch[1]) : null;

    if (!panoSpecId) {
      errors.push("无法解析内饰VR的panoSpecId");
      return { colorGroups, errors };
    }

    onProgress?.({
      stage: "collecting",
      current: 30,
      total: 100,
      message: `获取内饰VR配置...`,
    });

    // Fetch the pano XML
    const panoXmlUrl = `https://pano.autohome.com.cn/car/pano/${panoSpecId}.xml`;
    const xmlResponse = await fetchWithRetry(panoXmlUrl, {
      headers: {
        "Referer": "https://www.autohome.com.cn/",
      },
    }, 3, 30000);

    if (!xmlResponse.ok) {
      errors.push(`获取内饰配置失败: HTTP ${xmlResponse.status}`);
      return { colorGroups, errors };
    }

    const xmlText = await xmlResponse.text();

    const paintingMap = new Map<string, { colorname: string, colorvalue: string }>();
    const paintingRegex = /<painting[^>]*>/g;
    const paintings = xmlText.match(paintingRegex);
    if (paintings) {
      for (const pStr of paintings) {
        const idMatch = pStr.match(/id="([^"]+)"/);
        const nameMatch = pStr.match(/colorname="([^"]+)"/);
        const valueMatch = pStr.match(/colorvalue="([^"]+)"/);
        if (idMatch) {
          paintingMap.set(idMatch[1], {
            colorname: nameMatch ? nameMatch[1] : "",
            colorvalue: valueMatch ? valueMatch[1] : ""
          });
        }
      }
    }

    const colorGroupsMap = new Map<string, {
      color_name: string;
      color_value: string;
      positions: Map<string, { position: "driver" | "passenger" | "rear" | "third_row" | "trunk", position_name: string, images: string[] }>;
    }>();

    const sceneRegex = /<scene[^>]*>([\s\S]*?)<\/scene>/g;
    const scenes = xmlText.match(sceneRegex);

    if (scenes) {
      for (const sceneStr of scenes) {
        const titleMatch = sceneStr.match(/title="([^"]+)"/);
        const thumbMatch = sceneStr.match(/thumburl="([^"]+)"/);
        const colorIdMatch = sceneStr.match(/colorid="([^"]+)"/);
        
        if (titleMatch && thumbMatch) {
          const title = titleMatch[1];
          let position: "driver" | "passenger" | "rear" | "third_row" | "trunk" = "driver";
          if (title.includes('第三排') || title.includes('三排')) position = "third_row";
          else if (title.includes('后排') || title.includes('第二排') || title.includes('二排')) position = "rear";
          else if (title.includes('后备')) position = "trunk";
          else if (title.includes('副驾')) position = "passenger";
          
          let colorInfo = { colorname: "", colorvalue: "" };
          let colorId = colorIdMatch ? colorIdMatch[1] : "default";
          if (paintingMap.has(colorId)) {
            colorInfo = paintingMap.get(colorId)!;
          }
          
          let basePath = thumbMatch[1].replace('%$tileserver%', 'https://panovr.autoimg.cn/pano/pub').replace('/thumb.jpg', '');

          if (!colorGroupsMap.has(colorId)) {
            colorGroupsMap.set(colorId, {
              color_name: colorInfo.colorname,
              color_value: colorInfo.colorvalue,
              positions: new Map()
            });
          }
          
          const colorGroup = colorGroupsMap.get(colorId)!;
          
          if (!colorGroup.positions.has(position)) {
            colorGroup.positions.set(position, { 
              position, 
              position_name: title, 
              images: [] 
            });
          }
          
          // 获取内饰VR的六个面: front, back, left, right, up, down
          const faces = ['f', 'b', 'l', 'r', 'u', 'd'];
          faces.forEach(face => {
            colorGroup.positions.get(position)!.images.push(`${basePath}/vr/pano_${face}.jpg`);
          });
        }
      }
    }

    const totalImages = Array.from(colorGroupsMap.values()).reduce(
      (sum, cGroup) => sum + Array.from(cGroup.positions.values()).reduce((pSum, pGroup) => pSum + pGroup.images.length, 0),
      0
    );
    const concurrency = Math.max(1, Math.min(10, Math.floor(Number(plateLogo?.enabled ? 4 : 6))));

    type InteriorTask = {
      colorId: string;
      colorName: string;
      colorValue: string;
      position: "driver" | "passenger" | "rear" | "third_row" | "trunk";
      positionName: string;
      positionKey: string;
      url: string;
      indexInPosition: number;
      displayName: string;
    };

    const positionImagesMap = new Map<string, Array<string | null>>();
    const tasks: InteriorTask[] = [];

    for (const [colorId, colorGroupData] of Array.from(colorGroupsMap.entries())) {
      for (const [pos, posGroupData] of Array.from(colorGroupData.positions.entries())) {
        const positionKey = `${colorId}|${posGroupData.position}`;
        positionImagesMap.set(positionKey, new Array<string | null>(posGroupData.images.length).fill(null));

        for (let i = 0; i < posGroupData.images.length; i++) {
          const url = posGroupData.images[i];
          const displayName = colorGroupData.color_name
            ? `${posGroupData.position_name} (${colorGroupData.color_name})`
            : posGroupData.position_name;
          tasks.push({
            colorId,
            colorName: colorGroupData.color_name,
            colorValue: colorGroupData.color_value,
            position: posGroupData.position,
            positionName: posGroupData.position_name,
            positionKey,
            url,
            indexInPosition: i,
            displayName,
          });
        }
      }
    }

    const blobs = new Array<Blob | null>(tasks.length).fill(null);
    const compressedBlobs = new Array<Blob | null>(tasks.length).fill(null);
    const compressedDataUrls = new Array<string | null>(tasks.length).fill(null);
    const replacedDataUrls = new Array<string | null>(tasks.length).fill(null);

    let downloadedCount = 0;
    let compressedCount = 0;
    let replacedCount = 0;

    await mapLimit(tasks, concurrency, async (task, idx) => {
      const proxyImageUrl = getImageProxyUrl(task.url);

      onProgress?.({
        stage: "downloading",
        current: calcSpanProgress(50, 13, downloadedCount, totalImages),
        total: 100,
        message: `下载 ${task.displayName} - ${downloadedCount + 1}/${totalImages}`,
      });

      try {
        const response = await fetchWithRetry(
          proxyImageUrl,
          {
            headers: {
              Referer: "https://www.autohome.com.cn/",
            },
          },
          3,
          60000,
          false
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (blob.size <= 100) throw new Error('Empty image');
        blobs[idx] = blob;
      } catch (e) {
        errors.push(`下载图片失败: ${task.url} - ${e}`);
        blobs[idx] = null;
      } finally {
        downloadedCount++;
      }
    });

    await mapLimit(blobs, concurrency, async (blob, idx) => {
      if (!blob) {
        compressedDataUrls[idx] = null;
        compressedBlobs[idx] = null;
        return;
      }

      const task = tasks[idx];
      onProgress?.({
        stage: "compressing",
        current: calcSpanProgress(63, 13, compressedCount, totalImages),
        total: 100,
        message: `压缩 ${task.displayName} - ${compressedCount + 1}/${totalImages}`,
      });

      try {
        const compressed = await compressImage(blob, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 2048,
          initialQuality: 0.85,
          step: 0.15,
        });
        compressedBlobs[idx] = compressed.blob;
        compressedDataUrls[idx] = compressed.dataUrl;
      } catch {
        compressedBlobs[idx] = null;
        compressedDataUrls[idx] = null;
      } finally {
        compressedCount++;
      }
    });

    for (let idx = 0; idx < compressedDataUrls.length; idx++) {
      const dataUrl = compressedDataUrls[idx];

      if (!dataUrl) {
        replacedDataUrls[idx] = null;
        continue;
      }

      if (!plateLogo?.enabled) {
        replacedDataUrls[idx] = dataUrl;
        continue;
      }

      const currentIdx = ++replacedCount;

      const task = tasks[idx];
      onProgress?.({
        stage: "replacing",
        current: calcSpanProgress(76, 14, currentIdx, totalImages),
        total: 100,
        message: `车牌替换 ${task.displayName} - ${currentIdx}/${totalImages}`,
      });

      const blob = compressedBlobs[idx];
      if (!blob) {
        replacedDataUrls[idx] = dataUrl;
        continue;
      }

      const replaced = await maybeReplacePlateLogoBlob(blob, {
        enabled: plateLogo.enabled,
        apiBaseUrl: plateLogo.apiBaseUrl,
        logoBlob: plateLogo.logoBlob,
        timeoutMs: plateLogo.timeoutMs ?? 60000,
        scene: plateLogo.scene ?? "interior",
        conf: plateLogo.conf,
        imgsz: plateLogo.imgsz,
        maxDet: plateLogo.maxDet,
      });

      let nextDataUrl = dataUrl;
      if (replaced.replaced) nextDataUrl = await blobToDataUrl(replaced.blob);
      if (replaced.error) {
        plateReplaceServiceDegraded = true;
        plateReplaceErrorCount++;
        if (plateReplaceErrors.length < 5) {
          plateReplaceErrors.push(`车牌替换失败（${task.displayName} ${currentIdx}/${totalImages}）：${replaced.error}`);
        }
      }
      replacedDataUrls[idx] = nextDataUrl;
    }

    for (let i = 0; i < tasks.length; i++) {
      const url = replacedDataUrls[i];
      if (!url) continue;
      const task = tasks[i];
      const arr = positionImagesMap.get(task.positionKey);
      if (arr) arr[task.indexInPosition] = url;
    }

    for (const [colorId, colorGroupData] of Array.from(colorGroupsMap.entries())) {
      const positions: VRInteriorPositionGroup[] = [];
      for (const [pos, posGroupData] of Array.from(colorGroupData.positions.entries())) {
        const key = `${colorId}|${posGroupData.position}`;
        const imgs = (positionImagesMap.get(key) || []).filter(Boolean) as string[];
        if (imgs.length > 0) {
          positions.push({
            position: posGroupData.position,
            position_name: posGroupData.position_name,
            images: imgs,
          });
        }
      }
      if (positions.length > 0) {
        colorGroups.push({
          color_name: colorGroupData.color_name,
          color_value: colorGroupData.color_value,
          positions,
        });
      }
    }

    onProgress?.({
      stage: "done",
      current: 100,
      total: 100,
      message: `完成！共找到 ${colorGroups.length} 种颜色，${colorGroups.reduce((acc, c) => acc + c.positions.length, 0)} 个位置分组`,
    });

    if (plateReplaceServiceDegraded) {
      onProgress?.({
        stage: "done",
        current: 100,
        total: 100,
        message: `车牌替换服务本次有异常（失败 ${plateReplaceErrorCount} 张），已自动跳过并使用原图继续`,
      });
      if (plateReplaceErrors.length > 0) {
        errors.push(...plateReplaceErrors);
      }
    }

    return { colorGroups, errors };
  } catch (error) {
    const errorMsg = `下载内饰VR失败: ${error}`;
    errors.push(errorMsg);
    onProgress?.({
      stage: "error",
      current: 0,
      total: 100,
      message: errorMsg,
    });
    return { colorGroups, errors };
  }
}

export async function downloadInteriorVRForSeries(
  seriesJmId: number,
  brandName: string,
  seriesName: string,
  options?: {
    plateLogo?: PlateLogoReplaceOptions;
  },
  onProgress?: VRDownloadProgressCallback
): Promise<{ colorGroups: VRInteriorColorGroup[]; errors: string[] }> {
  onProgress?.({
    stage: "searching",
    current: 0,
    total: 100,
    message: `使用汽车之家下载: ${brandName} ${seriesName} (ID: ${seriesJmId})`,
  });

  return downloadInteriorVRImages(seriesJmId, brandName, seriesName, onProgress, options?.plateLogo);
}
