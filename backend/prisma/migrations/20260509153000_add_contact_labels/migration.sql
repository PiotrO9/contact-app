CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactLabel" (
    "contactId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactLabel_pkey" PRIMARY KEY ("contactId","labelId")
);

CREATE UNIQUE INDEX "Label_userId_name_key" ON "Label"("userId", "name");

CREATE INDEX "Label_userId_idx" ON "Label"("userId");

CREATE INDEX "ContactLabel_labelId_idx" ON "ContactLabel"("labelId");

ALTER TABLE "ContactLabel" ADD CONSTRAINT "ContactLabel_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactLabel" ADD CONSTRAINT "ContactLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
