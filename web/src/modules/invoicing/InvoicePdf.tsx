import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { FRANCHISE_LEGAL_MENTION } from "@/modules/vat-engine/resolve-vat";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0F172A" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName: { fontSize: 16, fontWeight: 700 },
  small: { fontSize: 9, color: "#475569" },
  invoiceTitle: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  section: { marginBottom: 16 },
  table: { borderTopWidth: 1, borderTopColor: "#E2E8F0", marginTop: 8 },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  colDesc: { width: "50%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "15%", textAlign: "right" },
  colVat: { width: "10%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalLine: { flexDirection: "row", gap: 12, marginBottom: 2 },
  totalLabel: { width: 120, textAlign: "right", fontSize: 10 },
  totalValue: { width: 80, textAlign: "right", fontSize: 10 },
  footer: { marginTop: 32, fontSize: 8, color: "#64748B", borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 8 },
});

export interface InvoicePdfProps {
  company: {
    name: string;
    address?: string | null;
    siret?: string | null;
    tvaIntracom?: string | null;
    iban?: string | null;
    brandColor: string;
  };
  owner: {
    firstName: string;
    lastName: string;
    companyName?: string | null;
    address?: string | null;
  };
  invoice: {
    number: string;
    issueDate: Date;
    dueDate: Date;
    subtotalHT: number;
    vatAmount: number;
    totalTTC: number;
  };
  lines: {
    description: string;
    quantity: number;
    unitPriceHT: number;
    vatRate: number;
    lineTotalHT: number;
  }[];
}

export function InvoicePdf({ company, owner, invoice, lines }: InvoicePdfProps) {
  const hasFranchiseLine = lines.some((l) => l.vatRate === 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.companyName, { color: company.brandColor }]}>{company.name}</Text>
            {company.address ? <Text style={styles.small}>{company.address}</Text> : null}
            {company.siret ? <Text style={styles.small}>SIRET : {company.siret}</Text> : null}
            {company.tvaIntracom ? <Text style={styles.small}>TVA intracom. : {company.tvaIntracom}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Facture {invoice.number}</Text>
            <Text style={styles.small}>Émise le {invoice.issueDate.toLocaleDateString("fr-FR")}</Text>
            <Text style={styles.small}>Échéance le {invoice.dueDate.toLocaleDateString("fr-FR")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 700, marginBottom: 2 }}>Destinataire</Text>
          <Text>
            {owner.companyName ? `${owner.companyName} — ` : ""}
            {owner.firstName} {owner.lastName}
          </Text>
          {owner.address ? <Text style={styles.small}>{owner.address}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnit}>PU HT</Text>
            <Text style={styles.colVat}>TVA</Text>
            <Text style={styles.colTotal}>Total HT</Text>
          </View>
          {lines.map((line, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colUnit}>{line.unitPriceHT.toFixed(2)} €</Text>
              <Text style={styles.colVat}>{line.vatRate.toFixed(1)} %</Text>
              <Text style={styles.colTotal}>{line.lineTotalHT.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{invoice.subtotalHT.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{invoice.vatAmount.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={[styles.totalLabel, { fontWeight: 700 }]}>Total TTC</Text>
            <Text style={[styles.totalValue, { fontWeight: 700 }]}>{invoice.totalTTC.toFixed(2)} €</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {hasFranchiseLine ? <Text>{FRANCHISE_LEGAL_MENTION}</Text> : null}
          {company.iban ? <Text>Paiement par virement — IBAN : {company.iban}</Text> : null}
          <Text>Facture générée automatiquement — conservation légale 10 ans.</Text>
        </View>
      </Page>
    </Document>
  );
}
