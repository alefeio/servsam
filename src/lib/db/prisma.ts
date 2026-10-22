import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getRuntimeDatabaseUrl } from "@/lib/db/urls";

const globalForPrisma = globalThis as unknown as { servsamPrisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getRuntimeDatabaseUrl() }),
  });
}

export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.servsamPrisma;
  if (cached) return cached;

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.servsamPrisma = client;
  }
  return client;
}
