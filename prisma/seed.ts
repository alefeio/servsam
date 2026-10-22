import { config as loadEnv } from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { assertMigrationTargetAllowed, getMigrationDatabaseUrl } from "../src/lib/db/urls";
import {
  PERMISSIONS,
  SEED_ROLE_CODES,
  SEED_ROLE_LABELS,
  seedGrantsFor,
} from "../src/lib/platform/permissions";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

assertMigrationTargetAllowed();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getMigrationDatabaseUrl() }),
});

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "servsam" },
    update: { name: "SERVSAM" },
    create: {
      id: crypto.randomUUID(),
      name: "SERVSAM",
      slug: "servsam",
    },
  });

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: {
        id: crypto.randomUUID(),
        key: permission.key,
        description: permission.description,
      },
    });
  }

  const permissions = await prisma.permission.findMany();
  const permissionByKey = new Map(permissions.map((permission) => [permission.key, permission]));

  for (const code of SEED_ROLE_CODES) {
    const label = SEED_ROLE_LABELS[code];
    const role = await prisma.role.upsert({
      where: { organizationId_code: { organizationId: organization.id, code } },
      update: { name: label.name, description: label.description, isSystem: true },
      create: {
        id: crypto.randomUUID(),
        organizationId: organization.id,
        code,
        name: label.name,
        description: label.description,
        isSystem: true,
      },
    });

    for (const grant of seedGrantsFor(code)) {
      const permission = permissionByKey.get(grant.key);
      if (!permission) continue;
      const existing = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      });
      if (existing) continue;
      await prisma.rolePermission.create({
        data: {
          id: crypto.randomUUID(),
          roleId: role.id,
          permissionId: permission.id,
        },
      });
      await prisma.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: organization.id,
          action: "PERMISSION_GRANTED",
          entityType: "RolePermission",
          entityId: role.id,
          metadata: { permission: grant.key, basis: grant.basis, source: "seed" },
        },
      });
    }
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("Seed sem usuário inicial: defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD.");
    return;
  }
  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log("Usuário inicial já existe. A senha não foi alterada.");
    return;
  }

  const diretoria = await prisma.role.findUnique({
    where: { organizationId_code: { organizationId: organization.id, code: "DIRETORIA" } },
  });
  if (!diretoria) throw new Error("Papel DIRETORIA não foi criado.");

  const now = new Date();
  const userId = crypto.randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      name: "Diretoria",
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
          password: await hashPassword(password),
          createdAt: now,
          updatedAt: now,
        },
      },
      userRoles: {
        create: { id: crypto.randomUUID(), roleId: diretoria.id },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: organization.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: userId,
      metadata: { source: "seed" },
    },
  });
  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: organization.id,
      action: "ROLE_ASSIGNED",
      entityType: "UserRole",
      entityId: userId,
      metadata: { role: "DIRETORIA", source: "seed" },
    },
  });

  console.log("Usuário inicial criado. A senha permanece só na variável de ambiente.");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.name : "SeedError";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
