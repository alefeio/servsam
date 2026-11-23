/**
 * @vitest-environment node
 *
 * Lock APRES com conexões PostgreSQL reais e distintas (não mock Prisma).
 * Usa URL HOMOL_* via `npm run test:integration` / preview-test.mjs.
 * Não cria massa [APRES]; usa chave de advisory isolada para o teste.
 */
import { config as loadEnv } from "dotenv";
import { afterAll, describe, expect, it } from "vitest";
import { integrationDatabaseGuard } from "@/lib/db/test-guard";
import {
  openApresSessionLock,
  pickLockConnectionUrl,
  withApresSessionLock,
} from "@/lib/platform/apres-session-lock";
import { APRES_01_SCENARIOS, buildApresProvisionPlan } from "@/lib/platform/apres-01-plan";

loadEnv({ path: ".env.local" });

const TEST_LOCK_KEY = {
  classId: 0x41505453, // 'APTS' — isolado do lock de provisionamento real
  objectId: 0x00009901,
} as const;

describe.skipIf(!integrationDatabaseGuard().allowed)(
  "APRES session advisory lock (conexões distintas)",
  () => {
    const clients: Array<{ close: () => Promise<void> }> = [];

    afterAll(async () => {
      for (const client of clients) {
        await client.close().catch(() => undefined);
      }
    });

    it("recusa pooler de transação quando só há URL pooler", () => {
      expect(() =>
        pickLockConnectionUrl({
          HOMOL_DATABASE_URL_POOLED:
            "postgres://u:p@db.prisma.io:5432/postgres?pgbouncer=true",
        }),
      ).toThrow(/lock_requires_direct_homol_url/);
    });

    it("A segura o lock, B é recusado, A libera e B adquire", async () => {
      const guard = integrationDatabaseGuard();
      if (!guard.allowed) throw new Error(guard.reason);

      const { url } = pickLockConnectionUrl(process.env);
      const lockA = await openApresSessionLock(url, TEST_LOCK_KEY);
      const lockB = await openApresSessionLock(url, TEST_LOCK_KEY);
      clients.push(lockA, lockB);

      expect(await lockA.tryAcquire()).toBe(true);
      expect(await lockB.tryAcquire()).toBe(false);

      await lockA.release();
      expect(await lockB.tryAcquire()).toBe(true);

      await lockB.release();
      await lockA.close();
      await lockB.close();
    });

    it("erro no trabalho libera o lock no finally (withApresSessionLock)", async () => {
      const { url } = pickLockConnectionUrl(process.env);

      await expect(
        withApresSessionLock(
          url,
          async () => {
            throw new Error("boom_during_provision");
          },
          TEST_LOCK_KEY,
        ),
      ).rejects.toThrow("boom_during_provision");

      // Segunda conexão consegue o lock após o finally.
      const lockB = await openApresSessionLock(url, TEST_LOCK_KEY);
      clients.push(lockB);
      expect(await lockB.tryAcquire()).toBe(true);
      await lockB.close();
    });

    it("perda da sessão de controle impede continuar (assertAlive)", async () => {
      const { url } = pickLockConnectionUrl(process.env);
      const lock = await openApresSessionLock(url, {
        classId: TEST_LOCK_KEY.classId,
        objectId: 0x00009902,
      });
      clients.push(lock);
      expect(await lock.tryAcquire()).toBe(true);

      // Simula perda: fecha a conexão por baixo do API público.
      await lock.close();
      await expect(lock.assertAlive()).rejects.toThrow(/apres_lock_session/);
      await expect(lock.tryAcquire()).rejects.toThrow(/apres_lock_session/);
    });

    it("reexecução idempotente do plano permanece válida com snapshot parcial", () => {
      const scenario = APRES_01_SCENARIOS[0];
      const resumed = buildApresProvisionPlan(
        [scenario],
        [
          {
            id: "cust-partial",
            legalName: scenario.customer.legalName,
            deletedAt: null,
            contacts: [{ id: "ct", name: scenario.contact.name }],
            units: [],
          },
        ],
        [],
      );
      expect(resumed.summary.createCustomers).toBe(0);
      expect(resumed.summary.createContacts).toBe(0);
      expect(resumed.summary.createUnits).toBe(1);
      expect(resumed.summary.createProposals).toBe(1);
    });
  },
);
