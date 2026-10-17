ALTER TABLE "receipts" ADD COLUMN "coveredMonths" "CalendarMonth"[] NOT NULL DEFAULT ARRAY[]::"CalendarMonth"[];

UPDATE "receipts"
SET "coveredMonths" = ARRAY["coveredMonth"]
WHERE cardinality("coveredMonths") = 0;
