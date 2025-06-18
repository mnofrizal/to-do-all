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

const TaskProgress = ({ onBack, activeView = 'kanban', onTaskClick, onLeapIt, selectedList }) => {
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

  useEffect(() => {
    if (selectedList) {
      const fetchTasks = async () => {
        const tasks = await window.db.getTasks(selectedList.id);
        const newColumns = getDefaultTaskColumns();
        
        tasks.forEach(task => {
          let targetColumnId = task.status;
          
          // Sort subtasks by order field if they exist
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
          
          // Map task status to correct column
          if (task.status === 'done') {
            targetColumnId = 'done';
          } else if (task.status === 'backlog') {
            targetColumnId = 'backlog';
          } else if (task.scheduledForToday === true && task.status !== 'done') {
            // Only put in today if explicitly scheduled AND not completed
            targetColumnId = 'today';
          } else if (task.status === 'inprogress') {
            // Check if it's assigned to current week
            const currentWeek = getCurrentWeek();
            if (task.assignedWeek === currentWeek.weekString) {
              targetColumnId = 'thisweek';
            } else {
              targetColumnId = 'backlog'; // Old week tasks go to backlog
            }
          } else {
            targetColumnId = 'backlog'; // Default fallback
          }
          
          const column = newColumns.find(c => c.id === targetColumnId);
          if (column) {
            column.tasks.push(task);
          }
        });
        
        // Sort tasks in each column by orderInColumn
        newColumns.forEach(column => {
          column.tasks.sort((a, b) => (a.orderInColumn || 0) - (b.orderInColumn || 0));
        });
        
        setColumns(newColumns);
      };
      fetchTasks();
    }
  }, [selectedList]);

  // Check for expired tasks on component mount and every minute
  useEffect(() => {
    const checkExpiredTasks = async () => {
      setColumns(prevColumns => {
        if (!Array.isArray(prevColumns)) {
          return getDefaultTaskColumns();
        }
        // Since moveExpiredTasksToBacklog is async, we'll handle it differently
        // For now, just return the columns as-is to prevent the error
        return prevColumns;
      });
    };

    // Check immediately on mount
    checkExpiredTasks();

    // Set up interval to check every minute
    const interval = setInterval(checkExpiredTasks, 60000);

    return () => clearInterval(interval);
  }, []); // Remove columns dependency to prevent infinite loop

  // Calculate progress dynamically without causing re-renders
  const getColumnProgress = (columnId) => {
    if (!Array.isArray(columns)) return null;
    
    if (columnId === 'thisweek') {
      return calculateThisWeekProgress(columns);
    } else if (columnId === 'today') {
      return calculateTodayProgress(columns);
    }
    return null;
  };

  const handleAddTask = async (columnId, taskTitle) => {
    if (!taskTitle.trim() || !selectedList) return;

    // Get the current column to determine the order
    const currentColumn = columns.find(col => col.id === columnId);
    const orderInColumn = currentColumn ? currentColumn.tasks.length : 0;

    const newTaskData = {
      ...createNewTask(taskTitle, columnId, selectedList.id),
      orderInColumn
    };
    const newTask = await window.db.createTask(newTaskData);

    console.log('Created new task:', newTask, 'for column:', columnId);

    const newColumns = Array.isArray(columns) ? columns.map(col =>
      col.id === columnId
        ? { ...col, tasks: [...col.tasks, { ...newTask, orderInColumn }] }
        : col
    ) : getDefaultTaskColumns();
    
    console.log('Updated columns:', newColumns);
    setColumns(newColumns);

    setNewTaskInputs({ ...newTaskInputs, [columnId]: '' });

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

    setColumns(Array.isArray(columns) ? columns.map(col =>
      col.id === actualTargetColumn
        ? { ...col, tasks: [...col.tasks, testTask] }
        : col
    ) : getDefaultTaskColumns())

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

  const handleCompleteTask = async (taskId) => {
    let taskToComplete = null;
    let sourceColumnId = null;

    if (Array.isArray(columns)) {
      columns.forEach(col => {
        const task = col.tasks.find(t => t.id === taskId);
        if (task) {
          taskToComplete = task;
          sourceColumnId = col.id;
        }
      });
    }

    if (!taskToComplete) return;

    const now = new Date().toISOString();
    const isCompleted = taskToComplete.status === 'done';
    const status = isCompleted ? 'inprogress' : 'done';
    const completedAt = isCompleted ? null : now;

    await window.db.updateTask(taskId, { status, completedAt, updatedAt: now });

    const newColumns = Array.isArray(columns) ? columns.map(col => {
      if (col.id === sourceColumnId) {
        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
      }
      if (col.id === status) {
        return { ...col, tasks: [...col.tasks, { ...taskToComplete, status, completedAt, updatedAt: now }] };
      }
      return col;
    }) : getDefaultTaskColumns();
    setColumns(newColumns);
  };

  const handleMoveTask = async (taskId, direction) => {
    const columnOrder = ['backlog', 'thisweek', 'today', 'done']
    let sourceColumnIndex = -1
    let sourceColumn = null
    let taskToMove = null

    // Find the task and its current column
    if (Array.isArray(columns)) {
      columns.forEach((col, index) => {
        const task = col.tasks.find(t => t.id === taskId)
        if (task) {
          sourceColumnIndex = index
          sourceColumn = col
          taskToMove = task
        }
      })
    }

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
    
    // Update the database first
    const targetColumnId = columnOrder[targetColumnIndex]
    const sourceColumnId = columnOrder[sourceColumnIndex]
    
    console.log('Moving task from', sourceColumnId, 'to', targetColumnId)
    
    let updatedTask = { ...taskToMove }
    
    // Special handling for different movements
    if (sourceColumnId === 'backlog' && targetColumnId === 'thisweek') {
      // Moving from backlog to this week: update to current week
      updatedTask = updateTaskToCurrentWeek(updatedTask)
    } else if (sourceColumnId === 'today' && targetColumnId === 'thisweek') {
      // Moving from today to this week: unschedule and update to current week
      console.log('Moving from today to thisweek - unscheduling task')
      updatedTask = {
        ...updatedTask,
        scheduledForToday: false,
        todayScheduledAt: null,
        status: 'inprogress',
        updatedAt: now
      }
      // Also update to current week
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
      console.log('Moving from today to', targetColumnId, '- unscheduling task')
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
        status: 'done',
        completedAt: now,
        updatedAt: now
      }
    } else if (sourceColumnId === 'done') {
      // Moving from done to other columns
      updatedTask = {
        ...updatedTask,
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

    // Save to database
    const updateData = {
      status: updatedTask.status,
      scheduledForToday: updatedTask.scheduledForToday || false,
      todayScheduledAt: updatedTask.todayScheduledAt,
      completedAt: updatedTask.completedAt,
      updatedAt: updatedTask.updatedAt,
      weekNumber: updatedTask.weekNumber,
      weekYear: updatedTask.weekYear,
      assignedWeek: updatedTask.assignedWeek,
      deadline: updatedTask.deadline,
      orderInColumn: updatedTask.orderInColumn || 0
    }

    console.log('Moving task from', sourceColumnId, 'to', targetColumnId, 'with updateData:', updateData)

    try {
      await window.db.updateTask(taskId, updateData)
      
      // Update local state only after successful database update
      setColumns(Array.isArray(columns) ? columns.map((col, index) => {
        if (index === sourceColumnIndex) {
          // Remove task from source column and update order of remaining tasks
          const filteredTasks = col.tasks.filter(t => t.id !== taskId);
          const reorderedTasks = filteredTasks.map((task, idx) => ({
            ...task,
            orderInColumn: idx
          }));
          return { ...col, tasks: reorderedTasks }
        } else if (index === targetColumnIndex) {
          // Add task to target column at the end
          const newOrder = col.tasks.length;
          const taskWithOrder = { ...updatedTask, orderInColumn: newOrder };
          return { ...col, tasks: [...col.tasks, taskWithOrder] }
        }
        return col
      }) : getDefaultTaskColumns())
    } catch (error) {
      console.error('Failed to update task:', error)
      // Optionally show an error message to the user
    }
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

  const handleAddSubtask = async (taskId, subtaskTitle) => {
    if (!subtaskTitle.trim()) return

    // Find the task to get current subtask count for ordering
    const currentTask = Array.isArray(columns) ? columns.flatMap(col => col.tasks).find(t => t.id === taskId) : null
    const currentSubtaskCount = currentTask?.subtasks?.length || 0

    const newSubtaskData = {
      title: subtaskTitle,
      completed: false,
      order: currentSubtaskCount,
      taskId: taskId
    }

    try {
      const newSubtask = await window.db.createSubtask(newSubtaskData)

      setColumns(Array.isArray(columns) ? columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task => {
          if (task.id === taskId) {
            const updatedSubtasks = [...(task.subtasks || []), newSubtask]
            // Sort subtasks by order to maintain correct display order
            updatedSubtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
            return { ...task, subtasks: updatedSubtasks }
          }
          return task
        })
      })) : getDefaultTaskColumns())

      setNewSubtaskInputs({ ...newSubtaskInputs, [taskId]: '' })
    } catch (error) {
      console.error('Failed to create subtask:', error)
    }
  }

  const handleToggleSubtask = async (taskId, subtaskId) => {
    // Find the current subtask to get its completion status
    const currentTask = Array.isArray(columns) ? columns.flatMap(col => col.tasks).find(t => t.id === taskId) : null
    const currentSubtask = currentTask?.subtasks?.find(st => st.id === subtaskId)
    
    if (!currentSubtask) return

    const newCompleted = !currentSubtask.completed

    try {
      await window.db.updateSubtask(subtaskId, { completed: newCompleted })

      setColumns(columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task => {
          if (task.id === taskId) {
            const updatedSubtasks = task.subtasks?.map(subtask =>
              subtask.id === subtaskId
                ? { ...subtask, completed: newCompleted }
                : subtask
            ) || []
            // Sort subtasks by order to maintain correct display order
            updatedSubtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
            return { ...task, subtasks: updatedSubtasks }
          }
          return task
        })
      })))
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
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
      const task = Array.isArray(columns) ? columns.flatMap(col => col.tasks).find(t => t.id === taskId) : null
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

  const handleSaveNotes = async (taskId) => {
    const now = new Date().toISOString()
    
    try {
      await window.db.updateTask(taskId, {
        notes: taskNotes[taskId] || '',
        updatedAt: now
      })
      
      setColumns(Array.isArray(columns) ? columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task =>
          task.id === taskId
            ? { ...task, notes: taskNotes[taskId] || '', updatedAt: now }
            : task
        )
      })) : getDefaultTaskColumns())
      setExpandedNotes(prev => ({ ...prev, [taskId]: false }))
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }

  const handleDeleteNotes = async (taskId) => {
    const now = new Date().toISOString()
    
    try {
      await window.db.updateTask(taskId, {
        notes: '',
        updatedAt: now
      })
      
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
    } catch (error) {
      console.error('Failed to delete notes:', error)
    }
  }

  // Dropdown and task management handlers
  const handleToggleDropdown = (taskId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await window.db.deleteTask(taskId)
      
      setColumns(columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(task => task.id !== taskId)
      })))
      setOpenDropdowns(prev => ({ ...prev, [taskId]: false }))
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleDuplicateTask = async (taskId) => {
    try {
      const taskToDuplicate = columns.flatMap(col => col.tasks).find(t => t.id === taskId)
      if (!taskToDuplicate) return
      
      const now = new Date().toISOString()
      const currentWeek = getCurrentWeek()
      
      // Find the column and calculate order
      const sourceColumn = columns.find(col => col.tasks.some(t => t.id === taskId))
      const orderInColumn = sourceColumn ? sourceColumn.tasks.length : 0
      
      const duplicatedTaskData = {
        title: `${taskToDuplicate.title} (Copy)`,
        status: 'inprogress', // Reset status
        priority: taskToDuplicate.priority || 'medium',
        notes: taskToDuplicate.notes || null, // Copy notes if they exist
        timeSpent: 0, // Reset time spent
        estimatedTime: taskToDuplicate.estimatedTime || 60,
        completedAt: null, // Reset completion timestamp
        deadline: taskToDuplicate.deadline || null,
        weekNumber: currentWeek.weekNumber, // Store in database
        weekYear: currentWeek.year, // Store in database
        assignedWeek: currentWeek.weekString,
        scheduledForToday: false, // Reset scheduling
        todayScheduledAt: null,
        orderInColumn: orderInColumn,
        listId: taskToDuplicate.listId || selectedList?.id, // Include the listId
        createdAt: now,
        updatedAt: now
      }
      
      const duplicatedTask = await window.db.createTask(duplicatedTaskData)
      
      // Duplicate subtasks if they exist
      if (taskToDuplicate.subtasks && taskToDuplicate.subtasks.length > 0) {
        const duplicatedSubtasks = []
        for (let i = 0; i < taskToDuplicate.subtasks.length; i++) {
          const originalSubtask = taskToDuplicate.subtasks[i]
          const newSubtaskData = {
            title: originalSubtask.title,
            completed: false, // Reset completion status for duplicated subtasks
            order: i,
            taskId: duplicatedTask.id
          }
          const duplicatedSubtask = await window.db.createSubtask(newSubtaskData)
          duplicatedSubtasks.push(duplicatedSubtask)
        }
        // Add subtasks to the duplicated task object
        duplicatedTask.subtasks = duplicatedSubtasks
      }
      
      // Add to the same column as original task
      setColumns(columns.map(col => {
        if (col.tasks.some(t => t.id === taskId)) {
          return { ...col, tasks: [...col.tasks, duplicatedTask] }
        }
        return col
      }))
      
      setOpenDropdowns(prev => ({ ...prev, [taskId]: false }))
    } catch (error) {
      console.error('Failed to duplicate task:', error)
      setOpenDropdowns(prev => ({ ...prev, [taskId]: false }))
    }
  }

  // Subtask management handlers
  const handleMoveSubtask = async (taskId, subtaskId, direction) => {
    try {
      const task = columns.flatMap(col => col.tasks).find(t => t.id === taskId)
      if (!task || !task.subtasks) return
      
      const subtasks = [...task.subtasks]
      const currentIndex = subtasks.findIndex(st => st.id === subtaskId)
      
      if (direction === 'up' && currentIndex > 0) {
        [subtasks[currentIndex], subtasks[currentIndex - 1]] = [subtasks[currentIndex - 1], subtasks[currentIndex]]
      } else if (direction === 'down' && currentIndex < subtasks.length - 1) {
        [subtasks[currentIndex], subtasks[currentIndex + 1]] = [subtasks[currentIndex + 1], subtasks[currentIndex]]
      } else {
        return // No movement needed
      }
      
      // Update order property in the subtask objects AND save to database
      for (let i = 0; i < subtasks.length; i++) {
        subtasks[i].order = i // Update the order property in the object
        await window.db.updateSubtask(subtasks[i].id, { order: i })
      }
      
      setColumns(columns.map(col => ({
        ...col,
        tasks: col.tasks.map(t => {
          if (t.id === taskId) {
            // Sort subtasks by order to maintain correct display order
            const sortedSubtasks = [...subtasks].sort((a, b) => (a.order || 0) - (b.order || 0))
            return { ...t, subtasks: sortedSubtasks }
          }
          return t
        })
      })))
    } catch (error) {
      console.error('Failed to move subtask:', error)
    }
  }

  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      await window.db.deleteSubtask(subtaskId)
      
      setColumns(columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task => {
          if (task.id === taskId) {
            const filteredSubtasks = task.subtasks?.filter(st => st.id !== subtaskId) || []
            // Sort subtasks by order to maintain correct display order
            filteredSubtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
            return { ...task, subtasks: filteredSubtasks }
          }
          return task
        })
      })))
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    }
  }

  const handleEditSubtask = (taskId, subtaskId, title) => {
    setEditingSubtask(`${taskId}-${subtaskId}`)
    setEditingSubtaskValue(title)
  }

  const handleSaveSubtaskEdit = async (taskId, subtaskId) => {
    if (!editingSubtaskValue.trim()) return
    
    try {
      await window.db.updateSubtask(subtaskId, { title: editingSubtaskValue.trim() })
      
      setColumns(columns.map(col => ({
        ...col,
        tasks: col.tasks.map(task => {
          if (task.id === taskId) {
            const updatedSubtasks = task.subtasks?.map(subtask =>
              subtask.id === subtaskId
                ? { ...subtask, title: editingSubtaskValue.trim() }
                : subtask
            ) || []
            // Sort subtasks by order to maintain correct display order
            updatedSubtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
            return { ...task, subtasks: updatedSubtasks }
          }
          return task
        })
      })))
      
      setEditingSubtask(null)
      setEditingSubtaskValue('')
    } catch (error) {
      console.error('Failed to update subtask title:', error)
    }
  }

  // Task title editing handlers
  const handleEditTask = (taskId, title) => {
    setEditingTask(taskId)
    setEditingTaskValue(title)
  }

  const handleSaveTaskEdit = async (taskId) => {
    if (!editingTaskValue.trim()) return
    
    const now = new Date().toISOString()
    
    try {
      await window.db.updateTask(taskId, {
        title: editingTaskValue.trim(),
        updatedAt: now
      })
      
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
    } catch (error) {
      console.error('Failed to update task title:', error)
    }
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
  const handleChangePriority = async (taskId, newPriority) => {
    const now = new Date().toISOString()
    
    try {
      await window.db.updateTask(taskId, {
        priority: newPriority,
        updatedAt: now
      })
      
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
    } catch (error) {
      console.error('Failed to update task priority:', error)
    }
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

  const handleDragOver = async (event) => {
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
    
    const taskToMove = activeItems[activeIndex]
    const taskWithOrder = { ...taskToMove, orderInColumn: newIndex }
    const updatedTask = await updateTaskForColumn(taskWithOrder, overContainer)
    
    setColumns(columns.map(col => {
      if (col.id === activeContainer) {
        // Remove task and reorder remaining tasks
        const filteredTasks = col.tasks.filter(task => task.id !== activeId)
        const reorderedTasks = filteredTasks.map((task, idx) => ({
          ...task,
          orderInColumn: idx
        }))
        return {
          ...col,
          tasks: reorderedTasks
        }
      } else if (col.id === overContainer) {
        const newTasks = [...col.tasks]
        newTasks.splice(newIndex, 0, { ...updatedTask, orderInColumn: newIndex })
        // Reorder all tasks in the target column
        const reorderedTasks = newTasks.map((task, idx) => ({
          ...task,
          orderInColumn: idx
        }))
        return {
          ...col,
          tasks: reorderedTasks
        }
      }
      return col
    }))
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
              const reorderedTasks = arrayMove(col.tasks, activeIndex, overIndex)
              // Update orderInColumn for all tasks and save to database
              const tasksWithOrder = reorderedTasks.map((task, idx) => {
                const updatedTask = { ...task, orderInColumn: idx }
                // Save order to database
                window.db.updateTask(task.id, { orderInColumn: idx }).catch(error => {
                  console.error('Failed to update task order:', error)
                })
                return updatedTask
              })
              return {
                ...col,
                tasks: tasksWithOrder
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
  const updateTaskForColumn = async (task, targetColumnId) => {
    const now = new Date().toISOString()
    const currentWeek = getCurrentWeek()
    
    let updatedTask = { ...task }
    
    // Apply the same logic as handleMoveTask
    if (targetColumnId === 'thisweek') {
      updatedTask = updateTaskToCurrentWeek(updatedTask)
      // Reset completion status when moving to thisweek
      // Also ensure task is unscheduled from today
      updatedTask = {
        ...updatedTask,
        status: 'inprogress',
        scheduledForToday: false,
        todayScheduledAt: null,
        completedAt: null,
        updatedAt: now
      }
    } else if (targetColumnId === 'today') {
      updatedTask = {
        ...updatedTask,
        scheduledForToday: true,
        todayScheduledAt: now,
        status: 'inprogress',
        completedAt: null,
        updatedAt: now
      }
    } else if (targetColumnId === 'done') {
      updatedTask = {
        ...updatedTask,
        status: 'done',
        completedAt: now,
        updatedAt: now
      }
    } else if (targetColumnId === 'backlog') {
      updatedTask = {
        ...updatedTask,
        scheduledForToday: false,
        todayScheduledAt: null,
        status: 'backlog',
        completedAt: null,
        updatedAt: now
      }
    } else {
      updatedTask = {
        ...updatedTask,
        status: 'inprogress',
        completedAt: null,
        updatedAt: now
      }
    }

    // Save to database
    const updateData = {
      status: updatedTask.status,
      scheduledForToday: updatedTask.scheduledForToday || false,
      todayScheduledAt: updatedTask.todayScheduledAt,
      completedAt: updatedTask.completedAt,
      updatedAt: updatedTask.updatedAt,
      weekNumber: updatedTask.weekNumber,
      weekYear: updatedTask.weekYear,
      assignedWeek: updatedTask.assignedWeek,
      deadline: updatedTask.deadline,
      orderInColumn: updatedTask.orderInColumn || 0
    }

    console.log('Drag & Drop: Moving task to', targetColumnId, 'with updateData:', updateData)

    try {
      await window.db.updateTask(task.id, updateData)
    } catch (error) {
      console.error('Failed to update task in database:', error)
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
                {Array.isArray(columns) && columns.map((column) => (
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