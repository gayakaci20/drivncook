-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP,
    "targetUserId" TEXT,
    "targetRole" TEXT,
    "franchiseId" TEXT,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "actionUrl" TEXT,
    "expiresAt" TIMESTAMP
);
