import { rename, writeFile } from 'node:fs/promises'

export interface AtomicWriter {
  write(path: string, content: string): Promise<void>
}

export class FileAtomicWriter implements AtomicWriter {
  async write(path: string, content: string): Promise<void> {
    const tempPath = `${path}.tmp`
    await writeFile(tempPath, content, 'utf-8')
    await rename(tempPath, path)
  }
}
