/*
  Warnings:

  - You are about to drop the column `notes` on the `Task` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "taskId" INTEGER,
    "listId" INTEGER,
    CONSTRAINT "Note_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Note_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inprogress',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "estimatedTime" INTEGER NOT NULL DEFAULT 60,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastStartTime" DATETIME,
    "deadline" DATETIME,
    "scheduledForToday" BOOLEAN NOT NULL DEFAULT false,
    "todayScheduledAt" DATETIME,
    "weekNumber" INTEGER,
    "weekYear" INTEGER,
    "assignedWeek" TEXT,
    "orderInColumn" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "listId" INTEGER NOT NULL,
    CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assignedWeek", "completedAt", "createdAt", "deadline", "estimatedTime", "id", "lastStartTime", "listId", "orderInColumn", "priority", "scheduledForToday", "status", "timeSpent", "title", "todayScheduledAt", "updatedAt", "weekNumber", "weekYear") SELECT "assignedWeek", "completedAt", "createdAt", "deadline", "estimatedTime", "id", "lastStartTime", "listId", "orderInColumn", "priority", "scheduledForToday", "status", "timeSpent", "title", "todayScheduledAt", "updatedAt", "weekNumber", "weekYear" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
