-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COLLECTOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'ONCE');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'DEPOSIT');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('ISSUED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ConceptKind" AS ENUM ('PENSION', 'MATRICULA', 'OTHER');

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "ruc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COLLECTOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parallels" (
    "id" UUID NOT NULL,
    "gradeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parallels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "representatives" (
    "id" UUID NOT NULL,
    "cedula" VARCHAR(10) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "cedula" VARCHAR(10) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "representativeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "parallelId" UUID NOT NULL,
    "pensionMonthly" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_concepts" (
    "id" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ConceptKind" NOT NULL,
    "defaultAmount" DECIMAL(12,2) NOT NULL,
    "requiresPeriod" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "period" "BillingPeriod" NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "dueOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_sequences" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "number" VARCHAR(16) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "calendarYear" INTEGER NOT NULL,
    "academicYearId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "collectorId" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'ISSUED',
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_lines" (
    "id" UUID NOT NULL,
    "receiptId" UUID NOT NULL,
    "chargeId" UUID NOT NULL,
    "period" "BillingPeriod" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_payments" (
    "id" UUID NOT NULL,
    "receiptId" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" VARCHAR(40),
    "bank" VARCHAR(80),

    CONSTRAINT "receipt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_voids" (
    "id" UUID NOT NULL,
    "receiptId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedById" UUID NOT NULL,

    CONSTRAINT "receipt_voids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "grades_name_key" ON "grades"("name");

-- CreateIndex
CREATE UNIQUE INDEX "parallels_gradeId_name_key" ON "parallels"("gradeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "representatives_cedula_key" ON "representatives"("cedula");

-- CreateIndex
CREATE INDEX "representatives_lastName_firstName_idx" ON "representatives"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "students_cedula_key" ON "students"("cedula");

-- CreateIndex
CREATE INDEX "students_lastName_firstName_idx" ON "students"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "students_active_idx" ON "students"("active");

-- CreateIndex
CREATE INDEX "enrollments_parallelId_academicYearId_idx" ON "enrollments"("parallelId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_academicYearId_key" ON "enrollments"("studentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_concepts_academicYearId_code_key" ON "fee_concepts"("academicYearId", "code");

-- CreateIndex
CREATE INDEX "charges_academicYearId_status_idx" ON "charges"("academicYearId", "status");

-- CreateIndex
CREATE INDEX "charges_studentId_academicYearId_idx" ON "charges"("studentId", "academicYearId");

-- CreateIndex
CREATE INDEX "charges_dueOn_idx" ON "charges"("dueOn");

-- CreateIndex
CREATE UNIQUE INDEX "charges_studentId_academicYearId_conceptId_period_key" ON "charges"("studentId", "academicYearId", "conceptId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_number_key" ON "receipts"("number");

-- CreateIndex
CREATE INDEX "receipts_issuedAt_idx" ON "receipts"("issuedAt");

-- CreateIndex
CREATE INDEX "receipts_collectorId_issuedAt_idx" ON "receipts"("collectorId", "issuedAt");

-- CreateIndex
CREATE INDEX "receipts_studentId_issuedAt_idx" ON "receipts"("studentId", "issuedAt");

-- CreateIndex
CREATE INDEX "receipts_status_issuedAt_idx" ON "receipts"("status", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_calendarYear_sequence_key" ON "receipts"("calendarYear", "sequence");

-- CreateIndex
CREATE INDEX "receipt_lines_receiptId_idx" ON "receipt_lines"("receiptId");

-- CreateIndex
CREATE INDEX "receipt_lines_chargeId_idx" ON "receipt_lines"("chargeId");

-- CreateIndex
CREATE INDEX "receipt_payments_receiptId_idx" ON "receipt_payments"("receiptId");

-- CreateIndex
CREATE INDEX "receipt_payments_method_idx" ON "receipt_payments"("method");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_voids_receiptId_key" ON "receipt_voids"("receiptId");

-- CreateIndex
CREATE INDEX "receipt_voids_voidedAt_idx" ON "receipt_voids"("voidedAt");

-- AddForeignKey
ALTER TABLE "parallels" ADD CONSTRAINT "parallels_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "representatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_parallelId_fkey" FOREIGN KEY ("parallelId") REFERENCES "parallels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_concepts" ADD CONSTRAINT "fee_concepts_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "fee_concepts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_lines" ADD CONSTRAINT "receipt_lines_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_lines" ADD CONSTRAINT "receipt_lines_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_payments" ADD CONSTRAINT "receipt_payments_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_voids" ADD CONSTRAINT "receipt_voids_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_voids" ADD CONSTRAINT "receipt_voids_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Un solo año lectivo activo.
CREATE UNIQUE INDEX "academic_years_one_active_key" ON "academic_years" ("active") WHERE "active" = true;

ALTER TABLE "students" ADD CONSTRAINT "students_cedula_digits" CHECK ("cedula" ~ '^[0-9]{10}$');
ALTER TABLE "representatives" ADD CONSTRAINT "representatives_cedula_digits" CHECK ("cedula" ~ '^[0-9]{10}$');

ALTER TABLE "charges" ADD CONSTRAINT "charges_amount_due_positive" CHECK ("amountDue" > 0);
ALTER TABLE "charges" ADD CONSTRAINT "charges_amount_paid_range" CHECK ("amountPaid" >= 0 AND "amountPaid" <= "amountDue");

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_total_positive" CHECK ("total" > 0);
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_number_format" CHECK ("number" ~ '^REC-[0-9]{4}-[0-9]{6}$');

ALTER TABLE "receipt_lines" ADD CONSTRAINT "receipt_lines_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "receipt_payments" ADD CONSTRAINT "receipt_payments_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "receipt_payments" ADD CONSTRAINT "receipt_payments_reference_rule" CHECK (
  ("method" = 'CASH' AND "reference" IS NULL)
  OR
  ("method" IN ('TRANSFER', 'DEPOSIT') AND "reference" IS NOT NULL AND char_length(btrim("reference")) >= 4)
);
