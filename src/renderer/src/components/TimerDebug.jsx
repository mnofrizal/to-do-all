import React from 'react'
import useTimerStore from '../stores/useTimerStore'
import useTaskStore from '../stores/useTaskStore'

const TimerDebug = () => {
  const { debugTaskSessions, clearTaskData } = useTimerStore()
  const { taskColumns } = useTaskStore()

  // Get all tasks from all columns
  const allTasks = taskColumns.flatMap(column => column.tasks)

  const handleDebugTask = async (taskId) => {
    await debugTaskSessions(taskId)
  }

  const handleClearTask = async (taskId) => {
    if (window.confirm(`Are you sure you want to clear all timer data for this task?`)) {
      await clearTaskData(taskId)
      alert('Task timer data cleared!')
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-lg font-semibold">Timer Debug Tools</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Use these tools to debug timer issues. Check the browser console for detailed logs.
      </p>
      
      <div className="space-y-2">
        {allTasks.map(task => (
          <div key={task.id} className="flex items-center justify-between rounded border p-2">
            <span className="text-sm">{task.title}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDebugTask(task.id)}
                className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
              >
                Debug
              </button>
              <button
                onClick={() => handleClearTask(task.id)}
                className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
              >
                Clear
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Instructions:</strong><br/>
          1. Click "Debug" on a task to see all its timer sessions in the console<br/>
          2. Click "Clear" to reset a task's timer data completely<br/>
          3. Open browser DevTools (F12) to see the console logs
        </p>
      </div>
    </div>
  )
}

export default TimerDebug