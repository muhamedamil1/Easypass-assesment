import type {
  ParsedInvoice,
  ReducedInvoiceBatch,
  ReducedInvoiceRow,
} from "./types";

function invoiceKey(invoice: ParsedInvoice) {
  return `${invoice.source}\u0000${invoice.externalId}`;
}

function amountCents(invoice: ParsedInvoice) {
  return Math.round(invoice.amountAed * 100);
}

function sameBusinessData(left: ParsedInvoice, right: ParsedInvoice) {
  return (
    left.companyName === right.companyName &&
    amountCents(left) === amountCents(right) &&
    left.status === right.status
  );
}

export function reduceInvoiceVersions(
  source: string,
  invoices: ParsedInvoice[],
): ReducedInvoiceBatch {
  const retained = new Map<string, ParsedInvoice>();

  for (const invoice of invoices) {
    const key = invoiceKey(invoice);
    const current = retained.get(key);

    if (!current) {
      retained.set(key, invoice);
      continue;
    }

    if (invoice.updatedAtMs > current.updatedAtMs) {
      retained.set(key, invoice);
      continue;
    }

    if (invoice.updatedAtMs < current.updatedAtMs) {
      continue;
    }

    if (!sameBusinessData(invoice, current)) {
      throw new Error(
        `CONFLICTING_SOURCE_VERSIONS: ${invoice.source}/${invoice.externalId}`,
      );
    }
  }

  const rows: ReducedInvoiceRow[] = Array.from(retained.values())
    .sort((left, right) =>
      `${left.source}/${left.externalId}`.localeCompare(
        `${right.source}/${right.externalId}`,
      ),
    )
    .map((invoice) => ({
      source: invoice.source,
      external_id: invoice.externalId,
      source_company_name: invoice.companyName,
      amount_aed: invoice.amountAed,
      status: invoice.status,
      source_updated_at: invoice.updatedAt,
      company_name: invoice.companyName,
      updated_at: invoice.updatedAt,
    }));

  return {
    source,
    received: invoices.length,
    unique: rows.length,
    rows,
  };
}
