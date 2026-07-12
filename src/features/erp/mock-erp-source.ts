import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { MockErpEnvelope } from "./types";

const fixturePath = join(process.cwd(), "fixtures", "mock-erp-invoices.json");

export async function loadMockErpInvoicePayload(): Promise<MockErpEnvelope> {
  const contents = await readFile(fixturePath, "utf8");
  return JSON.parse(contents) as MockErpEnvelope;
}
