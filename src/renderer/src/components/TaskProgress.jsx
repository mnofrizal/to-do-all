import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Zap, CheckCircle, Menu, FileText, ChevronLeft, ChevronRight, MoreHorizontal, MoreVertical, CheckCircle2, ChevronDown, ChevronUp, X, Bold, Italic, Strikethrough, List, ListOrdered, Undo, Redo, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useTheme } from '../contexts/ThemeContext'
import TaskFlowTimeline from './TaskFlowTimeline'
import ApiTestPanel from './ApiTestPanel' // Import the new component
import DayWithLabel from './DayWithLabel' // Import the new component
import KanbanColumn from './KanbanColumn' // Import the new component
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
  const [editingTask, setEditingTask] = useState(null)
  const [editingTaskValue, setEditingTaskValue] = useState('')
  
  // Drag and drop state
  const [activeId, setActiveId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  
  // Testing panel state
  const [testTaskName, setTestTaskName] = useState('')
  const [testTaskDate, setTestTaskDate] = useState('')
  const [testTargetColumn, setTestTargetColumn] = useState('thisweek')

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDeleteNotes = (taskId) => {
    const now = new Date().toISOString()
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, notes: '', updatedAt: now }
          : task
      )
    })))
    // Clear from local state too
    setTaskNotes(prev => ({
      ...prev,
      [taskId]: ''
    }))
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

  // Task title editing handlers
  const handleEditTask = (taskId, title) => {
    setEditingTask(taskId)
    setEditingTaskValue(title)
  }

  const handleSaveTaskEdit = (taskId) => {
    if (!editingTaskValue.trim()) return
    
    const now = new Date().toISOString()
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.map(task =>
        task.id === taskId
          ? { ...task, title: editingTaskValue.trim(), updatedAt: now }
          : task
      )
    })))
    
    setEditingTask(null)
    setEditingTaskValue('')
  }

  const handleCancelTaskEdit = () => {
    setEditingTask(null)
    setEditingTaskValue('')
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

  // Drag and drop handlers
  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    
    // Find the task being dragged
    const task = columns.flatMap(col => col.tasks).find(t => t.id === active.id)
    setDraggedTask(task)
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeId = active.id
    const overId = over.id
    
    // Find the containers
    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)
    
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return
    }
    
    // Move task between columns
    setColumns(columns => {
      const activeItems = columns.find(col => col.id === activeContainer)?.tasks || []
      const overItems = columns.find(col => col.id === overContainer)?.tasks || []
      
      const activeIndex = activeItems.findIndex(item => item.id === activeId)
      const overIndex = overItems.findIndex(item => item.id === overId)
      
      let newIndex
      if (overId in columns.reduce((acc, col) => ({ ...acc, [col.id]: col }), {})) {
        // Dropping on a column
        newIndex = overItems.length + 1
      } else {
        // Dropping on a task
        const isBelowOverItem = over && overIndex < overItems.length - 1
        const modifier = isBelowOverItem ? 1 : 0
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
      }
      
      return columns.map(col => {
        if (col.id === activeContainer) {
          return {
            ...col,
            tasks: col.tasks.filter(task => task.id !== activeId)
          }
        } else if (col.id === overContainer) {
          const taskToMove = activeItems[activeIndex]
          const updatedTask = updateTaskForColumn(taskToMove, overContainer)
          const newTasks = [...col.tasks]
          newTasks.splice(newIndex, 0, updatedTask)
          return {
            ...col,
            tasks: newTasks
          }
        }
        return col
      })
    })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      setDraggedTask(null)
      return
    }
    
    const activeId = active.id
    const overId = over.id
    
    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)
    
    if (!activeContainer || !overContainer) {
      setActiveId(null)
      setDraggedTask(null)
      return
    }
    
    if (activeContainer === overContainer) {
      // Reordering within the same column
      setColumns(columns => {
        return columns.map(col => {
          if (col.id === activeContainer) {
            const activeIndex = col.tasks.findIndex(task => task.id === activeId)
            const overIndex = col.tasks.findIndex(task => task.id === overId)
            
            if (activeIndex !== overIndex) {
              return {
                ...col,
                tasks: arrayMove(col.tasks, activeIndex, overIndex)
              }
            }
          }
          return col
        })
      })
    }
    
    setActiveId(null)
    setDraggedTask(null)
  }

  // Helper function to find which container a task belongs to
  const findContainer = (id) => {
    // Check if it's a column id
    if (columns.some(col => col.id === id)) {
      return id
    }
    
    // Find which column contains this task
    return columns.find(col => col.tasks.some(task => task.id === id))?.id
  }

  // Helper function to update task properties when moving between columns
  const updateTaskForColumn = (task, targetColumnId) => {
    const now = new Date().toISOString()
    const currentWeek = getCurrentWeek()
    
    let updatedTask = { ...task }
    
    // Apply the same logic as handleMoveTask
    if (targetColumnId === 'thisweek') {
      updatedTask = updateTaskToCurrentWeek(updatedTask)
      // Reset completion status when moving to thisweek
      updatedTask = {
        ...updatedTask,
        completed: false,
        status: 'inprogress',
        completedAt: null,
        updatedAt: now
      }
    } else if (targetColumnId === 'today') {
      updatedTask = {
        ...updatedTask,
        scheduledForToday: true,
        todayScheduledAt: now,
        completed: false, // Reset completion status
        status: 'inprogress',
        completedAt: null, // Reset completion timestamp
        updatedAt: now
      }
    } else if (targetColumnId === 'done') {
      updatedTask = {
        ...updatedTask,
        completed: true,
        status: 'done',
        completedAt: now,
        updatedAt: now
      }
    } else if (targetColumnId === 'backlog') {
      updatedTask = {
        ...updatedTask,
        scheduledForToday: false,
        todayScheduledAt: null,
        completed: false,
        status: 'backlog',
        completedAt: null,
        updatedAt: now
      }
    } else {
      updatedTask = {
        ...updatedTask,
        completed: false, // Reset completion status for any other column
        status: 'inprogress',
        completedAt: null, // Reset completion timestamp
        updatedAt: now
      }
    }
    
    return updatedTask
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
          >
            <div className="flex h-[calc(100vh-105px)] flex-col">
              {/* Testing Panel DONT REMOVE THIS WILL USED LATER*/}
              {/* <ApiTestPanel
                testTaskName={testTaskName}
                setTestTaskName={setTestTaskName}
                testTaskDate={testTaskDate}
                setTestTaskDate={setTestTaskDate}
                testTargetColumn={testTargetColumn}
                setTestTargetColumn={setTestTargetColumn}
                handleCreateTestTask={handleCreateTestTask}
              /> */}

              <div
                className="kanban-scrollbar flex-1 overflow-x-auto overflow-y-hidden pt-6"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                <div className="mx-auto flex h-full min-w-fit max-w-7xl gap-4 px-6 pb-4">
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    scrollRefs={scrollRefs}
                    hoveredTask={hoveredTask}
                    setHoveredTask={setHoveredTask}
                    dropdownOpen={dropdownOpen}
                    setDropdownOpen={setDropdownOpen}
                    handleCompleteTask={handleCompleteTask}
                    handleToggleSubtasks={handleToggleSubtasks}
                    handleShowSubtaskInput={handleShowSubtaskInput}
                    handleToggleNotes={handleToggleNotes}
                    handleMoveTask={handleMoveTask}
                    handleDuplicateTask={handleDuplicateTask}
                    handleChangePriority={handleChangePriority}
                    handleDeleteTask={handleDeleteTask}
                    getPriorityColor={getPriorityColor}
                    taskNotes={taskNotes}
                    handleNotesChange={handleNotesChange}
                    handleSaveNotes={handleSaveNotes}
                    handleDeleteNotes={handleDeleteNotes}
                    expandedNotes={expandedNotes}
                    setExpandedNotes={setExpandedNotes}
                    expandedSubtasks={expandedSubtasks}
                    setExpandedSubtasks={setExpandedSubtasks}
                    newSubtaskInputs={newSubtaskInputs}
                    handleSubtaskInputChange={handleSubtaskInputChange}
                    handleSubtaskKeyPress={handleSubtaskKeyPress}
                    handleAddSubtask={handleAddSubtask}
                    editingSubtask={editingSubtask}
                    setEditingSubtask={setEditingSubtask}
                    editingSubtaskValue={editingSubtaskValue}
                    setEditingSubtaskValue={setEditingSubtaskValue}
                    handleSaveSubtaskEdit={handleSaveSubtaskEdit}
                    handleCancelSubtaskEdit={handleCancelSubtaskEdit}
                    editingTask={editingTask}
                    setEditingTask={setEditingTask}
                    editingTaskValue={editingTaskValue}
                    setEditingTaskValue={setEditingTaskValue}
                    handleEditTask={handleEditTask}
                    handleSaveTaskEdit={handleSaveTaskEdit}
                    handleCancelTaskEdit={handleCancelTaskEdit}
                    hoveredSubtask={hoveredSubtask}
                    setHoveredSubtask={setHoveredSubtask}
                    handleToggleSubtask={handleToggleSubtask}
                    handleMoveSubtask={handleMoveSubtask} // This is for main task, subtask one is named the same in KanbanColumn
                    handleDeleteSubtask={handleDeleteSubtask} // This is for main task, subtask one is named the same in KanbanColumn
                    newTaskInputs={newTaskInputs}
                    handleInputChange={handleInputChange}
                    handleKeyPress={handleKeyPress}
                    getColumnProgress={getColumnProgress}
                    handleLeapItClick={handleLeapItClick}
                  />
                ))}
                 </div>
               </div>
             </div>
             
             <DragOverlay>
               {activeId && draggedTask ? (
                 <div className="rotate-3 transform opacity-80">
                   <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                     <div className="font-medium text-foreground">{draggedTask.title}</div>
                     {draggedTask.taskGroup && (
                       <div className="mt-1 text-xs text-muted-foreground">
                         {draggedTask.taskGroup.name}
                       </div>
                     )}
                   </div>
                 </div>
               ) : null}
             </DragOverlay>
           </DndContext>
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
         <div className="flex h-full px-0 pt-6">
           
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

export default TaskProgress