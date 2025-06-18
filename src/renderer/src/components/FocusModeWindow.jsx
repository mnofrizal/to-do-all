import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GripVertical,
  Minus,
  Gamepad2,
  FileText,
  Pause,
  Play,
  SkipForward,
  CheckCircle,
  CheckCircle2,
  Expand,
  Maximize2,
  Coffee
} from 'lucide-react'
import { Button } from './ui/button'

const FocusModeWindow = ({
  onBack,
  onDone,
  activeTask,
  timer,
  isTimerRunning,
  onToggleTimer,
  onCompleteTask,
  onSkipTask,
  onToggleNotes,
  // Add database integration props
  selectedList,
  onTaskUpdate,
  taskColumns,
  setTaskColumns
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // Completion celebration modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completedTaskTitle, setCompletedTaskTitle] = useState('')
  const [taskCompletionTime, setTaskCompletionTime] = useState(0)

  // Cursor tracking effect
  useEffect(() => {
    // Start cursor tracking when component mounts
    if (window.api?.cursorTracking) {
      window.api.cursorTracking.start()
      
      const handleCursorUpdate = (event, data) => {
        setIsHovered(data.isOverWindow)
      }
      
      window.api.cursorTracking.onUpdate(handleCursorUpdate)
      
      return () => {
        window.api.cursorTracking.stop()
        window.api.cursorTracking.removeListener(handleCursorUpdate)
      }
    }
  }, [])

  // Position tracking effect
  useEffect(() => {
    // Start position tracking when component mounts
    if (window.api?.positionTracking) {
      window.api.positionTracking.start()
      
      return () => {
        window.api.positionTracking.stop()
      }
    }
  }, [])

  const formatTime = (time) => {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`
  }

  const handleMinimize = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('window-minimize')
    }
  }

  const handleExpand = () => {
    // Go back to floating mode
    if (onBack) {
      onBack()
    }
  }

  // Database completion functions (same as FloatingTodayWindow)
  const handleCompleteTask = async () => {
    if (!activeTask) return

    try {
      // If task is already completed, just toggle it back
      if (activeTask.status === 'done') {
        await completeTaskDirectly(activeTask.id)
        return
      }

      // Show completion celebration modal
      setCompletedTaskTitle(activeTask.title)
      setTaskCompletionTime(timer?.hours * 60 + timer?.minutes || 0)
      setShowCompletionModal(true)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  // Function to actually complete the task (called from modal)
  const completeTaskDirectly = async (taskId) => {
    try {
      const now = new Date().toISOString()
      const isCompleted = activeTask.status === 'done'
      const status = isCompleted ? 'inprogress' : 'done'
      const completedAt = isCompleted ? null : now

      // Update database
      await window.db.updateTask(taskId, { status, completedAt, updatedAt: now })

      // Update parent state if available
      if (taskColumns && setTaskColumns && onTaskUpdate) {
        const updatedColumns = taskColumns.map(col => {
          if (col.tasks.some(t => t.id === taskId)) {
            return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          }
          if (col.id === status) {
            return {
              ...col,
              tasks: [...col.tasks, {
                ...activeTask,
                status,
                completedAt,
                updatedAt: now
              }]
            }
          }
          return col
        })
        
        setTaskColumns(updatedColumns)
        onTaskUpdate(updatedColumns)
      }

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

  // Enhanced skip function
  const handleSkipTask = async () => {
    if (!activeTask || !selectedList) {
      onSkipTask() // Call parent's skip handler to reset timer and move to next
      return
    }
    
    try {
      // Move the skipped task to the bottom of the today list by updating its orderInColumn
      // Get all tasks from database to find the current max order
      const allTasks = await window.db.getTasks(selectedList.id)
      const todayTasks = allTasks.filter(task => task.scheduledForToday === true && task.status !== 'done')
      
      if (todayTasks.length > 0) {
        // Find the highest orderInColumn value in today's tasks
        const maxOrder = Math.max(...todayTasks.map(t => t.orderInColumn || 0), 0)
        
        // Update the skipped task's orderInColumn to be at the bottom
        await window.db.updateTask(activeTask.id, {
          orderInColumn: maxOrder + 1,
          updatedAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to move skipped task to bottom in focus mode:', error)
    }
    
    // Reset timer when skipping task and move to next task
    onSkipTask() // Call parent's skip handler to reset timer and move to next
  }

  const handleComplete = () => {
    handleCompleteTask()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex h-full w-full items-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.98 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          display: isHovered ? "flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          zIndex: 20,
        }}
      >
        <div
          className="flex w-full cursor-move items-center justify-center px-4 py-1.5"
          style={{ WebkitAppRegion: 'drag' }}
        >
          {/* Control Buttons - Non-draggable */}
          <div
            className='flex items-center justify-center'
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <div className='flex items-center justify-center gap-2 bg-white dark:border-zinc-700 dark:bg-zinc-800'>
              {/* Minimize */}
              <ButtonWithLabel icon={Minus} label="Mini..." onClick={handleMinimize} />
              {/* Document/Notes */}
              <ButtonWithLabel
                icon={FileText}
                label="Notes"
                onClick={() => onToggleNotes && onToggleNotes(activeTask?.id)}
              />
              {/* Pause/Play Toggle */}
              <ButtonWithLabel
                icon={isTimerRunning ? Pause : Play}
                label={isTimerRunning ? "Pause" : "Play"}
                onClick={onToggleTimer}
              />
              {/* Next */}
              <ButtonWithLabel
                icon={SkipForward}
                label="Next"
                onClick={handleSkipTask}
              />
              {/* Check */}
              <CheckWithLabel onClick={handleComplete} />
              {/* Expand */}
              <ButtonWithLabel icon={Maximize2} label="Expand" onClick={handleExpand} />
            </div>
          </div>
        </div>
      </motion.div>
      
      {!isHovered && activeTask && (
        <div
          className="flex w-full items-center justify-between p-4 text-center"
        >
          <h1 className="text-base font-semibold tracking-wider text-foreground">
            {activeTask.title}
          </h1>
          <div className="text-lg font-bold tracking-wider text-foreground">
            {isTimerRunning ? formatTime(timer) : "PAUSED"}
          </div>
        </div>
      )}

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
                <div className="mb-2 text-sm font-medium text-green-600 dark:text-green-400">
                  Bikin PR
                </div>
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
                <p className="text-lg font-medium text-green-600 dark:text-green-400">
                  You finished the task!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  "{completedTaskTitle}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleNextTask}
                  className="w-full rounded-full bg-gradient-to-r from-green-400 to-green-600 py-3 text-white hover:from-green-500 hover:to-green-700"
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Next Task
                </Button>
                <Button
                  onClick={handleTakeBreak}
                  variant="ghost"
                  className="w-full py-3 text-muted-foreground hover:text-foreground"
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
    </motion.div>
  )
}

const ButtonWithLabel = ({ icon: Icon, label, onClick }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.button
      className="flex items-center justify-center rounded-full"
      aria-label={label}
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      initial={false}
      animate={{
        width: hovered ? 80 : 24,
        paddingLeft: hovered ? 6 : 2,
        paddingRight: hovered ? 6 : 2,
        paddingTop: 2,
        paddingBottom: 2,
      
        backgroundColor: hovered ? "rgb(228 228 231)" : "transparent"
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.25
      }}
      style={{
        borderStyle: "solid",
        minHeight: 24,
        overflow: "hidden"
      }}
    >
      <Icon size={14} strokeWidth={2} className="text-zinc-600"/>
      <motion.span
        initial={{ opacity: 0, width: 0 }}
        animate={{
          opacity: hovered ? 1 : 0,
          width: hovered ? "auto" : 0
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="ml-1 select-none text-xs font-medium text-zinc-700"
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden"
        }}
      >
        {label}
      </motion.span>
    </motion.button>
  )
}

const CheckWithLabel = ({ onClick }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.button
      className="flex items-center justify-center rounded-full bg-white"
      aria-label="Check"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      initial={false}
      animate={{
        width: hovered ? 80 : 24,
        paddingLeft: hovered ? 6 : 2,
        paddingRight: hovered ? 6 : 2,
        paddingTop: 2,
        paddingBottom: 2,
        borderWidth: hovered ? 1 : 0,
        borderColor: hovered ? "#22c55e" : "transparent"
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.25
      }}
      style={{
        borderStyle: "solid",
        minHeight: 24,
        overflow: "hidden"
      }}
    >
      <CheckCircle size={14} stroke="#22c55e" strokeWidth={2} />
      <motion.span
        initial={{ opacity: 0, width: 0 }}
        animate={{
          opacity: hovered ? 1 : 0,
          width: hovered ? "auto" : 0
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="ml-1 select-none text-xs font-medium text-green-600"
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden"
        }}
      >
        Done
      </motion.span>
    </motion.button>
  )
}

export default FocusModeWindow
