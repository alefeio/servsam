import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getRuntimeDatabaseUrl } from "@/lib/db/urls";

const globalForPrisma = globalThis as unknown as { servsamPrisma?: PrismaClient };

function createPrismaClient() {
  const isolatedTest = process.env.DATABASE_ENV?.trim().toLowerCase() === "test";
  // Em serverless (Preview/Production) limitar o pool evita tempestade de conexões
  // em cold start; em test isolado permite um pouco mais de paralelismo.
  const adapter = new PrismaPg({
    connectionString: getRuntimeDatabaseUrl(),
    max: isolatedTest ? 5 : 1,
    idleTimeoutMillis: isolatedTest ? 10_000 : 5_000,
    connectionTimeoutMillis: 20_000,
  });
  return new PrismaClient({
    adapter,
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
