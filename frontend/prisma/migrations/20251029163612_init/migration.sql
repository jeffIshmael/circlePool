-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT,
    "userName" TEXT,
    "address" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Chama" (
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
    CONSTRAINT "Chama_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChamaMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "chamaId" INTEGER NOT NULL,
    "payDate" DATETIME NOT NULL,
    CONSTRAINT "ChamaMember_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChamaMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" TEXT NOT NULL,
    "description" TEXT,
    "doneAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "chamaId" INTEGER NOT NULL,
    CONSTRAINT "Payment_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message" TEXT NOT NULL,
    "senderId" INTEGER,
    "requestId" INTEGER,
    "userId" INTEGER NOT NULL,
    "chamaId" INTEGER,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" TEXT NOT NULL,
    "interestRate" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "chamaId" INTEGER NOT NULL,
    CONSTRAINT "LoanRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoanRequest_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChamaRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "chamaId" INTEGER NOT NULL,
    CONSTRAINT "ChamaRequest_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChamaRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayOut" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" BIGINT NOT NULL,
    "doneAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,
    "receiver" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "chamaId" INTEGER NOT NULL,
    CONSTRAINT "PayOut_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PayOut_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Chama_slug_key" ON "Chama"("slug");
