-- CreateTable
CREATE TABLE "TimelineEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "listId" INTEGER NOT NULL,
    CONSTRAINT "TimelineEdge_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEdge_listId_sourceId_targetId_key" ON "TimelineEdge"("listId", "sourceId", "targetId");
