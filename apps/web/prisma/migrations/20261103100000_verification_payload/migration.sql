-- What a pending editorial-board enrolment needs at its confirmation (#389). It stays out
-- of the link, so it never reaches the e-mail or a log, and goes with the row.

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN "payload" TEXT;
