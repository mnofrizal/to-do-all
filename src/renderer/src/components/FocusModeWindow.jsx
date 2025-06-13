import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const FocusModeWindow = ({ onBack, onDone }) => {
  const [timer, setTimer] = useState({ hours: 0, minutes: 59, seconds: 28 })
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [activeTask] = useState({
    id: 1,
    title: 'RAB dan ANALISA'
  })

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex h-full w-full items-center p-4"
    >
      {/* Task Title and Timer - Compact Layout */}
      <div className="flex w-full items-center justify-between text-center">
        <h1 className="text-base tracking-wider text-foreground">
          {activeTask.title}
        </h1>
        <div className="text-xl font-semibold text-foreground">
          {formatTime(timer)}
        </div>
      </div>
    </motion.div>
  )
}

export default FocusModeWindow