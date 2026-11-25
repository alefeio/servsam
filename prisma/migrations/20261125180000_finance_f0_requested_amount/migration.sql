-- Sprint 11B.4 QA — preserva valor solicitado vs confirmado (parcial).
-- Aditivo. Aplicar somente após autorização explícita (isolado/HOMOL).

ALTER TABLE "receipt_entry" ADD COLUMN "requestedAmountCents" INTEGER;

UPDATE "receipt_entry"
SET "requestedAmountCents" = "amountCents"
WHERE "requestedAmountCents" IS NULL;

ALTER TABLE "receipt_entry"
ALTER COLUMN "requestedAmountCents" SET NOT NULL;

CREATE INDEX "receipt_entry_organizationId_confirmedAt_idx"
ON "receipt_entry"("organizationId", "confirmedAt");
