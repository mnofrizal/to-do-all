import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Global interval tracker to prevent multiple intervals
let globalIntervalId = null

const useTimerStore = create(
  subscribeWithSelector((set, get) => ({
    // Current active timer (global display)
    timer: { hours: 0, minutes: 0, seconds: 0 },
    isRunning: false,
    intervalId: null,
    
    // Active task tracking
    activeTaskId: null,
    sessionStartTime: null, // Track when current session started (local only)
    
    // Timer actions
    start: () => {
      const { isRunning, intervalId } = get()
      if (isRunning || intervalId || globalIntervalId) return
      
      // CRITICAL: Clear any existing intervals (both local and global)
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (globalIntervalId) {
        clearInterval(globalIntervalId)
        globalIntervalId = null
      }
      
      const id = setInterval(() => {
        set((state) => {
          const { timer } = state
          let newSeconds = timer.seconds + 1
          let newMinutes = timer.minutes
          let newHours = timer.hours

          if (newSeconds >= 60) {
            newSeconds = 0
            newMinutes += 1
          }
          if (newMinutes >= 60) {
            newMinutes = 0
            newHours += 1
          }

          return {
            timer: { hours: newHours, minutes: newMinutes, seconds: newSeconds }
          }
        })
      }, 1000)
      
      // Store in both local state and global tracker
      globalIntervalId = id
      set({ isRunning: true, intervalId: id })
    },
    
    pause: () => {
      const { intervalId } = get()
      
      // Clear both local and global intervals
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (globalIntervalId) {
        clearInterval(globalIntervalId)
        globalIntervalId = null
      }
      
      set({ isRunning: false, intervalId: null })
    },
    
    toggle: () => {
      const { isRunning } = get()
      if (isRunning) {
        get().pause()
      } else {
        get().start()
      }
    },
    
    reset: () => {
      const { intervalId } = get()
      
      // Clear both local and global intervals
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (globalIntervalId) {
        clearInterval(globalIntervalId)
        globalIntervalId = null
      }
      
      // Extra safety: clear all possible intervals by checking window
      if (typeof window !== 'undefined' && window.clearInterval) {
        if (intervalId) {
          window.clearInterval(intervalId)
        }
        if (globalIntervalId) {
          window.clearInterval(globalIntervalId)
        }
      }
      
      set({
        timer: { hours: 0, minutes: 0, seconds: 0 },
        isRunning: false,
        intervalId: null,
        activeTaskId: null,
        sessionStartTime: null
      })
    },
    
    // Simplified timer management - no TimeSession creation
    switchToTask: async (taskId, userId) => {
      const { activeTaskId, isRunning, intervalId } = get()
      
      try {
        // Save current task if running
        if (activeTaskId && isRunning) {
          await get().pauseForTask()
        }
        
        // CRITICAL: Ensure any existing interval is cleared (both local and global)
        if (intervalId) {
          clearInterval(intervalId)
        }
        if (globalIntervalId) {
          clearInterval(globalIntervalId)
          globalIntervalId = null
        }
        
        // Load the new task's accumulated time
        const task = await window.db.getTask(taskId)
        if (!task) {
          console.error('Task not found:', taskId)
          return
        }
        
        const taskTimer = get().secondsToTimer(task.timeSpent || 0)
        
        // Update state with new task timer - ensure clean state
        set({
          activeTaskId: taskId,
          timer: taskTimer,
          isRunning: false,
          intervalId: null,
          sessionStartTime: null
        })
        
      } catch (error) {
        console.error('Failed to switch task:', error)
      }
    },
    
    // Start timer for specific task
    startForTask: async (taskId, userId) => {
      const { isRunning, activeTaskId, intervalId } = get()
      if (isRunning) return // Already running
      
      try {
        // CRITICAL: Force clear any existing intervals before starting (both local and global)
        if (intervalId) {
          clearInterval(intervalId)
        }
        if (globalIntervalId) {
          clearInterval(globalIntervalId)
          globalIntervalId = null
        }
        set({ intervalId: null, isRunning: false })
        
        // Small delay to ensure interval is fully cleared
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // If switching to a different task, switch first
        if (activeTaskId !== taskId) {
          await get().switchToTask(taskId, userId)
        }
        
        const now = new Date()
        
        // IMMEDIATELY save start time to database (crash protection)
        await window.db.updateTask(taskId, {
          lastStartTime: now,
          updatedAt: now
        })
        
        // Start local timer and session tracking
        set({
          sessionStartTime: now
        })
        
        get().start()
        
      } catch (error) {
        console.error('Failed to start timer for task:', error)
      }
    },
    
    // Pause timer and save accumulated time
    pauseForTask: async () => {
      const { isRunning, activeTaskId, sessionStartTime } = get()
      if (!isRunning || !activeTaskId || !sessionStartTime) return
      
      try {
        const now = new Date()
        const sessionDuration = Math.floor((now - sessionStartTime) / 1000)
        
        // Get current task
        const task = await window.db.getTask(activeTaskId)
        if (!task) {
          console.error('Task not found:', activeTaskId)
          return
        }
        
        const newTimeSpent = (task.timeSpent || 0) + sessionDuration
        
        // Update task with accumulated time and clear active state
        await window.db.updateTask(activeTaskId, {
          timeSpent: newTimeSpent,
          lastStartTime: null, // null = timer not active
          updatedAt: now
        })
        
        // Update local timer to reflect saved time
        const updatedTimer = get().secondsToTimer(newTimeSpent)
        set({
          timer: updatedTimer,
          sessionStartTime: null
        })
        
        get().pause()
        
      } catch (error) {
        console.error('Failed to pause timer for task:', error)
      }
    },
    
    // Utility functions
    secondsToTimer: (totalSeconds) => {
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      return { hours, minutes, seconds }
    },
    
    timerToSeconds: (timer) => {
      return timer.hours * 3600 + timer.minutes * 60 + timer.seconds
    },
    
    // Format timer for display
    formatTime: (customTimer = null) => {
      const timerToFormat = customTimer || get().timer
      return `${timerToFormat.hours.toString().padStart(2, '0')}:${timerToFormat.minutes.toString().padStart(2, '0')}:${timerToFormat.seconds.toString().padStart(2, '0')}`
    },
    
    // Format task timer for display
    formatTaskTime: (taskId) => {
      // For simplified approach, just use current timer if it's the active task
      const { activeTaskId, timer } = get()
      if (activeTaskId === taskId) {
        return get().formatTime(timer)
      }
      return '00:00:00'
    },
    
    // Get total minutes
    getTotalMinutes: (customTimer = null) => {
      const timerToUse = customTimer || get().timer
      return timerToUse.hours * 60 + timerToUse.minutes
    },
    
    // Initialize app and recover crashed timers
    initializeApp: async () => {
      try {
        console.log('Initializing timer store and checking for crashed timers...')
        
        // Find any tasks with active timers (lastStartTime != null)
        const activeTasks = await window.db.getTasksWithActiveTimers()
        
        if (activeTasks.length > 0) {
          console.log(`Found ${activeTasks.length} tasks with active timers, recovering...`)
          
          for (const task of activeTasks) {
            const now = new Date()
            const crashedDuration = Math.floor((now - new Date(task.lastStartTime)) / 1000)
            
            console.log(`Recovering ${crashedDuration} seconds for task: ${task.title}`)
            
            // Add crashed time to accumulated time and clear active state
            await window.db.updateTask(task.id, {
              timeSpent: (task.timeSpent || 0) + crashedDuration,
              lastStartTime: null,
              updatedAt: now
            })
          }
          
          console.log('Timer recovery completed')
        } else {
          console.log('No active timers found, no recovery needed')
        }
      } catch (error) {
        console.error('Failed to initialize timer store:', error)
      }
    },
    
    // Cleanup on unmount
    cleanup: async () => {
      const { intervalId, isRunning } = get()
      
      // Save current session if running
      if (isRunning) {
        await get().pauseForTask()
      }
      
      // Clear both local and global intervals
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (globalIntervalId) {
        clearInterval(globalIntervalId)
        globalIntervalId = null
      }
      
      set({
        intervalId: null,
        isRunning: false,
        activeTaskId: null,
        sessionStartTime: null
      })
    },
    
    // Periodic save (call this every 30 seconds when timer is running)
    periodicSave: async () => {
      const { activeTaskId, sessionStartTime, isRunning } = get()
      if (!isRunning || !activeTaskId || !sessionStartTime) return
      
      try {
        const now = new Date()
        const sessionDuration = Math.floor((now - sessionStartTime) / 1000)
        
        // Get current task
        const task = await window.db.getTask(activeTaskId)
        if (!task) return
        
        const newTimeSpent = (task.timeSpent || 0) + sessionDuration
        
        // Update task with current accumulated time and reset start time
        await window.db.updateTask(activeTaskId, {
          timeSpent: newTimeSpent,
          lastStartTime: now, // Reset start time to now
          updatedAt: now
        })
        
        // Reset local session start time
        set({ sessionStartTime: now })
        
        console.log(`Periodic save: ${sessionDuration} seconds added to task ${activeTaskId}`)
        
      } catch (error) {
        console.error('Failed to save session progress:', error)
      }
    },

    // Check if task timer is active
    isTaskTimerActive: (task) => {
      return task && task.lastStartTime !== null
    },

    // Load task timer from database (for display purposes)
    loadTaskTimer: async (taskId) => {
      try {
        const task = await window.db.getTask(taskId)
        if (!task) return { hours: 0, minutes: 0, seconds: 0 }
        
        return get().secondsToTimer(task.timeSpent || 0)
      } catch (error) {
        console.error('Failed to load task timer:', error)
        return { hours: 0, minutes: 0, seconds: 0 }
      }
    }
  }))
)

export default useTimerStore