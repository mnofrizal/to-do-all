# Database Integration Plan: Prisma with SQLite

This document outlines the detailed plan for integrating a database into the application using Prisma and SQLite. The plan covers project setup, schema definition, database migration, and application integration.

## 1. Project Setup & Installation

First, we'll add Prisma to the project and initialize it.

*   **Install Dependencies:**
    *   `prisma`: The command-line tool for managing the database schema and migrations.
    *   `@prisma/client`: The auto-generated, type-safe database client.

*   **Initialize Prisma:**
    *   Run `npx prisma init`. This command will create a new `prisma` directory containing a `schema.prisma` file and a `.env` file to configure the database connection URL.

## 2. Schema Definition

Next, we'll define the database schema in the `prisma/schema.prisma` file. The new hierarchy will be: **Workspace -> List -> Task -> Subtask**.

*   **Data Models ERD:**

    ```mermaid
    erDiagram
        Workspace {
            Int id PK
            String name
            DateTime createdAt
            DateTime updatedAt
        }

        List {
            Int id PK
            String name
            String icon
            String iconColor
            DateTime createdAt
            DateTime updatedAt
            Int workspaceId FK
        }

        Task {
            Int id PK
            String title
            String status
            String priority
            String notes
            Int timeSpent
            Int estimatedTime
            DateTime createdAt
            DateTime updatedAt
            DateTime completedAt
            DateTime deadline
            String assignedWeek
            Boolean scheduledForToday
            DateTime todayScheduledAt
            Int listId FK
        }

        Subtask {
            Int id PK
            String title
            Boolean completed
            Int order
            Int taskId FK
        }

        Workspace ||--o{ List : "has"
        List ||--o{ Task : "contains"
        Task ||--o{ Subtask : "contains"
    }
    ```

*   **`schema.prisma`:**

    ```prisma
    // This is your Prisma schema file,
    // learn more about it in the docs: https://pris.ly/d/prisma-schema

    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "sqlite"
      url      = env("DATABASE_URL")
    }

    model Workspace {
      id        Int      @id @default(autoincrement())
      name      String
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
      lists     List[]
    }

    model List {
      id          Int      @id @default(autoincrement())
      name        String
      icon        String
      iconColor   String
      createdAt   DateTime @default(now())
      updatedAt   DateTime @updatedAt
      tasks       Task[]
      workspace   Workspace @relation(fields: [workspaceId], references: [id])
      workspaceId Int
    }

    model Task {
      id                Int       @id @default(autoincrement())
      title             String
      status            String    @default("inprogress")
      priority          String    @default("medium")
      notes             String?
      timeSpent         Int       @default(0)
      estimatedTime     Int       @default(60)
      createdAt         DateTime  @default(now())
      updatedAt         DateTime  @updatedAt
      completedAt       DateTime?
      deadline          DateTime?
      assignedWeek      String?
      scheduledForToday Boolean   @default(false)
      todayScheduledAt  DateTime?
      list              List      @relation(fields: [listId], references: [id])
      listId            Int
      subtasks          Subtask[]
    }

    model Subtask {
      id        Int     @id @default(autoincrement())
      title     String
      completed Boolean @default(false)
      order     Int
      task      Task    @relation(fields: [taskId], references: [id])
      taskId    Int
    }
    ```

## 3. Database Migration

With the schema defined, we'll create the database and its tables.

*   **Run Migration:**
    *   Execute `npx prisma migrate dev --name init`. This command will create the SQLite database file and tables, and generate the Prisma Client.

## 4. Application Integration

Now, we'll integrate the Prisma Client into the Electron application.

*   **Data Flow Diagram:**

    ```mermaid
    sequenceDiagram
        participant UI as User Interface
        participant Renderer as Renderer Process
        participant Preload as Preload Script
        participant Main as Main Process
        participant DB as SQLite Database

        UI->>Renderer: Selects Workspace
        Renderer->>Preload: window.db.getLists(workspaceId)
        Preload->>Main: ipcRenderer.invoke('get-lists', workspaceId)
        Main->>DB: prisma.list.findMany({ where: { workspaceId } })
        DB-->>Main: Returns Lists for Workspace
        Main-->>Preload: Returns Lists
        Preload-->>Renderer: Returns Lists
        Renderer->>UI: Displays Lists
    ```

*   **Main Process (`src/main/index.js`):** Instantiate the Prisma Client and create IPC handlers for database operations.
*   **Preload Script (`src/preload/index.js`):** Create a `db` API on the `window` object to securely call the main process handlers.

## 5. Refactoring Application Logic

Finally, we'll refactor the React components and data logic to use the new database API.

*   **UI Changes:** A new UI component will be added for workspace management.
*   **Data Logic:** The application logic will be updated to be workspace-aware. All data manipulation functions will be refactored to use the `window.db` API.