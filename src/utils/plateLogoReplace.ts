import defaultLogoUrl from "../../logo/youluminglogo.png?url";

type ReplaceLogoApiResponse = {
  success: boolean;
  result_image?: string;
  detections?: Array<{ bbox: [number, number, number, number]; confidence: number }>;
  attempts?: Array<{ input: string; conf: number; imgsz?: number | null; count: number }>;
  scene?: string;
  error?: string;
  message?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isEnabledByEnv(): boolean {
  const v = String(import.meta.env.VITE_PLATE_REPLACE_ENABLED || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function getApiBaseUrlByEnv(): string {
  return String(import.meta.env.VITE_PLATE_REPLACE_API_BASE_URL || "").trim();
}

async function postReplaceLogo(
  apiBaseUrl: string,
  formData: FormData,
  options: {
    timeoutMs: number;
    scene?: "exterior" | "interior";
    conf?: number;
    imgsz?: number;
    maxDet?: number;
  }
): Promise<ReplaceLogoApiResponse> {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || 60000));
  const params = new URLSearchParams();
  if (options.scene) params.set('scene', options.scene);
  if (typeof options.conf === 'number') params.set('conf', String(options.conf));
  if (typeof options.imgsz === 'number') params.set('imgsz', String(options.imgsz));
  if (typeof options.maxDet === 'number') params.set('max_det', String(options.maxDet));
  const qs = params.toString() ? `?${params.toString()}` : '';

  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(`${apiBaseUrl}/api/replace-logo${qs}`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = new Error(`车牌替换服务返回错误: HTTP ${resp.status}`);
        (err as any).status = resp.status;

        const shouldRetry = resp.status === 429 || resp.status >= 500;
        if (shouldRetry && attempt < maxRetries) {
          await sleep(300 * Math.pow(2, attempt));
          continue;
        }
        throw err;
      }

      const json = (await resp.json()) as ReplaceLogoApiResponse;
      return json;
    } catch (e: any) {
      lastError = e;

      const status = Number((e as any)?.status);
      const isAbort = e?.name === 'AbortError';
      const shouldRetry = (!isAbort && (status === 429 || status >= 500)) || (!Number.isFinite(status) && !isAbort);

      if (shouldRetry && attempt < maxRetries) {
        await sleep(300 * Math.pow(2, attempt));
        continue;
      }
      throw e;
    } finally {
      window.clearTimeout(timer);
    }
  }

  throw lastError || new Error('车牌替换失败');
}

