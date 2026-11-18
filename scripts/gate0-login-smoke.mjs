/**
 * Gate 0 login smoke:
 * 1) Preview /sistema/login reachable (vercel curl + protection bypass)
 * 2) Seed admin authenticates against Preview HOMOL DB (Better Auth API locally)
 * Never prints emails, passwords, cookies, or connection strings.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, unlinkSync } from "node:fs";

function parseEnvFile(path) {
  const map = {};
  if (!existsSync(path)) return map;
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

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const deployment =
  process.env.GATE0_PREVIEW_URL ||
  "https://servsam-2h894k192-alefeios-projects.vercel.app";

const local = parseEnvFile(".env.local");
if (!local.SEED_ADMIN_EMAIL || !local.SEED_ADMIN_PASSWORD) {
  console.error(JSON.stringify({ ok: false, reason: "missing SEED_* in .env.local" }));
  process.exit(1);
}

const loginOut = ".gate0-login.html";
const loginCurl = spawnSync(
  "npx",
  [
    "vercel",
    "curl",
    "/sistema/login",
    "--deployment",
    deployment,
    "--yes",
    "--",
    "--silent",
    "--show-error",
    "-o",
    loginOut,
    "-w",
    "%{http_code}",
  ],
  { encoding: "utf8", shell: true },
);
const loginStatusMatch = `${loginCurl.stdout || ""}`.match(/(\d{3})\s*$/);
const loginStatus = loginStatusMatch ? Number(loginStatusMatch[1]) : null;
const loginHtml = existsSync(loginOut) ? readFileSync(loginOut, "utf8") : "";
const loginPageOk =
  loginStatus === 200 &&
  /Entrar no sistema/i.test(loginHtml) &&
  !/servsam-demo/i.test(loginHtml);

const auth = spawnSync("node", ["scripts/gate0-local-auth-homol.mjs"], {
  encoding: "utf8",
  shell: true,
  env: process.env,
});
let authReport = { ok: false };
try {
  authReport = JSON.parse((auth.stdout || "").trim().split("\n").at(-1) || "{}");
} catch {
  authReport = { ok: false, reason: "unparsed-auth" };
}

const probePull = ".env.gate0.preview.local";
spawnSync("npx", ["vercel", "env", "pull", probePull, "--environment=preview", "--yes"], {
  encoding: "utf8",
  shell: true,
  stdio: "ignore",
});
const preview = parseEnvFile(probePull);
try {
  unlinkSync(probePull);
} catch {
  /* ignore */
}
const dbUrl =
  preview.HOMOL_DATABASE_URL_POOLED ||
  preview.HOMOL_DATABASE_URL ||
  preview.HOMOL_POSTGRES_URL;
const probe = spawnSync("node", ["scripts/gate0-homol-probe.mjs"], {
  encoding: "utf8",
  shell: true,
  env: { ...process.env, GATE0_DB: dbUrl },
});
let negative = { ok: false };
try {
  negative = JSON.parse((probe.stdout || "").trim().split("\n").at(-1) || "{}");
} catch {
  negative = { ok: false, reason: "unparsed-probe" };
}

try {
  unlinkSync(loginOut);
} catch {
  /* ignore */
}

const report = {
  deploymentHostHash: sha(new URL(deployment).host),
  loginPage: { status: loginStatus, ok: loginPageOk },
  homolAuth: authReport,
  negativeProofHomol: negative,
  emailHash: sha(local.SEED_ADMIN_EMAIL.trim().toLowerCase()),
  passwordLen: local.SEED_ADMIN_PASSWORD.length,
};

const pass =
  report.loginPage.ok &&
  report.homolAuth.ok === true &&
  report.homolAuth.orgPresent === true &&
  report.homolAuth.userActive === true &&
  report.homolAuth.sessionDelta >= 1 &&
  report.negativeProofHomol.ok === true &&
  report.negativeProofHomol.userCount >= 1 &&
  report.negativeProofHomol.orgCount >= 1 &&
  report.negativeProofHomol.roleCount >= 4;

console.log(JSON.stringify({ verdict: pass ? "PASS_LOGIN" : "BLOCKED_LOGIN", ...report }, null, 2));
process.exit(pass ? 0 : 1);
