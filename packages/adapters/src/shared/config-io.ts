import { readFile, writeFile } from 'node:fs/promises'

export interface ConfigIO {
  read(path: string): Promise<string>
  write(path: string, content: string): Promise<void>
}

export class FileConfigIO implements ConfigIO {
  async read(path: string): Promise<string> {
    return readFile(path, 'utf-8')
  }

  async write(path: string, content: string): Promise<void> {
    await writeFile(path, content, 'utf-8')
  }
}
