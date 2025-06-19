# Simplified Timer System

This document explains the new simplified timer system that implements "1 task = 1 session" with pause/resume functionality.

## Overview

The new timer system eliminates the complexity of multiple TimeSession records per task and instead uses direct time tracking in the Task model with crash recovery capabilities.

## Database Schema Changes

### Task Model
```sql
model Task {
  timeSpent         Int       @default(0)        -- Total accumulated seconds
  lastStartTime     DateTime?                    -- When timer started (null = not active)
  -- Other existing fields...
}
```

### Key Fields
- **`timeSpent`**: Total accumulated time in seconds for the task
- **`lastStartTime`**: When the current timer session started (null = timer not active)

## How It Works

### Starting Timer
1. Set `lastStartTime` to current timestamp (immediately saved to DB for crash protection)
2. Load task's `timeSpent` and convert to timer display format
3. Start local interval timer from accumulated time

### Pausing Timer
1. Calculate session duration from `lastStartTime` to now
2. Add session duration to existing `timeSpent`
3. Set `lastStartTime` to null (indicates timer not active)
4. Save to database

### Task Switching
1. Pause current task (save accumulated time)
2. Load new task's `timeSpent`
3. Start timer from new task's accumulated time

### Crash Recovery
On app startup:
1. Find all tasks where `lastStartTime` is not null
2. Calculate lost time: `now - lastStartTime`
3. Add lost time to `timeSpent`
4. Set `lastStartTime` to null

## Benefits

✅ **Single Session Per Task**: Conceptually one session with pause/resume
✅ **Simple Database**: Only 2 fields needed for timer functionality
✅ **Crash Recovery**: Never lose work due to app crashes
✅ **No Session Management**: Direct time accumulation in Task model
✅ **Easy Queries**: Direct access to total time via `timeSpent`
✅ **Data Integrity**: Always know timer state from `lastStartTime`

## Migration

### 1. Database Migration
```bash
# Apply the schema migration
npx prisma migrate dev
```

### 2. Data Migration (Optional)
```bash
# Consolidate existing TimeSession data
node scripts/migrate-timer-data.js
```

### 3. Update Dependencies
The following files have been updated:
- `prisma/schema.prisma` - Added `lastStartTime` field
- `src/main/index.js` - Simplified IPC handlers
- `src/preload/index.js` - Updated database API
- `src/renderer/src/stores/useTimerStore.js` - Complete rewrite
- `src/renderer/src/App.jsx` - Added timer initialization

## API Changes

### New Methods
- `window.db.getTask(taskId)` - Get single task with timer data
- `window.db.getTasksWithActiveTimers()` - Find crashed timers

### Removed Methods
- `window.db.createTimeSession()` - No longer needed
- `window.db.updateTimeSession()` - No longer needed
- `window.db.endTimeSession()` - No longer needed
- `window.db.getActiveTimeSession()` - No longer needed

### Simplified Timer Store
```javascript
// Start timer for task
await startForTask(taskId, userId)

// Pause timer and save
await pauseForTask()

// Switch between tasks
await switchToTask(taskId, userId)

// Initialize app with crash recovery
await initializeApp()
```

## Usage Example

```javascript
// User starts timer on task with 100 seconds accumulated
await startForTask(taskId, userId)
// Database: { timeSpent: 100, lastStartTime: "2025-01-19T10:00:00Z" }
// Display: 01:40 (continues counting)

// User pauses after 30 more seconds
await pauseForTask()
// Database: { timeSpent: 130, lastStartTime: null }
// Display: 02:10 (stopped)

// User starts again later
await startForTask(taskId, userId)
// Database: { timeSpent: 130, lastStartTime: "2025-01-19T11:00:00Z" }
// Display: 02:10 (continues from where left off)
```

## Crash Recovery Example

```javascript
// App crashes while timer is running
// Database before crash: { timeSpent: 100, lastStartTime: "10:00:00" }
// App crashes at 10:05:00

// On restart:
await initializeApp()
// Detects: lastStartTime = "10:00:00", now = "10:05:00"
// Calculates: lostTime = 300 seconds (5 minutes)
// Updates: { timeSpent: 400, lastStartTime: null }
// Result: 5 minutes of work recovered!
```

## Legacy Support

TimeSession records are kept for historical data but no new records are created. Legacy methods are still available:
- `getTaskTimeSessions(taskId)` - View historical sessions
- `getAllTaskSessions(taskId)` - Get all session history

This ensures backward compatibility while moving to the simplified system.