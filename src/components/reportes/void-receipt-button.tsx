"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function VoidReceiptButton({
  receiptId,
  action,
}: {
  receiptId: string;
  action: (formData: FormData) => Promise<{ ok: true; receiptNumber: string } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button className="text-danger underline-offset-2 hover:underline" type="button" onClick={() => setOpen(true)}>
        Anular
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <textarea className="min-h-16 w-44 rounded-md border border-line p-2 text-xs" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de la anulación" />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <button
        className="text-xs font-semibold text-danger"
        type="button"
        disabled={pending}
        onClick={() => {
          const body = new FormData();
          body.set("receiptId", receiptId);
          body.set("reason", reason);
          startTransition(async () => {
            const result = await action(body);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setOpen(false);
            router.refresh();
          });
        }}
      >
        Confirmar
      </button>
    </div>
  );
}
