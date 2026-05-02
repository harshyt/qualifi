import { VercelBlobProvider } from "@/lib/storage/vercel-blob";
import { LocalStorageProvider } from "@/lib/storage/local";

export interface StorageProvider {
  upload(path: string, data: Buffer, mimeType: string): Promise<string>;
  download(url: string): Promise<Buffer>;
  delete(url: string): Promise<void>;
}

export function getStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === "local") {
    return new LocalStorageProvider();
  }
  return new VercelBlobProvider();
}
