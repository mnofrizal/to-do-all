-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimelineNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "positionX" REAL NOT NULL,
    "positionY" REAL NOT NULL,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,
    "listId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimelineNode_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineNode_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TimelineNode" ("createdAt", "id", "listId", "nodeId", "positionX", "positionY", "taskId", "type", "updatedAt") SELECT "createdAt", "id", "listId", "nodeId", "positionX", "positionY", "taskId", "type", "updatedAt" FROM "TimelineNode";
DROP TABLE "TimelineNode";
ALTER TABLE "new_TimelineNode" RENAME TO "TimelineNode";
CREATE UNIQUE INDEX "TimelineNode_taskId_key" ON "TimelineNode"("taskId");
CREATE UNIQUE INDEX "TimelineNode_listId_nodeId_key" ON "TimelineNode"("listId", "nodeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
