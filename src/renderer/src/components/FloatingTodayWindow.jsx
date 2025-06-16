import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Settings, Home, Maximize2, ChevronDown, Minimize2 } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import FloatingTaskCard from './FloatingTaskCard'
import {
  formatTime,
  getCurrentWeek,
  getDefaultTaskColumns,
  createNewTask,
  calculateTodayProgress,
  isToday,
  updateTaskToCurrentWeek
} from '../data/taskData'

const FloatingTodayWindow = ({ onClose, onFocusMode, columns = null, onTaskUpdate }) => {
  // Initialize with data from taskData or get default columns
  const [taskColumns, setTaskColumns] = useState(columns || getDefaultTaskColumns())
  const [activeTask, setActiveTask] = useState(null)
  const [newTaskInput, setNewTaskInput] = useState('')
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Timer persistence - store timer state for each task
  const [taskTimers, setTaskTimers] = useState({})
  const [currentTimer, setCurrentTimer] = useState({ hours: 0, minutes: 0, seconds: 0 })
  
  // TaskCard related states
  const [hoveredTask, setHoveredTask] = useState(null)
  const [expandedSubtasks, setExpandedSubtasks] = useState({})
  const [newSubtaskInputs, setNewSubtaskInputs] = useState({})
  const [expandedNotes, setExpandedNotes] = useState({})
  const [taskNotes, setTaskNotes] = useState({})
  const [dropdownOpen, setDropdownOpen] = useState({})
  const [hoveredSubtask, setHoveredSubtask] = useState(null)
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [editingSubtaskValue, setEditingSubtaskValue] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [editingTaskValue, setEditingTaskValue] = useState('')
  
  // Update columns when prop changes
  useEffect(() => {
    if (columns) {
      setTaskColumns(columns)
    }
  }, [columns])
  
  // Get today's tasks from the Today column (exclude completed tasks)
  const getTodayTasks = () => {
    const todayColumn = taskColumns.find(col => col.id === 'today')
    const todayTasks = todayColumn?.tasks.filter(task => !task.completed) || []
    
    // Sort tasks: active task first, then by creation date
    return todayTasks.sort((a, b) => {
      if (a.id === activeTask) return -1
      if (b.id === activeTask) return 1
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  }
  
  const tasks = getTodayTasks()

  // Timer logic with persistence
  useEffect(() => {
    let interval = null
    if (isTimerRunning && activeTask) {
      interval = setInterval(() => {
        setCurrentTimer(prev => {
          let newSeconds = prev.seconds + 1
          let newMinutes = prev.minutes
          let newHours = prev.hours

          if (newSeconds >= 60) {
            newSeconds = 0
            newMinutes += 1
          }
          if (newMinutes >= 60) {
            newMinutes = 0
            newHours += 1
          }

          const newTimer = { hours: newHours, minutes: newMinutes, seconds: newSeconds }
          
          // Save timer state for current task
          setTaskTimers(prev => ({
            ...prev,
            [activeTask]: newTimer
          }))

          return newTimer
        })
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, activeTask])

  // Load timer when active task changes
  useEffect(() => {
    if (activeTask && taskTimers[activeTask]) {
      setCurrentTimer(taskTimers[activeTask])
    } else if (activeTask) {
      setCurrentTimer({ hours: 0, minutes: 0, seconds: 0 })
    }
  }, [activeTask, taskTimers])

  // Initialize active task
  useEffect(() => {
    if (tasks.length > 0 && !activeTask) {
      // Set first task as active
      setActiveTask(tasks[0].id)
      setIsTimerRunning(true) // Auto-start timer when floating mode opens
    }
  }, [tasks.length, activeTask])

  // Task control handlers
  const handleActivateTask = (taskId) => {
    // Save current timer state before switching
    if (activeTask && currentTimer) {
      setTaskTimers(prev => ({
        ...prev,
        [activeTask]: currentTimer
      }))
    }
    
    setActiveTask(taskId)
    setIsTimerRunning(true)
  }

  const handleSkipTask = () => {
    if (tasks.length <= 1) return
    
    const currentIndex = tasks.findIndex(t => t.id === activeTask)
    const nextIndex = (currentIndex + 1) % tasks.length
    const nextTask = tasks[nextIndex]
    
    if (nextTask) {
      handleActivateTask(nextTask.id)
    }
  }

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      const newTask = createNewTask(newTaskInput, 'today')
      
      // Add task to Today column
      const updatedColumns = taskColumns.map(col =>
        col.id === 'today'
          ? { ...col, tasks: [...col.tasks, newTask] }
          : col
      )
      
      setTaskColumns(updatedColumns)
      
      // Notify parent component of the update
      if (onTaskUpdate) {
        onTaskUpdate(updatedColumns)
      }
      
      setNewTaskInput('')
    }
  }

  // TaskCard handlers
  const handleCompleteTask = (taskId) => {
    // Find the task and its current column
    let taskToComplete = null
    let sourceColumnId = null
    
    taskColumns.forEach(col => {
      const task = col.tasks.find(t => t.id === taskId)
      if (task) {
        taskToComplete = task
        sourceColumnId = col.id
      }
    })

    if (!taskToComplete) return

    const now = new Date().toISOString()

    // If task is being marked as completed, move it to Done column
    if (!taskToComplete.completed) {
      const updatedColumns = taskColumns.map(col => {
        if (col.id === sourceColumnId) {
          // Remove task from current column
          return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
        } else if (col.id === 'done') {
          // Add completed task to Done column
          return {
            ...col,
            tasks: [...col.tasks, {
              ...taskToComplete,
              completed: true,
              status: 'done',
              completedAt: now,
              updatedAt: now
            }]
          }
        }
        return col
      })
      
      setTaskColumns(updatedColumns)
      if (onTaskUpdate) onTaskUpdate(updatedColumns)
    } else {
      // If task is being uncompleted from Done column, move it back to Today column
      if (sourceColumnId === 'done') {
        const updatedColumns = taskColumns.map(col => {
          if (col.id === 'done') {
            // Remove task from Done column
            return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          } else if (col.id === 'today') {
            // Add uncompleted task to Today column
            return {
              ...col,
              tasks: [...col.tasks, {
                ...taskToComplete,
                completed: false,
                status: 'inprogress',
                completedAt: null,
                updatedAt: now
              }]
            }
          }
          return col
        })
        
        setTaskColumns(updatedColumns)
        if (onTaskUpdate) onTaskUpdate(updatedColumns)
      }
    }
  }

  const handleMoveTask = (taskId, direction) => {
    const columnOrder = ['backlog', 'thisweek', 'today', 'done']
    let sourceColumnIndex = -1
    let sourceColumn = null
    let taskToMove = null

    // Find the task and its current column
    taskColumns.forEach((col, index) => {
      const task = col.tasks.find(t => t.id === taskId)
      if (task) {
        sourceColumnIndex = index
        sourceColumn = col
        taskToMove = task
      }
    })

    if (!taskToMove || sourceColumnIndex === -1) return

    let targetColumnIndex = sourceColumnIndex
    if (direction === 'left' && sourceColumnIndex > 0) {
      targetColumnIndex = sourceColumnIndex - 1
    } else if (direction === 'right' && sourceColumnIndex < columnOrder.length - 1) {
      targetColumnIndex = sourceColumnIndex + 1
    } else {
      return // Can't move further
    }

    // Move the task
    const now = new Date().toISOString()
    const currentWeek = getCurrentWeek()
    
    const updatedColumns = taskColumns.map((col, index) => {
      if (index === sourceColumnIndex) {
        // Remove task from source column
        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
      } else if (index === targetColumnIndex) {
        // Add task to target column
        const targetColumnId = columnOrder[targetColumnIndex]
        const sourceColumnId = columnOrder[sourceColumnIndex]
        
        let updatedTask = { ...taskToMove }
        
        // Special handling for different movements
        if (sourceColumnId === 'backlog' && targetColumnId === 'thisweek') {
          // Moving from backlog to this week: update to current week
          updatedTask = updateTaskToCurrentWeek(updatedTask)
        } else if (targetColumnId === 'today') {
          // Moving to today: schedule for today
          updatedTask = {
            ...updatedTask,
            scheduledForToday: true,
            todayScheduledAt: now,
            updatedAt: now,
            status: 'inprogress'
          }
        } else if (sourceColumnId === 'today' && targetColumnId !== 'done') {
          // Moving away from today: unschedule
          updatedTask = {
            ...updatedTask,
            scheduledForToday: false,
            todayScheduledAt: null,
            updatedAt: now,
            status: targetColumnId === 'backlog' ? 'backlog' : 'inprogress'
          }
        } else if (targetColumnId === 'done') {
          // Completing task
          updatedTask = {
            ...updatedTask,
            completed: true,
            status: 'done',
            completedAt: now,
            updatedAt: now
          }
        } else if (sourceColumnId === 'done') {
          // Moving from done to other columns
          updatedTask = {
            ...updatedTask,
            completed: false,
            status: targetColumnId === 'backlog' ? 'backlog' : 'inprogress',
            completedAt: null,
            updatedAt: now
          }
        } else {
          // General status update
          updatedTask = {
            ...updatedTask,
            status: targetColumnId === 'backlog' ? 'backlog' : 'inprogress',
            updatedAt: now
          }
        }
        
        return { ...col, tasks: [...col.tasks, updatedTask] }
      }
      return col
    })
    
    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
  }

  // Subtask handlers
  const handleToggleSubtasks = (taskId) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const handleShowSubtaskInput = (taskId) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [taskId]: true
    }))
  }

  const handleAddSubtask = (taskId, subtaskTitle) => {
    if (!subtaskTitle.trim()) return

    // Find the task to get current subtask count for ordering
    const currentTask = taskColumns.flatMap(col => col.tasks).find(t => t.id === taskId)
    const currentSubtaskCount = currentTask?.subtasks?.length || 0

    const newSubtask = {
      id: Date.now(),
      title: subtaskTitle,
      completed: false,
      order: currentSubtaskCount
    }

    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] }
          : task
      )
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
    setNewSubtaskInputs({ ...newSubtaskInputs, [taskId]: '' })
  }

  const handleToggleSubtask = (taskId, subtaskId) => {
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks?.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              )
            }
          : task
      )
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
  }

  const handleSubtaskInputChange = (taskId, value) => {
    setNewSubtaskInputs({ ...newSubtaskInputs, [taskId]: value })
  }

  const handleSubtaskKeyPress = (e, taskId) => {
    if (e.key === 'Enter') {
      handleAddSubtask(taskId, newSubtaskInputs[taskId])
    }
  }

  // Notes handlers
  const handleToggleNotes = (taskId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
    
    // Initialize notes if not exists
    if (!taskNotes[taskId]) {
      const task = taskColumns.flatMap(col => col.tasks).find(t => t.id === taskId)
      setTaskNotes(prev => ({
        ...prev,
        [taskId]: task?.notes || ''
      }))
    }
  }

  const handleNotesChange = (taskId, value) => {
    setTaskNotes(prev => ({
      ...prev,
      [taskId]: value
    }))
  }

  const handleSaveNotes = (taskId) => {
    const now = new Date().toISOString()
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, notes: taskNotes[taskId] || '', updatedAt: now }
          : task
      )
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
    setExpandedNotes(prev => ({ ...prev, [taskId]: false }))
  }

  const handleDeleteNotes = (taskId) => {
    const now = new Date().toISOString()
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, notes: '', updatedAt: now }
          : task
      )
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
    
    // Clear from local state too
    setTaskNotes(prev => ({
      ...prev,
      [taskId]: ''
    }))
    setExpandedNotes(prev => ({ ...prev, [taskId]: false }))
  }

  // Task management handlers
  const handleDeleteTask = (taskId) => {
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.filter(task => task.id !== taskId)
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
  }

  const handleDuplicateTask = (taskId) => {
    const taskToDuplicate = taskColumns.flatMap(col => col.tasks).find(t => t.id === taskId)
    if (taskToDuplicate) {
      const now = new Date().toISOString()
      const currentWeek = getCurrentWeek()
      const duplicatedTask = {
        ...taskToDuplicate,
        id: Date.now(),
        title: `${taskToDuplicate.title} (Copy)`,
        timeSpent: 0,
        time: formatTime(0),
        completed: false,
        status: 'inprogress',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        weekNumber: currentWeek.weekNumber,
        weekYear: currentWeek.year,
        assignedWeek: currentWeek.weekString,
        scheduledForToday: true,
        todayScheduledAt: now
      }
      
      // Add to Today column
      const updatedColumns = taskColumns.map(col => {
        if (col.id === 'today') {
          return { ...col, tasks: [...col.tasks, duplicatedTask] }
        }
        return col
      })

      setTaskColumns(updatedColumns)
      if (onTaskUpdate) onTaskUpdate(updatedColumns)
    }
  }

  // Subtask management handlers
  const handleMoveSubtask = (taskId, subtaskId, direction) => {
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task => {
        if (task.id === taskId && task.subtasks) {
          const subtasks = [...task.subtasks]
          const currentIndex = subtasks.findIndex(st => st.id === subtaskId)
          
          if (direction === 'up' && currentIndex > 0) {
            [subtasks[currentIndex], subtasks[currentIndex - 1]] = [subtasks[currentIndex - 1], subtasks[currentIndex]]
          } else if (direction === 'down' && currentIndex < subtasks.length - 1) {
            [subtasks[currentIndex], subtasks[currentIndex + 1]] = [subtasks[currentIndex + 1], subtasks[currentIndex]]
          }
          
          return { ...task, subtasks }
        }
        return task
      })
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
  }

  const handleDeleteSubtask = (taskId, subtaskId) => {
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks?.filter(st => st.id !== subtaskId) || [] }
          : task
      )
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
  }

  const handleSaveSubtaskEdit = (taskId, subtaskId) => {
    if (!editingSubtaskValue.trim()) return
    
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks?.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, title: editingSubtaskValue.trim() }
                  : subtask
              )
            }
          : task
      )
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
    
    setEditingSubtask(null)
    setEditingSubtaskValue('')
  }

  const handleCancelSubtaskEdit = () => {
    setEditingSubtask(null)
    setEditingSubtaskValue('')
  }

  // Task title editing handlers
  const handleEditTask = (taskId, title) => {
    setEditingTask(taskId)
    setEditingTaskValue(title)
  }

  const handleSaveTaskEdit = (taskId) => {
    if (!editingTaskValue.trim()) return
    
    const now = new Date().toISOString()
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, title: editingTaskValue.trim(), updatedAt: now }
          : task
      )
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
    
    setEditingTask(null)
    setEditingTaskValue('')
  }

  const handleCancelTaskEdit = () => {
    setEditingTask(null)
    setEditingTaskValue('')
  }

  // Priority handler
  const handleChangePriority = (taskId, newPriority) => {
    const now = new Date().toISOString()
    const updatedColumns = taskColumns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, priority: newPriority, updatedAt: now }
          : task
      )
    }))

    setTaskColumns(updatedColumns)
    if (onTaskUpdate) onTaskUpdate(updatedColumns)
    setDropdownOpen(prev => ({ ...prev, [taskId]: false }))
  }

  // Priority badge helper
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatTimerDisplay = (time) => {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`
  }

  // Calculate progress using taskData functions
  const todayProgress = calculateTodayProgress(taskColumns)
  const completedTasks = todayProgress.completed
  const totalTasks = tasks.length + completedTasks // Only count incomplete + completed today
  
  // Calculate total estimated time for today's tasks
  const totalEstimateMinutes = tasks.reduce((total, task) => {
    return total + (task.estimatedTime || 0)
  }, 0)
  
  const currentProgressMinutes = currentTimer.hours * 60 + currentTimer.minutes
  const progressPercentage = totalTasks > 0
    ? (completedTasks / totalTasks) * 100
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background dark:bg-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background/90 p-4 dark:bg-card/90">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
            All <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
          <h2 className="text-lg font-bold text-foreground">Today</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground"
            onClick={onClose}
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground"
            onClick={onFocusMode}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
         
        </div>
      </div>

      {/* Content Container */}
      <div className="flex h-full flex-col">
          {/* Estimate and Progress */}
          <div className="space-y-3 bg-background p-4 dark:bg-card">
            <div className="text-sm text-muted-foreground">
              Est: {formatTime(totalEstimateMinutes)}
            </div>
            <div className="flex items-center justify-between">
              <Progress
                value={progressPercentage}
                className="mr-3 h-2 flex-1 bg-zinc-300"
              />
              <span className="text-xs text-muted-foreground">
                {completedTasks}/{totalTasks} Done
              </span>
            </div>
          </div>


          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <FloatingTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  isActive={task.id === activeTask}
                  isTimerRunning={isTimerRunning}
                  onActivateTask={handleActivateTask}
                  onSkipTask={handleSkipTask}
                  onToggleTimer={handleToggleTimer}
                  onCompleteTask={handleCompleteTask}
                  onGetCurrentTimer={() => currentTimer}
                  onGetTaskTimer={(taskId) => taskTimers[taskId]}
                  // Subtask handlers
                  expandedSubtasks={expandedSubtasks}
                  setExpandedSubtasks={setExpandedSubtasks}
                  newSubtaskInputs={newSubtaskInputs}
                  handleSubtaskInputChange={handleSubtaskInputChange}
                  handleSubtaskKeyPress={handleSubtaskKeyPress}
                  handleAddSubtask={handleAddSubtask}
                  handleToggleSubtask={handleToggleSubtask}
                  handleMoveSubtask={handleMoveSubtask}
                  handleDeleteSubtask={handleDeleteSubtask}
                  // Notes handlers
                  expandedNotes={expandedNotes}
                  setExpandedNotes={setExpandedNotes}
                  taskNotes={taskNotes}
                  handleNotesChange={handleNotesChange}
                  handleSaveNotes={handleSaveNotes}
                  handleDeleteNotes={handleDeleteNotes}
                  // Task handlers
                  handleDeleteTask={handleDeleteTask}
                  handleDuplicateTask={handleDuplicateTask}
                  handleChangePriority={handleChangePriority}
                  getPriorityColor={getPriorityColor}
                  // Edit handlers
                  editingTask={editingTask}
                  setEditingTask={setEditingTask}
                  editingTaskValue={editingTaskValue}
                  setEditingTaskValue={setEditingTaskValue}
                  handleEditTask={handleEditTask}
                  handleSaveTaskEdit={handleSaveTaskEdit}
                  handleCancelTaskEdit={handleCancelTaskEdit}
                  editingSubtask={editingSubtask}
                  setEditingSubtask={setEditingSubtask}
                  editingSubtaskValue={editingSubtaskValue}
                  setEditingSubtaskValue={setEditingSubtaskValue}
                  handleSaveSubtaskEdit={handleSaveSubtaskEdit}
                  handleCancelSubtaskEdit={handleCancelSubtaskEdit}
                  hoveredSubtask={hoveredSubtask}
                  setHoveredSubtask={setHoveredSubtask}
                />
              ))}
            </div>

            {/* Add Task */}
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="+ ADD TASK"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  className="flex-1 bg-background text-sm dark:bg-card"
                />
              </div>
            </div>
          </div>
      </div>

      {/* Focus Mode Button - Shows on hover */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 20
        }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-4 left-4 right-4"
        style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        <Button
          onClick={onFocusMode}
          className="w-full rounded-full bg-green-500 py-3 text-white hover:bg-green-600"
        >
          Focus mode
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default FloatingTodayWindow