/**
 * Read-only: checks whether a given email exists in HOMOL (no secrets printed).
 * Usage: node scripts/homol-user-lookup.mjs alexandrefpenha@gmail.com
 */
import { createHash } from "node:crypto";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error(JSON.stringify({ ok: false, reason: "usage: email required" }));
  process.exit(1);
}

const { env, targetHostHash } = buildHomolEnv();
Object.assign(process.env, env);

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const { getPrisma } = await import("../src/lib/db/prisma.ts");
const prisma = getPrisma();
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    name: true,
    isActive: true,
    organizationId: true,
    createdAt: true,
    userRoles: { select: { role: { select: { code: true, name: true } } } },
  },
});

console.log(
  JSON.stringify(
    {
      ok: true,
      targetHostHash,
      emailHash: sha(email),
      exists: Boolean(user),
      isActive: user?.isActive ?? null,
      namePresent: Boolean(user?.name),
      idHash: user ? sha(user.id) : null,
      orgIdHash: user ? sha(user.organizationId) : null,
      roles: user?.userRoles.map((link) => link.role.code) ?? [],
      createdAt: user?.createdAt ?? null,
    },
    null,
    2,
  ),
);
await prisma.$disconnect();
