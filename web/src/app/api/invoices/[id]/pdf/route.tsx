import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, requireOwnerSession } from "@/lib/auth-guard";
import { InvoicePdf } from "@/modules/invoicing/InvoicePdf";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{ include: { owner: true; company: true; lines: true } }>;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = req.nextUrl.searchParams.get("companyId");

  // Deux chemins d'accès possibles : équipe back-office (companyId + rôle) ou
  // propriétaire connecté au portail (accès restreint à ses propres factures).
  let invoice: InvoiceWithRelations | null = null;

  if (companyId) {
    try {
      await requireRole(companyId, ["ADMIN", "ACCOUNTANT", "EMPLOYEE", "READONLY"]);
      invoice = await prisma.invoice.findFirst({
        where: { id, companyId },
        include: { owner: true, company: true, lines: true },
      });
    } catch {
      // retente via le portail propriétaire ci-dessous avant d'abandonner
    }
  }

  if (!invoice) {
    try {
      const owner = await requireOwnerSession();
      invoice = await prisma.invoice.findFirst({
        where: { id, ownerId: owner.id },
        include: { owner: true, company: true, lines: true },
      });
    } catch {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <InvoicePdf
      company={{
        name: invoice.company.name,
        address: invoice.company.address,
        siret: invoice.company.siret,
        tvaIntracom: invoice.company.tvaIntracom,
        iban: invoice.company.iban,
        brandColor: invoice.company.brandColor,
      }}
      owner={{
        firstName: invoice.owner.firstName,
        lastName: invoice.owner.lastName,
        companyName: invoice.owner.companyName,
        address: invoice.owner.address,
      }}
      invoice={{
        number: invoice.number,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotalHT: Number(invoice.subtotalHT),
        vatAmount: Number(invoice.vatAmount),
        totalTTC: Number(invoice.totalTTC),
      }}
      lines={invoice.lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPriceHT: Number(l.unitPriceHT),
        vatRate: Number(l.vatRate),
        lineTotalHT: Number(l.lineTotalHT),
      }))}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${invoice.number}.pdf"`,
    },
  });
}
