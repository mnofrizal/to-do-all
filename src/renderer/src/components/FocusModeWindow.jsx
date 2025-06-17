import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GripVertical,
  Minus,
  Gamepad2,
  FileText,
  Pause,
  Play,
  SkipForward,
  CheckCircle,
  Expand,
  Maximize2
} from 'lucide-react'

const FocusModeWindow = ({ 
  onBack, 
  onDone,
  activeTask,
  timer,
  isTimerRunning,
  onToggleTimer,
  onCompleteTask,
  onSkipTask,
  onToggleNotes
}) => {
  const [isHovered, setIsHovered] = useState(false)

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

  const handleComplete = () => {
    if (activeTask && onCompleteTask) {
      onCompleteTask(activeTask.id)
    }
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
                onClick={onSkipTask}
              />
              {/* Check */}
              <CheckWithLabel onClick={handleComplete} />
              {/* Expand */}
              <ButtonWithLabel icon={Maximize2} label="Expand" onClick={handleExpand} />
            </div>
          </div>
        </div>
      </motion.div>
      {!isHovered && (
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
