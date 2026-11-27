import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getRuntimeDatabaseUrl } from "@/lib/db/urls";

const globalForPrisma = globalThis as unknown as { servsamPrisma?: PrismaClient };

function createPrismaClient() {
  const isolatedTest = process.env.DATABASE_ENV?.trim().toLowerCase() === "test";
  const onVercel = Boolean(process.env.VERCEL);
  // Em serverless Vercel, pool pequeno evita tempestade de conexões no cold start.
  // Em Docker/local/test manter o default do pg.Pool (não limitar concorrência dos testes).
  const adapter = new PrismaPg(
    onVercel
      ? {
          connectionString: getRuntimeDatabaseUrl(),
          max: 1,
          idleTimeoutMillis: 5_000,
          connectionTimeoutMillis: 20_000,
        }
      : { connectionString: getRuntimeDatabaseUrl() },
  );
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
