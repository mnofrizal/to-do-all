import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  getDefaultTaskColumns,
  createNewTask,
  updateTaskToCurrentWeek,
  getCurrentWeek
} from '../data/taskData'
import { arrayMove } from '@dnd-kit/sortable'
import useAppStore from './useAppStore'

const useTaskStore = create(
  subscribeWithSelector((set, get) => ({
    // Task state
    activeTask: null,
    taskColumns: getDefaultTaskColumns(),

    // Task actions
    setActiveTask: (task) => set({ activeTask: task }),
    setTaskColumns: (columns) => set({ taskColumns: columns }),

    // Load tasks from database
    loadTasks: async (listId) => {
      if (!listId) {
        set({ taskColumns: getDefaultTaskColumns() })
        return
      }

      try {
        const tasks = await window.db.getTasks(listId)
        console.log('Loaded tasks:', tasks)
        const newColumns = getDefaultTaskColumns()

        tasks.forEach((task) => {
          let targetColumnId = task.status

          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
          }

          if (task.status === 'done') {
            targetColumnId = 'done'
          } else if (task.status === 'backlog') {
            targetColumnId = 'backlog'
          } else if (task.scheduledForToday === true && task.status !== 'done') {
            targetColumnId = 'today'
          } else if (task.status === 'inprogress') {
            const currentWeek = getCurrentWeek()
            if (task.assignedWeek === currentWeek.weekString) {
              targetColumnId = 'thisweek'
            } else {
              targetColumnId = 'backlog'
            }
          } else {
            targetColumnId = 'backlog'
          }

          const column = newColumns.find((c) => c.id === targetColumnId)
          if (column) {
            column.tasks.push(task)
          }
        })

        newColumns.forEach((column) => {
          column.tasks.sort((a, b) => (a.orderInColumn || 0) - (b.orderInColumn || 0))
        })

        set({ taskColumns: newColumns })
      } catch (error) {
        console.error('Failed to load tasks:', error)
        set({ taskColumns: getDefaultTaskColumns() })
      }
    },

    // Create a new task
    createTask: async (columnId, taskTitle) => {
      const { taskColumns } = get()
      const { selectedList } = useAppStore.getState()
      if (!taskTitle.trim() || !selectedList) return

      const currentColumn = taskColumns.find((col) => col.id === columnId)
      const orderInColumn = currentColumn ? currentColumn.tasks.length : 0

      const newTaskData = {
        ...createNewTask(taskTitle, columnId, selectedList.id),
        orderInColumn
      }
      const newTask = await window.db.createTask(newTaskData)

      set((state) => {
        const updatedColumns = state.taskColumns.map((col) =>
          col.id === columnId ? { ...col, tasks: [...col.tasks, { ...newTask, orderInColumn }] } : col
        )
        return { taskColumns: updatedColumns }
      })
    },

    // Update a task
    updateTask: async (taskId, updateData) => {
      try {
        await window.db.updateTask(taskId, updateData)
        set((state) => {
          const updatedColumns = state.taskColumns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => (task.id === taskId ? { ...task, ...updateData } : task))
          }))
          return { taskColumns: updatedColumns }
        })
      } catch (error) {
        console.error('Failed to update task:', error)
        throw error
      }
    },

    // Delete a task
    deleteTask: async (taskId) => {
      try {
        const { taskColumns } = get()
        let taskToDelete = null
        for (const col of taskColumns) {
          const task = col.tasks.find((t) => t.id === taskId)
          if (task) {
            taskToDelete = task
            break
          }
        }

        if (taskToDelete) {
          if (taskToDelete.attachments && taskToDelete.attachments.length > 0) {
            for (const attachment of taskToDelete.attachments) {
              await window.db.deleteAttachment(attachment.id)
            }
          }
          if (taskToDelete.notes && taskToDelete.notes.length > 0) {
            for (const note of taskToDelete.notes) {
              await window.db.deleteNote(note.id)
            }
          }
        }

        await window.db.deleteTask(taskId)

        set((state) => {
          const updatedColumns = state.taskColumns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((task) => task.id !== taskId)
          }))
          return { taskColumns: updatedColumns }
        })
      } catch (error) {
        console.error('Failed to delete task:', error)
        throw error
      }
    },

    // Drag and drop handlers
    handleDragStart: (event) => {
      // Logic to handle drag start if needed, e.g., setting activeId
    },

    handleDragOver: (event) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id
      const overId = over.id

      const { taskColumns } = get()
      const activeContainer = findContainer(taskColumns, activeId)
      const overContainer = findContainer(taskColumns, overId)

      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return
      }

      set((state) => {
        const activeItems = state.taskColumns.find((col) => col.id === activeContainer)?.tasks || []
        const overItems = state.taskColumns.find((col) => col.id === overContainer)?.tasks || []
        const activeIndex = activeItems.findIndex((item) => item.id === activeId)
        const overIndex = overItems.findIndex((item) => item.id === overId)

        let newIndex
        if (overId in state.taskColumns.reduce((acc, col) => ({ ...acc, [col.id]: col }), {})) {
          newIndex = overItems.length + 1
        } else {
          const isBelowOverItem = over && overIndex < overItems.length - 1
          const modifier = isBelowOverItem ? 1 : 0
          newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
        }

        const taskToMove = activeItems[activeIndex]
        const updatedTask = updateTaskForColumn(taskToMove, overContainer)

        const newColumns = state.taskColumns.map((col) => {
          if (col.id === activeContainer) {
            const filteredTasks = col.tasks.filter((task) => task.id !== activeId)
            const reorderedTasks = filteredTasks.map((task, idx) => ({
              ...task,
              orderInColumn: idx
            }))
            return { ...col, tasks: reorderedTasks }
          } else if (col.id === overContainer) {
            const newTasks = [...col.tasks]
            newTasks.splice(newIndex, 0, { ...updatedTask, orderInColumn: newIndex })
            const reorderedTasks = newTasks.map((task, idx) => ({
              ...task,
              orderInColumn: idx
            }))
            return { ...col, tasks: reorderedTasks }
          }
          return col
        })
        return { taskColumns: newColumns }
      })
    },

    handleDragEnd: (event) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id
      const overId = over.id

      const { taskColumns } = get()
      const activeContainer = findContainer(taskColumns, activeId)
      const overContainer = findContainer(taskColumns, overId)

      if (!activeContainer || !overContainer) return

      if (activeContainer === overContainer) {
        set((state) => {
          const newColumns = state.taskColumns.map((col) => {
            if (col.id === activeContainer) {
              const activeIndex = col.tasks.findIndex((task) => task.id === activeId)
              const overIndex = col.tasks.findIndex((task) => task.id === overId)

              if (activeIndex !== overIndex) {
                const reorderedTasks = arrayMove(col.tasks, activeIndex, overIndex)
                const tasksWithOrder = reorderedTasks.map((task, idx) => {
                  const updatedTask = { ...task, orderInColumn: idx }
                  window.db.updateTask(task.id, { orderInColumn: idx }).catch((error) => {
                    console.error('Failed to update task order:', error)
                  })
                  return updatedTask
                })
                return { ...col, tasks: tasksWithOrder }
              }
            }
            return col
          })
          return { taskColumns: newColumns }
        })
      }
    },

    // Subtask actions
    addSubtask: async (taskId, subtaskTitle) => {
      if (!subtaskTitle.trim()) return

      const { taskColumns } = get()
      const currentTask = taskColumns.flatMap((col) => col.tasks).find((t) => t.id === taskId)
      const currentSubtaskCount = currentTask?.subtasks?.length || 0

      const newSubtaskData = {
        title: subtaskTitle,
        completed: false,
        order: currentSubtaskCount,
        taskId: taskId
      }

      try {
        const newSubtask = await window.db.createSubtask(newSubtaskData)
        set((state) => {
          const newColumns = state.taskColumns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => {
              if (task.id === taskId) {
                const updatedSubtasks = [...(task.subtasks || []), newSubtask]
                updatedSubtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
                return { ...task, subtasks: updatedSubtasks }
              }
              return task
            })
          }))
          return { taskColumns: newColumns }
        })
      } catch (error) {
        console.error('Failed to create subtask:', error)
      }
    },

    updateSubtask: async (taskId, subtaskId, updateData) => {
      try {
        await window.db.updateSubtask(subtaskId, updateData)
        set((state) => {
          const newColumns = state.taskColumns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => {
              if (task.id === taskId) {
                const updatedSubtasks =
                  task.subtasks?.map((subtask) =>
                    subtask.id === subtaskId ? { ...subtask, ...updateData } : subtask
                  ) || []
                updatedSubtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
                return { ...task, subtasks: updatedSubtasks }
              }
              return task
            })
          }))
          return { taskColumns: newColumns }
        })
        useAppStore.getState().triggerSubtaskUpdate()
      } catch (error) {
        console.error('Failed to update subtask:', error)
      }
    },

    deleteSubtask: async (taskId, subtaskId) => {
      try {
        await window.db.deleteSubtask(subtaskId)
        set((state) => {
          const newColumns = state.taskColumns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => {
              if (task.id === taskId) {
                const filteredSubtasks = task.subtasks?.filter((st) => st.id !== subtaskId) || []
                filteredSubtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
                return { ...task, subtasks: filteredSubtasks }
              }
              return task
            })
          }))
          return { taskColumns: newColumns }
        })
      } catch (error) {
        console.error('Failed to delete subtask:', error)
      }
    },

    // Attachment actions
    addAttachment: async (taskId, attachmentData) => {
      try {
        const newAttachment = await window.db.createAttachment(attachmentData)
        set((state) => {
          const newColumns = state.taskColumns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => {
              if (task.id === taskId) {
                return { ...task, attachments: [...(task.attachments || []), newAttachment] }
              }
              return task
            })
          }))
          return { taskColumns: newColumns }
        })
      } catch (error) {
        console.error('Failed to add attachment:', error)
      }
    },

    deleteAttachment: async (taskId, attachmentId) => {
      try {
        await window.db.deleteAttachment(attachmentId)
        set((state) => {
          const newColumns = state.taskColumns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => {
              if (task.id === taskId) {
                return {
                  ...task,
                  attachments: task.attachments.filter((att) => att.id !== attachmentId)
                }
              }
              return task
            })
          }))
          return { taskColumns: newColumns }
        })
      } catch (error) {
        console.error('Failed to delete attachment:', error)
      }
    },

    // Note actions
    deleteNote: async (taskId, noteId) => {
      try {
        await window.db.deleteNote(noteId)
        set((state) => {
          const newColumns = state.taskColumns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => {
              if (task.id === taskId) {
                return {
                  ...task,
                  notes: task.notes.filter((note) => note.id !== noteId)
                }
              }
              return task
            })
          }))
          return { taskColumns: newColumns }
        })
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
    },

    detachNote: (taskId, noteId) => {
      set((state) => {
        const newColumns = state.taskColumns.map((col) => ({
          ...col,
          tasks: col.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                notes: task.notes.filter((note) => note.id !== noteId)
              }
            }
            return task
          })
        }))
        return { taskColumns: newColumns }
      })
    },

    detachAttachment: (taskId, attachmentId) => {
      set((state) => {
        const newColumns = state.taskColumns.map((col) => ({
          ...col,
          tasks: col.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                attachments: task.attachments.filter((att) => att.id !== attachmentId)
              }
            }
            return task
          })
        }))
        return { taskColumns: newColumns }
      })
    },

    moveTask: async (taskId, direction) => {
      const { taskColumns } = get()
      const columnOrder = ['backlog', 'thisweek', 'today', 'done']
      let sourceColumnId = null
      let taskToMove = null

      taskColumns.forEach((col) => {
        const task = col.tasks.find((t) => t.id === taskId)
        if (task) {
          taskToMove = task
          sourceColumnId = col.id
        }
      })

      if (!taskToMove) return

      const sourceColumnOrderIndex = columnOrder.indexOf(sourceColumnId)
      let targetColumnOrderIndex = sourceColumnOrderIndex

      if (direction === 'left' && sourceColumnOrderIndex > 0) {
        targetColumnOrderIndex = sourceColumnOrderIndex - 1
      } else if (direction === 'right' && sourceColumnOrderIndex < columnOrder.length - 1) {
        targetColumnOrderIndex = sourceColumnOrderIndex + 1
      } else {
        return
      }

      const targetColumnId = columnOrder[targetColumnOrderIndex]
      const updatedTask = updateTaskForColumn({ ...taskToMove, orderInColumn: 0 }, targetColumnId)

      set((state) => {
        const newColumns = [...state.taskColumns]
        const sourceColIndex = newColumns.findIndex((c) => c.id === sourceColumnId)
        const targetColIndex = newColumns.findIndex((c) => c.id === targetColumnId)

        if (sourceColIndex === -1 || targetColIndex === -1) return state

        // Remove from source and reorder
        const sourceTasks = newColumns[sourceColIndex].tasks.filter((t) => t.id !== taskId)
        const reorderedSourceTasks = sourceTasks.map((task, idx) => ({ ...task, orderInColumn: idx }))
        newColumns[sourceColIndex] = { ...newColumns[sourceColIndex], tasks: reorderedSourceTasks }
        reorderedSourceTasks.forEach((task) => {
          window.db.updateTask(task.id, { orderInColumn: task.orderInColumn })
        })

        // Add to target and reorder
        const targetTasks = [updatedTask, ...newColumns[targetColIndex].tasks]
        const reorderedTargetTasks = targetTasks.map((task, idx) => ({ ...task, orderInColumn: idx }))
        newColumns[targetColIndex] = { ...newColumns[targetColIndex], tasks: reorderedTargetTasks }
        reorderedTargetTasks.forEach((task) => {
          if (task.id !== updatedTask.id) {
            window.db.updateTask(task.id, { orderInColumn: task.orderInColumn })
          }
        })

        return { taskColumns: newColumns }
      })
    }
  }))
)

useAppStore.subscribe(
  (state) => state.selectedList,
  (selectedList) => {
    if (selectedList) {
      useTaskStore.getState().loadTasks(selectedList.id)
    } else {
      useTaskStore.getState().setTaskColumns(getDefaultTaskColumns())
    }
  }
)

const findContainer = (columns, id) => {
  if (columns.some((col) => col.id === id)) {
    return id
  }
  return columns.find((col) => col.tasks.some((task) => task.id === id))?.id
}

const updateTaskForColumn = (task, targetColumnId) => {
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

  window.db.updateTask(task.id, updateData).catch((error) => {
    console.error('Failed to update task in database:', error)
  })

  return updatedTask
}

export default useTaskStore