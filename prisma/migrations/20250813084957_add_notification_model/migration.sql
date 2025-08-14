-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    "targetUserId" TEXT,
    "targetRole" TEXT,
    "franchiseId" TEXT,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "actionUrl" TEXT,
    "expiresAt" DATETIME
);
