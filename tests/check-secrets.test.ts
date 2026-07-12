import { describe, expect, it } from "vitest";

import { formatFindings, scanTargets } from "../scripts/check-secrets";

describe("secret scanner", () => {
  it("flags a temporary fake secret", () => {
    const findings = scanTargets([
      {
        scope: "tracked",
        path: "tmp/fake.env",
        content: `${"SUPABASE_" + "SERVICE_ROLE_KEY"}=${"sb_" + "secret_fakeReleaseGateValue12345"}\n`,
      },
    ]);

    expect(findings).toEqual([
      expect.objectContaining({
        path: "tmp/fake.env",
        line: 1,
        category: expect.stringMatching(/Supabase secret key|populated sensitive environment assignment/),
      }),
      expect.objectContaining({
        path: "tmp/fake.env",
        line: 1,
      }),
    ]);
  });

  it("allows empty .env.example placeholders", () => {
    const findings = scanTargets([
      {
        scope: "tracked",
        path: ".env.example",
        content:
          "NEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=\nSUPABASE_SERVICE_ROLE_KEY=\nSEED_ADMIN_PASSWORD=\nSEED_VIEWER_PASSWORD=\n",
      },
    ]);

    expect(findings).toHaveLength(0);
  });


  it("allows PowerShell placeholder assignments in setup docs", () => {
    const findings = scanTargets([
      {
        scope: "working-tree",
        path: "README.md",
        content: '$env:SUPABASE_DB_URL="<DATABASE_CONNECTION_STRING>"\n',
      },
    ]);

    expect(findings).toHaveLength(0);
  });
  it("redacts sensitive output", () => {
    const fakeSecret = "sb_" + "secret_fakeReleaseGateValue12345";
    const findings = scanTargets([
      {
        scope: "tracked",
        path: "docs/fake.md",
        content: `token=${fakeSecret}\n`,
      },
    ]);
    const output = formatFindings(findings);

    expect(findings.length).toBeGreaterThan(0);
    expect(output).not.toContain(fakeSecret);
    expect(output).toContain("category=");
    expect(output).toContain("docs/fake.md");
  });
});
