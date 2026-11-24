-- Sprint 11B.3 — Colaboradores e agendamentos operacionais (aditivo).
-- NÃO aplicar ao HOMOL compartilhado sem preflight + autorização explícita.

-- CreateEnum
CREATE TYPE "ServiceAppointmentStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "employee" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "email" TEXT,
    "userId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_appointment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerUnitId" TEXT,
    "employeeId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "ServiceAppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "changeReason" TEXT,
    "conflictAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_organizationId_isActive_deletedAt_idx" ON "employee"("organizationId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "employee_organizationId_fullName_idx" ON "employee"("organizationId", "fullName");

-- CreateIndex
CREATE INDEX "service_appointment_organizationId_startsAt_endsAt_idx" ON "service_appointment"("organizationId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "service_appointment_organizationId_status_deletedAt_idx" ON "service_appointment"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "service_appointment_organizationId_employeeId_startsAt_idx" ON "service_appointment"("organizationId", "employeeId", "startsAt");

-- CreateIndex
CREATE INDEX "service_appointment_serviceOrderId_status_idx" ON "service_appointment"("serviceOrderId", "status");

-- CreateIndex
CREATE INDEX "service_appointment_organizationId_customerId_idx" ON "service_appointment"("organizationId", "customerId");

-- Um agendamento vigente (scheduled) por OS nesta sprint.
CREATE UNIQUE INDEX "service_appointment_active_service_order_unique"
ON "service_appointment" ("serviceOrderId")
WHERE "status" = 'scheduled' AND "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointment" ADD CONSTRAINT "service_appointment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointment" ADD CONSTRAINT "service_appointment_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointment" ADD CONSTRAINT "service_appointment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
