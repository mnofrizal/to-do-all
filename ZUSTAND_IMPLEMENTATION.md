# Zustand State Management Implementation

This document outlines the Zustand state management implementation for the TaskLeap application.

## Overview

The application now uses Zustand for centralized state management, replacing the previous prop drilling approach. The state is organized into three main stores:

1. **App Store** (`useAppStore`) - Authentication, navigation, and workspace state
2. **Timer Store** (`useTimerStore`) - Timer functionality with automatic interval management
3. **Task Store** (`useTaskStore`) - Task and column management with database integration

## Store Structure

### 1. App Store (`src/renderer/src/stores/useAppStore.js`)

**State:**
- `currentUser` - Current authenticated user
- `isAuthChecking` - Loading state for authentication
- `activeMenu` - Current active menu item
- `currentView` - Current view ('home', 'taskProgress', 'floating', 'focus')
- `windowMode` - Window mode ('normal', 'floating', 'focus')
- `activeWorkspace` - Currently selected workspace
- `selectedList` - Currently selected list
- `workspaceLists` - Lists in the current workspace
- `activeTaskView` - Active task view ('kanban', 'timeline', etc.)

**Key Actions:**
- `login(user)` - Authenticate user and store in localStorage
- `logout()` - Clear user session and reset app state
- `navigateToTaskProgress(list)` - Navigate to task progress view
- `navigateToHome()` - Navigate to home view
- `enterFloatingMode()` - Enter floating window mode
- `enterFocusMode()` - Enter focus window mode
- `exitSpecialModes()` - Exit floating/focus modes
- `initializeAuth()` - Initialize authentication from localStorage
- `fetchWorkspaceLists(workspaceId)` - Fetch lists for workspace

### 2. Timer Store (`src/renderer/src/stores/useTimerStore.js`)

**State:**
- `timer` - Timer object with hours, minutes, seconds
- `isRunning` - Whether timer is currently running
- `intervalId` - Internal interval ID for cleanup

**Key Actions:**
- `start()` - Start the timer
- `pause()` - Pause the timer
- `toggle()` - Toggle timer start/pause
- `reset()` - Reset timer to 00:00:00
- `formatTime()` - Get formatted time string (HH:MM:SS)
- `getTotalMinutes()` - Get total elapsed minutes
- `cleanup()` - Clean up intervals on unmount

### 3. Task Store (`src/renderer/src/stores/useTaskStore.js`)

**State:**
- `activeTask` - Currently active task
- `taskColumns` - Task columns with tasks organized by status
- `selectedList` - Currently selected list

**Key Actions:**
- `loadTasks(listId)` - Load tasks from database
- `createTask(taskData)` - Create new task
- `updateTask(taskId, updateData)` - Update existing task
- `deleteTask(taskId)` - Delete task
- `moveTask(taskId, fromColumn, toColumn, updateData)` - Move task between columns
- `getTodayTasks()` - Get today's tasks
- `getTasksByColumn(columnId)` - Get tasks by column
- `findTaskById(taskId)` - Find task by ID

## Usage Examples

### Basic Store Usage

```jsx
import useAppStore from '../stores/useAppStore'
import useTimerStore from '../stores/useTimerStore'
import useTaskStore from '../stores/useTaskStore'

const MyComponent = () => {
  // Get state and actions from stores
  const { currentUser, activeMenu, setActiveMenu } = useAppStore()
  const { timer, isRunning, start, pause, formatTime } = useTimerStore()
  const { activeTask, setActiveTask, getTodayTasks } = useTaskStore()

  return (
    <div>
      <p>User: {currentUser?.name}</p>
      <p>Timer: {formatTime()}</p>
      <p>Active Task: {activeTask?.title}</p>
      <button onClick={start}>Start Timer</button>
      <button onClick={pause}>Pause Timer</button>
    </div>
  )
}
```

### Navigation Actions

```jsx
const { 
  navigateToTaskProgress, 
  navigateToHome, 
  enterFloatingMode,
  enterFocusMode,
  exitSpecialModes 
} = useAppStore()

// Navigate to task progress with a list
navigateToTaskProgress(selectedList)

// Enter floating mode (handles window resizing and always-on-top)
enterFloatingMode()

// Exit special modes and return to normal
exitSpecialModes()
```

### Timer Management

```jsx
const { 
  start, 
  pause, 
  toggle, 
  reset, 
  formatTime, 
  getTotalMinutes,
  cleanup 
} = useTimerStore()

// Start timer
start()

// Toggle timer (start if stopped, pause if running)
toggle()

// Get formatted time for display
const timeDisplay = formatTime() // "01:23:45"

// Clean up on component unmount
useEffect(() => {
  return () => cleanup()
}, [cleanup])
```

### Task Management

```jsx
const { 
  loadTasks, 
  createTask, 
  updateTask, 
  moveTask,
  getTodayTasks 
} = useTaskStore()

// Load tasks for a list
await loadTasks(listId)

// Create new task
await createTask({
  title: "New Task",
  status: "inprogress",
  listId: selectedList.id
})

// Move task between columns
await moveTask(taskId, 'today', 'done', { 
  status: 'done', 
  completedAt: new Date().toISOString() 
})

// Get today's tasks
const todayTasks = getTodayTasks()
```

## Migration Benefits

1. **Reduced Prop Drilling**: No more passing props through multiple component levels
2. **Centralized State**: All state management in dedicated stores
3. **Better Performance**: Components only re-render when relevant state changes
4. **Easier Testing**: Stores can be tested independently
5. **Type Safety**: Better TypeScript support (if migrated to TS)
6. **DevTools**: Zustand DevTools support for debugging

## Integration Points

### Components Updated
- `App.jsx` - Main app component using all stores
- `TopNavbar.jsx` - Uses app store for navigation state
- `HomePage.jsx` - Uses app store for workspace state
- `FloatingTaskCard.jsx` - Uses timer and task stores

### Key Features
- **Automatic Timer Management**: Timer store handles intervals automatically
- **Window Mode Management**: App store manages window resizing and always-on-top
- **Database Integration**: Task store integrates with database operations
- **Authentication Flow**: App store manages login/logout with localStorage

## Best Practices

1. **Store Separation**: Keep related state together in appropriate stores
2. **Action Naming**: Use clear, descriptive action names
3. **Error Handling**: Handle errors in store actions
4. **Cleanup**: Always cleanup intervals and subscriptions
5. **Selective Subscriptions**: Only subscribe to needed state slices

## Future Enhancements

1. **Persistence**: Add persistence middleware for offline support
2. **DevTools**: Integrate Zustand DevTools for debugging
3. **TypeScript**: Migrate to TypeScript for better type safety
4. **Middleware**: Add logging and error tracking middleware
5. **Optimistic Updates**: Implement optimistic UI updates