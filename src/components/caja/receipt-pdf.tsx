"use client";

import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { formatLongDate } from "@/lib/domain/dates";
import { formatUsd } from "@/lib/domain/money";
import { paymentLabel } from "@/lib/domain/payments";
import { SCHOOL } from "@/lib/domain/school";
import type { PaperReceipt } from "./receipt-paper";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: "Times-Roman" },
  center: { textAlign: "center" },
  small: { fontSize: 9, textAlign: "center", marginBottom: 2 },
  title: { fontSize: 14, textAlign: "center", marginTop: 4 },
  heading: { fontSize: 10, textAlign: "center", marginTop: 10, marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 110 },
  strong: { fontFamily: "Times-Bold" },
});

function ReceiptDocument({ receipt }: { receipt: PaperReceipt }) {
  const rows = [
    ["Recibo", receipt.receiptNumber],
    ["Fecha", formatLongDate(receipt.issueDate)],
    ["Estudiante", receipt.studentName],
    ["Curso", `${receipt.grade}${receipt.section ? ` ${receipt.section}` : ""} · ${receipt.specialty}`],
    ["Concepto", receipt.concept],
    ["Mes de abono", receipt.month],
    ["Cantidad", formatUsd(receipt.amount)],
    ["Forma de pago", `${paymentLabel(receipt.method)}${receipt.referenceNumber ? ` ${receipt.referenceNumber}` : ""}`],
    ["Nota", receipt.notes || "—"],
    ["Atención", `${receipt.cashierName} · ${receipt.cashierRole}`],
  ];
  return (
    <Document>
      <Page size={[396, 560]} style={styles.page}>
        <Text style={styles.small}>{SCHOOL.institution.toUpperCase()}</Text>
        <Text style={styles.title}>{SCHOOL.name}</Text>
        <Text style={styles.small}>{SCHOOL.city} · {receipt.yearName}</Text>
        <Text style={styles.heading}>REGISTRO DE RECIBO DE PAGOS POR CONCEPTOS</Text>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={label === "Cantidad" || label === "Recibo" ? styles.strong : undefined}>{value}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function downloadReceiptPdf(receipt: PaperReceipt) {
  const blob = await pdf(<ReceiptDocument receipt={receipt} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${receipt.receiptNumber.replace(/\s+/g, "-")}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
