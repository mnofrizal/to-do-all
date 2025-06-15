import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Zap, CheckCircle, Menu, FileText, ChevronLeft, ChevronRight, MoreHorizontal, MoreVertical, CheckCircle2, ChevronDown, ChevronUp, X, Bold, Italic, Strikethrough, List, ListOrdered, Undo, Redo, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useTheme } from '../contexts/ThemeContext'
import TaskFlowTimeline from './TaskFlowTimeline'
import {
  formatTime,
  getCurrentWeek,
  getNextMonday,
  isCurrentWeekTask,
  updateTaskToCurrentWeek,
  isToday,
  isTaskExpired,
  moveExpiredTasksToBacklog,
  calculateThisWeekProgress,
  calculateTodayProgress,
  getDefaultTaskColumns,
  createNewTask
} from '../data/taskData'

const TaskProgress = ({ onBack, activeView = 'kanban', onTaskClick, onLeapIt }) => {
  const scrollRefs = useRef({})
  const { theme, colorTheme } = useTheme()
  const [columns, setColumns] = useState(getDefaultTaskColumns())

  const [newTaskInputs, setNewTaskInputs] = useState({})
  const [hoveredTask, setHoveredTask] = useState(null)
  const [expandedSubtasks, setExpandedSubtasks] = useState({})
  const [newSubtaskInputs, setNewSubtaskInputs] = useState({})
  const [expandedNotes, setExpandedNotes] = useState({})
  const [taskNotes, setTaskNotes] = useState({})
  const [openDropdowns, setOpenDropdowns] = useState({})
  const [dropdownOpen, setDropdownOpen] = useState({})
  const [hoveredSubtask, setHoveredSubtask] = useState(null)
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [editingSubtaskValue, setEditingSubtaskValue] = useState('')
  
  // Testing panel state
  const [testTaskName, setTestTaskName] = useState('')
  const [testTaskDate, setTestTaskDate] = useState('')
  const [testTargetColumn, setTestTargetColumn] = useState('thisweek')

  // Check for expired tasks on component mount and every minute
  useEffect(() => {
    const checkExpiredTasks = () => {
      setColumns(prevColumns => moveExpiredTasksToBacklog(prevColumns));
    };

    // Check immediately on mount
    checkExpiredTasks();

    // Set up interval to check every minute
    const interval = setInterval(checkExpiredTasks, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate progress dynamically without causing re-renders
  const getColumnProgress = (columnId) => {
    if (columnId === 'thisweek') {
      return calculateThisWeekProgress(columns);
    } else if (columnId === 'today') {
      return calculateTodayProgress(columns);
    }
    return null;
  };

  const handleAddTask = (columnId, taskTitle) => {
    if (!taskTitle.trim()) return

    const newTask = createNewTask(taskTitle, columnId)

    setColumns(columns.map(col =>
      col.id === columnId
        ? { ...col, tasks: [...col.tasks, newTask] }
        : col
    ))

    setNewTaskInputs({ ...newTaskInputs, [columnId]: '' })

    // Auto scroll to bottom with smooth animation after adding task
    setTimeout(() => {
      if (scrollRefs.current[columnId]) {
        scrollRefs.current[columnId].scrollTo({
          top: scrollRefs.current[columnId].scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  // Test task creation function (simulates API POST)
  const handleCreateTestTask = () => {
    if (!testTaskName.trim()) return

    const now = new Date().toISOString()
    const taskDate = testTaskDate ? new Date(testTaskDate) : new Date()
    const currentWeek = getCurrentWeek()
    
    // Calculate week info based on the provided date
    const taskYear = taskDate.getFullYear()
    const startOfYear = new Date(taskYear, 0, 1)
    const days = Math.floor((taskDate - startOfYear) / (24 * 60 * 60 * 1000))
    const taskWeekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    const taskWeekString = `${taskYear}-W${taskWeekNumber.toString().padStart(2, '0')}`
    
    // Calculate deadline (next Monday from task date)
    const dayOfWeek = taskDate.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    const deadline = new Date(taskDate)
    deadline.setDate(taskDate.getDate() + daysUntilMonday)
    deadline.setHours(0, 0, 0, 0)
    
    // Smart column filtering: if task is not from current week and target is thisweek/today, move to backlog
    let actualTargetColumn = testTargetColumn
    let filterReason = ''
    
    if ((testTargetColumn === 'thisweek' || testTargetColumn === 'today') &&
        taskWeekString !== currentWeek.weekString) {
      actualTargetColumn = 'backlog'
      filterReason = ` → Auto-moved to Backlog (not current week)`
    }
    
    const testTask = createNewTask(
      `${testTaskName} (${taskWeekString})${filterReason}`,
      actualTargetColumn,
      taskDate.toISOString()
    )
    
    // Override specific test properties
    Object.assign(testTask, {
      taskGroup: {
        name: 'TEST',
        color: 'bg-purple-500'
      },
      deadline: deadline.toISOString(),
      weekNumber: taskWeekNumber,
      weekYear: taskYear,
      assignedWeek: taskWeekString,
      notes: `Created for testing week ${taskWeekString}. Original target: ${testTargetColumn}, Actual: ${actualTargetColumn}`
    })

    setColumns(columns.map(col =>
      col.id === actualTargetColumn
        ? { ...col, tasks: [...col.tasks, testTask] }
        : col
    ))

    // Reset form
    setTestTaskName('')
    setTestTaskDate('')
  }

  const handleInputChange = (columnId, value) => {
    setNewTaskInputs({ ...newTaskInputs, [columnId]: value })
  }

  const handleKeyPress = (e, columnId) => {
    if (e.key === 'Enter') {
      handleAddTask(columnId, newTaskInputs[columnId])
    }
  }

  const handleLeapItClick = () => {
    // Call the parent handler for single-window approach
    if (onLeapIt) {
      onLeapIt()
    }
  }

  const handleCompleteTask = (taskId) => {
    // Find the task and its current column
    let taskToComplete = null
    let sourceColumnId = null
    
    columns.forEach(col => {
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
      setColumns(columns.map(col => {
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
      }))
    } else {
      // If task is being uncompleted from Done column, move it back to Today column
      if (sourceColumnId === 'done') {
        setColumns(columns.map(col => {
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
        }))
      } else {
        // If task is in other columns, just toggle completion status
        setColumns(columns.map(col => ({
          ...col,
          tasks: col.tasks.map(task =>
            task.id === taskId ? {
              ...task,
              completed: false,
              status: 'inprogress',
              completedAt: null,
              updatedAt: now
            } : task
          )
        })))
      }
    }
  }

  const handleMoveTask = (taskId, direction) => {
    const columnOrder = ['backlog', 'thisweek', 'today', 'done']
    let sourceColumnIndex = -1
    let sourceColumn = null
    let taskToMove = null

    // Find the task and its current column
    columns.forEach((col, index) => {
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
    
    setColumns(columns.map((col, index) => {
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
    }))
  }

  // Subtask handlers
  const handleToggleSubtasks = (taskId) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  // Special handler for menu button when no subtasks exist
  const handleShowSubtaskInput = (taskId) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [taskId]: true
    }))
  }

  const handleAddSubtask = (taskId, subtaskTitle) => {
    if (!subtaskTitle.trim()) return

    // Find the task to get current subtask count for ordering
    const currentTask = columns.flatMap(col => col.tasks).find(t => t.id === taskId)
    const currentSubtaskCount = currentTask?.subtasks?.length || 0

    const newSubtask = {
      id: Date.now(),
      title: subtaskTitle,
      completed: false,
      order: currentSubtaskCount
    }

    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] }
          : task
      )
    })))

    setNewSubtaskInputs({ ...newSubtaskInputs, [taskId]: '' })
  }

  const handleToggleSubtask = (taskId, subtaskId) => {
    setColumns(columns.map(col => ({
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
    })))
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
      const task = columns.flatMap(col => col.tasks).find(t => t.id === taskId)
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
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, notes: taskNotes[taskId] || '', updatedAt: now }
          : task
      )
    })))
    setExpandedNotes(prev => ({ ...prev, [taskId]: false }))
  }

  // Dropdown and task management handlers
  const handleToggleDropdown = (taskId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const handleDeleteTask = (taskId) => {
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(task => task.id !== taskId)
    })))
    setOpenDropdowns(prev => ({ ...prev, [taskId]: false }))
  }

  const handleDuplicateTask = (taskId) => {
    const taskToDuplicate = columns.flatMap(col => col.tasks).find(t => t.id === taskId)
    if (taskToDuplicate) {
      const now = new Date().toISOString()
      const currentWeek = getCurrentWeek()
      const duplicatedTask = {
        ...taskToDuplicate,
        id: Date.now(),
        title: `${taskToDuplicate.title} (Copy)`,
        timeSpent: 0, // Reset time spent
        time: formatTime(0), // Reset formatted time
        completed: false, // Reset completion status for duplicate
        status: 'inprogress', // Reset status
        createdAt: now,
        updatedAt: now,
        completedAt: null, // Reset completion timestamp
        // Update week tracking to current week
        weekNumber: currentWeek.weekNumber,
        weekYear: currentWeek.year,
        assignedWeek: currentWeek.weekString,
        scheduledForToday: false, // Reset scheduling
        todayScheduledAt: null
      }
      
      // Add to the same column as original task
      setColumns(columns.map(col => {
        if (col.tasks.some(t => t.id === taskId)) {
          return { ...col, tasks: [...col.tasks, duplicatedTask] }
        }
        return col
      }))
    }
    setOpenDropdowns(prev => ({ ...prev, [taskId]: false }))
  }

  // Subtask management handlers
  const handleMoveSubtask = (taskId, subtaskId, direction) => {
    setColumns(columns.map(col => ({
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
    })))
  }

  const handleDeleteSubtask = (taskId, subtaskId) => {
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks?.filter(st => st.id !== subtaskId) || [] }
          : task
      )
    })))
  }

  const handleEditSubtask = (taskId, subtaskId, title) => {
    setEditingSubtask(`${taskId}-${subtaskId}`)
    setEditingSubtaskValue(title)
  }

  const handleSaveSubtaskEdit = (taskId, subtaskId) => {
    if (!editingSubtaskValue.trim()) return
    
    setColumns(columns.map(col => ({
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
    })))
    
    setEditingSubtask(null)
    setEditingSubtaskValue('')
  }

  const handleCancelSubtaskEdit = () => {
    setEditingSubtask(null)
    setEditingSubtaskValue('')
  }

  // Priority handler
  const handleChangePriority = (taskId, newPriority) => {
    const now = new Date().toISOString()
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, priority: newPriority, updatedAt: now }
          : task
      )
    })))
    // Close all dropdowns after priority change
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

  // Instant view switching - no slide animations
  const viewVariants = {
    initial: { opacity: 1, x: 0 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 1, x: 0 }
  }

  const viewTransition = {
    duration: 0
  }

  // No task animations - instant appearance
  const taskVariants = {
    hidden: { opacity: 1, y: 0 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0
      }
    }
  }

  const renderViewContent = () => {
    switch (activeView) {
      case 'kanban':
        return (
          <div className="flex h-[calc(100vh-105px)] flex-col">
            {/* Testing Panel */}
            <div className="mx-auto w-full max-w-7xl px-6 pt-4">
              <Card className="mb-4 border-2 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        🧪 API Test Panel
                      </span>
                    </div>
                    <div className="flex flex-1 items-center gap-3">
                      <Input
                        placeholder="Task name..."
                        value={testTaskName}
                        onChange={(e) => setTestTaskName(e.target.value)}
                        className="h-8 w-48 border-purple-300 bg-white text-sm dark:border-purple-700 dark:bg-purple-900/50"
                      />
                      <Input
                        type="date"
                        value={testTaskDate}
                        onChange={(e) => setTestTaskDate(e.target.value)}
                        className="h-8 w-40 border-purple-300 bg-white text-sm dark:border-purple-700 dark:bg-purple-900/50"
                      />
                      <select
                        value={testTargetColumn}
                        onChange={(e) => setTestTargetColumn(e.target.value)}
                        className="h-8 rounded border border-purple-300 bg-white px-2 text-sm dark:border-purple-700 dark:bg-purple-900/50 dark:text-white"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="thisweek">This Week</option>
                        <option value="today">Today</option>
                      </select>
                      <Button
                        onClick={handleCreateTestTask}
                        size="sm"
                        className="h-8 bg-purple-600 text-white hover:bg-purple-700"
                      >
                        Create Test Task
                      </Button>
                    </div>
                    <div className="flex flex-col text-xs text-purple-600 dark:text-purple-400">
                      <div>Current Week: {getCurrentWeek().weekString}</div>
                      {testTaskDate && (() => {
                        const taskDate = new Date(testTaskDate);
                        const taskYear = taskDate.getFullYear();
                        const startOfYear = new Date(taskYear, 0, 1);
                        const days = Math.floor((taskDate - startOfYear) / (24 * 60 * 60 * 1000));
                        const taskWeekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
                        const taskWeekString = `${taskYear}-W${taskWeekNumber.toString().padStart(2, '0')}`;
                        const currentWeek = getCurrentWeek();
                        const willAutoFilter = (testTargetColumn === 'thisweek' || testTargetColumn === 'today') &&
                                             taskWeekString !== currentWeek.weekString;
                        
                        return (
                          <div className={willAutoFilter ? 'text-orange-600 dark:text-orange-400 font-medium' : ''}>
                            Task Week: {taskWeekString}
                            {willAutoFilter && ' → Will auto-move to Backlog'}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div
              className="kanban-scrollbar flex-1 overflow-x-auto overflow-y-hidden"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              <div className="mx-auto flex h-full min-w-fit max-w-7xl gap-4 px-6 pb-6">
              {columns.map((column) => (
          <div key={column.id} className="flex h-[calc(100vh-150px)] w-full min-w-[350px] max-w-[370px] flex-col">
            <Card className={`flex h-full flex-col border ${column.color} bg-card`}>
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-card-foreground">{column.title}</h3>
                  {column.id !== 'done' && (
                 <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                 <Plus className="h-5 w-5 text-zinc-700" />
               </Button>
                )}
                 
                </div>
                {(column.id === 'thisweek' || column.id === 'today') && (
                  <span className="text-sm text-muted-foreground">
                    {(() => {
                      const progress = getColumnProgress(column.id);
                      return progress ? `${progress.completed}/${progress.total} Done` : '0/0 Done';
                    })()}
                  </span>
                )}
                 {column.id === 'done' && (
                  <p className="text-sm font-medium text-muted-foreground">{column.subtitle}</p>
                )}
              </div>

              {/* Progress Bar */}
              {(column.id === 'thisweek' || column.id === 'today') && (
                <div className="mx-4 mb-6">
                  <Progress
                    value={(() => {
                      const progress = getColumnProgress(column.id);
                      return progress && progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
                    })()}
                    className="h-2 w-full"
                  />
                </div>
              )}

              {/* Done Column Header Info */}
              {column.id === 'done' && (
                <div className="px-4 pb-4">
                  <div className="flex justify-between text-right">
          
                    <p className="text-sm text-muted-foreground">{column.date}</p>
                    <p className="text-sm text-muted-foreground">{column.taskCount}</p>
                  </div>
                </div>
              )}

              {/* Tasks and Add Task Container */}
              <div className="flex min-h-0 flex-1 flex-col">
                {/* Scrollable Tasks */}
                <CardContent
                  ref={(el) => scrollRefs.current[column.id] = el}
                  className="min-h-0 space-y-3 overflow-y-auto p-4 pt-0"
                >
                  {column.tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      className={`rounded-lg border border-zinc-300 dark:border-zinc-800 dark:bg-[#262626] p-3 shadow-sm cursor-pointer hover:bg-accent transition-colors relative ${
                        task.completed ? 'opacity-75' : ''
                      }`}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      {/* Default content - always visible */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="relative flex min-w-0 flex-1 items-start gap-2">
                          {column.id === 'today' && (
                            <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                          
                          {/* Checklist button - always visible in Done column, hover-only in others */}
                          <AnimatePresence>
                            {(hoveredTask === task.id || column.id === 'done') && (
                              <motion.button
                                initial={column.id === 'done' ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={column.id === 'done' ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCompleteTask(task.id)
                                }}
                                className={`absolute z-10 mt-0.5 transition-colors ${
                                  column.id === 'done'
                                    ? 'text-green-600 hover:text-green-700'
                                    : 'text-muted-foreground hover:text-green-600'
                                } ${
                                  column.id === 'today' ? 'left-4' : 'left-0'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <CheckCircle2
                                  size={16}
                                  strokeWidth={2}
                                  fill={column.id === 'done' ? 'currentColor' : 'none'}
                                />
                              </motion.button>
                            )}
                          </AnimatePresence>
                          
                          {/* Title with smooth slide animation */}
                          <motion.span
                            className={`font-light text-sm truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                            animate={{
                              x: hoveredTask === task.id ? 24 : 0
                            }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                          >
                            {task.title}
                          </motion.span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            {(hoveredTask === task.id || dropdownOpen[task.id]) ? (
                              <motion.div
                                key="actions"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="z-50 mt-0.5 flex items-center gap-2 bg-background pl-3"
                              >
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (task.subtasks && task.subtasks.length > 0) {
                                      handleToggleSubtasks(task.id)
                                    } else {
                                      handleShowSubtaskInput(task.id)
                                    }
                                  }}
                                  className="text-muted-foreground transition-colors hover:text-foreground"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Menu size={16} />
                                </motion.button>
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleNotes(task.id)
                                  }}
                                  className="text-muted-foreground transition-colors hover:text-foreground"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <FileText size={16} />
                                </motion.button>
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMoveTask(task.id, 'left')
                                  }}
                                  className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                                  disabled={column.id === 'backlog'}
                                  whileHover={{ scale: column.id !== 'backlog' ? 1.1 : 1 }}
                                  whileTap={{ scale: column.id !== 'backlog' ? 0.95 : 1 }}
                                >
                                  <ChevronLeft size={16} />
                                </motion.button>
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMoveTask(task.id, 'right')
                                  }}
                                  className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                                  disabled={column.id === 'done'}
                                  whileHover={{ scale: column.id !== 'done' ? 1.1 : 1 }}
                                  whileTap={{ scale: column.id !== 'done' ? 0.95 : 1 }}
                                >
                                  <ChevronRight size={16} />
                                </motion.button>
                                <DropdownMenu
                                  onOpenChange={(open) => {
                                    setDropdownOpen(prev => ({ ...prev, [task.id]: open }))
                                  }}
                                >
                                  <DropdownMenuTrigger asChild>
                                    <motion.button
                                      className="text-muted-foreground transition-colors hover:text-foreground"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical size={16} />
                                    </motion.button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-24">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDuplicateTask(task.id)
                                      }}
                                      className="text-xs"
                                    >
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleChangePriority(task.id, 'high')
                                      }}
                                      className="text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-red-500" />
                                        High
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleChangePriority(task.id, 'medium')
                                      }}
                                      className="text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                        Medium
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleChangePriority(task.id, 'low')
                                      }}
                                      className="text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        Low
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteTask(task.id)
                                      }}
                                      className="text-xs text-destructive focus:text-destructive"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </motion.div>
                            ) : (
                              <div key="badges" className="flex items-center gap-2">
                                {/* Priority Badge */}
                                <div
                                  className={`${getPriorityColor(task.priority)} h-3 w-3 rounded-full`}
                                  title={`Priority: ${task.priority}`}
                                />
                                {/* Task Group Badge */}
                                <div
                                  className={`${task.taskGroup.color} h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}
                                >
                                  {task.taskGroup.name}
                                </div>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      
                      
                      {task.estimate && (
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span className="text-xs text-muted-foreground">+ {task.estimate}</span>
                          <span className="text-xs text-muted-foreground">{task.time}</span>
                        </div>
                      )}

                      {/* Subtasks Section */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          <div
                            className="flex cursor-pointer items-center justify-between"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleSubtasks(task.id)
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {/* Circular Progress Bar */}
                              <div className="relative h-4 w-4">
                                <svg className="h-4 w-4 -rotate-90 transform" viewBox="0 0 16 16">
                                  {/* Background circle */}
                                  <circle
                                    cx="8"
                                    cy="8"
                                    r="6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    className="text-muted-foreground/30"
                                  />
                                  {/* Progress circle */}
                                  <circle
                                    cx="8"
                                    cy="8"
                                    r="6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 6}`}
                                    strokeDashoffset={`${2 * Math.PI * 6 * (1 - (task.subtasks.filter(st => st.completed).length / task.subtasks.length))}`}
                                    className="text-primary transition-all duration-300"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} Subtasks
                              </span>
                              <Plus size={14} className="text-muted-foreground" />
                            </div>
                            {expandedSubtasks[task.id] ? (
                              <ChevronUp size={16} className="text-muted-foreground" />
                            ) : (
                              <ChevronDown size={16} className="text-muted-foreground" />
                            )}
                          </div>

                          <AnimatePresence>
                            {expandedSubtasks[task.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="mt-3 space-y-2"
                              >
                                {/* Subtask List */}
                                {task.subtasks.length > 0 && (
                                  <div className="space-y-1">
                                    {task.subtasks.map((subtask, subtaskIndex) => (
                                      <div
                                        key={subtask.id}
                                        className="group relative flex items-center gap-2 py-1"
                                        onMouseEnter={() => setHoveredSubtask(`${task.id}-${subtask.id}`)}
                                        onMouseLeave={() => setHoveredSubtask(null)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleToggleSubtask(task.id, subtask.id)
                                          }}
                                          className="text-muted-foreground hover:text-green-600"
                                        >
                                          <CheckCircle2
                                            size={16}
                                            className={subtask.completed ? 'text-green-600' : 'text-muted-foreground'}
                                            fill={subtask.completed ? 'currentColor' : 'none'}
                                          />
                                        </button>
                                        
                                        {/* Editable title */}
                                        {editingSubtask === `${task.id}-${subtask.id}` ? (
                                          <input
                                            type="text"
                                            value={editingSubtaskValue}
                                            onChange={(e) => setEditingSubtaskValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleSaveSubtaskEdit(task.id, subtask.id)
                                              } else if (e.key === 'Escape') {
                                                handleCancelSubtaskEdit()
                                              }
                                            }}
                                            onBlur={() => handleSaveSubtaskEdit(task.id, subtask.id)}
                                            className="flex-1 rounded border border-primary bg-background px-2 py-1 text-sm focus:outline-none"
                                            autoFocus
                                          />
                                        ) : (
                                          <span
                                            className={`flex-1 text-sm cursor-pointer ${
                                              subtask.completed
                                                ? 'line-through text-muted-foreground'
                                                : 'text-foreground'
                                            }`}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditSubtask(task.id, subtask.id, subtask.title)
                                            }}
                                          >
                                            {subtask.title}
                                          </span>
                                        )}

                                        {/* Hover controls */}
                                        <AnimatePresence>
                                          {hoveredSubtask === `${task.id}-${subtask.id}` && editingSubtask !== `${task.id}-${subtask.id}` && (
                                            <motion.div
                                              initial={{ opacity: 0, x: 10 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              exit={{ opacity: 0, x: 10 }}
                                              transition={{ duration: 0.15 }}
                                              className="flex items-center gap-1"
                                            >
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleMoveSubtask(task.id, subtask.id, 'up')
                                                }}
                                                disabled={subtaskIndex === 0}
                                                className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                                              >
                                                <ArrowUp size={12} />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleMoveSubtask(task.id, subtask.id, 'down')
                                                }}
                                                disabled={subtaskIndex === task.subtasks.length - 1}
                                                className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                                              >
                                                <ArrowDown size={12} />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleDeleteSubtask(task.id, subtask.id)
                                                }}
                                                className="text-muted-foreground hover:text-red-600"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Add Subtask Input - Now below the subtask list */}
                                <div className="relative">
                                  <Input
                                    placeholder="Enter subtask task title*"
                                    value={newSubtaskInputs[task.id] || ''}
                                    onChange={(e) => handleSubtaskInputChange(task.id, e.target.value)}
                                    onKeyPress={(e) => handleSubtaskKeyPress(e, task.id)}
                                    className="h-10 border-2 border-primary bg-background pr-10 text-sm text-foreground placeholder:text-muted-foreground"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setNewSubtaskInputs({ ...newSubtaskInputs, [task.id]: '' })
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Floating Subtask Input for tasks with no subtasks */}
                      {task.subtasks && task.subtasks.length === 0 && expandedSubtasks[task.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="mt-3 border-t border-border pt-3"
                        >
                          <div className="relative">
                            <Input
                              placeholder="Enter subtask task title*"
                              value={newSubtaskInputs[task.id] || ''}
                              onChange={(e) => handleSubtaskInputChange(task.id, e.target.value)}
                              onKeyPress={(e) => handleSubtaskKeyPress(e, task.id)}
                              className="h-10 border-2 border-primary bg-background pr-10 text-sm text-foreground placeholder:text-muted-foreground"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setNewSubtaskInputs({ ...newSubtaskInputs, [task.id]: '' })
                                setExpandedSubtasks(prev => ({ ...prev, [task.id]: false }))
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Notes Section */}
                      <AnimatePresence>
                        {expandedNotes[task.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                              duration: 0.4,
                              ease: [0.25, 0.1, 0.25, 1],
                              opacity: { duration: 0.2, ease: "easeOut" },
                              height: {
                                duration: 0.4,
                                ease: [0.25, 0.1, 0.25, 1],
                                delay: expandedNotes[task.id] ? 0 : 0.15
                              }
                            }}
                            className="mt-3 border-t border-border pt-3"
                            style={{ overflow: 'hidden' }}
                          >
                          {/* Formatting Toolbar */}
                          <div className="mb-3 flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-2">
                            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                              <Bold size={14} />
                            </button>
                            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                              <Italic size={14} />
                            </button>
                            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                              <Strikethrough size={14} />
                            </button>
                            <div className="mx-1 h-4 w-px bg-border"></div>
                            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                              <List size={14} />
                            </button>
                            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                              <ListOrdered size={14} />
                            </button>
                            <div className="mx-1 h-4 w-px bg-border"></div>
                            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                              <Undo size={14} />
                            </button>
                            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                              <Redo size={14} />
                            </button>
                          </div>

                          {/* Notes Textarea */}
                          <div className="relative">
                            <textarea
                              placeholder="Enter your notes here..."
                              value={taskNotes[task.id] || ''}
                              onChange={(e) => handleNotesChange(task.id, e.target.value)}
                              className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedNotes(prev => ({ ...prev, [task.id]: false }))
                              }}
                              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Save Button */}
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveNotes(task.id)
                              }}
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              Save Notes
                            </Button>
                          </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Notes Indicator */}
                      {task.notes && !expandedNotes[task.id] && (
                        <div className="mt-3 border-t border-border pt-3">
                          <div
                            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleNotes(task.id)
                            }}
                          >
                            <FileText size={14} />
                            <span>{task.notes}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </CardContent>

                {/* Add Task Input - Always visible, right after tasks */}
                <div className="flex-shrink-0 px-4 pb-2">
                  <Input
                    placeholder="+ ADD TASK"
                    value={newTaskInputs[column.id] || ''}
                    onChange={(e) => handleInputChange(column.id, e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, column.id)}
                    className="h-12 border-dashed border-zinc-300 bg-transparent text-sm text-foreground placeholder:font-semibold placeholder:text-muted-foreground dark:border-zinc-700"
                  />
                </div>
              </div>

              {/* Column Footer - Fixed at bottom */}
              <div className="mt-auto p-4 pt-2">
                {column.id === 'backlog' && (
                  <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-border" />
                      All Clear
                    </div>
                  </Button>
                )}
                {column.id === 'thisweek' && (
                  <div className="w-full px-16">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Week Progress</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                        // Get current day of week (0 = Sunday, 1 = Monday, etc.)
                        const today = new Date()
                        const currentDayOfWeek = today.getDay()
                        // Convert to Monday-based (0 = Monday, 1 = Tuesday, etc.)
                        const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
                        
                        // Check if this day has passed (including today)
                        const isPassed = index <= mondayBasedDay
                        const isToday = index === mondayBasedDay
                        
                        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                        
                        return (
                          <DayWithLabel
                            key={index}
                            day={day}
                            dayName={dayNames[index]}
                            isToday={isToday}
                            isPassed={isPassed}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
                {column.id === 'today' && (
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleLeapItClick}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Leap It!
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ))}
               </div>
             </div>
           </div>
         )
     
     case 'files':
       return (
         <div className="flex h-full items-center justify-center p-6">
           <div className="text-center">
             <h2 className="mb-4 text-2xl font-bold text-foreground">Files View</h2>
             <p className="mb-6 text-muted-foreground">File management interface coming soon...</p>
             <div className="grid max-w-md grid-cols-3 gap-4">
               <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-card">
                 <span className="text-sm text-muted-foreground">Document 1</span>
               </div>
               <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-card">
                 <span className="text-sm text-muted-foreground">Document 2</span>
               </div>
               <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-card">
                 <span className="text-sm text-muted-foreground">Document 3</span>
               </div>
             </div>
           </div>
         </div>
        )
     
     case 'timeline':
       return (
         <div className="flex h-full p-6">
           
           <div className="flex-1 border border-border bg-card" style={{ minHeight: 600 }}>
             <TaskFlowTimeline />
           </div>
         </div>
       )
     
     case 'details':
       return (
         <div className="flex h-full flex-col p-6">
           <div className="mb-6">
             <h2 className="mb-2 text-2xl font-bold text-foreground">Details/List View</h2>
             <p className="text-muted-foreground">Detailed task list interface</p>
           </div>
           <div className="flex-1 rounded-lg border border-border bg-card p-4">
             <div className="space-y-3">
               <div className="flex items-center justify-between border-b border-border p-3">
                 <span className="font-medium text-foreground">Task Title</span>
                 <span className="text-sm text-muted-foreground">Status</span>
               </div>
               <div className="flex items-center justify-between rounded p-3 hover:bg-accent">
                 <span className="text-foreground">jalan jalkan</span>
                 <span className="text-sm text-blue-500">In Progress</span>
               </div>
               <div className="flex items-center justify-between rounded p-3 hover:bg-accent">
                 <span className="text-foreground">kamu taki tahu satasdsasa</span>
                 <span className="text-sm text-yellow-500">Pending</span>
               </div>
               <div className="flex items-center justify-between rounded p-3 hover:bg-accent">
                 <span className="text-foreground">Test to do 2 makan enak makar</span>
                 <span className="text-sm text-green-500">Completed</span>
               </div>
             </div>
           </div>
         </div>
       )
     
     default:
       return (
         <div className="flex h-full items-center justify-center">
           <p className="text-muted-foreground">View not found</p>
         </div>
       )
   }
 }

 return (
   <div className="flex h-full flex-col">
     <AnimatePresence>
       <div
         key={activeView}
         className="h-full"
       >
         {renderViewContent()}
       </div>
     </AnimatePresence>
   </div>
 )
}

// Day with hover label component (similar to ButtonWithLabel in FocusModeWindow)
const DayWithLabel = ({ day, dayName, isToday, isPassed }) => {
  const [hovered, setHovered] = useState(false)
  
  return (
    <motion.div
      className={`flex items-center justify-center rounded-full text-xs font-medium transition-colors border cursor-pointer ${
        isToday
          ? 'bg-primary text-primary-foreground'
          : isPassed
          ? 'bg-green-500 text-white'
          : 'bg-muted text-muted-foreground'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={false}
      animate={{
        width: hovered ? 80 : 20,
        height: 20,
        paddingLeft: hovered ? 8 : 0,
        paddingRight: hovered ? 8 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
      style={{
        minHeight: 20,
        overflow: "hidden"
      }}
    >
      <motion.span
        className="select-none text-center text-xs font-medium"
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%"
        }}
        animate={{
          opacity: 1,
          x: 0
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        {hovered ? dayName : day}
      </motion.span>
    </motion.div>
  )
}

export default TaskProgress