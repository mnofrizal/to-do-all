import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const useTimerStore = create(
  subscribeWithSelector((set, get) => ({
    // Current active timer (global display)
    timer: { hours: 0, minutes: 0, seconds: 0 },
    isRunning: false,
    intervalId: null,
    
    // Per-task timer tracking
    taskTimers: {}, // { taskId: { hours: 0, minutes: 0, seconds: 0 } }
    activeSessions: {}, // { taskId: sessionId }
    activeTaskId: null,
    sessionStartTime: null, // Track when current session started
    
    // Timer actions
    start: () => {
      const { isRunning, intervalId } = get()
      if (isRunning || intervalId) return
      
      const id = setInterval(() => {
        set((state) => {
          const { timer, activeTaskId, taskTimers } = state
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

          const newTimer = { hours: newHours, minutes: newMinutes, seconds: newSeconds }
          
          // Update both global timer and task-specific timer if there's an active task
          const updatedTaskTimers = activeTaskId ? {
            ...taskTimers,
            [activeTaskId]: newTimer
          } : taskTimers

          return {
            timer: newTimer,
            taskTimers: updatedTaskTimers
          }
        })
      }, 1000)
      
      set({ isRunning: true, intervalId: id })
    },
    
    pause: () => {
      const { intervalId } = get()
      if (intervalId) {
        clearInterval(intervalId)
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
      if (intervalId) {
        clearInterval(intervalId)
      }
      set({
        timer: { hours: 0, minutes: 0, seconds: 0 },
        isRunning: false,
        intervalId: null
      })
    },
    
    // Per-task timer management
    switchToTask: async (taskId, userId) => {
      const { activeTaskId, isRunning, intervalId } = get()
      
      try {
        // End current session if there's an active task and timer is running
        if (activeTaskId && isRunning) {
          await get().endCurrentSession()
        }
        
        // Stop the current timer interval
        if (intervalId) {
          clearInterval(intervalId)
        }
        
        // Load the new task's accumulated time from database
        const totalSeconds = await window.db.getTaskTotalTime(taskId)
        const taskTimer = get().secondsToTimer(totalSeconds)
        
        // Update state with new task timer - RESET the timer to task's accumulated time
        set({
          activeTaskId: taskId,
          timer: taskTimer, // Set timer to task's accumulated time
          taskTimers: {
            ...get().taskTimers,
            [taskId]: taskTimer
          },
          isRunning: false,
          intervalId: null
        })
        
      } catch (error) {
        console.error('Failed to switch task:', error)
      }
    },
    
    startNewSession: async (taskId, userId) => {
      try {
        const sessionStart = new Date()
        const session = await window.db.createTimeSession({
          taskId,
          userId,
          startTime: sessionStart
        })
        
        set((state) => ({
          activeSessions: {
            ...state.activeSessions,
            [taskId]: session.id
          },
          sessionStartTime: sessionStart
        }))
        
        return session
      } catch (error) {
        console.error('Failed to start new session:', error)
        throw error
      }
    },
    
    endCurrentSession: async () => {
      const { activeTaskId, activeSessions, timer, sessionStartTime } = get()
      if (!activeTaskId || !activeSessions[activeTaskId]) return
      
      try {
        const sessionId = activeSessions[activeTaskId]
        
        // Calculate ONLY the time spent in this session (not total accumulated time)
        const sessionDuration = get().getSessionDuration()
        
        
        await window.db.endTimeSession(sessionId, new Date(), sessionDuration)
        
        // Remove from active sessions
        set((state) => {
          const newActiveSessions = { ...state.activeSessions }
          delete newActiveSessions[activeTaskId]
          return {
            activeSessions: newActiveSessions,
            sessionStartTime: null
          }
        })
        
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    },
    
    // Start timer for specific task
    startForTask: async (taskId, userId) => {
      const { isRunning, activeTaskId } = get()
      if (isRunning) return // Already running
      
      try {
        // If switching to a different task, switch first
        if (activeTaskId !== taskId) {
          await get().switchToTask(taskId, userId)
        }
        
        // Start new session and timer
        await get().startNewSession(taskId, userId)
        get().start()
        
      } catch (error) {
        console.error('Failed to start timer for task:', error)
      }
    },
    
    // Pause timer and end session
    pauseForTask: async () => {
      const { isRunning } = get()
      if (!isRunning) return
      
      try {
        await get().endCurrentSession()
        get().pause()
      } catch (error) {
        console.error('Failed to pause timer for task:', error)
      }
    },
    
    // Get timer for specific task
    getTaskTimer: (taskId) => {
      const { taskTimers } = get()
      return taskTimers[taskId] || { hours: 0, minutes: 0, seconds: 0 }
    },
    
    // Load task timer from database
    loadTaskTimer: async (taskId) => {
      try {
        const totalSeconds = await window.db.getTaskTotalTime(taskId)
        const taskTimer = get().secondsToTimer(totalSeconds)
        
        set((state) => ({
          taskTimers: {
            ...state.taskTimers,
            [taskId]: taskTimer
          }
        }))
        
        return taskTimer
      } catch (error) {
        console.error('Failed to load task timer:', error)
        return { hours: 0, minutes: 0, seconds: 0 }
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

    // Get duration of current session only (not total accumulated time)
    getSessionDuration: () => {
      const { sessionStartTime } = get()
      if (!sessionStartTime) return 0
      
      const now = new Date()
      const sessionDurationMs = now - new Date(sessionStartTime)
      const sessionDurationSeconds = Math.floor(sessionDurationMs / 1000)
      
      return sessionDurationSeconds
    },
    
    // Format timer for display
    formatTime: (customTimer = null) => {
      const timerToFormat = customTimer || get().timer
      return `${timerToFormat.hours.toString().padStart(2, '0')}:${timerToFormat.minutes.toString().padStart(2, '0')}:${timerToFormat.seconds.toString().padStart(2, '0')}`
    },
    
    // Format task timer for display
    formatTaskTime: (taskId) => {
      const taskTimer = get().getTaskTimer(taskId)
      return get().formatTime(taskTimer)
    },
    
    // Get total minutes
    getTotalMinutes: (customTimer = null) => {
      const timerToUse = customTimer || get().timer
      return timerToUse.hours * 60 + timerToUse.minutes
    },
    
    // Get total minutes for task
    getTaskTotalMinutes: (taskId) => {
      const taskTimer = get().getTaskTimer(taskId)
      return get().getTotalMinutes(taskTimer)
    },
    
    // Cleanup on unmount
    cleanup: async () => {
      const { intervalId, isRunning } = get()
      
      // End current session if running
      if (isRunning) {
        await get().endCurrentSession()
      }
      
      // Clear interval
      if (intervalId) {
        clearInterval(intervalId)
      }
      
      set({
        intervalId: null,
        isRunning: false,
        activeSessions: {},
        activeTaskId: null,
        sessionStartTime: null
      })
    },
    
    // Periodic save (call this every 30 seconds when timer is running)
    periodicSave: async () => {
      const { activeTaskId, activeSessions, isRunning } = get()
      if (!isRunning || !activeTaskId || !activeSessions[activeTaskId]) return
      
      try {
        const sessionId = activeSessions[activeTaskId]
        const sessionDuration = get().getSessionDuration()
        
        // Update session with current session duration (but don't end it)
        await window.db.updateTimeSession(sessionId, { duration: sessionDuration })
      } catch (error) {
        console.error('Failed to save session progress:', error)
      }
    },

    // Debug methods
    debugTaskSessions: async (taskId) => {
      try {
        const sessions = await window.db.getAllTaskSessions(taskId)
        console.log(`=== DEBUG: All sessions for task ${taskId} ===`)
        sessions.forEach((session, index) => {
          console.log(`Session ${index + 1}:`, {
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            createdAt: session.createdAt
          })
        })
        const totalTime = await window.db.getTaskTotalTime(taskId)
        console.log(`Total calculated time: ${totalTime} seconds`)
        return sessions
      } catch (error) {
        console.error('Failed to debug task sessions:', error)
        return []
      }
    },

    clearTaskData: async (taskId) => {
      try {
        await window.db.clearTaskTimeSessions(taskId)
        set((state) => {
          const newTaskTimers = { ...state.taskTimers }
          delete newTaskTimers[taskId]
          return {
            taskTimers: newTaskTimers,
            timer: state.activeTaskId === taskId ? { hours: 0, minutes: 0, seconds: 0 } : state.timer,
            activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId
          }
        })
      } catch (error) {
        console.error('Failed to clear task data:', error)
      }
    }
  }))
)

export default useTimerStore