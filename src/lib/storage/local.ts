import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import type { StorageProvider } from "@/lib/storage";

const BASE_DIR = "/tmp/screener-uploads";
const LOCAL_SCHEME = "local://";

export class LocalStorageProvider implements StorageProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(filePath: string, data: Buffer, _mimeType: string): Promise<string> {
    const fullPath = path.join(BASE_DIR, filePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, data);
    return `${LOCAL_SCHEME}${fullPath}`;
  }

  async download(url: string): Promise<Buffer> {
    const filePath = url.slice(LOCAL_SCHEME.length);
    return readFile(filePath);
  }

  async delete(url: string): Promise<void> {
    const filePath = url.slice(LOCAL_SCHEME.length);
    try {
      await unlink(filePath);
    } catch {
      // File already gone — ignore
    }
  }
}
