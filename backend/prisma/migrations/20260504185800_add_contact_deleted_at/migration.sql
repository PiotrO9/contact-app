ALTER TABLE "Contact" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contact" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Contact_userId_deletedAt_idx" ON "Contact"("userId", "deletedAt");
