import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  restrictToWindowEdges,
} from '@dnd-kit/modifiers'
import KanbanColumn from './ui/KanbanColumn'
import { useKanbanData } from './hooks/useKanbanData'
import { getColumnProgress, getPriorityColor, findContainer } from './lib/utils'
import {
  updateTaskToCurrentWeek,
  getCurrentWeek,
} from '../../data/taskData'

const KanbanView = ({ selectedList, onLeapIt }) => {
  const scrollRefs = useRef({})
  const {
    columns,
    setColumns,
    newTaskInputs,
    setNewTaskInputs,
    handleAddTask,
  } = useKanbanData(selectedList)

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
  
  const [activeId, setActiveId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  
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

  const handleInputChange = (columnId, value) => {
    setNewTaskInputs({ ...newTaskInputs, [columnId]: value })
  }

  const handleKeyPress = (e, columnId) => {
    if (e.key === 'Enter') {
      handleAddTask(columnId, newTaskInputs[columnId])
    }
  }

  const handleLeapItClick = () => {
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
      return
    }

    const now = new Date().toISOString()
    const currentWeek = getCurrentWeek()
    
    const targetColumnId = columnOrder[targetColumnIndex]
    const sourceColumnId = columnOrder[sourceColumnIndex]
    
    let updatedTask = { ...taskToMove }
    
    if (sourceColumnId === 'backlog' && targetColumnId === 'thisweek') {
      updatedTask = updateTaskToCurrentWeek(updatedTask)
    } else if (sourceColumnId === 'today' && targetColumnId === 'thisweek') {
      updatedTask = {
        ...updatedTask,
        scheduledForToday: false,
        todayScheduledAt: null,
        status: 'inprogress',
        updatedAt: now
      }
      updatedTask = updateTaskToCurrentWeek(updatedTask)
    } else if (targetColumnId === 'today') {
      updatedTask = {
        ...updatedTask,
        scheduledForToday: true,
        todayScheduledAt: now,
        updatedAt: now,
        status: 'inprogress'
      }
    } else if (sourceColumnId === 'today' && targetColumnId !== 'done') {
      updatedTask = {
        ...updatedTask,
        scheduledForToday: false,
        todayScheduledAt: null,
        updatedAt: now,
        status: targetColumnId === 'backlog' ? 'backlog' : 'inprogress'
      }
    } else if (targetColumnId === 'done') {
      updatedTask = {
        ...updatedTask,
        status: 'done',
        completedAt: now,
        updatedAt: now
      }
    } else if (sourceColumnId === 'done') {
      updatedTask = {
        ...updatedTask,
        status: targetColumnId === 'backlog' ? 'backlog' : 'inprogress',
        completedAt: null,
        updatedAt: now
      }
    } else {
      updatedTask = {
        ...updatedTask,
        status: targetColumnId === 'backlog' ? 'backlog' : 'inprogress',
        updatedAt: now
      }
    }

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

    try {
      await window.db.updateTask(taskId, updateData)
      
      setColumns(Array.isArray(columns) ? columns.map((col, index) => {
        if (index === sourceColumnIndex) {
          const filteredTasks = col.tasks.filter(t => t.id !== taskId);
          const reorderedTasks = filteredTasks.map((task, idx) => ({
            ...task,
            orderInColumn: idx
          }));
          return { ...col, tasks: reorderedTasks }
        } else if (index === targetColumnIndex) {
          const newOrder = col.tasks.length;
          const taskWithOrder = { ...updatedTask, orderInColumn: newOrder };
          return { ...col, tasks: [...col.tasks, taskWithOrder] }
        }
        return col
      }) : getDefaultTaskColumns())
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

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

  const handleToggleNotes = (taskId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
    
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
      setTaskNotes(prev => ({
        ...prev,
        [taskId]: ''
      }))
      setExpandedNotes(prev => ({ ...prev, [taskId]: false }))
    } catch (error) {
      console.error('Failed to delete notes:', error)
    }
  }

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
      
      const sourceColumn = columns.find(col => col.tasks.some(t => t.id === taskId))
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
        scheduledForToday: false,
        todayScheduledAt: null,
        orderInColumn: orderInColumn,
        listId: taskToDuplicate.listId || selectedList?.id,
        createdAt: now,
        updatedAt: now
      }
      
      const duplicatedTask = await window.db.createTask(duplicatedTaskData)
      
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
        return
      }
      
      for (let i = 0; i < subtasks.length; i++) {
        subtasks[i].order = i
        await window.db.updateSubtask(subtasks[i].id, { order: i })
      }
      
      setColumns(columns.map(col => ({
        ...col,
        tasks: col.tasks.map(t => {
          if (t.id === taskId) {
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
      setDropdownOpen(prev => ({ ...prev, [taskId]: false }))
    } catch (error) {
      console.error('Failed to update task priority:', error)
    }
  }

  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    
    const task = columns.flatMap(col => col.tasks).find(t => t.id === active.id)
    setDraggedTask(task)
  }

  const handleDragOver = async (event) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeId = active.id
    const overId = over.id
    
    const activeContainer = findContainer(columns, activeId)
    const overContainer = findContainer(columns, overId)
    
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return
    }
    
    const activeItems = columns.find(col => col.id === activeContainer)?.tasks || []
    const overItems = columns.find(col => col.id === overContainer)?.tasks || []
    
    const activeIndex = activeItems.findIndex(item => item.id === activeId)
    const overIndex = overItems.findIndex(item => item.id === overId)
    
    let newIndex
    if (overId in columns.reduce((acc, col) => ({ ...acc, [col.id]: col }), {})) {
      newIndex = overItems.length + 1
    } else {
      const isBelowOverItem = over && overIndex < overItems.length - 1
      const modifier = isBelowOverItem ? 1 : 0
      newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
    }
    
    const taskToMove = activeItems[activeIndex]
    const taskWithOrder = { ...taskToMove, orderInColumn: newIndex }
    const updatedTask = await updateTaskForColumn(taskWithOrder, overContainer)
    
    setColumns(columns.map(col => {
      if (col.id === activeContainer) {
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
    
    const activeContainer = findContainer(columns, activeId)
    const overContainer = findContainer(columns, overId)
    
    if (!activeContainer || !overContainer) {
      setActiveId(null)
      setDraggedTask(null)
      return
    }
    
    if (activeContainer === overContainer) {
      setColumns(columns => {
        return columns.map(col => {
          if (col.id === activeContainer) {
            const activeIndex = col.tasks.findIndex(task => task.id === activeId)
            const overIndex = col.tasks.findIndex(task => task.id === overId)
            
            if (activeIndex !== overIndex) {
              const reorderedTasks = arrayMove(col.tasks, activeIndex, overIndex)
              const tasksWithOrder = reorderedTasks.map((task, idx) => {
                const updatedTask = { ...task, orderInColumn: idx }
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

  const updateTaskForColumn = async (task, targetColumnId) => {
    const now = new Date().toISOString()
    const currentWeek = getCurrentWeek()
    
    let updatedTask = { ...task }
    
    if (targetColumnId === 'thisweek') {
      updatedTask = updateTaskToCurrentWeek(updatedTask)
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

    try {
      await window.db.updateTask(task.id, updateData)
    } catch (error) {
      console.error('Failed to update task in database:', error)
    }
    
    return updatedTask
  }

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
              handleMoveSubtask={handleMoveSubtask}
              handleDeleteSubtask={handleDeleteSubtask}
              newTaskInputs={newTaskInputs}
              handleInputChange={handleInputChange}
              handleKeyPress={handleKeyPress}
              getColumnProgress={(id) => getColumnProgress(columns, id)}
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
}

export default KanbanView