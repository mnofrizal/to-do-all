/*
  Warnings:

  - You are about to drop the `TimelineEdge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TimelineNode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TimelineEdge";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TimelineNode";
PRAGMA foreign_keys=on;
