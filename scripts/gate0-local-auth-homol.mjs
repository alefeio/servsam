/**
 * Authenticates the seed admin against the Preview HOMOL database locally.
 * Complements Preview HTTP checks. Never prints secrets.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";

function parse(path) {
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
    map[match[1]] = value;
  }
  return map;
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

spawnSync("npx", ["vercel", "env", "pull", ".env.gate0.preview.local", "--environment=preview", "--yes"], {
  stdio: "ignore",
  shell: true,
});
const preview = parse(".env.gate0.preview.local");
const local = parse(".env.local");
try {
  unlinkSync(".env.gate0.preview.local");
} catch {
  /* ignore */
}

const dbUrl =
  preview.HOMOL_DATABASE_URL_POOLED ||
  preview.HOMOL_DATABASE_URL ||
  preview.HOMOL_POSTGRES_URL;

if (!dbUrl || dbUrl.includes("[SENSITIVE]")) {
  console.log(JSON.stringify({ ok: false, reason: "missing-homol" }));
  process.exit(1);
}

// Use tsx with env injection via a temp file to avoid printing secrets
writeFileSync(
  "scripts/.gate0-local-auth-run.mts",
  `
import { createHash } from "node:crypto";
process.env.DATABASE_ENV = "preview";
process.env.HOMOL_DATABASE_URL_POOLED = process.env.GATE0_DB!;
process.env.HOMOL_DATABASE_URL = process.env.GATE0_DB!;
process.env.HOMOL_POSTGRES_URL = process.env.GATE0_DB!;
process.env.RUNTIME_DATABASE_URL = process.env.GATE0_DB!;
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "gate0-local-preview-secret-not-for-prod";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.VERCEL_ENV = "preview";

const email = process.env.SEED_ADMIN_EMAIL!.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD!;
const sha = (v: string) => createHash("sha256").update(v).digest("hex").slice(0, 12);

const { getPrisma } = await import("../src/lib/db/prisma.ts");
const { auth } = await import("../src/lib/platform/auth.ts");
const prisma = getPrisma();
const beforeSessions = await prisma.session.count();
const org = await prisma.organization.findUnique({ where: { slug: "servsam" }, select: { id: true } });
const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } });
const roles = user ? await prisma.userRole.count({ where: { userId: user.id } }) : 0;
const signedIn = await auth.api.signInEmail({ body: { email, password }, headers: new Headers() });
const afterSessions = await prisma.session.count();
const ok = Boolean(signedIn?.user?.id);
console.log(JSON.stringify({
  ok,
  orgPresent: Boolean(org),
  userActive: user?.isActive === true,
  roleLinks: roles,
  sessionDelta: afterSessions - beforeSessions,
  userIdHash: signedIn?.user?.id ? sha(signedIn.user.id) : null,
  hostHash: sha(new URL(process.env.GATE0_DB!).host),
}));
if (signedIn?.user?.id) {
  await prisma.session.deleteMany({ where: { userId: signedIn.user.id } });
}
await prisma.$disconnect();
process.exit(ok ? 0 : 1);
`,
);

const result = spawnSync("npx", ["tsx", "scripts/.gate0-local-auth-run.mts"], {
  encoding: "utf8",
  shell: true,
  env: {
    ...process.env,
    ...local,
    GATE0_DB: dbUrl,
    DATABASE_ENV: "preview",
  },
});

console.log((result.stdout || "").trim().split("\n").at(-1));
if (result.status !== 0 && result.stderr) {
  console.error(JSON.stringify({ ok: false, status: result.status, stderrHash: sha(result.stderr) }));
}

try {
  unlinkSync("scripts/.gate0-local-auth-run.mts");
} catch {
  /* ignore */
}

process.exit(result.status ?? 1);
