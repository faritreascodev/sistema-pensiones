import { NextResponse } from "next/server";
import { currentUser } from "@/server/current-user";
import { prisma } from "@/server/db";
import { readVoucher } from "@/server/files";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });
  const { id } = await context.params;
  const voucher = await prisma.paymentVoucher.findUnique({ where: { id } });
  if (!voucher) return new NextResponse("No encontrado", { status: 404 });
  const bytes = await readVoucher(voucher.storedName);
  const download = new URL(request.url).searchParams.get("descarga") === "1";
  const filename = voucher.originalName.replace(/"/g, "");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": voucher.mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    },
  });
}
