/**
 * Advisory lock APRES em sessão PostgreSQL dedicada (não usa o pool Prisma).
 * Session locks exigem a mesma conexão para acquire/release; poolers em
 * transaction mode quebram isso — preferir URL direta HOMOL.
 */
import pg from "pg";
import { APRES_ADVISORY_LOCK } from "@/lib/platform/apres-01-guards";
import { sha12 } from "@/lib/platform/homol-instance-identity";

export type ApresLockKey = {
  classId: number;
  objectId: number;
};

export type ApresSessionLock = {
  readonly connectionId: string;
  tryAcquire(): Promise<boolean>;
  release(): Promise<void>;
  /** Confirma que a sessão de controle ainda responde; senão lança. */
  assertAlive(): Promise<void>;
  close(): Promise<void>;
};

function isLikelyTransactionPooler(connectionUrl: string): boolean {
  try {
    const parsed = new URL(connectionUrl);
    if (/pooler/i.test(parsed.hostname)) return true;
    if (parsed.searchParams.get("pgbouncer") === "true") return true;
    if (parsed.searchParams.get("connection_limit") === "1") return false;
  } catch {
    return false;
  }
  return false;
}

/**
 * Escolhe URL direta para o lock. Recusa pooler de transação quando há alternativa.
 */
export function pickLockConnectionUrl(env: Record<string, string | undefined>): {
  url: string;
  source: string;
  poolerSuspected: boolean;
} {
  const ranked: Array<{ key: string; url: string }> = [];
  for (const key of [
    "HOMOL_POSTGRES_URL",
    "HOMOL_DATABASE_URL",
    "HOMOL_DATABASE_URL_POOLED",
  ]) {
    const value = env[key]?.trim();
    if (value && !value.includes("[SENSITIVE]")) {
      ranked.push({ key, url: value });
    }
  }
  if (ranked.length === 0) {
    throw new Error("homol_url_missing_for_lock");
  }

  const direct = ranked.find((item) => !isLikelyTransactionPooler(item.url));
  const chosen = direct ?? ranked[0];
  const poolerSuspected = isLikelyTransactionPooler(chosen.url);
  if (poolerSuspected && !direct) {
    throw new Error("lock_requires_direct_homol_url_not_transaction_pooler");
  }
  return {
    url: chosen.url,
    source: chosen.key,
    poolerSuspected,
  };
}

export async function openApresSessionLock(
  connectionUrl: string,
  key: ApresLockKey = APRES_ADVISORY_LOCK,
): Promise<ApresSessionLock> {
  if (isLikelyTransactionPooler(connectionUrl)) {
    throw new Error("lock_connection_rejects_transaction_pooler");
  }

  const client = new pg.Client({ connectionString: connectionUrl });
  await client.connect();

  let closed = false;
  let held = false;
  const connectionId = sha12(`${Date.now()}:${Math.random()}`);

  async function assertOpen() {
    if (closed) throw new Error("apres_lock_session_closed");
  }

  return {
    connectionId,
    async tryAcquire() {
      await assertOpen();
      const result = await client.query<{ acquired: boolean }>(
        `SELECT pg_try_advisory_lock($1::int, $2::int) AS acquired`,
        [key.classId, key.objectId],
      );
      held = Boolean(result.rows[0]?.acquired);
      return held;
    },
    async release() {
      await assertOpen();
      if (!held) return;
      await client.query(`SELECT pg_advisory_unlock($1::int, $2::int)`, [
        key.classId,
        key.objectId,
      ]);
      held = false;
    },
    async assertAlive() {
      await assertOpen();
      try {
        await client.query("SELECT 1 AS ok");
      } catch (error) {
        closed = true;
        held = false;
        throw new Error(
          `apres_lock_session_lost:${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    },
    async close() {
      if (closed) return;
      try {
        if (held) {
          await client.query(`SELECT pg_advisory_unlock($1::int, $2::int)`, [
            key.classId,
            key.objectId,
          ]);
          held = false;
        }
      } catch {
        /* best effort */
      }
      closed = true;
      await client.end().catch(() => undefined);
    },
  };
}

/** Executa `work` com lock de sessão; libera e fecha sempre no finally. */
export async function withApresSessionLock<T>(
  connectionUrl: string,
  work: (lock: ApresSessionLock) => Promise<T>,
  key: ApresLockKey = APRES_ADVISORY_LOCK,
): Promise<T> {
  const lock = await openApresSessionLock(connectionUrl, key);
  try {
    const acquired = await lock.tryAcquire();
    if (!acquired) {
      throw new Error("concurrent_apres_provision_lock");
    }
    return await work(lock);
  } finally {
    await lock.close();
  }
}
