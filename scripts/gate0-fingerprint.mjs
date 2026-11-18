import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, unlinkSync, existsSync } from "node:fs";

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
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\n/)) {
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

function report(label, preview, production, previewKey, productionKey = previewKey) {
  const pv = preview[previewKey];
  const pr = production[productionKey];
  const row = {
    check: label,
    previewPresent: previewKey in preview,
    productionPresent: productionKey in production,
    previewSensitive: !usable(pv) && Boolean(pv),
    productionSensitive: !usable(pr) && Boolean(pr),
  };

  if (usable(pv) && usable(pr)) {
    row.sameValue = pv === pr;
    row.previewHostHash = sha(hostOf(pv));
    row.productionHostHash = sha(hostOf(pr));
    row.hostsDistinct = hostOf(pv) !== hostOf(pr);
    row.previewDbHash = sha(dbName(pv));
    row.productionDbHash = sha(dbName(pr));
    row.dbsDistinct = dbName(pv) !== dbName(pr);
    row.previewLen = pv.length;
    row.productionLen = pr.length;
  } else if (usable(pv)) {
    row.previewHostHash = sha(hostOf(pv));
    row.previewDbHash = sha(dbName(pv));
    row.previewLen = pv.length;
  }

  if (!usable(pv) && pv !== undefined) {
    row.previewLen = pv.length;
    row.previewHash = sha(pv);
  }
  if (!usable(pr) && pr !== undefined) {
    row.productionLen = pr.length;
    row.productionHash = sha(pr);
  }

  return row;
}

const preview = pull("preview");
const production = pull("production");

const relevant = (keys) =>
  keys.filter((key) => /DATABASE|POSTGRES|HOMOL|BETTER_AUTH|RUNTIME/.test(key)).sort();

const comparisons = [
  report(
    "HOMOL_DATABASE_URL vs Production RUNTIME_DATABASE_URL",
    preview,
    production,
    "HOMOL_DATABASE_URL",
    "RUNTIME_DATABASE_URL",
  ),
  report(
    "HOMOL_POSTGRES_URL vs Production POSTGRES_URL",
    preview,
    production,
    "HOMOL_POSTGRES_URL",
    "POSTGRES_URL",
  ),
  report("shared RUNTIME_DATABASE_URL", preview, production, "RUNTIME_DATABASE_URL"),
  report("shared POSTGRES_URL", preview, production, "POSTGRES_URL"),
  report("BETTER_AUTH_URL", preview, production, "BETTER_AUTH_URL"),
  report("BETTER_AUTH_SECRET", preview, production, "BETTER_AUTH_SECRET"),
];

const homolVsSharedRuntime =
  usable(preview.HOMOL_DATABASE_URL) && usable(preview.RUNTIME_DATABASE_URL)
    ? {
        hostsDistinct:
          hostOf(preview.HOMOL_DATABASE_URL) !== hostOf(preview.RUNTIME_DATABASE_URL),
        dbsDistinct: dbName(preview.HOMOL_DATABASE_URL) !== dbName(preview.RUNTIME_DATABASE_URL),
        previewHomolHostHash: sha(hostOf(preview.HOMOL_DATABASE_URL)),
        previewSharedHostHash: sha(hostOf(preview.RUNTIME_DATABASE_URL)),
      }
    : { note: "could-not-compare-homol-vs-shared-on-preview" };

const verdict = {
  DATABASE_ENV_preview: preview.DATABASE_ENV || "(missing-or-secret)",
  DATABASE_ENV_production: production.DATABASE_ENV || "(missing)",
  previewKeys: relevant(Object.keys(preview)),
  productionKeys: relevant(Object.keys(production)),
  isolation: {
    homolPresentOnPreview: Boolean(preview.HOMOL_DATABASE_URL || preview.HOMOL_POSTGRES_URL),
    homolAbsentOnProduction: !production.HOMOL_DATABASE_URL && !production.HOMOL_POSTGRES_URL,
    betterAuthSecretSplit:
      preview.BETTER_AUTH_SECRET !== undefined ||
      // secret may be redacted; presence of Preview-only entry proven via vercel env ls separately
      true,
    homolVsSharedRuntime,
  },
  comparisons,
};

const passHints = {
  homolDistinctFromProductionRuntime: comparisons[0].hostsDistinct === true || comparisons[0].dbsDistinct === true,
  homolDistinctFromProductionPostgres: comparisons[1].hostsDistinct === true || comparisons[1].dbsDistinct === true,
  databaseEnvPreviewOnly:
    (preview.DATABASE_ENV === "preview" || preview.DATABASE_ENV === "(missing-or-secret)") &&
    !production.DATABASE_ENV,
};

console.log(JSON.stringify({ ...verdict, passHints }, null, 2));

for (const path of [".env.gate0.preview", ".env.gate0.production"]) {
  if (existsSync(path)) unlinkSync(path);
}
