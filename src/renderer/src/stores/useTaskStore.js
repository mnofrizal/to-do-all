import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getDefaultTaskColumns } from '../data/taskData'

const useTaskStore = create(
  subscribeWithSelector((set, get) => ({
    // Task state
    activeTask: null,
    taskColumns: getDefaultTaskColumns(),
    selectedList: null,
    
    // Task actions
    setActiveTask: (task) => set({ activeTask: task }),
    setTaskColumns: (columns) => set({ taskColumns: columns }),
    setSelectedList: (list) => set({ selectedList: list }),
    
    // Load tasks from database
    loadTasks: async (listId) => {
      if (!listId) {
        set({ taskColumns: getDefaultTaskColumns() })
        return
      }
      
      try {
        const tasks = await window.db.getTasks(listId)
        const newColumns = getDefaultTaskColumns()
        
        tasks.forEach(task => {
          let targetColumnId = task.status
          
          // Sort subtasks by order field if they exist
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.sort((a, b) => (a.order || 0) - (b.order || 0))
          }
          
          // Map task status to correct column
          if (task.status === 'done') {
            targetColumnId = 'done'
          } else if (task.status === 'backlog') {
            targetColumnId = 'backlog'
          } else if (task.scheduledForToday === true && task.status !== 'done') {
            targetColumnId = 'today'
          } else if (task.status === 'inprogress') {
            // Check if it's assigned to current week
            const currentWeek = getCurrentWeek()
            if (task.assignedWeek === currentWeek.weekString) {
              targetColumnId = 'thisweek'
            } else {
              targetColumnId = 'backlog'
            }
          } else {
            targetColumnId = 'backlog'
          }
          
          const column = newColumns.find(c => c.id === targetColumnId)
          if (column) {
            column.tasks.push(task)
          }
        })
        
        // Sort tasks in each column by orderInColumn
        newColumns.forEach(column => {
          column.tasks.sort((a, b) => (a.orderInColumn || 0) - (b.orderInColumn || 0))
        })
        
        set({ taskColumns: newColumns })
      } catch (error) {
        console.error('Failed to load tasks:', error)
        set({ taskColumns: getDefaultTaskColumns() })
      }
    },
    
    // Create a new task
    createTask: async (taskData) => {
      try {
        const newTask = await window.db.createTask(taskData)
        
        set((state) => {
          const updatedColumns = state.taskColumns.map(col =>
            col.id === taskData.status || (taskData.scheduledForToday && col.id === 'today')
              ? { ...col, tasks: [...col.tasks, newTask] }
              : col
          )
          return { taskColumns: updatedColumns }
        })
        
        return newTask
      } catch (error) {
        console.error('Failed to create task:', error)
        throw error
      }
    },
    
    // Update a task
    updateTask: async (taskId, updateData) => {
      try {
        await window.db.updateTask(taskId, updateData)
        
        set((state) => {
          const updatedColumns = state.taskColumns.map(col => ({
            ...col,
            tasks: col.tasks.map(task =>
              task.id === taskId ? { ...task, ...updateData } : task
            )
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
        await window.db.deleteTask(taskId)
        
        set((state) => {
          const updatedColumns = state.taskColumns.map(col => ({
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
          }))
          return { taskColumns: updatedColumns }
        })
      } catch (error) {
        console.error('Failed to delete task:', error)
        throw error
      }
    },
    
    // Move task between columns
    moveTask: async (taskId, fromColumnId, toColumnId, updateData = {}) => {
      try {
        // Update in database
        await window.db.updateTask(taskId, updateData)
        
        set((state) => {
          let taskToMove = null
          
          // Find and remove task from source column
          const updatedColumns = state.taskColumns.map(col => {
            if (col.id === fromColumnId) {
              const task = col.tasks.find(t => t.id === taskId)
              if (task) {
                taskToMove = { ...task, ...updateData }
                return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
              }
            }
            return col
          })
          
          // Add task to target column
          if (taskToMove) {
            const finalColumns = updatedColumns.map(col => {
              if (col.id === toColumnId) {
                return { ...col, tasks: [...col.tasks, taskToMove] }
              }
              return col
            })
            return { taskColumns: finalColumns }
          }
          
          return { taskColumns: updatedColumns }
        })
      } catch (error) {
        console.error('Failed to move task:', error)
        throw error
      }
    },
    
    // Get today's tasks
    getTodayTasks: () => {
      const { taskColumns } = get()
      const todayColumn = taskColumns.find(col => col.id === 'today')
      return todayColumn?.tasks.filter(task => task.status !== 'done') || []
    },
    
    // Get tasks by column
    getTasksByColumn: (columnId) => {
      const { taskColumns } = get()
      const column = taskColumns.find(col => col.id === columnId)
      return column?.tasks || []
    },
    
    // Find task by ID
    findTaskById: (taskId) => {
      const { taskColumns } = get()
      for (const column of taskColumns) {
        const task = column.tasks.find(t => t.id === taskId)
        if (task) return task
      }
      return null
    }
  }))
)

// Helper function (you might want to import this from your existing utils)
const getCurrentWeek = () => {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  
  return {
    weekNumber,
    year,
    weekString: `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }
}

export default useTaskStore