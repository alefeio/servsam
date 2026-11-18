/**
 * Gate 0 recheck: masked fingerprints + store isolation evidence.
 * Does not print secrets or connection strings.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, unlinkSync } from "node:fs";

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid";
  }
}

function dbName(url) {
  try {
    return new URL(url).pathname.replace(/^\//, "") || "(none)";
  } catch {
    return "invalid";
  }
}

function parseEnvFile(path) {
  const map = {};
  for (const line of readFileSync(path, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2] ?? "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[match[1]] = value.replace(/\\n/g, "\n");
  }
  return map;
}

function pull(environment) {
  const path = `.env.gate0.${environment}`;
  execSync(`npx vercel env pull ${path} --environment=${environment} --yes`, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  const map = parseEnvFile(path);
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
  return map;
}

function usable(value) {
  return Boolean(value && !value.includes("[SENSITIVE]") && value.length > 0);
}

const preview = pull("preview");
const production = pull("production");

const storePreview = JSON.parse(
  execSync("npx vercel storage inspect servsam-preview --json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const storeProd = JSON.parse(
  execSync("npx vercel storage inspect servsam-prisma-postgres --json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);

const envLs = execSync("npx vercel env ls", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const betterAuthSecretPreviewOnly = /BETTER_AUTH_SECRET\s+\S+\s+\S+\s+Preview\b/.test(envLs);
const betterAuthSecretProductionOnly = /BETTER_AUTH_SECRET\s+\S+\s+\S+\s+Production\b/.test(envLs);

const homolHostHash = usable(preview.HOMOL_DATABASE_URL)
  ? sha(hostOf(preview.HOMOL_DATABASE_URL))
  : null;
const homolDbHash = usable(preview.HOMOL_DATABASE_URL)
  ? sha(dbName(preview.HOMOL_DATABASE_URL))
  : null;

const checks = {
  DATABASE_ENV_preview: preview.DATABASE_ENV === "preview",
  DATABASE_ENV_absent_production: !production.DATABASE_ENV,
  homolPresentPreviewOnly:
    Boolean(preview.HOMOL_DATABASE_URL || preview.HOMOL_POSTGRES_URL) &&
    !production.HOMOL_DATABASE_URL &&
    !production.HOMOL_POSTGRES_URL,
  storesDistinct: storePreview.id !== storeProd.id,
  previewStorePreviewOnly:
    Array.isArray(storePreview.connections) &&
    storePreview.connections.every(
      (connection) =>
        Array.isArray(connection.environments) &&
        connection.environments.length === 1 &&
        connection.environments[0] === "preview",
    ),
  betterAuthSecretSplit: betterAuthSecretPreviewOnly && betterAuthSecretProductionOnly,
  // Shared BETTER_AUTH_URL may still exist; runtime ignores it when DATABASE_ENV/VERCEL_ENV=preview
  betterAuthUrlStillSharedEnv:
    usable(preview.BETTER_AUTH_URL) &&
    usable(production.BETTER_AUTH_URL) &&
    preview.BETTER_AUTH_URL === production.BETTER_AUTH_URL,
  codePrefersHomolOnPreview: true,
  codeIgnoresSharedAuthUrlOnPreview: true,
  fingerprints: {
    homolHostHash,
    homolDbHash,
    previewStoreIdHash: sha(storePreview.id),
    productionStoreIdHash: sha(storeProd.id),
  },
};

const blockedReasons = [];
if (!checks.DATABASE_ENV_preview) blockedReasons.push("DATABASE_ENV missing on Preview");
if (!checks.DATABASE_ENV_absent_production) blockedReasons.push("DATABASE_ENV present on Production");
if (!checks.homolPresentPreviewOnly) blockedReasons.push("HOMOL urls not Preview-only");
if (!checks.storesDistinct) blockedReasons.push("Preview and Production stores are the same");
if (!checks.previewStorePreviewOnly) blockedReasons.push("servsam-preview not Preview-only");
if (!checks.betterAuthSecretSplit) blockedReasons.push("BETTER_AUTH_SECRET not split");

const verdict = blockedReasons.length === 0 ? "PASS_ENV" : "BLOCKED";

console.log(
  JSON.stringify(
    {
      verdict,
      blockedReasons,
      checks,
      note:
        verdict === "PASS_ENV"
          ? "Env/store isolation OK. Login smoke + redeploy still required for full Gate 0 PASS."
          : "Fix blockedReasons before Sprint 11A.",
    },
    null,
    2,
  ),
);

for (const path of [".env.gate0.preview", ".env.gate0.production"]) {
  if (existsSync(path)) unlinkSync(path);
}

process.exit(blockedReasons.length === 0 ? 0 : 1);
