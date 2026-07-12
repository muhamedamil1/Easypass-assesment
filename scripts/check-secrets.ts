import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

export type SecretFinding = {
  scope: "tracked" | "working-tree" | "history";
  path: string;
  line: number | null;
  category: string;
};

type ScanTarget = {
  scope: SecretFinding["scope"];
  path: string;
  content: string;
  revision?: string;
};

const evidencePath = "evidence/secret-scan.txt";

const excludedPathParts = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "out",
  "build",
]);

const allowedEmptyEnvPlaceholders = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SEED_ADMIN_PASSWORD",
  "SEED_VIEWER_PASSWORD",
]);

const sensitiveEnvNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_DB_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SEED_ADMIN_PASSWORD",
  "SEED_VIEWER_PASSWORD",
  "ACCESS_TOKEN",
  "REFRESH_TOKEN",
  "AUTH_TOKEN",
  "API_TOKEN",
  "BEARER_TOKEN",
  "JWT",
];

const textFileExtensions = new Set([
  ".css",
  ".env",
  ".example",
  ".gitignore",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

function normalizePath(path: string) {
  return path.replace(/\\/g, "/");
}

function shouldSkipPath(path: string) {
  const normalized = normalizePath(path);
  const parts = normalized.split("/");

  if (parts.some((part) => excludedPathParts.has(part))) {
    return true;
  }

  if (/^\.env(\.|$)/.test(normalized) && normalized !== ".env.example") {
    return true;
  }

  return false;
}

function isProbablyTextPath(path: string) {
  const normalized = normalizePath(path);
  const dotIndex = normalized.lastIndexOf(".");

  if (dotIndex === -1) {
    return ["AGENTS", "HARNESS", "NOTES", "README", "SETUP"].some((name) =>
      normalized.endsWith(name),
    );
  }

  return textFileExtensions.has(normalized.slice(dotIndex).toLowerCase());
}

function isEmptyAllowedEnvPlaceholder(path: string, line: string) {
  if (normalizePath(path) !== ".env.example") {
    return false;
  }

  const match = line.match(/^([A-Z0-9_]+)=\s*$/);
  return Boolean(match && allowedEmptyEnvPlaceholders.has(match[1]));
}

function hasValueAfterAssignment(line: string) {
  const match = line.match(/=\s*["']?([^"',\s#}]+)/) ?? line.match(/:\s*["']?([^"',\s#}]+)/);
  if (!match) {
    return false;
  }

  const value = match[1].trim();
  return value.length > 0 && !/^<.*>$/.test(value) && !/^YOUR_/i.test(value);
}

function lineFindings(path: string, line: string): string[] {
  if (isEmptyAllowedEnvPlaceholder(path, line)) {
    return [];
  }

  const categories = new Set<string>();

  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(line)) {
    categories.add("private key");
  }

  if (/\bpostgres(?:ql)?:\/\/[^\s"'<>]+/i.test(line)) {
    categories.add("database connection URL");
  }

  if (/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/.test(line)) {
    categories.add("JWT or Supabase key");
  }

  if (/\bsb_secret_[A-Za-z0-9_-]{12,}\b/.test(line)) {
    categories.add("Supabase secret key");
  }

  if (/authorization\s*[:=]\s*["']?\s*bearer\s+[A-Za-z0-9._~+/=-]{8,}/i.test(line)) {
    categories.add("authorization header");
  }

  for (const name of sensitiveEnvNames) {
    const envAssignmentPattern = new RegExp(`\\b${name}\\b\\s*=`, "i");
    const quotedObjectPattern = new RegExp(`["']${name}["']\\s*:\\s*["'][^"']+["']`, "i");
    if ((envAssignmentPattern.test(line) || quotedObjectPattern.test(line)) && hasValueAfterAssignment(line)) {
      categories.add(
        name.includes("PASSWORD")
          ? "non-empty seed password"
          : "populated sensitive environment assignment",
      );
    }
  }

  if (/\b(?:access|refresh|auth|api)[_-]?token\b\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{8,}/i.test(line)) {
    categories.add("access or refresh token");
  }

  return Array.from(categories).sort();
}

export function scanTargets(targets: ScanTarget[]): SecretFinding[] {
  const findings: SecretFinding[] = [];

  for (const target of targets) {
    if (shouldSkipPath(target.path) || !isProbablyTextPath(target.path)) {
      continue;
    }

    const lines = target.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const category of lineFindings(target.path, line)) {
        findings.push({
          scope: target.scope,
          path: target.revision ? `${target.revision}:${target.path}` : target.path,
          line: index + 1,
          category,
        });
      }
    });
  }

  return findings;
}

function git(args: string[]) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

async function getWorkingTreeTargets(): Promise<ScanTarget[]> {
  const trackedFiles = git(["ls-files"])
    .split(/\r?\n/)
    .filter(Boolean);
  const untrackedFiles = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/)
    .filter(Boolean);

  const files = [
    ...trackedFiles.map((path) => ({ path, scope: "tracked" as const })),
    ...untrackedFiles.map((path) => ({ path, scope: "working-tree" as const })),
  ].filter(({ path }) => !shouldSkipPath(path) && isProbablyTextPath(path));

  const targets: ScanTarget[] = [];

  for (const { path, scope } of files) {
    try {
      targets.push({
        scope,
        path,
        content: await readFile(path, "utf8"),
      });
    } catch {
      // A dirty worktree can have a tracked path deleted before final diff review.
      // Git history scanning still inspects the committed content.
    }
  }

  return targets;
}

function getHistoryTargets(): ScanTarget[] {
  const revisions = git(["rev-list", "--all"]).split(/\r?\n/).filter(Boolean);
  const targets: ScanTarget[] = [];

  for (const revision of revisions) {
    const files = git(["ls-tree", "-r", "--name-only", revision])
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((path) => !shouldSkipPath(path) && isProbablyTextPath(path));

    for (const path of files) {
      try {
        targets.push({
          scope: "history",
          path,
          revision: revision.slice(0, 12),
          content: git(["show", `${revision}:${path}`]),
        });
      } catch {
        // Deleted, renamed, or binary-ish historical paths are skipped.
      }
    }
  }

  return targets;
}

export function formatFindings(findings: SecretFinding[]) {
  const lines = ["Secret scan for EasyPass release"];

  if (findings.length === 0) {
    lines.push("Result: PASS (no working-tree or Git-history secret findings)");
  } else {
    lines.push(`Result: FAIL (${findings.length} finding(s))`);
    for (const finding of findings) {
      const line = finding.line === null ? "unknown" : String(finding.line);
      lines.push(
        `FINDING scope=${finding.scope} path=${finding.path} line=${line} category=${finding.category}`,
      );
    }
  }

  lines.push("Secret values are never printed by this scanner.");
  return `${lines.join("\n")}\n`;
}

export async function runSecretScan() {
  const findings = scanTargets([
    ...(await getWorkingTreeTargets()),
    ...getHistoryTargets(),
  ]);
  const output = formatFindings(findings);

  await mkdir(dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, output, "utf8");
  process.stdout.write(output);

  return findings;
}

const invokedPath = process.argv[1] ? normalizePath(relative(process.cwd(), process.argv[1])) : "";

if (invokedPath.endsWith("scripts/check-secrets.ts")) {
  runSecretScan()
    .then((findings) => {
      if (findings.length > 0) {
        process.exitCode = 1;
      }
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      const output = `Secret scan for EasyPass release\nResult: FAIL (scanner error)\n${message}\n`;
      process.stderr.write(output);
      process.exitCode = 1;
    });
}
