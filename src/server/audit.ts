import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

type Writer = Prisma.TransactionClient | typeof prisma;

export async function writeAudit(
  writer: Writer,
  input: { actorId?: string | null; action: string; entity: string; entityId?: string | null; detail: string },
) {
  await writer.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      detail: input.detail.slice(0, 500),
    },
  });
}
