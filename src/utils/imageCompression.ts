export interface CompressedImage {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  initialQuality?: number;
  minQuality?: number;
  step?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxSizeMB: 0.6,
  maxWidthOrHeight: 2048,
  quality: 0.9,
  initialQuality: 0.9,
  minQuality: 0.3,
  step: 0.1,
};

export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxSizeBytes = opts.maxSizeMB * 1024 * 1024;

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    opts.maxWidthOrHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = opts.initialQuality;
  let blob = await canvasToBlob(canvas, file.type, quality);

  while (blob.size > maxSizeBytes && quality > opts.minQuality) {
    quality = Math.max(quality - opts.step, opts.minQuality);
    blob = await canvasToBlob(canvas, file.type, quality);
  }

  if (blob.size > maxSizeBytes) {
    const scale = Math.sqrt(maxSizeBytes / blob.size);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    blob = await canvasToBlob(canvas, file.type, opts.minQuality);

    let retryQuality = opts.minQuality + opts.step;
    while (blob.size > maxSizeBytes && retryQuality > opts.minQuality) {
      retryQuality = Math.max(retryQuality - opts.step, opts.minQuality);
      blob = await canvasToBlob(canvas, file.type, retryQuality);
    }
  }

  const dataUrl = await blobToDataUrl(blob);

  return {
    blob,
    dataUrl,
    originalSize: file.size,
    compressedSize: blob.size,
    width,
    height,
  };
}

async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function calculateDimensions(
  width: number,
  height: number,
  maxSize: number
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }
  const ratio = Math.min(maxSize / width, maxSize / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const targetMimeType = mimeType.startsWith("image/")
      ? mimeType
      : "image/jpeg";
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas to Blob conversion failed"));
        }
      },
      targetMimeType,
      quality
    );
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function compressImageArray(
  files: (File | Blob)[],
  options: CompressionOptions = {},
  onProgress?: (index: number, total: number) => void
): Promise<CompressedImage[]> {
  const results: CompressedImage[] = [];
  for (let i = 0; i < files.length; i++) {
    const compressed = await compressImage(files[i], options);
    results.push(compressed);
    onProgress?.(i + 1, files.length);
  }
  return results;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
