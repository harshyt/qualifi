import { put, del, get } from "@vercel/blob";
import type { StorageProvider } from "@/lib/storage";

export class VercelBlobProvider implements StorageProvider {
  async upload(path: string, data: Buffer, mimeType: string): Promise<string> {
    const blob = await put(path, data, {
      access: "private",
      contentType: mimeType,
    });
    return blob.url;
  }

  async download(url: string): Promise<Buffer> {
    const result = await get(url, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error(`Failed to fetch blob: ${result?.statusCode ?? "not found"}`);
    }
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(url: string): Promise<void> {
    await del(url);
  }
}
