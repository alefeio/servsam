/**
 * Provisionamento excepcional HOMOL ACCESS-01 (somente leitura até CONFIRM=YES).
 *
 * Dry-run (padrão):
 *   npx tsx scripts/homol-provision-access01.mjs alexandrefpenha@gmail.com
 *
 * Execução (exige autorização explícita):
 *   CONFIRM=YES npx tsx scripts/homol-provision-access01.mjs alexandrefpenha@gmail.com
 *
 * A senha aleatória serve só para criar o hash Better Auth; nunca é impressa nem
 * gravada em disco. O responsável define a senha via “Esqueci minha senha”.
 */
import { createHash, randomBytes } from "node:crypto";
import { buildHomolEnv, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
const confirm = (process.env.CONFIRM ?? "").trim().toUpperCase() === "YES";
const ROLE_CODE = "DIRETORIA";
const NAME = "Alexandre Penha";
const EXPECTED_HOMOL_HOST_HASH = "22e5c2dd2d93";

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
if (process.env.DATABASE_ENV !== "preview") {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "DATABASE_ENV must be preview",
      databaseEnv: process.env.DATABASE_ENV ?? null,
    }),
  );
  process.exit(1);
}
if (targetHostHash !== EXPECTED_HOMOL_HOST_HASH) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "unexpected_homol_host_hash",
      targetHostHash,
      expected: EXPECTED_HOMOL_HOST_HASH,
      source: HOMOL_ENV_FILE,
    }),
  );
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
  select: { id: true, slug: true },
});
if (!organization) {
  console.error(JSON.stringify({ ok: false, reason: "organization_missing" }));
  process.exit(1);
}

const role = await prisma.role.findUnique({
  where: {
    organizationId_code: { organizationId: organization.id, code: ROLE_CODE },
  },
  select: { id: true, code: true },
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

const baselineUserCount = await prisma.user.count({
  where: { organizationId: organization.id },
});

const plan = {
  ok: true,
  mode: confirm ? "execute" : "dry-run",
  databaseEnv: "preview",
  homolSource: HOMOL_ENV_FILE,
  targetHostHash,
  productionContact: false,
  emailHash: sha(email),
  organizationSlug: organization.slug,
  proposedRole: ROLE_CODE,
  proposedActive: true,
  alreadyExists: Boolean(existing),
  existingRoles: existing?.userRoles.map((link) => link.role.code) ?? [],
  existingActive: existing?.isActive ?? null,
  baselineUserCount,
  willCreate: !existing,
  passwordPersistence: "none_in_memory_only_then_discarded",
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

const context = await auth.$context;
let disposablePassword = `Svsm-${randomBytes(24).toString("base64url")}!A9`;
const passwordHash = await context.password.hash(disposablePassword);
disposablePassword = "";

const userId = crypto.randomUUID();
const accountId = crypto.randomUUID();
const userRoleId = crypto.randomUUID();
const now = new Date();

await prisma.$transaction(async (tx) => {
  await tx.user.create({
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
          id: accountId,
          accountId: userId,
          providerId: "credential",
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      },
      userRoles: { create: { id: userRoleId, roleId: role.id } },
    },
  });

  await writeAudit(
    {
      organizationId: organization.id,
      actorUserId: null,
      action: "USER_CREATED",
      entityType: "User",
      entityId: userId,
      metadata: {
        source: "homol-provision-access01",
        role: ROLE_CODE,
        emailHash: sha(email),
        passwordDelivery: "forgot_password_flow",
      },
    },
    tx,
  );

  await writeAudit(
    {
      organizationId: organization.id,
      actorUserId: null,
      action: "ROLE_ASSIGNED",
      entityType: "User",
      entityId: userId,
      metadata: { role: ROLE_CODE, source: "homol-provision-access01" },
    },
    tx,
  );
});

const created = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    isActive: true,
    organizationId: true,
    accounts: { select: { providerId: true, password: true } },
    userRoles: { select: { role: { select: { code: true } } } },
  },
});

const afterUserCount = await prisma.user.count({
  where: { organizationId: organization.id },
});

console.log(
  JSON.stringify(
    {
      ...plan,
      status: "created",
      userIdHash: sha(userId),
      isActive: created?.isActive === true,
      roles: created?.userRoles.map((link) => link.role.code) ?? [],
      sameOrgAsServsam: created?.organizationId === organization.id,
      credentialAccount: Boolean(
        created?.accounts.some((account) => account.providerId === "credential"),
      ),
      passwordHashPresent: Boolean(
        created?.accounts.some(
          (account) => account.providerId === "credential" && Boolean(account.password),
        ),
      ),
      afterUserCount,
      onlyOneUserAdded: afterUserCount === baselineUserCount + 1,
      nextStep: "forgot_password_on_preview",
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
