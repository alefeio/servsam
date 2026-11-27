/**
 * RELEASE-03 — provisionamento auditado de 3 usuários piloto no HOMOL.
 *
 * Dry-run:
 *   DATABASE_ENV=preview HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
 *     node --import tsx scripts/release-03-provision-users.mjs
 *
 * Execução (autorização formal RELEASE-03):
 *   CONFIRM=YES RELEASE_03_AUTHORIZE=YES DATABASE_ENV=preview \
 *     HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
 *     node --import tsx scripts/release-03-provision-users.mjs
 *
 * Senhas vão SOMENTE para `.credentials/release-03-pilot.local.json` (gitignored).
 * Nunca impressas no stdout.
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildHomolEnv, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";
import {
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  computeInstanceId,
} from "./lib/homol-11b4-migrate-plan.mjs";
import pg from "pg";

const confirm = (process.env.CONFIRM ?? "").trim().toUpperCase() === "YES";
const authorized =
  (process.env.RELEASE_03_AUTHORIZE ?? "").trim().toUpperCase() === "YES";

const PILOTS = [
  { name: "Diretor", email: "diretoria@servsam.com", role: "DIRETORIA" },
  {
    name: "Administrador",
    email: "administrativo@servsam.com",
    role: "ADMINISTRATIVO",
  },
  { name: "Financeiro", email: "financeiro@servsam.com", role: "FINANCEIRO" },
];

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV=preview" }));
  process.exit(1);
}

const { env, targetHostHash } = buildHomolEnv();
Object.assign(process.env, env);

if (process.env.VERCEL_ENV === "production") {
  console.error(JSON.stringify({ ok: false, reason: "refusing production" }));
  process.exit(1);
}
if (targetHostHash !== EXPECTED_HOST_HASH) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "unexpected_homol_host_hash",
      targetHostHash,
      expected: EXPECTED_HOST_HASH,
    }),
  );
  process.exit(1);
}

function sha(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function strongPassword() {
  return `Svsm-${randomBytes(18).toString("base64url")}-A9!`;
}

const idClient = new pg.Client({
  connectionString: env.POSTGRES_URL || env.RUNTIME_DATABASE_URL,
});
await idClient.connect();
let instanceId;
try {
  const id = await idClient.query(`
    SELECT current_database() AS database,
           (SELECT system_identifier::text FROM pg_control_system()) AS sid
  `);
  instanceId = computeInstanceId(
    String(id.rows[0].sid),
    String(id.rows[0].database),
  );
} finally {
  await idClient.end();
}

if (instanceId !== EXPECTED_INSTANCE_ID) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "unexpected_instance",
      instanceId,
      expected: EXPECTED_INSTANCE_ID,
    }),
  );
  process.exit(1);
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

const operator = await prisma.user.findFirst({
  where: {
    organizationId: organization.id,
    isActive: true,
    email: "diretoria@servsam.local",
    userRoles: { some: { role: { code: "DIRETORIA" } } },
  },
  select: { id: true, email: true },
});
if (!operator) {
  console.error(JSON.stringify({ ok: false, reason: "operator_user_manage_missing" }));
  process.exit(1);
}

const roles = await prisma.role.findMany({
  where: {
    organizationId: organization.id,
    code: { in: ["DIRETORIA", "ADMINISTRATIVO", "FINANCEIRO"] },
  },
  select: { id: true, code: true },
});
const roleByCode = Object.fromEntries(roles.map((r) => [r.code, r]));
for (const code of ["DIRETORIA", "ADMINISTRATIVO", "FINANCEIRO"]) {
  if (!roleByCode[code]) {
    console.error(JSON.stringify({ ok: false, reason: "role_missing", code }));
    process.exit(1);
  }
}

const baselineUserCount = await prisma.user.count({
  where: { organizationId: organization.id },
});

const planRows = [];
for (const pilot of PILOTS) {
  const existing = await prisma.user.findUnique({
    where: { email: pilot.email },
    select: {
      id: true,
      isActive: true,
      userRoles: { select: { role: { select: { code: true } } } },
    },
  });
  planRows.push({
    name: pilot.name,
    email: pilot.email,
    emailHash: sha(pilot.email),
    role: pilot.role,
    alreadyExists: Boolean(existing),
    existingRoles: existing?.userRoles.map((l) => l.role.code) ?? [],
    existingActive: existing?.isActive ?? null,
    willCreate: !existing,
  });
}

const plan = {
  ok: true,
  mode: confirm && authorized ? "execute" : "dry-run",
  phase: "release-03-provision-users",
  databaseEnv: "preview",
  homolSource: HOMOL_ENV_FILE,
  hostHash: targetHostHash,
  instanceId,
  organizationSlug: organization.slug,
  operatorEmailDomain: String(operator.email).split("@")[1],
  operatorIdHash: sha(operator.id),
  baselineUserCount,
  pilots: planRows,
  willCreateCount: planRows.filter((r) => r.willCreate).length,
  passwordPersistence: "gitignored_.credentials_only",
  requires: ["CONFIRM=YES", "RELEASE_03_AUTHORIZE=YES"],
};

if (!confirm || !authorized) {
  console.log(
    JSON.stringify(
      {
        ...plan,
        status: "awaiting_authorization",
        confirm,
        authorized,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
  process.exit(0);
}

const context = await auth.$context;
const credentialEnvelope = {
  purpose: "SERVSAM RELEASE-03 HOMOL pilot — credenciais temporárias",
  createdAt: new Date().toISOString(),
  hostHash: targetHostHash,
  instanceId,
  note: "Entregar ao responsável por canal seguro 1:1. Não versionar. Rotacionar após o piloto.",
  accounts: [],
};
const results = [];

for (const pilot of PILOTS) {
  const existing = await prisma.user.findUnique({
    where: { email: pilot.email },
    select: {
      id: true,
      isActive: true,
      userRoles: { select: { role: { select: { code: true } } } },
    },
  });
  if (existing) {
    results.push({
      emailHash: sha(pilot.email),
      status: "skipped_already_exists",
      roles: existing.userRoles.map((l) => l.role.code),
      isActive: existing.isActive,
    });
    continue;
  }

  const role = roleByCode[pilot.role];
  let plaintext = strongPassword();
  const passwordHash = await context.password.hash(plaintext);
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const userRoleId = crypto.randomUUID();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        name: pilot.name,
        email: pilot.email,
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
        userRoles: {
          create: {
            id: userRoleId,
            roleId: role.id,
            assignedById: operator.id,
          },
        },
      },
    });

    await writeAudit(
      {
        organizationId: organization.id,
        actorUserId: operator.id,
        action: "USER_CREATED",
        entityType: "User",
        entityId: userId,
        metadata: {
          source: "release-03-provision-users",
          role: pilot.role,
          emailHash: sha(pilot.email),
          passwordDelivery: "local_credentials_envelope",
        },
      },
      tx,
    );

    await writeAudit(
      {
        organizationId: organization.id,
        actorUserId: operator.id,
        action: "ROLE_ASSIGNED",
        entityType: "User",
        entityId: userId,
        metadata: {
          role: pilot.role,
          source: "release-03-provision-users",
        },
      },
      tx,
    );
  });

  credentialEnvelope.accounts.push({
    name: pilot.name,
    email: pilot.email,
    role: pilot.role,
    temporaryPassword: plaintext,
    loginUrl:
      "https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app/sistema/login",
  });
  plaintext = "";

  results.push({
    emailHash: sha(pilot.email),
    userIdHash: sha(userId),
    status: "created",
    role: pilot.role,
    isActive: true,
  });
}

const credDir = resolve(".credentials");
mkdirSync(credDir, { recursive: true });
const credPath = resolve(credDir, "release-03-pilot.local.json");
writeFileSync(credPath, JSON.stringify(credentialEnvelope, null, 2), {
  encoding: "utf8",
  mode: 0o600,
});

const afterUserCount = await prisma.user.count({
  where: { organizationId: organization.id },
});

const createdCount = results.filter((r) => r.status === "created").length;
console.log(
  JSON.stringify(
    {
      ...plan,
      status: "executed",
      results,
      afterUserCount,
      createdCount,
      usersDeltaOk: afterUserCount === baselineUserCount + createdCount,
      credentialsEnvelopePath: ".credentials/release-03-pilot.local.json",
      credentialsPrinted: false,
      passwordCountInEnvelope: credentialEnvelope.accounts.length,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
process.exit(createdCount === plan.willCreateCount && afterUserCount === baselineUserCount + createdCount ? 0 : 2);
