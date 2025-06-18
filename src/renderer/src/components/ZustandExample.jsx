import React from 'react'
import useAppStore from '../stores/useAppStore'
import useTimerStore from '../stores/useTimerStore'
import useTaskStore from '../stores/useTaskStore'

// Example component showing how to use Zustand stores
const ZustandExample = () => {
  // App Store - Authentication, Navigation, Workspace state
  const {
    currentUser,
    activeMenu,
    currentView,
    windowMode,
    activeWorkspace,
    selectedList,
    setActiveMenu,
    navigateToTaskProgress,
    enterFloatingMode,
    logout
  } = useAppStore()

  // Timer Store - Timer functionality
  const {
    timer,
    isRunning,
    start,
    pause,
    toggle,
    reset,
    formatTime,
    getTotalMinutes
  } = useTimerStore()

  // Task Store - Task management
  const {
    activeTask,
    taskColumns,
    setActiveTask,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    getTodayTasks
  } = useTaskStore()

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Zustand Store Examples</h2>
      
      {/* App Store Examples */}
      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">App Store</h3>
        <p>Current User: {currentUser?.name || 'Not logged in'}</p>
        <p>Active Menu: {activeMenu}</p>
        <p>Current View: {currentView}</p>
        <p>Window Mode: {windowMode}</p>
        <p>Active Workspace: {activeWorkspace || 'None'}</p>
        <p>Selected List: {selectedList?.name || 'None'}</p>
        
        <div className="mt-2 space-x-2">
          <button 
            onClick={() => setActiveMenu('tasks')}
            className="rounded bg-blue-500 px-3 py-1 text-white"
          >
            Set Tasks Menu
          </button>
          <button 
            onClick={() => enterFloatingMode()}
            className="rounded bg-green-500 px-3 py-1 text-white"
          >
            Enter Floating Mode
          </button>
        </div>
      </div>

      {/* Timer Store Examples */}
      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">Timer Store</h3>
        <p>Timer: {formatTime()}</p>
        <p>Is Running: {isRunning ? 'Yes' : 'No'}</p>
        <p>Total Minutes: {getTotalMinutes()}</p>
        
        <div className="mt-2 space-x-2">
          <button 
            onClick={start}
            className="rounded bg-green-500 px-3 py-1 text-white"
          >
            Start
          </button>
          <button 
            onClick={pause}
            className="rounded bg-yellow-500 px-3 py-1 text-white"
          >
            Pause
          </button>
          <button 
            onClick={toggle}
            className="rounded bg-blue-500 px-3 py-1 text-white"
          >
            Toggle
          </button>
          <button 
            onClick={reset}
            className="rounded bg-red-500 px-3 py-1 text-white"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Task Store Examples */}
      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">Task Store</h3>
        <p>Active Task: {activeTask?.title || 'None'}</p>
        <p>Task Columns: {taskColumns.length} columns</p>
        <p>Today's Tasks: {getTodayTasks().length} tasks</p>
        
        <div className="mt-2 space-x-2">
          <button 
            onClick={() => loadTasks(selectedList?.id)}
            className="rounded bg-blue-500 px-3 py-1 text-white"
            disabled={!selectedList}
          >
            Load Tasks
          </button>
          <button 
            onClick={() => setActiveTask(getTodayTasks()[0])}
            className="rounded bg-green-500 px-3 py-1 text-white"
            disabled={getTodayTasks().length === 0}
          >
            Set First Task Active
          </button>
        </div>
      </div>
    </div>
  )
}

export default ZustandExample