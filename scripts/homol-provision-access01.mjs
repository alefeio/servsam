/**
 * Provisionamento excepcional HOMOL ACCESS-01 (somente leitura até CONFIRM=YES).
 *
 * Dry-run (padrão):
 *   node scripts/homol-provision-access01.mjs alexandrefpenha@gmail.com
 *
 * Execução (exige autorização explícita):
 *   CONFIRM=YES node scripts/homol-provision-access01.mjs alexandrefpenha@gmail.com
 *
 * Não imprime senha. Com CONFIRM=YES, grava a senha inicial apenas em
 * .tmp-access01-initial-password.local (gitignored) para entrega 1:1.
 */
import { createHash, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
const confirm = (process.env.CONFIRM ?? "").trim().toUpperCase() === "YES";
const ROLE_CODE = "DIRETORIA";
const NAME = "Alexandre Penha";

if (!email.includes("@")) {
  console.error(JSON.stringify({ ok: false, reason: "email required" }));
  process.exit(1);
}

const { env, targetHostHash } = buildHomolEnv();
Object.assign(process.env, env);
if (process.env.VERCEL_ENV === "production" || process.env.DATABASE_ENV === "production") {
  console.error(JSON.stringify({ ok: false, reason: "refusing production" }));
  process.exit(1);
}

function sha(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

const { getPrisma } = await import("../src/lib/db/prisma.ts");
const { auth } = await import("../src/lib/platform/auth.ts");
const { writeAudit } = await import("../src/lib/platform/audit.ts");
const prisma = getPrisma();

const organization = await prisma.organization.findUnique({
  where: { slug: "servsam" },
});
if (!organization) {
  console.error(JSON.stringify({ ok: false, reason: "organization_missing" }));
  process.exit(1);
}

const role = await prisma.role.findUnique({
  where: {
    organizationId_code: { organizationId: organization.id, code: ROLE_CODE },
  },
});
if (!role) {
  console.error(JSON.stringify({ ok: false, reason: "role_missing", role: ROLE_CODE }));
  process.exit(1);
}

const existing = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    isActive: true,
    userRoles: { select: { role: { select: { code: true } } } },
  },
});

const plan = {
  ok: true,
  mode: confirm ? "execute" : "dry-run",
  targetHostHash,
  emailHash: sha(email),
  organizationSlug: "servsam",
  proposedRole: ROLE_CODE,
  proposedActive: true,
  alreadyExists: Boolean(existing),
  existingRoles: existing?.userRoles.map((link) => link.role.code) ?? [],
  existingActive: existing?.isActive ?? null,
  willCreate: !existing,
  requiresConfirmEnv: "CONFIRM=YES",
};

if (!confirm) {
  console.log(JSON.stringify({ ...plan, status: "awaiting_authorization" }, null, 2));
  await prisma.$disconnect();
  process.exit(0);
}

if (existing) {
  console.log(
    JSON.stringify(
      {
        ...plan,
        status: "skipped_already_exists",
        message: "Conta já existe — não altera senha nem papéis automaticamente.",
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
  process.exit(0);
}

const initialPassword = `Svsm-${randomBytes(18).toString("base64url")}!`;
const context = await auth.$context;
const passwordHash = await context.password.hash(initialPassword);
const userId = crypto.randomUUID();
const now = new Date();

await prisma.user.create({
  data: {
    id: userId,
    name: NAME,
    email,
    emailVerified: true,
    organizationId: organization.id,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    accounts: {
      create: {
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    },
    userRoles: { create: { id: crypto.randomUUID(), roleId: role.id } },
  },
});

await writeAudit({
  organizationId: organization.id,
  actorUserId: null,
  action: "USER_CREATED",
  entityType: "User",
  entityId: userId,
  metadata: {
    source: "homol-provision-access01",
    role: ROLE_CODE,
    emailHash: sha(email),
  },
});

await writeAudit({
  organizationId: organization.id,
  actorUserId: null,
  action: "ROLE_ASSIGNED",
  entityType: "User",
  entityId: userId,
  metadata: { role: ROLE_CODE, source: "homol-provision-access01" },
});

writeFileSync(
  ".tmp-access01-initial-password.local",
  [
    "# Arquivo local gitignored — entregar senha só por canal 1:1 e apagar depois.",
    `# email=${email}`,
    `# createdAt=${now.toISOString()}`,
    initialPassword,
    "",
  ].join("\n"),
  { encoding: "utf8", mode: 0o600 },
);

console.log(
  JSON.stringify(
    {
      ...plan,
      status: "created",
      userIdHash: sha(userId),
      passwordFile: ".tmp-access01-initial-password.local",
      note: "Senha inicial não impressa. Preferir fluxo Esqueci minha senha após o primeiro acesso Vercel.",
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
