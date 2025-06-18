# Corrected Database Schema - Based on Actual Task Management Plan

## 🎯 **Corrected Application Flow**
```
User → Workspace (Sidebar: Default/Shared/Archive/Custom) 
     → TaskList (Home Page) 
     → TaskProgress Page (Kanban: backlog/thisweek/today/done)
     → Floating Today Window 
     → Focus Mode (1 task + timer)
```

### Time Tracking Architecture
```mermaid
graph LR
    A[User starts timer] --> B[Create TimeSession]
    B --> C[startTime recorded]
    C --> D[Timer running...]
    D --> E[User stops timer]
    E --> F[endTime recorded]
    F --> G[duration calculated]
    G --> H[Task.timeSpent updated]
```

### Task Status Flow
```mermaid
stateDiagram-v2
    [*] --> backlog: Create Task
    backlog --> inprogress: Move to This Week
    inprogress --> today: Schedule for Today
    today --> done: Complete Task
    inprogress --> done: Complete Task
    done --> [*]
    
    inprogress --> backlog: Move back (expired)
    today --> backlog: Move back (expired)
```

## 📊 **Corrected Entity Relationship Diagram**

```mermaid
erDiagram
    User ||--o{ Workspace : "has many"
    User ||--o{ Task : "creates"
    User ||--o{ TimeSession : "tracks time in"
    User ||--o{ FlowData : "creates flows"
    User ||--|| UserPreferences : "has one"
    User ||--o{ SharedWorkspace : "shares"
    
    Workspace ||--o{ TaskList : "contains many"
    Workspace ||--o{ SharedWorkspace : "shared as"
    
    TaskList ||--o{ Task : "contains many"
    TaskList ||--o{ FlowData : "visualized in"
    
    TaskGroup ||--o{ Task : "categorizes many"
    
    Task ||--o{ Subtask : "has many"
    Task ||--o{ TimeSession : "tracked in"
    Task ||--o{ Attachment : "has many"
    Task ||--o{ Note : "has many"
    
    TaskList ||--o{ Attachment : "contains standalone"
    TaskList ||--o{ Note : "contains standalone"
    
    
    User {
        string id PK
        string email UK
        string username UK
        string name
        string avatar
        datetime createdAt
        datetime updatedAt
    }
    
    UserPreferences {
        string id PK
        string userId FK
        string theme
        json windowPosition
        int sidebarWidth
        string defaultView
        boolean autoStartTimer
        boolean showCompletedTasks
        int weekStartsOn
        string timeFormat
    }
    
    Workspace {
        string id PK
        string name
        string description
        string icon
        string iconColor
        string type
        int position
        boolean isDefault
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    TaskList {
        string id PK
        string name
        string description
        string icon
        string iconColor
        string color
        int position
        boolean isArchived
        string workspaceId FK
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    TaskGroup {
        string id PK
        string name
        string color
        datetime createdAt
        datetime updatedAt
    }
    
    Task {
        string id PK
        string title
        string description
        string status
        boolean completed
        string priority
        int estimatedTime
        int timeSpent
        datetime deadline
        boolean scheduledForToday
        datetime todayScheduledAt
        int weekNumber
        int weekYear
        string assignedWeek
        int position
        string taskListId FK
        string workspaceId FK
        string userId FK
        string taskGroupId FK
        datetime createdAt
        datetime updatedAt
        datetime completedAt
    }
    
    Subtask {
        string id PK
        string title
        boolean completed
        int position
        string taskId FK
        datetime createdAt
        datetime updatedAt
    }
    
    TimeSession {
        string id PK
        datetime startTime
        datetime endTime
        int duration
        string notes
        string taskId FK
        string userId FK
        datetime createdAt
    }
    
    FlowData {
        string id PK
        string userId FK
        string workspaceId FK
        string taskListId FK
        string flowType
        json nodesData
        json edgesData
        json viewportData
        datetime createdAt
        datetime updatedAt
    }
    
    Attachment {
        string id PK
        string filename
        string filepath
        int filesize
        string mimetype
        string taskId FK
        string taskListId FK
        boolean isStandalone
        json flowPosition
        datetime createdAt
    }
    
    Note {
        string id PK
        string title
        string content
        string color
        string taskId FK
        string taskListId FK
        boolean isStandalone
        json flowPosition
        datetime createdAt
        datetime updatedAt
    }
    
    SharedWorkspace {
        string id PK
        string workspaceId FK
        string userId FK
        string permission
        datetime createdAt
    }
```

## 🔧 **Key Corrections Made:**

### **1. Removed Redundant Fields**
- ❌ Removed `kanbanColumn` - use existing `status` field
- ❌ Removed duplicate `workspaceId` references
- ✅ Keep all fields from your task management plan

### **2. Aligned with Your Actual Data Structure**
Based on your `taskData.js`, the Task entity should have:
```javascript
{
  id: number,
  title: string,
  timeSpent: number, // Accumulated from TimeSession
  estimatedTime: number,
  taskGroup: { name: string, color: string },
  priority: 'high' | 'medium' | 'low',
  status: 'backlog' | 'inprogress' | 'done', // Maps to kanban columns
  createdAt: ISO string,
  updatedAt: ISO string,
  completedAt: ISO string | null,
  deadline: ISO string,
  weekNumber: number,
  weekYear: number,
  assignedWeek: string, // "2025-W24"
  scheduledForToday: boolean,
  todayScheduledAt: ISO string | null,
  subtasks: array,
  completed: boolean
}
```

