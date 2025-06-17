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

const FocusModeWindow = ({ onBack, onDone }) => {
  const [timer, setTimer] = useState({ hours: 0, minutes: 59, seconds: 28 })
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [activeTask] = useState({
    id: 1,
    title: 'RAB dan ANALISA'
  })
  const [isHovered, setIsHovered] = useState(false)

  // Timer logic
  useEffect(() => {
    let interval = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          let newSeconds = prev.seconds + 1
          let newMinutes = prev.minutes
          let newHours = prev.hours

          if (newSeconds >= 60) {
            newSeconds = 0
            newMinutes += 1
          }
          if (newMinutes >= 60) {
            newMinutes = 0
            newHours += 1
          }

          return { hours: newHours, minutes: newMinutes, seconds: newSeconds }
        })
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

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

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex h-full w-full items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          className="flex w-full items-center justify-between py-1.5"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {/* Drag Handle */}
          <div className='flex items-center'>
            <span
              className="flex items-center justify-center pl-2"
              style={{ WebkitAppRegion: 'drag' }}
              aria-label="Drag"
              tabIndex={0}
            >
              <GripVertical size={25} strokeWidth={2} className='text-black' />
            </span>
          </div>
          <div className='flex-1 px-10'>
            <div className='flex items-center justify-between bg-white dark:border-zinc-700 dark:bg-zinc-800'>
        
              {/* Minimize */}
              <ButtonWithLabel icon={Minus} label="Mini..." onClick={handleMinimize} />
              {/* Document/Notes */}
              <ButtonWithLabel icon={FileText} label="Notes" />
              {/* Pause/Play Toggle */}
              <ButtonWithLabel
                icon={isTimerRunning ? Pause : Play}
                label={isTimerRunning ? "Pause" : "Play"}
                onClick={handleToggleTimer}
              />
              {/* Next */}
              <ButtonWithLabel icon={SkipForward} label="Next" />
              {/* Check */}
              <CheckWithLabel />
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

const CheckWithLabel = () => {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.button
      className="flex items-center justify-center rounded-full bg-white"
      aria-label="Check"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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