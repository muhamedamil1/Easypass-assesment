import { NextResponse } from "next/server";

import { loadMockErpInvoicePayload } from "@/features/erp/mock-erp-source";

export async function GET() {
  const payload = await loadMockErpInvoicePayload();
  return NextResponse.json(payload);
}
