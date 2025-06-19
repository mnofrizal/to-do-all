import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Home, Maximize2, ChevronDown, Minimize2, CheckCircle2, SkipForward, Coffee } from 'lucide-react'
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

const FloatingTodayWindow = ({
  onClose,
  onFocusMode,
  columns = null,
  onTaskUpdate,
  selectedList, // Add selectedList prop for database operations
  // New shared state props
  activeTask,
  timer,
  isTimerRunning,
  onActivateTask,
  onToggleTimer,
  onCompleteTask,
  onSkipTask
}) => {
  // Initialize with data from taskData or get default columns
  const [taskColumns, setTaskColumns] = useState(columns || getDefaultTaskColumns())
  const [newTaskInput, setNewTaskInput] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  
  // Completion celebration modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completedTaskTitle, setCompletedTaskTitle] = useState('')
  const [taskCompletionTime, setTaskCompletionTime] = useState(0)
  
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
  
  // Load tasks from database when selectedList changes
  useEffect(() => {
    if (selectedList) {
      const fetchTasks = async () => {
        try {
          const tasks = await window.db.getTasks(selectedList.id);
          const newColumns = getDefaultTaskColumns();
          
          tasks.forEach(task => {
            let targetColumnId = task.status;
            
            // Sort subtasks by order field if they exist
            if (task.subtasks && task.subtasks.length > 0) {
              task.subtasks.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
            
            // Map task status to correct column (same logic as TaskProgress)
            if (task.status === 'done') {
              targetColumnId = 'done';
            } else if (task.status === 'backlog') {
              targetColumnId = 'backlog';
            } else if (task.scheduledForToday === true && task.status !== 'done') {
              targetColumnId = 'today';
            } else if (task.status === 'inprogress') {
              const currentWeek = getCurrentWeek();
              if (task.assignedWeek === currentWeek.weekString) {
                targetColumnId = 'thisweek';
              } else {
                targetColumnId = 'backlog';
              }
            } else {
              targetColumnId = 'backlog';
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
          
          setTaskColumns(newColumns);
        } catch (error) {
          console.error('Failed to load tasks:', error);
        }
      };
      fetchTasks();
    }
  }, [selectedList]);

  // Update columns when prop changes (fallback for when passed from parent)
  useEffect(() => {
    if (columns && !selectedList) {
      setTaskColumns(columns)
    }
  }, [columns, selectedList])
  
  // Get today's tasks from the Today column (exclude completed tasks)
  const getTodayTasks = () => {
    const todayColumn = taskColumns.find(col => col.id === 'today')
    const todayTasks = todayColumn?.tasks.filter(task => !task.completed) || []
    
    // Sort tasks: active task always at the top, then by orderInColumn (database order)
    return todayTasks.sort((a, b) => {
      // Active task always comes first
      if (a.id === activeTask?.id) return -1
      if (b.id === activeTask?.id) return 1
      // For non-active tasks, sort by orderInColumn (respects skip-to-bottom behavior)
      return (a.orderInColumn || 0) - (b.orderInColumn || 0)
    })
  }
  
  const tasks = getTodayTasks()

  // Initialize active task if none set or current active task is not in today's tasks
  useEffect(() => {
    if (tasks.length > 0) {
      // Check if current activeTask is still in today's tasks
      const isActiveTaskInToday = activeTask && tasks.some(task => task.id === activeTask.id)
      
      if (!activeTask || !isActiveTaskInToday) {
        // Activate first available task
        const firstTask = tasks[0]
        onActivateTask(firstTask)
      }
    } else if (activeTask) {
      // No today tasks available, clear active task
      onActivateTask(null)
    }
  }, [tasks.length, activeTask, onActivateTask])

  // Handle task activation with position swap
  const handleActivateTask = async (task) => {
    try {
      // Swap positions between the currently active task and the newly selected task
      if (selectedList && task.id !== activeTask?.id && activeTask) {
        const todayColumn = taskColumns.find(col => col.id === 'today')
        if (todayColumn) {
          // Find the current positions
          const currentActiveTask = todayColumn.tasks.find(t => t.id === activeTask.id)
          const newActiveTask = todayColumn.tasks.find(t => t.id === task.id)
          
          if (currentActiveTask && newActiveTask) {
            const currentActiveOrder = currentActiveTask.orderInColumn || 0
            const newActiveOrder = newActiveTask.orderInColumn || 0
            
            // Swap the orderInColumn values in database
            await window.db.updateTask(activeTask.id, {
              orderInColumn: newActiveOrder,
              updatedAt: new Date().toISOString()
            })
            
            await window.db.updateTask(task.id, {
              orderInColumn: currentActiveOrder,
              updatedAt: new Date().toISOString()
            })

            // Update local state to reflect the position swap
            const updatedColumns = taskColumns.map(col => {
              if (col.id === 'today') {
                const updatedTasks = col.tasks.map(t => {
                  if (t.id === activeTask.id) {
                    return { ...t, orderInColumn: newActiveOrder }
                  } else if (t.id === task.id) {
                    return { ...t, orderInColumn: currentActiveOrder }
                  }
                  return t
                })
                // Sort tasks by orderInColumn to reflect new order
                updatedTasks.sort((a, b) => (a.orderInColumn || 0) - (b.orderInColumn || 0))
                return { ...col, tasks: updatedTasks }
              }
              return col
            })

            setTaskColumns(updatedColumns)
            if (onTaskUpdate) onTaskUpdate(updatedColumns)
          }
        }
      }
    } catch (error) {
      console.error('Failed to swap task positions on activation:', error)
    }

    // Call the parent's activate handler
    onActivateTask(task)
  }

  // Helper function to move to next task
  const moveToNextTask = () => {
    if (tasks.length === 0) return
    
    // Find the next task based on current visual order (after any swaps)
    const currentTasks = getTodayTasks() // This gets the current sorted order
    const currentIndex = currentTasks.findIndex(task => task.id === activeTask?.id)
    
    if (currentIndex !== -1 && currentIndex + 1 < currentTasks.length) {
      // Move to the next task in the current visual order
      onActivateTask(currentTasks[currentIndex + 1])
    } else if (currentTasks.length > 1) {
      // If we're at the end, wrap to the first task (excluding the current active task)
      // After skip, the skipped task will be at the bottom, so activate the first task
      const nextTask = currentTasks.find(task => task.id !== activeTask?.id)
      if (nextTask) {
        onActivateTask(nextTask)
      }
    } else {
      // No more tasks, deactivate
      onActivateTask(null)
    }
  }

  const handleSkipTask = async () => {
    if (!activeTask || !selectedList) return
    
    // Store the current active task ID and find the next task BEFORE making changes
    const currentActiveTaskId = activeTask.id
    
    // Get the current tasks directly from taskColumns to ensure we have the latest state
    const todayColumn = taskColumns.find(col => col.id === 'today')
    const availableTasks = todayColumn?.tasks.filter(task => !task.completed) || []
    
    // Sort by orderInColumn to get the current database order (this is the actual order after swaps)
    const sortedByOrder = [...availableTasks].sort((a, b) => (a.orderInColumn || 0) - (b.orderInColumn || 0))
    
    // Find the current active task's position in the database order
    const currentIndexInOrder = sortedByOrder.findIndex(task => task.id === currentActiveTaskId)
    
    // Find the next task based on database order (the task that comes BEFORE in the database order)
    let nextTask = null
    if (currentIndexInOrder > 0) {
      // Get the task that comes before in the database order
      nextTask = sortedByOrder[currentIndexInOrder - 1]
    } else if (sortedByOrder.length > 1) {
      // If we're at the beginning, get the last task in database order
      nextTask = sortedByOrder[sortedByOrder.length - 1]
    }
    
    console.log('Skip Debug:', {
      currentActiveTaskId,
      sortedByOrder: sortedByOrder.map(t => ({ id: t.id, title: t.title, orderInColumn: t.orderInColumn })),
      currentIndexInOrder,
      nextTask: nextTask ? { id: nextTask.id, title: nextTask.title, orderInColumn: nextTask.orderInColumn } : null
    })
    
    try {
      // Move the skipped task to the bottom of the today list by updating its orderInColumn
      const todayColumn = taskColumns.find(col => col.id === 'today')
      if (todayColumn) {
        // Find the highest orderInColumn value in today's tasks
        const maxOrder = Math.max(...todayColumn.tasks.map(t => t.orderInColumn || 0), 0)
        
        // Update the skipped task's orderInColumn to be at the bottom
        await window.db.updateTask(currentActiveTaskId, {
          orderInColumn: maxOrder + 1,
          updatedAt: new Date().toISOString()
        })
        
        // Update local state to reflect the new order
        const updatedColumns = taskColumns.map(col => {
          if (col.id === 'today') {
            const updatedTasks = col.tasks.map(task =>
              task.id === currentActiveTaskId
                ? { ...task, orderInColumn: maxOrder + 1 }
                : task
            )
            // Sort tasks by orderInColumn to reflect new order
            updatedTasks.sort((a, b) => (a.orderInColumn || 0) - (b.orderInColumn || 0))
            return { ...col, tasks: updatedTasks }
          }
          return col
        })
        
        setTaskColumns(updatedColumns)
        if (onTaskUpdate) onTaskUpdate(updatedColumns)
      }
    } catch (error) {
      console.error('Failed to move skipped task to bottom:', error)
    }
    
    // Reset timer when skipping task
    onSkipTask() // Call parent's skip handler to reset timer
    
    // Activate the next task that we determined before making changes
    if (nextTask) {
      onActivateTask(nextTask)
    } else {
      onActivateTask(null)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskInput.trim() || !selectedList) return;

    try {
      // Get the current column to determine the order
      const currentColumn = taskColumns.find(col => col.id === 'today');
      const orderInColumn = currentColumn ? currentColumn.tasks.length : 0;

      const newTaskData = {
        ...createNewTask(newTaskInput, 'today', selectedList.id),
        orderInColumn
      };
      const newTask = await window.db.createTask(newTaskData);

      // Add task to Today column
      const updatedColumns = taskColumns.map(col =>
        col.id === 'today'
          ? { ...col, tasks: [...col.tasks, { ...newTask, orderInColumn }] }
          : col
      )
      
      setTaskColumns(updatedColumns)
      
      // Notify parent component of the update
      if (onTaskUpdate) {
        onTaskUpdate(updatedColumns)
      }
      
      setNewTaskInput('')
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  // TaskCard handlers
  const handleCompleteTask = async (taskId) => {
    try {
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

      // If task is already completed, just toggle it back
      if (taskToComplete.status === 'done') {
        await completeTaskDirectly(taskId)
        return
      }

      // Show completion celebration modal
      setCompletedTaskTitle(taskToComplete.title)
      setTaskCompletionTime(timer?.hours * 60 + timer?.minutes || 0)
      setShowCompletionModal(true)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  // Function to actually complete the task (called from modal)
  const completeTaskDirectly = async (taskId) => {
    try {
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
      const isCompleted = taskToComplete.status === 'done'
      const status = isCompleted ? 'inprogress' : 'done'
      const completedAt = isCompleted ? null : now

      // Update database
      await window.db.updateTask(taskId, { status, completedAt, updatedAt: now })

      // Update local state
      const updatedColumns = taskColumns.map(col => {
        if (col.id === sourceColumnId) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
        }
        if (col.id === status) {
          return {
            ...col,
            tasks: [...col.tasks, {
              ...taskToComplete,
              status,
              completedAt,
              updatedAt: now
            }]
          }
        }
        return col
      })
      
      setTaskColumns(updatedColumns)
      if (onTaskUpdate) onTaskUpdate(updatedColumns)

      // If task was completed (not uncompleted), call parent's completion handler
      if (!isCompleted) {
        onCompleteTask(taskId)
      }
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  // Handle next task from completion modal
  const handleNextTask = () => {
    setShowCompletionModal(false)
    // Complete the current task and move to next
    if (activeTask) {
      completeTaskDirectly(activeTask.id)
    }
  }

  // Handle take a break from completion modal
  const handleTakeBreak = () => {
    setShowCompletionModal(false)
    // Complete the current task but don't move to next
    if (activeTask) {
      completeTaskDirectly(activeTask.id)
      // Stop timer and deactivate task
      onSkipTask()
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

  const handleAddSubtask = async (taskId, subtaskTitle) => {
    if (!subtaskTitle.trim()) return

    try {
      // Find the task to get current subtask count for ordering
      const currentTask = taskColumns.flatMap(col => col.tasks).find(t => t.id === taskId)
      const currentSubtaskCount = currentTask?.subtasks?.length || 0

      const newSubtaskData = {
        title: subtaskTitle,
        completed: false,
        order: currentSubtaskCount,
        taskId: taskId
      }

      const newSubtask = await window.db.createSubtask(newSubtaskData)

      const updatedColumns = taskColumns.map(col => ({
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
      }))

      setTaskColumns(updatedColumns)
      if (onTaskUpdate) onTaskUpdate(updatedColumns)
      setNewSubtaskInputs({ ...newSubtaskInputs, [taskId]: '' })
    } catch (error) {
      console.error('Failed to create subtask:', error)
    }
  }

  const handleToggleSubtask = async (taskId, subtaskId) => {
    try {
      // Find the current subtask to get its completion status
      const currentTask = taskColumns.flatMap(col => col.tasks).find(t => t.id === taskId)
      const currentSubtask = currentTask?.subtasks?.find(st => st.id === subtaskId)
      
      if (!currentSubtask) return

      const newCompleted = !currentSubtask.completed

      await window.db.updateSubtask(subtaskId, { completed: newCompleted })

      const updatedColumns = taskColumns.map(col => ({
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
      }))

      setTaskColumns(updatedColumns)
      if (onTaskUpdate) onTaskUpdate(updatedColumns)
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
  const handleDeleteTask = async (taskId) => {
    try {
      await window.db.deleteTask(taskId)
      
      const updatedColumns = taskColumns.map(col => ({
        ...col,
        tasks: col.tasks.filter(task => task.id !== taskId)
      }))

      setTaskColumns(updatedColumns)
      if (onTaskUpdate) onTaskUpdate(updatedColumns)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleDuplicateTask = async (taskId) => {
    try {
      const taskToDuplicate = taskColumns.flatMap(col => col.tasks).find(t => t.id === taskId)
      if (!taskToDuplicate || !selectedList) return
      
      const now = new Date().toISOString()
      const currentWeek = getCurrentWeek()
      
      // Find the column and calculate order
      const sourceColumn = taskColumns.find(col => col.tasks.some(t => t.id === taskId))
      const orderInColumn = sourceColumn ? sourceColumn.tasks.length : 0
      
      const duplicatedTaskData = {
        title: `${taskToDuplicate.title} (Copy)`,
        status: 'inprogress',
        priority: taskToDuplicate.priority || 'medium',
        notes: taskToDuplicate.notes || null,
        timeSpent: 0,
        estimatedTime: taskToDuplicate.estimatedTime || 60,
        completedAt: null,
        deadline: taskToDuplicate.deadline || null,
        weekNumber: currentWeek.weekNumber,
        weekYear: currentWeek.year,
        assignedWeek: currentWeek.weekString,
        scheduledForToday: true,
        todayScheduledAt: now,
        orderInColumn: orderInColumn,
        listId: taskToDuplicate.listId || selectedList.id,
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
            completed: false,
            order: i,
            taskId: duplicatedTask.id
          }
          const duplicatedSubtask = await window.db.createSubtask(newSubtaskData)
          duplicatedSubtasks.push(duplicatedSubtask)
        }
        duplicatedTask.subtasks = duplicatedSubtasks
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
    } catch (error) {
      console.error('Failed to duplicate task:', error)
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
  
  const currentProgressMinutes = timer?.hours * 60 + timer?.minutes || 0
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
                  isActive={task.id === activeTask?.id}
                  isTimerRunning={isTimerRunning}
                  onActivateTask={() => handleActivateTask(task)}
                  onSkipTask={handleSkipTask}
                  onToggleTimer={onToggleTimer}
                  onCompleteTask={handleCompleteTask}
                  onGetCurrentTimer={() => timer}
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
            <div className="mt-4 border-b border-border pb-4">
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

            {/* Done Today Section */}
            {(() => {
              const doneColumn = taskColumns.find(col => col.id === 'done')
              const todayDoneTasks = doneColumn?.tasks.filter(task => {
                if (!task.completedAt) return false
                const completionDate = new Date(task.completedAt).toDateString()
                const today = new Date().toDateString()
                return completionDate === today
              }).sort((a, b) => {
                // Sort by completion time: latest first (newer to older)
                return new Date(b.completedAt) - new Date(a.completedAt)
              }) || []

              if (todayDoneTasks.length === 0) return null

              return (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Done</h3>
                    <span className="text-sm text-muted-foreground">
                      {todayDoneTasks.length} {todayDoneTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {todayDoneTasks.map((task) => (
                      <div key={task.id} className="opacity-60">
                        <FloatingTaskCard
                          task={task}
                          index={0}
                          isActive={false}
                          isTimerRunning={false}
                          onActivateTask={() => {}} // Disabled for completed tasks
                          onSkipTask={() => {}} // Disabled for completed tasks
                          onToggleTimer={() => {}} // Disabled for completed tasks
                          onCompleteTask={handleCompleteTask} // Allow uncompleting
                          onGetCurrentTimer={() => ({ hours: 0, minutes: 0, seconds: 0 })}
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
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
      </div>

      {/* Completion Celebration Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mx-4 w-full max-w-sm rounded-2xl border border-green-200 bg-white p-6 shadow-2xl dark:border-green-800 dark:bg-card"
            >
              {/* Header */}
              <div className="mb-6 text-center">
                
                <h2 className="text-2xl font-bold text-foreground">
                  Well done! 🎉
                </h2>
              </div>

              {/* Celebration Image/Icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-green-600">
                  <CheckCircle2 size={64} className="text-white" fill="currentColor" />
                </div>
              </div>

              {/* Completion Message */}
              <div className="mb-6 text-center">
                <p className="text-sm font-medium text-emerald-600/60 dark:text-green-400">
                  You finished the task!
                </p>
                <p className="mt-1 text-muted-foreground line-through">
                  {completedTaskTitle}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleNextTask}
                  className="w-full rounded-full bg-gradient-to-r from-amber-200 to-emerald-300 py-3 text-base font-semibold text-zinc-800 hover:from-emerald-400 hover:to-emerald-600"
                >
                  <SkipForward className="mr-2 h-5 w-5" />
                  Next Task
                </Button>
                <Button
                  onClick={handleTakeBreak}
                  variant="ghost"
                  className="w-full rounded-full py-3 text-muted-foreground hover:text-foreground"
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  Take a Break
                </Button>
              </div>

              {/* Time Stats */}
              <div className="mt-6 flex justify-between text-sm text-muted-foreground">
                <span>Est: None</span>
                <span className="text-green-600 dark:text-green-400">
                  Taken: {taskCompletionTime}min
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
