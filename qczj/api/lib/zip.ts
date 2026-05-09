import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { ensureDir } from './fs.js'

export async function zipDirectory(
  srcDir: string,
  outZipPath: string,
): Promise<void> {
  await ensureDir(path.dirname(outZipPath))

  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(outZipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    out.on('close', () => resolve())
    out.on('error', reject)
    archive.on('error', reject)

    archive.pipe(out)
    archive.directory(srcDir, false)
    archive.finalize()
  })
}

