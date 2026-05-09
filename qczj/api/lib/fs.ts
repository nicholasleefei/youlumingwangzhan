import fs from 'fs/promises'
import path from 'path'

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export function safeFileName(input: string): string {
  const cleaned = input
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.slice(0, 120) || 'file'
}

export async function writeFileAtomic(
  filePath: string,
  data: Buffer,
): Promise<void> {
  const dir = path.dirname(filePath)
  await ensureDir(dir)
  const tmp = `${filePath}.tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`
  await fs.writeFile(tmp, data)
  await fs.rename(tmp, filePath)
}