function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return new Blob([dataUrl], { type: "text/plain" });
  }

  const meta = dataUrl.slice(0, commaIndex);
  const body = dataUrl.slice(commaIndex + 1);
  const mimeMatch = meta.match(/^data:([^;]+)(;base64)?/i);
  const mime = mimeMatch?.[1] || "application/octet-stream";
  const isBase64 = /;base64/i.test(meta);

  if (isBase64) {
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  const text = decodeURIComponent(body);
  return new Blob([text], { type: mime });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

let defaultLogoBlobPromise: Promise<Blob> | null = null;

async function getDefaultLogoBlob(): Promise<Blob> {
  if (!defaultLogoBlobPromise) {
    defaultLogoBlobPromise = fetch(defaultLogoUrl).then(async (r) => {
      if (!r.ok) throw new Error(`获取默认Logo失败: HTTP ${r.status}`);
      return r.blob();
    });
  }
  return defaultLogoBlobPromise;
}

export async function maybeReplacePlateLogoDataUrl(
  carImageDataUrl: string,
  options?: {
    enabled?: boolean;
    apiBaseUrl?: string;
    logoBlob?: Blob;
    timeoutMs?: number;
    scene?: "exterior" | "interior";
    conf?: number;
    imgsz?: number;
    maxDet?: number;
    strict?: boolean;
  }
): Promise<{
  dataUrl: string;
  replaced: boolean;
  detections?: ReplaceLogoApiResponse["detections"];
  attempts?: ReplaceLogoApiResponse["attempts"];
  scene?: ReplaceLogoApiResponse["scene"];
  error?: string;
}> {
  const enabled = options?.enabled ?? isEnabledByEnv();
  if (!enabled) return { dataUrl: carImageDataUrl, replaced: false };

  const apiBaseUrl = (options?.apiBaseUrl ?? getApiBaseUrlByEnv()).trim();
  if (!apiBaseUrl) return { dataUrl: carImageDataUrl, replaced: false };

  const carBlob = dataUrlToBlob(carImageDataUrl);
  const logoBlob = options?.logoBlob ?? (await getDefaultLogoBlob());

  const carFile = new File([carBlob], "car.png", { type: carBlob.type || "image/png" });
  const logoFile = new File([logoBlob], "logo.png", { type: logoBlob.type || "image/png" });

  const formData = new FormData();
  formData.append("car_image", carFile);
  formData.append("logo_image", logoFile);

  try {
    const json = await postReplaceLogo(apiBaseUrl, formData, {
      timeoutMs: Number(options?.timeoutMs ?? 60000),
      scene: options?.scene,
      conf: options?.conf,
      imgsz: options?.imgsz,
      maxDet: options?.maxDet,
    });

    if (!json?.success || !json?.result_image) {
      const msg = json?.error || json?.message || '车牌替换失败';
      if (options?.strict) throw new Error(msg);
      return { dataUrl: carImageDataUrl, replaced: false, detections: json?.detections, attempts: json?.attempts, scene: json?.scene, error: msg };
    }

    const hasDetections = Array.isArray(json.detections) && json.detections.length > 0;
    return {
      dataUrl: `data:image/png;base64,${json.result_image}`,
      replaced: hasDetections,
      detections: json.detections,
      attempts: json.attempts,
      scene: json.scene,
    };
  } catch (e: any) {
    if (options?.strict) throw e;
    return { dataUrl: carImageDataUrl, replaced: false, error: e?.message || String(e) };
  }
}

export async function maybeReplacePlateLogoBlob(
  carImageBlob: Blob,
  options?: {
    enabled?: boolean;
    apiBaseUrl?: string;
    logoBlob?: Blob;
    timeoutMs?: number;
    scene?: "exterior" | "interior";
    conf?: number;
    imgsz?: number;
    maxDet?: number;
    strict?: boolean;
  }
): Promise<{
  blob: Blob;
  replaced: boolean;
  detections?: ReplaceLogoApiResponse["detections"];
  attempts?: ReplaceLogoApiResponse["attempts"];
  scene?: ReplaceLogoApiResponse["scene"];
  error?: string;
}> {
  const enabled = options?.enabled ?? isEnabledByEnv();
  if (!enabled) return { blob: carImageBlob, replaced: false };

  const apiBaseUrl = (options?.apiBaseUrl ?? getApiBaseUrlByEnv()).trim();
  if (!apiBaseUrl) return { blob: carImageBlob, replaced: false };

  const logoBlob = options?.logoBlob ?? (await getDefaultLogoBlob());

  const carFile = new File([carImageBlob], "car.png", { type: carImageBlob.type || "image/png" });
  const logoFile = new File([logoBlob], "logo.png", { type: logoBlob.type || "image/png" });

  const formData = new FormData();
  formData.append("car_image", carFile);
  formData.append("logo_image", logoFile);

  try {
    const json = await postReplaceLogo(apiBaseUrl, formData, {
      timeoutMs: Number(options?.timeoutMs ?? 60000),
      scene: options?.scene,
      conf: options?.conf,
      imgsz: options?.imgsz,
      maxDet: options?.maxDet,
    });

    if (!json?.success || !json?.result_image) {
      const msg = json?.error || json?.message || '车牌替换失败';
      if (options?.strict) throw new Error(msg);
      return { blob: carImageBlob, replaced: false, detections: json?.detections, attempts: json?.attempts, scene: json?.scene, error: msg };
    }

    const outBlob = base64ToBlob(json.result_image, "image/png");
    const hasDetections = Array.isArray(json.detections) && json.detections.length > 0;
    return {
      blob: outBlob,
      replaced: hasDetections,
      detections: json.detections,
      attempts: json.attempts,
      scene: json.scene,
    };
  } catch (e: any) {
    if (options?.strict) throw e;
    return { blob: carImageBlob, replaced: false, error: e?.message || String(e) };
  }
}
