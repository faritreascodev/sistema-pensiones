"use client";

import { Button } from "@/components/ui/button";
import { downloadReceiptPdf } from "./receipt-pdf";
import type { PaperReceipt } from "./receipt-paper";

export function ReceiptActions({ receipt }: { receipt: PaperReceipt }) {
  return (
    <div className="flex gap-2 no-print">
      <Button type="button" onClick={() => window.print()}>
        Imprimir
      </Button>
      <Button type="button" variant="secondary" onClick={() => void downloadReceiptPdf(receipt)}>
        Descargar PDF
      </Button>
    </div>
  );
}
