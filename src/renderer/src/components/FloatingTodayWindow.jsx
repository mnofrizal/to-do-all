import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Settings, Home, Maximize2, ChevronDown, Minimize2 } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Progress } from './ui/progress'

const FloatingTodayWindow = ({ onClose, onFocusMode, todayTasks = [] }) => {
  const [tasks, setTasks] = useState(todayTasks)
  const [activeTask, setActiveTask] = useState(null)
  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 36 })
  const [newTaskInput, setNewTaskInput] = useState('')
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Timer logic
  useEffect(() => {
    let interval = null
    if (isTimerRunning && activeTask) {
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
  }, [isTimerRunning, activeTask])

  // Initialize with sample tasks if none provided
  useEffect(() => {
    if (tasks.length === 0) {
      setTasks([
        {
          id: 1,
          title: 'RAB dan ANALISA',
          time: '0min',
          estimate: '0min',
          priority: 'K',
          priorityColor: 'bg-blue-500',
          isActive: true
        },
        {
          id: 2,
          title: 'Test to do 2 makan enak maka...',
          time: '10min',
          estimate: '10min',
          priority: 'K',
          priorityColor: 'bg-blue-500'
        },
        {
          id: 3,
          title: 'edwf',
          time: '0min',
          estimate: '0min',
          priority: 'T',
          priorityColor: 'bg-yellow-500'
        },
        {
          id: 4,
          title: 'kamu takj tauu satasdsasa',
          time: '0min',
          estimate: '0min',
          priority: 'T',
          priorityColor: 'bg-yellow-500'
        },
        {
          id: 5,
          title: 'masak sate',
          time: '10hr',
          estimate: '0min',
          priority: 'K',
          priorityColor: 'bg-blue-500'
        },
        {
          id: 6,
          title: 'qwdqwdq',
          time: '0min',
          estimate: '0min',
          priority: 'T',
          priorityColor: 'bg-purple-500'
        },
        {
          id: 7,
          title: 'sarapan apg',
          time: '0min',
          estimate: '0min',
          priority: 'T',
          priorityColor: 'bg-purple-500'
        }
      ])
      setActiveTask(1) // Set first task as active
      setIsTimerRunning(true) // Auto-start timer when floating mode opens
    }
  }, [tasks.length])

  // Auto-start timer when component mounts and activeTask is set
  useEffect(() => {
    if (activeTask && !isTimerRunning) {
      setIsTimerRunning(true)
    }
  }, [activeTask])

  const handleTaskClick = (taskId) => {
    setActiveTask(taskId)
    setIsTimerRunning(true)
  }

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      const newTask = {
        id: Date.now(),
        title: newTaskInput,
        time: '0min',
        estimate: '0min',
        priority: 'T',
        priorityColor: 'bg-gray-500'
      }
      setTasks([...tasks, newTask])
      setNewTaskInput('')
    }
  }

  const formatTime = (time) => {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`
  }

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length
  
  // Calculate progress based on time spent vs estimates
  const totalEstimateMinutes = tasks.reduce((total, task) => {
    const estimate = task.estimate || '0min'
    const minutes = parseInt(estimate.replace(/[^\d]/g, '')) || 0
    return total + minutes
  }, 0)
  
  const currentProgressMinutes = timer.hours * 60 + timer.minutes
  const progressPercentage = totalEstimateMinutes > 0
    ? Math.min((currentProgressMinutes / totalEstimateMinutes) * 100, 100)
    : (completedTasks / totalTasks) * 100

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
              Est: {Math.floor(totalEstimateMinutes / 60)}hr {totalEstimateMinutes % 60}min
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

          {/* Active Task Timer */}
          {activeTask && (
            <div className="mx-4 mb-4">
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 dark:bg-primary/10">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {tasks.find(t => t.id === activeTask)?.title || 'RAB dan ANALISA'}
                  </span>
                  <span className="font-mono text-xl font-bold text-foreground">
                    {formatTime(timer)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent dark:hover:bg-accent ${
                    task.id === activeTask 
                      ? 'border-primary bg-primary/10 dark:bg-primary/20' 
                      : 'border-border bg-card dark:bg-card hover:border-primary/50'
                  }`}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-1 items-start gap-2">
                      <Badge 
                        className={`${task.priorityColor} text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center`}
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-sm leading-5 text-foreground">{task.title}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>+ EST</span>
                    <span>{task.estimate}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task */}
            <div className="mt-4 border-t border-border pt-4">
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
          </div>
      </div>

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