### **3. TimeSession Purpose Explained**
```javascript
// When user clicks "activate" in floating window:
const session = {
  id: "session-1",
  taskId: "task-123",
  userId: "user-1", 
  startTime: "2025-06-18T13:30:00Z", // When activated
  endTime: null, // Still running
  duration: null, // Calculated when stopped
  notes: "Focused work session"
}

// When user stops timer:
session.endTime = "2025-06-18T15:30:00Z"
session.duration = 120 // 2 hours in minutes

// Update task.timeSpent += session.duration
```

### **4. Workspace Types**
```javascript
// Default workspaces (created automatically)
{ type: "default", name: "Personal", isDefault: true }
{ type: "shared", name: "Shared", isDefault: true }  
{ type: "archive", name: "Archive", isDefault: true }

// Custom workspaces (user created)
{ type: "custom", name: "Work Projects", isDefault: false }
{ type: "custom", name: "Side Projects", isDefault: false }
```

## 📋 **Simplified Prisma Schema**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  username  String   @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  workspaces       Workspace[]
  tasks            Task[]
  timeSessions     TimeSession[]
  preferences      UserPreferences?
  flowData         FlowData[]
  attachments      Attachment[]
  notes            Note[]
  sharedWorkspaces SharedWorkspace[]
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  description String?
  icon        String   @default("W")
  iconColor   String   @default("bg-blue-500")
  type        String   @default("custom") // default/shared/archive/custom
  position    Int      @default(0)
  isDefault   Boolean  @default(false)
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskLists    TaskList[]
  tasks        Task[]
  flowData     FlowData[]
  sharedWith   SharedWorkspace[]
}

model Task {
  id                String    @id @default(cuid())
  title             String
  description       String?
  status            String    @default("backlog") // backlog/inprogress/done
  completed         Boolean   @default(false)
  priority          String    @default("medium") // low/medium/high
  estimatedTime     Int       @default(60) // minutes
  timeSpent         Int       @default(0)  // minutes (accumulated from TimeSession)
  deadline          DateTime?
  scheduledForToday Boolean   @default(false)
  todayScheduledAt  DateTime?
  weekNumber        Int?
  weekYear          Int?
  assignedWeek      String?   // "2025-W24"
  position          Int       @default(0)
  
  taskListId  String
  workspaceId String
  userId      String
  taskGroupId String?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  completedAt DateTime?
  
  taskList     TaskList      @relation(fields: [taskListId], references: [id], onDelete: Cascade)
  workspace    Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskGroup    TaskGroup?    @relation(fields: [taskGroupId], references: [id])
  subtasks     Subtask[]
  timeSessions TimeSession[]
  attachments  Attachment[]
  notes        Note[]
}

model TimeSession {
  id        String    @id @default(cuid())
  startTime DateTime  @default(now())
  endTime   DateTime?
  duration  Int?      // minutes (calculated when session ends)
  notes     String?
  
  taskId String
  userId String
  
  task User @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
}

model TaskList {
  id          String   @id @default(cuid())
  name        String
  description String?
  icon        String   @default("L")
  iconColor   String   @default("bg-gray-500")
  color       String?
  position    Int      @default(0)
  isArchived  Boolean  @default(false)
  workspaceId String
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]
  flowData    FlowData[]
  attachments Attachment[]
  notes       Note[]
}

model TaskGroup {
  id        String   @id @default(cuid())
  name      String
  color     String   @default("bg-blue-500")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tasks Task[]
}

model Subtask {
  id        String   @id @default(cuid())
  title     String
  completed Boolean  @default(false)
  position  Int      @default(0)
  taskId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model UserPreferences {
  id                 String  @id @default(cuid())
  userId             String  @unique
  theme              String  @default("system")
  windowPosition     Json?
  sidebarWidth       Int     @default(288)
  defaultView        String  @default("kanban")
  autoStartTimer     Boolean @default(false)
  showCompletedTasks Boolean @default(true)
  weekStartsOn       Int     @default(1)
  timeFormat         String  @default("24h")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model FlowData {
  id           String   @id @default(cuid())
  userId       String
  workspaceId  String
  taskListId   String
  flowType     String   @default("timeline")
  nodesData    Json
  edgesData    Json
  viewportData Json
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  taskList  TaskList  @relation(fields: [taskListId], references: [id], onDelete: Cascade)
}

model Attachment {
  id           String  @id @default(cuid())
  filename     String
  filepath     String
  filesize     Int
  mimetype     String
  isStandalone Boolean @default(false)
  flowPosition Json?   // {x: number, y: number} for React Flow positioning
  
  // Optional relationships - either belongs to task OR standalone in tasklist
  taskId      String?
  taskListId  String
  
  task      Task?     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskList  TaskList  @relation(fields: [taskListId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
}

model Note {
  id           String  @id @default(cuid())
  title        String  @default("Note")
  content      String  @default("")
  color        String  @default("bg-yellow-200")
  isStandalone Boolean @default(false)
  flowPosition Json?   // {x: number, y: number} for React Flow positioning
  
  // Optional relationships - either belongs to task OR standalone in tasklist
  taskId      String?
  taskListId  String
  
  task      Task?     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskList  TaskList  @relation(fields: [taskListId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SharedWorkspace {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  permission  String   @default("read") // read/write/admin
  createdAt   DateTime @default(now())
  
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([workspaceId, userId])
}
```

## ✅ **This Design Now Matches Your Actual App:**

1. **Sidebar Workspaces**: Default (shared, archive) + custom workspaces
2. **Home Page**: TaskLists within selected workspace  
3. **TaskProgress**: Kanban with 4 columns using `status` field
4. **Floating Window**: Shows today's tasks with activate button
5. **Focus Mode**: Single task with timer (creates TimeSession)
6. **Timer Tracking**: TimeSession records work periods, accumulates to timeSpent

No unnecessary fields, aligned with your existing `taskData.js` structure!