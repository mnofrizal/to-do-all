import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Zap, CheckCircle, Menu, FileText, ChevronLeft, ChevronRight, MoreHorizontal, MoreVertical, CheckCircle2, ChevronDown, ChevronUp, X, Bold, Italic, Strikethrough, List, ListOrdered, Undo, Redo } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useTheme } from '../contexts/ThemeContext'

const TaskProgress = ({ onBack, activeView = 'kanban', onTaskClick, onLeapIt }) => {
  const scrollRefs = useRef({})
  const { theme, colorTheme } = useTheme()
  const [columns, setColumns] = useState([
    {
      id: 'backlog',
      title: 'Backlog',
      tasks: [],
      color: 'dark:border-zinc-700 border-zinc-300',
    },
    {
      id: 'thisweek',
      title: 'This Week',
      tasks: [
        {
          id: 1,
          title: 'jalan jalkan',
          time: '0min',
          estimate: 'EST',
          priority: 'K',
          priorityColor: 'bg-blue-500'
        }
      ],
      color: 'dark:border-zinc-700 border-zinc-300',
      progress: { completed: 2, total: 5 }
    },
    {
      id: 'today',
      title: 'Today',
      tasks: [
        {
          id: 2,
          title: 'masak sate',
          time: '10hr',
          estimate: 'EST',
          priority: 'K',
          priorityColor: 'bg-blue-500',
          subtasks: [
            { id: 21, title: 'makan sarapasan', completed: true },
            { id: 22, title: 'makan malam', completed: true }
          ],
          notes: 'ini adalah notes'
        },
        {
          id: 3,
          title: 'edwf',
          time: '0min',
          estimate: 'EST',
          priority: 'T',
          priorityColor: 'bg-yellow-500',
          subtasks: [
            { id: 31, title: 'makan sarapasan', completed: true },
            { id: 32, title: 'makan malam', completed: true }
          ]
        }
      ],
      color: 'border-primary',
      progress: { completed: 0, total: 2 }
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        {
          id: 4,
          title: 'Test to do 2 makan enak makar',
          time: '10min',
          priority: 'K',
          priorityColor: 'bg-blue-500',
          completed: true
        },
        {
          id: 5,
          title: 'Kerjain to do app',
          time: '10hr 24min',
          priority: 'K',
          priorityColor: 'bg-blue-500',
          completed: true
        }
      ],
      color: 'dark:border-zinc-700 border-zinc-300',
      subtitle: '2 tasks this month',
      date: 'Wed, Jun 11, 2025',
      taskCount: '2 tasks'
    }
  ])

  const [newTaskInputs, setNewTaskInputs] = useState({})
  const [hoveredTask, setHoveredTask] = useState(null)
  const [expandedSubtasks, setExpandedSubtasks] = useState({})
  const [newSubtaskInputs, setNewSubtaskInputs] = useState({})
  const [expandedNotes, setExpandedNotes] = useState({})
  const [taskNotes, setTaskNotes] = useState({})
  const [openDropdowns, setOpenDropdowns] = useState({})

  const handleAddTask = (columnId, taskTitle) => {
    if (!taskTitle.trim()) return

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      time: '0min',
      estimate: 'EST',
      priority: 'T',
      priorityColor: 'bg-gray-500',
      subtasks: [],
      notes: ''
    }

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
            tasks: [...col.tasks, { ...taskToComplete, completed: true }]
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
              tasks: [...col.tasks, { ...taskToComplete, completed: false }]
            }
          }
          return col
        }))
      } else {
        // If task is in other columns, just toggle completion status
        setColumns(columns.map(col => ({
          ...col,
          tasks: col.tasks.map(task =>
            task.id === taskId ? { ...task, completed: false } : task
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
    setColumns(columns.map((col, index) => {
      if (index === sourceColumnIndex) {
        // Remove task from source column
        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
      } else if (index === targetColumnIndex) {
        // Add task to target column
        const updatedTask = {
          ...taskToMove,
          // Mark as completed if moving TO Done column
          // Mark as incomplete if moving FROM Done column to any other column
          completed: columnOrder[targetColumnIndex] === 'done'
            ? true
            : columnOrder[sourceColumnIndex] === 'done'
              ? false
              : taskToMove.completed
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

    const newSubtask = {
      id: Date.now(),
      title: subtaskTitle,
      completed: false
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
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, notes: taskNotes[taskId] || '' }
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
      const duplicatedTask = {
        ...taskToDuplicate,
        id: Date.now(),
        title: `${taskToDuplicate.title} (Copy)`,
        completed: false // Reset completion status for duplicate
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
            <div
              className="kanban-scrollbar flex-1 overflow-x-auto overflow-y-hidden"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              <div className="mx-auto flex h-full min-w-fit max-w-7xl gap-4 p-6">
              {columns.map((column) => (
          <div key={column.id} className="flex h-[calc(100vh-150px)] w-full min-w-[350px] max-w-[370px] flex-col">
            <Card className={`flex h-full flex-col border ${column.color} bg-card`}>
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-card-foreground">{column.title}</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                    <Plus className="h-5 w-5 text-zinc-700" />
                  </Button>
                </div>
                {column.progress && (
                  <span className="text-sm text-muted-foreground">
                    {column.progress.completed}/{column.progress.total} Done
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {column.progress && (
                <div className="mx-4 mb-6">
                  <Progress
                    value={(column.progress.completed / column.progress.total) * 100}
                    className="h-2 w-full"
                  />
                </div>
              )}

              {/* Done Column Header Info */}
              {column.id === 'done' && (
                <div className="px-4 pb-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">{column.subtitle}</p>
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
                            {hoveredTask === task.id ? (
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
                                <DropdownMenu>
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
                                  <DropdownMenuContent align="end" className="w-32">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDuplicateTask(task.id)
                                      }}
                                      className="text-sm"
                                    >
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteTask(task.id)
                                      }}
                                      className="text-sm text-destructive focus:text-destructive"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </motion.div>
                            ) : (
                              <div
                                key="priority"
                                className={`${task.priorityColor} h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}
                              >
                                {task.priority}
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
                                    {task.subtasks.map((subtask) => (
                                      <div
                                        key={subtask.id}
                                        className="flex items-center gap-2 py-1"
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
                                        <span
                                          className={`text-sm ${
                                            subtask.completed
                                              ? 'line-through text-muted-foreground'
                                              : 'text-foreground'
                                          }`}
                                        >
                                          {subtask.title}
                                        </span>
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
                      {expandedNotes[task.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="mt-3 border-t border-border pt-3"
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
                    className="h-12 border-dashed border-zinc-700 bg-transparent text-sm text-foreground placeholder:font-semibold placeholder:text-muted-foreground"
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
         <div className="flex h-full flex-col p-6">
           <div className="mb-6">
             <h2 className="mb-2 text-2xl font-bold text-foreground">Timeline Map</h2>
             <p className="text-muted-foreground">Visual timeline of task progress and milestones</p>
           </div>
           <div className="flex-1 rounded-lg border border-border bg-card p-6">
             <div className="relative">
               {/* Timeline line */}
               <div className="absolute bottom-0 left-8 top-0 w-0.5 bg-border"></div>
               
               {/* Timeline items */}
               <div className="space-y-8">
                 <div className="flex items-start space-x-4">
                   <div className="relative z-10 h-4 w-4 rounded-full border-2 border-background bg-blue-500"></div>
                   <div className="flex-1">
                     <div className="rounded-lg border border-border bg-background p-4">
                       <h3 className="font-semibold text-foreground">Project Started</h3>
                       <p className="text-sm text-muted-foreground">Initial setup and planning phase</p>
                       <span className="text-xs text-muted-foreground">2 days ago</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-start space-x-4">
                   <div className="relative z-10 h-4 w-4 rounded-full border-2 border-background bg-yellow-500"></div>
                   <div className="flex-1">
                     <div className="rounded-lg border border-border bg-background p-4">
                       <h3 className="font-semibold text-foreground">Development Phase</h3>
                       <p className="text-sm text-muted-foreground">Core features implementation</p>
                       <span className="text-xs text-muted-foreground">1 day ago</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-start space-x-4">
                   <div className="relative z-10 h-4 w-4 rounded-full border-2 border-background bg-green-500"></div>
                   <div className="flex-1">
                     <div className="rounded-lg border border-border bg-background p-4">
                       <h3 className="font-semibold text-foreground">Testing & Review</h3>
                       <p className="text-sm text-muted-foreground">Quality assurance and bug fixes</p>
                       <span className="text-xs text-muted-foreground">Today</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
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

export default TaskProgress