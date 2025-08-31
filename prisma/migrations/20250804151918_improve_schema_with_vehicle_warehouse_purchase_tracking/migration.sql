-- AlterTable
ALTER TABLE "franchises" ADD COLUMN "drivingLicense" TEXT;
ALTER TABLE "franchises" ADD COLUMN "idCardDocument" TEXT;
ALTER TABLE "franchises" ADD COLUMN "kbisDocument" TEXT;
ALTER TABLE "franchises" ADD COLUMN "personalEmail" TEXT;
ALTER TABLE "franchises" ADD COLUMN "personalPhone" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "title" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "assignmentDate" TIMESTAMP;
ALTER TABLE "vehicles" ADD COLUMN "lastRevisionDate" TIMESTAMP;
ALTER TABLE "vehicles" ADD COLUMN "nextRevisionDate" TIMESTAMP;
ALTER TABLE "vehicles" ADD COLUMN "revisionInterval" INTEGER;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN "advisor" TEXT;

-- CreateTable
CREATE TABLE "franchise_purchase_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "purchasePrice" DECIMAL NOT NULL,
    "salePrice" DECIMAL NOT NULL,
    "purchaseDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseType" TEXT NOT NULL DEFAULT 'PURCHASE',
    "expirationDate" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "franchise_purchase_history_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "franchises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "franchise_purchase_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "client_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL NOT NULL,
    "purchaseDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "client_purchases_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "franchises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "client_purchases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
