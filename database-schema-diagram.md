# Database Schema Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
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
    
    TaskList {
        string id PK
        string name
        string description
        string icon
        string iconColor
        string color
        int position
        boolean isArchived
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
        string notes
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
        datetime createdAt
    }
    
    SharedTaskList {
        string id PK
        string taskListId FK
        string userId FK
        string permission
        datetime createdAt
    }

    %% Relationships
    User ||--o{ UserPreferences : has
    User ||--o{ TaskList : owns
    User ||--o{ Task : creates
    User ||--o{ TimeSession : tracks
    User ||--o{ FlowData : creates
    User ||--o{ SharedTaskList : shares
    
    TaskList ||--o{ Task : contains
    TaskList ||--o{ FlowData : visualizes
    TaskList ||--o{ SharedTaskList : shared_as
    
    TaskGroup ||--o{ Task : categorizes
    
    Task ||--o{ Subtask : has
    Task ||--o{ TimeSession : tracked_in
    Task ||--o{ Attachment : has
    
    %% Constraints and Notes
    User {
        note "Primary user entity for multi-user support"
    }
    
    Task {
        note "Core task entity with week-based management"
    }
    
    FlowData {
        note "React Flow data stored as JSON for simplicity"
    }
    
    TimeSession {
        note "Time tracking sessions for productivity analytics"
    }
```

## Clear Entity Relationship Diagram (ERD)

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
    
    User {
        string id PK "Primary Key"
        string email UK "Unique"
        string username UK "Unique"
        string name "Display name"
        string avatar "Profile picture"
        datetime createdAt
        datetime updatedAt
    }
    
    UserPreferences {
        string id PK
        string userId FK "→ User.id"
        string theme "light/dark/system"
        json windowPosition "Window state"
        int sidebarWidth
        string defaultView "kanban/timeline"
        boolean autoStartTimer
        boolean showCompletedTasks
        int weekStartsOn "0-6"
        string timeFormat "12h/24h"
    }
    
    Workspace {
        string id PK
        string name "Workspace name"
        string description
        string icon "Display icon"
        string iconColor "Icon color"
        string type "default/shared/archive/custom"
        int position "Sort order"
        boolean isArchived "Soft delete"
        string userId FK "→ User.id"
        datetime createdAt
        datetime updatedAt
    }
    
    TaskList {
        string id PK
        string name "List name"
        string description
        string icon "Display icon"
        string iconColor "Icon color"
        string color "Theme color"
        int position "Sort order"
        boolean isArchived "Soft delete"
        string workspaceId FK "→ Workspace.id"
        string userId FK "→ User.id"
        datetime createdAt
        datetime updatedAt
    }
    
    TaskGroup {
        string id PK
        string name "Group name"
        string color "Group color"
        datetime createdAt
        datetime updatedAt
    }
    
    Task {
        string id PK
        string title "Task title"
        string description
        string notes "User notes"
        string status "backlog/inprogress/today/done"
        boolean completed "Completion flag"
        string priority "low/medium/high/urgent"
        int estimatedTime "Minutes"
        int timeSpent "Minutes"
        datetime deadline "Due date"
        boolean scheduledForToday
        datetime todayScheduledAt
        int weekNumber "Week tracking"
        int weekYear "Year tracking"
        string assignedWeek "YYYY-WNN format"
        int position "Sort order"
        string taskListId FK "→ TaskList.id"
        string workspaceId FK "→ Workspace.id"
        string workspaceId FK "→ Workspace.id"
        string userId FK "→ User.id"
        string taskGroupId FK "→ TaskGroup.id (optional)"
        string kanbanColumn "backlog/thisweek/today/done"
        datetime createdAt
        datetime updatedAt
        datetime completedAt
    }
    
    Subtask {
        string id PK
        string title "Subtask title"
        boolean completed "Done flag"
        int position "Sort order"
        string taskId FK "→ Task.id"
        datetime createdAt
        datetime updatedAt
    }
    
    TimeSession {
        string id PK
        datetime startTime "Session start"
        datetime endTime "Session end (optional)"
        int duration "Minutes (calculated)"
        string notes "Session notes"
        string taskId FK "→ Task.id"
        string userId FK "→ User.id"
        datetime createdAt
    }
    
    FlowData {
        string id PK
        string userId FK "→ User.id"
        string taskListId FK "→ TaskList.id"
        string flowType "timeline/kanban"
        json nodesData "React Flow nodes"
        json edgesData "React Flow edges"
        json viewportData "Zoom/pan state"
        datetime createdAt
        datetime updatedAt
    }
    
    Attachment {
        string id PK
        string filename "Original name"
        string filepath "Storage path"
        int filesize "Bytes"
        string mimetype "File type"
        string taskId FK "→ Task.id"
        datetime createdAt
    }
    
    SharedWorkspace {
        string id PK
        string workspaceId FK "→ Workspace.id"
        string userId FK "→ User.id"
        string permission "read/write/admin"
        datetime createdAt
    }
```

## Hierarchical Relationship Structure

```mermaid
graph TD
    A[User] --> B[TaskList 1]
    A --> C[TaskList 2]
    A --> D[TaskList N]
    
    B --> E[Task 1]
    B --> F[Task 2]
    B --> G[Task N]
    
    C --> H[Task A]
    C --> I[Task B]
    
    E --> J[Subtask 1]
    E --> K[Subtask 2]
    F --> L[Subtask 3]
    
    M[TaskGroup] -.-> E
    M -.-> F
    M -.-> H
    
    N[TimeSession 1] --> E
    O[TimeSession 2] --> F
    
    P[Attachment 1] --> E
    Q[Attachment 2] --> E
    
    style A fill:#e1f5fe
    style B,C,D fill:#f3e5f5
    style E,F,G,H,I fill:#fff3e0
    style J,K,L fill:#f0f4f8
    style M fill:#e8f5e8
    style N,O fill:#ffebee
    style P,Q fill:#fce4ec
```

## Database Design Principles

### 1. **Offline-First Architecture**
- SQLite for local storage
- All operations work without internet
- Easy migration to cloud databases

### 2. **JSON Storage Strategy**
- **FlowData**: React Flow nodes/edges stored as JSON
- **UserPreferences**: Window positions and UI state as JSON
- **Benefits**: Simple, flexible, no complex joins needed

### 3. **Future-Proof Design**
- User management ready for multi-user
- Sharing mechanisms prepared
- Cloud sync architecture considered

### 4. **Performance Optimizations**
- Indexed foreign keys
- Efficient queries for common operations
- Minimal data duplication

## Key Design Decisions

### React Flow Data Storage
```mermaid
graph TB
    subgraph "FlowData Table"
        A[id: Primary Key]
        B[userId: Owner]
        C[taskListId: Context]
        D[flowType: timeline/kanban]
        E[nodesData: JSON Array]
        F[edgesData: JSON Array]
        G[viewportData: JSON Object]
    end
    
    subgraph "JSON Structure Example"
        H["nodesData: [
          {
            id: 'task-1',
            type: 'customTask',
            position: {x: 100, y: 100},
            data: {
              taskId: 'db-task-id',
              label: 'Task Title'
            }
          }
        ]"]
        
        I["edgesData: [
          {
            id: 'edge-1',
            source: 'task-1',
            target: 'task-2',
            type: 'default'
          }
        ]"]
    end
    
    E --> H
    F --> I
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

## Migration Strategy

### Phase 1: Core Tables
1. User & UserPreferences
2. TaskList & TaskGroup
3. Task & Subtask

### Phase 2: Advanced Features
1. TimeSession
2. FlowData
3. Attachment

### Phase 3: Collaboration
1. SharedTaskList
2. Additional user management

## Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_task_user_status ON Task(userId, status);
CREATE INDEX idx_task_list_position ON Task(taskListId, position);
CREATE INDEX idx_task_assigned_week ON Task(assignedWeek);
CREATE INDEX idx_time_session_task ON TimeSession(taskId);
CREATE INDEX idx_flow_data_user_list ON FlowData(userId, taskListId);
```

## Detailed Relationship Diagram

```mermaid
graph TB
    subgraph "User Management"
        U[User]
        UP[UserPreferences]
        U ||--|| UP
    end
    
    subgraph "Task Organization"
        TL[TaskList]
        TG[TaskGroup]
        T[Task]
        ST[Subtask]
        
        TL ||--o{ T
        TG ||--o{ T
        T ||--o{ ST
    end
    
    subgraph "Time & Flow Data"
        TS[TimeSession]
        FD[FlowData]
        
        T ||--o{ TS
        TL ||--o{ FD
    end
    
    subgraph "Files & Sharing"
        A[Attachment]
        STL[SharedTaskList]
        
        T ||--o{ A
        TL ||--o{ STL
    end
    
    %% User relationships
    U ||--o{ TL
    U ||--o{ T
    U ||--o{ TS
    U ||--o{ FD
    U ||--o{ STL
    
    %% Styling
    classDef userClass fill:#e1f5fe
    classDef taskClass fill:#f3e5f5
    classDef dataClass fill:#e8f5e8
    classDef fileClass fill:#fff3e0
    
    class U,UP userClass
    class TL,TG,T,ST taskClass
    class TS,FD dataClass
    class A,STL fileClass
```

## Relationship Types and Cardinalities

### One-to-One Relationships
```mermaid
graph LR
    A[User] ---|1:1| B[UserPreferences]
    
    style A fill:#e1f5fe
    style B fill:#e1f5fe
```

### One-to-Many Relationships
```mermaid
graph TB
    subgraph "User owns multiple entities"
        U1[User] ---|1:N| TL1[TaskList]
        U2[User] ---|1:N| T1[Task]
        U3[User] ---|1:N| TS1[TimeSession]
        U4[User] ---|1:N| FD1[FlowData]
    end
    
    subgraph "TaskList contains multiple entities"
        TL2[TaskList] ---|1:N| T2[Task]
        TL3[TaskList] ---|1:N| FD2[FlowData]
        TL4[TaskList] ---|1:N| STL1[SharedTaskList]
    end
    
    subgraph "Task has multiple entities"
        T3[Task] ---|1:N| ST1[Subtask]
        T4[Task] ---|1:N| TS2[TimeSession]
        T5[Task] ---|1:N| A1[Attachment]
    end
    
    subgraph "TaskGroup categorizes multiple tasks"
        TG1[TaskGroup] ---|1:N| T6[Task]
    end
    
    style U1,U2,U3,U4 fill:#e1f5fe
    style TL1,TL2,TL3,TL4 fill:#f3e5f5
    style T1,T2,T3,T4,T5,T6 fill:#f3e5f5
    style TG1 fill:#f3e5f5
    style ST1 fill:#f3e5f5
    style TS1,TS2 fill:#e8f5e8
    style FD1,FD2 fill:#e8f5e8
    style A1 fill:#fff3e0
    style STL1 fill:#fff3e0
```

## Foreign Key Relationships

### Primary Foreign Keys
```mermaid
graph LR
    subgraph "User References"
        UP[UserPreferences.userId] --> U1[User.id]
        TL[TaskList.userId] --> U2[User.id]
        T[Task.userId] --> U3[User.id]
        TS[TimeSession.userId] --> U4[User.id]
        FD[FlowData.userId] --> U5[User.id]
        STL[SharedTaskList.userId] --> U6[User.id]
    end
    
    subgraph "TaskList References"
        T2[Task.taskListId] --> TL2[TaskList.id]
        FD2[FlowData.taskListId] --> TL3[TaskList.id]
        STL2[SharedTaskList.taskListId] --> TL4[TaskList.id]
    end
    
    subgraph "Task References"
        ST2[Subtask.taskId] --> T3[Task.id]
        TS2[TimeSession.taskId] --> T4[Task.id]
        A2[Attachment.taskId] --> T5[Task.id]
    end
    
    subgraph "TaskGroup References"
        T6[Task.taskGroupId] --> TG2[TaskGroup.id]
    end
    
    style UP,TL,T,TS,FD,STL,T2,FD2,STL2,ST2,TS2,A2,T6 fill:#ffebee
    style U1,U2,U3,U4,U5,U6,TL2,TL3,TL4,T3,T4,T5,TG2 fill:#e8f5e8
```

## Data Flow Relationships

### Task Lifecycle Flow
```mermaid
graph TD
    A[User creates TaskList] --> B[User creates Task in TaskList]
    B --> C[Task assigned to TaskGroup]
    B --> D[User creates Subtasks]
    B --> E[User starts TimeSession]
    B --> F[User adds Attachments]
    B --> G[Task appears in FlowData]
    
    H[User shares TaskList] --> I[SharedTaskList created]
    I --> J[Other users can access]
    
    style A,H fill:#e1f5fe
    style B,C,D fill:#f3e5f5
    style E,G fill:#e8f5e8
    style F fill:#fff3e0
    style I,J fill:#fff3e0
```

### React Flow Data Relationship
```mermaid
graph TB
    subgraph "FlowData Structure"
        FD[FlowData Table]
        FD --> ND[nodesData JSON]
        FD --> ED[edgesData JSON]
        FD --> VD[viewportData JSON]
    end
    
    subgraph "Node Data References"
        ND --> TN[Task Nodes]
        ND --> AN[Attachment Nodes]
        ND --> SN[Subflow Nodes]
        
        TN -.->|references| T1[Task.id]
        AN -.->|references| A1[Attachment.id]
    end
    
    subgraph "Edge Data References"
        ED --> TE[Task-to-Task Edges]
        ED --> AE[Task-to-Attachment Edges]
        ED --> SE[Subflow Edges]
    end
    
    style FD fill:#e8f5e8
    style ND,ED,VD fill:#f0f4f8
    style TN,AN,SN fill:#fff3e0
    style TE,AE,SE fill:#f3e5f5
    style T1,A1 fill:#e1f5fe
```

## Cascade and Constraint Rules

### Deletion Cascades
```mermaid
graph TD
    A[Delete User] --> B[Cascade to UserPreferences]
    A --> C[Cascade to TaskList]
    A --> D[Cascade to Task]
    A --> E[Cascade to TimeSession]
    A --> F[Cascade to FlowData]
    A --> G[Cascade to SharedTaskList]
    
    H[Delete TaskList] --> I[Cascade to Task]
    H --> J[Cascade to FlowData]
    H --> K[Cascade to SharedTaskList]
    
    L[Delete Task] --> M[Cascade to Subtask]
    L --> N[Cascade to TimeSession]
    L --> O[Cascade to Attachment]
    
    style A,H,L fill:#ffebee
    style B,C,D,E,F,G,I,J,K,M,N,O fill:#e8f5e8
```

### Optional Relationships
```mermaid
graph LR
    A[Task] ---|optional| B[TaskGroup]
    C[Task] ---|optional| D[deadline]
    E[Task] ---|optional| F[todayScheduledAt]
    G[TimeSession] ---|optional| H[endTime]
    I[TimeSession] ---|optional| J[notes]
    
    style A,C,E,G,I fill:#f3e5f5
    style B,D,F,H,J fill:#f0f4f8
```

## Data Integrity Rules

1. **Cascading Deletes**: User deletion removes all related data
2. **Soft Deletes**: TaskList archiving instead of deletion
3. **Referential Integrity**: Foreign key constraints enforced
4. **Data Validation**: Prisma schema validation for all fields
5. **Unique Constraints**: User email/username uniqueness
6. **Optional References**: TaskGroup and deadline are optional for tasks