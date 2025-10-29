/*
  Warnings:

  - You are about to drop the `Chama` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChamaMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChamaRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `chamaId` on the `LoanRequest` table. All the data in the column will be lost.
  - You are about to drop the column `chamaId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `chamaId` on the `PayOut` table. All the data in the column will be lost.
  - You are about to drop the column `chamaId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `circleId` to the `LoanRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `circleId` to the `PayOut` table without a default value. This is not possible if the table is not empty.
  - Added the required column `circleId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Chama_slug_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Chama";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ChamaMember";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ChamaRequest";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Circle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "payDate" DATETIME NOT NULL,
    "cycleTime" INTEGER NOT NULL,
    "started" BOOLEAN NOT NULL DEFAULT false,
    "amount" TEXT NOT NULL,
    "leftPercent" INTEGER NOT NULL DEFAULT 10,
    "interestPercent" INTEGER NOT NULL DEFAULT 5,
    "loanableAmount" TEXT NOT NULL DEFAULT '0',
    "round" INTEGER NOT NULL DEFAULT 1,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "maxNo" INTEGER NOT NULL DEFAULT 15,
    "blockchainId" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "canJoin" BOOLEAN NOT NULL DEFAULT true,
    "payOutOrder" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Circle_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircleMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    "payDate" DATETIME NOT NULL,
    CONSTRAINT "CircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircleRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    CONSTRAINT "CircleRequest_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CircleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoanRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" TEXT NOT NULL,
    "interestRate" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    CONSTRAINT "LoanRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoanRequest_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoanRequest" ("amount", "createdAt", "duration", "endDate", "id", "interestRate", "startDate", "status", "userId") SELECT "amount", "createdAt", "duration", "endDate", "id", "interestRate", "startDate", "status", "userId" FROM "LoanRequest";
DROP TABLE "LoanRequest";
ALTER TABLE "new_LoanRequest" RENAME TO "LoanRequest";
CREATE TABLE "new_Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message" TEXT NOT NULL,
    "senderId" INTEGER,
    "requestId" INTEGER,
    "userId" INTEGER NOT NULL,
    "circleId" INTEGER,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "message", "read", "requestId", "senderId", "userId") SELECT "createdAt", "id", "message", "read", "requestId", "senderId", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_PayOut" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" BIGINT NOT NULL,
    "doneAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,
    "receiver" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    CONSTRAINT "PayOut_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PayOut_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PayOut" ("amount", "doneAt", "id", "receiver", "txHash", "userId") SELECT "amount", "doneAt", "id", "receiver", "txHash", "userId" FROM "PayOut";
DROP TABLE "PayOut";
ALTER TABLE "new_PayOut" RENAME TO "PayOut";
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" TEXT NOT NULL,
    "description" TEXT,
    "doneAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "circleId" INTEGER NOT NULL,
    CONSTRAINT "Payment_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "description", "doneAt", "id", "txHash", "userId") SELECT "amount", "description", "doneAt", "id", "txHash", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Circle_slug_key" ON "Circle"("slug");
