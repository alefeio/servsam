-- Unicidade de documento ativo por organização (soft-delete permite reuso após arquivar).
CREATE UNIQUE INDEX "customer_organizationId_document_active_key"
ON "customer" ("organizationId", "document")
WHERE "deletedAt" IS NULL AND "document" IS NOT NULL;
