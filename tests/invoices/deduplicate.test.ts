import { describe, expect, it } from "vitest";

import { reduceInvoiceVersions } from "../../src/features/invoices/deduplicate";
import type { ParsedInvoice } from "../../src/features/invoices/types";

function invoice(overrides: Partial<ParsedInvoice> = {}): ParsedInvoice {
  const updatedAt = overrides.updatedAt ?? "2026-06-01T00:00:00.000Z";

  return {
    source: "mock-erp",
    externalId: "INV-1",
    companyName: "Falcon Trading LLC",
    amountAed: 10,
    status: "paid",
    updatedAt,
    updatedAtMs: Date.parse(updatedAt),
    ...overrides,
  };
}

describe("reduceInvoiceVersions", () => {
  it("retains unique rows", () => {
    const reduced = reduceInvoiceVersions("mock-erp", [
      invoice({ externalId: "INV-1" }),
      invoice({ externalId: "INV-2" }),
    ]);

    expect(reduced.received).toBe(2);
    expect(reduced.unique).toBe(2);
  });

  it("newer duplicate wins independent of order", () => {
    const older = invoice({
      amountAed: 10,
      status: "unpaid",
      updatedAt: "2026-06-01T00:00:00.000Z",
      updatedAtMs: Date.parse("2026-06-01T00:00:00.000Z"),
    });
    const newer = invoice({
      amountAed: 20,
      status: "paid",
      updatedAt: "2026-06-02T00:00:00.000Z",
      updatedAtMs: Date.parse("2026-06-02T00:00:00.000Z"),
    });

    expect(reduceInvoiceVersions("mock-erp", [older, newer]).rows[0]).toMatchObject({
      amount_aed: 20,
      status: "paid",
    });
    expect(reduceInvoiceVersions("mock-erp", [newer, older]).rows[0]).toMatchObject({
      amount_aed: 20,
      status: "paid",
    });
  });

  it("older duplicate is discarded", () => {
    const reduced = reduceInvoiceVersions("mock-erp", [
      invoice({
        amountAed: 20,
        updatedAt: "2026-06-02T00:00:00.000Z",
        updatedAtMs: Date.parse("2026-06-02T00:00:00.000Z"),
      }),
      invoice({
        amountAed: 10,
        updatedAt: "2026-06-01T00:00:00.000Z",
        updatedAtMs: Date.parse("2026-06-01T00:00:00.000Z"),
      }),
    ]);

    expect(reduced.rows[0].amount_aed).toBe(20);
  });

  it("equal identical version collapses", () => {
    const reduced = reduceInvoiceVersions("mock-erp", [invoice(), invoice()]);

    expect(reduced.received).toBe(2);
    expect(reduced.unique).toBe(1);
  });

  it("equal timestamp with changed status, amount, or company fails", () => {
    expect(() =>
      reduceInvoiceVersions("mock-erp", [
        invoice(),
        invoice({ status: "unpaid" }),
      ]),
    ).toThrow("CONFLICTING_SOURCE_VERSIONS");

    expect(() =>
      reduceInvoiceVersions("mock-erp", [
        invoice(),
        invoice({ amountAed: 11 }),
      ]),
    ).toThrow("CONFLICTING_SOURCE_VERSIONS");

    expect(() =>
      reduceInvoiceVersions("mock-erp", [
        invoice(),
        invoice({ companyName: "Oasis Foods FZE" }),
      ]),
    ).toThrow("CONFLICTING_SOURCE_VERSIONS");
  });
});
