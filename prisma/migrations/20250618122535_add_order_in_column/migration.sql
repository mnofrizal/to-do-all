-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inprogress',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "estimatedTime" INTEGER NOT NULL DEFAULT 60,
    "orderInColumn" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "deadline" DATETIME,
    "assignedWeek" TEXT,
    "scheduledForToday" BOOLEAN NOT NULL DEFAULT false,
    "todayScheduledAt" DATETIME,
    "listId" INTEGER NOT NULL,
    CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assignedWeek", "completedAt", "createdAt", "deadline", "estimatedTime", "id", "listId", "notes", "priority", "scheduledForToday", "status", "timeSpent", "title", "todayScheduledAt", "updatedAt") SELECT "assignedWeek", "completedAt", "createdAt", "deadline", "estimatedTime", "id", "listId", "notes", "priority", "scheduledForToday", "status", "timeSpent", "title", "todayScheduledAt", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
