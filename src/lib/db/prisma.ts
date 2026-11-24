import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getRuntimeDatabaseUrl } from "@/lib/db/urls";

const globalForPrisma = globalThis as unknown as { servsamPrisma?: PrismaClient };

function createPrismaClient() {
  const isolatedTest = process.env.DATABASE_ENV?.trim().toLowerCase() === "test";
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getRuntimeDatabaseUrl() }),
    // Docker local/E2E isolado pode exceder o default de 5s em txs interativas.
    ...(isolatedTest
      ? { transactionOptions: { maxWait: 20_000, timeout: 30_000 } }
      : {}),
  });
}

export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.servsamPrisma;
  if (cached) return cached;

  const client = createPrismaClient();
  // Sempre cachear: em `next start`/produção, recriar por chamada esgota conexões.
  globalForPrisma.servsamPrisma = client;
  return client;
}
