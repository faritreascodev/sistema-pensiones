import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "./errors";

const ROOT = path.join(process.cwd(), "data", "vouchers");
const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function sniffVoucher(buffer: Buffer): string | null {
  if (buffer.subarray(0, 5).toString("utf8") === "%PDF-") return "application/pdf";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  return null;
}

export async function storeVoucher(buffer: Buffer): Promise<{ storedName: string; mimeType: string }> {
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw new AppError("El comprobante debe pesar entre 1 byte y 5 MB.");
  }
  const mimeType = sniffVoucher(buffer);
  if (!mimeType) throw new AppError("Adjunta un PDF, JPG o PNG.");
  await mkdir(ROOT, { recursive: true });
  const storedName = `${randomUUID()}.${EXTENSIONS[mimeType]}`;
  await writeFile(path.join(ROOT, storedName), buffer);
  return { storedName, mimeType };
}

export async function readVoucher(storedName: string): Promise<Buffer> {
  if (!/^[0-9a-f-]{36}\.(pdf|jpg|png)$/i.test(storedName)) {
    throw new AppError("Archivo inválido.");
  }
  return readFile(path.join(ROOT, storedName));
}

export async function removeVoucher(storedName: string) {
  await unlink(path.join(ROOT, storedName)).catch(() => undefined);
}
