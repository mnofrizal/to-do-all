import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import HomePage from './components/HomePage'
import TaskProgress from './components/TaskProgress'
import TitleBar from './components/TitleBar'
import TopNavbar from './components/TopNavbar'
import FloatingTodayWindow from './components/FloatingTodayWindow'
import FocusModeWindow from './components/FocusModeWindow'
import Login from './components/Login'
import { ThemeProvider } from './contexts/ThemeContext'
import useAppStore from './stores/useAppStore'
import useTimerStore from './stores/useTimerStore'
import useTaskStore from './stores/useTaskStore'

const App = () => {
  // Zustand stores
  const {
    currentUser,
    isAuthChecking,
    activeMenu,
    currentView,
    windowMode,
    activeWorkspace,
    selectedList,
    activeTaskView,
    initializeAuth,
    login,
    logout,
    setActiveMenu,
    navigateToTaskProgress,
    navigateToHome,
    enterFloatingMode,
    enterFocusMode,
    exitSpecialModes,
    setActiveTaskView,
    setSelectedList,
    fetchWorkspaceLists,
    setActiveWorkspace
  } = useAppStore()

  const {
    timer,
    isRunning: isTimerRunning,
    start: startTimer,
    pause: pauseTimer,
    toggle: toggleTimer,
    reset: resetTimer,
    cleanup: cleanupTimer,
    switchToTask,
    startForTask,
    pauseForTask,
    loadTaskTimer,
    formatTaskTime,
    periodicSave
  } = useTimerStore()

  const {
    activeTask,
    setActiveTask,
    loadTasks
  } = useTaskStore()

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => cleanupTimer()
  }, [cleanupTimer])

  // Periodic save timer data every 30 seconds
  useEffect(() => {
    if (isTimerRunning) {
      const saveInterval = setInterval(() => {
        periodicSave()
      }, 30000) // Save every 30 seconds

      return () => clearInterval(saveInterval)
    }
  }, [isTimerRunning, periodicSave])

  // Authentication handlers
  const handleLogin = (user) => {
    login(user)
  }

  const handleLogout = () => {
    logout()
    resetTimer()
  }

  const handleToggleTimer = async () => {
    if (activeTask && currentUser) {
      if (isTimerRunning) {
        await pauseForTask()
      } else {
        await startForTask(activeTask.id, currentUser.id)
      }
    } else {
      toggleTimer()
    }
  }

  const handleActivateTask = async (task) => {
    setActiveTask(task)
    if (currentUser) {
      await switchToTask(task.id, currentUser.id)
      await startForTask(task.id, currentUser.id)
    } else {
      startTimer()
    }
  }

  const handleCompleteTask = async (taskId) => {
    // Stop timer when task is completed
    if (isTimerRunning) {
      await pauseForTask()
    }
    
    // Move to next task in floating or focus mode
    if ((currentView === 'floating' || currentView === 'focus') && selectedList) {
      try {
        // Get today's tasks from database (incomplete only, excluding the just completed task)
        const allTasks = await window.db.getTasks(selectedList.id)
        const todayTasks = allTasks.filter(task =>
          task.scheduledForToday === true && task.status !== 'done' && task.id !== taskId
        )
        
        if (todayTasks.length > 0) {
          const currentIndex = todayTasks.findIndex(task => task.id === activeTask?.id)
          let nextIndex = currentIndex + 1
          
          // If current task was the completed one, start from beginning
          if (currentIndex === -1) {
            nextIndex = 0
          }
          
          if (nextIndex < todayTasks.length) {
            // Move to next task and switch timer
            const nextTask = todayTasks[nextIndex]
            setActiveTask(nextTask)
            if (currentUser) {
              await switchToTask(nextTask.id, currentUser.id)
              await startForTask(nextTask.id, currentUser.id)
            } else {
              startTimer()
            }
          } else {
            // No more tasks, deactivate
            setActiveTask(null)
          }
        } else {
          setActiveTask(null)
        }
      } catch (error) {
        console.error('Failed to get tasks for completion:', error)
        setActiveTask(null)
      }
    } else {
      // In normal mode, go back to normal view
      setActiveTask(null)
      exitSpecialModes()
    }
  }

  const handleSkipTask = async () => {
    // Pause current timer when skipping task
    if (isTimerRunning) {
      await pauseForTask()
    }
    
    // Move to next task in floating or focus mode
    if ((currentView === 'floating' || currentView === 'focus') && selectedList && activeTask) {
      try {
        // Get today's tasks from database (incomplete only)
        const allTasks = await window.db.getTasks(selectedList.id)
        const todayTasks = allTasks.filter(task =>
          task.scheduledForToday === true && task.status !== 'done'
        )
        
        if (todayTasks.length > 0) {
          const currentIndex = todayTasks.findIndex(task => task.id === activeTask?.id)
          const nextIndex = currentIndex + 1
          
          if (nextIndex < todayTasks.length) {
            // Move to next task and switch timer
            const nextTask = todayTasks[nextIndex]
            setActiveTask(nextTask)
            if (currentUser) {
              await switchToTask(nextTask.id, currentUser.id)
              await startForTask(nextTask.id, currentUser.id)
            } else {
              startTimer()
            }
          } else {
            // No more tasks, deactivate
            setActiveTask(null)
          }
        } else {
          setActiveTask(null)
        }
      } catch (error) {
        console.error('Failed to get tasks for skip:', error)
        setActiveTask(null)
      }
    } else {
      setActiveTask(null)
    }
  }

  const handleCardClick = (list) => {
    navigateToTaskProgress(list)
  }

  const handleListChange = (list) => {
    setSelectedList(list)
  }

  const handleBackToHome = async () => {
    if (windowMode === 'floating') {
      // Auto-pause timer when exiting floating mode
      if (isTimerRunning) {
        await pauseForTask()
      }
      exitSpecialModes()
    } else {
      navigateToHome()
    }
  }

  const handleLeapIt = async () => {
    // Auto-resume timer when entering floating mode if there's an active task
    if (activeTask && !isTimerRunning && currentUser) {
      await switchToTask(activeTask.id, currentUser.id)
      await startForTask(activeTask.id, currentUser.id)
    } else if (activeTask && !isTimerRunning) {
      startTimer()
    }
    enterFloatingMode()
  }

  const handleFocusMode = () => {
    enterFocusMode()
  }

  const handleBackToFloating = () => {
    // Switch back to floating mode
    enterFloatingMode()
  }

  const handleBackToNormal = () => {
    exitSpecialModes()
  }

  const handleTaskClick = (task) => {
    setActiveTaskView('timeline')
  }

  // Instant page switching - no transition delays
  const pageVariants = {
    initial: { opacity: 1, x: 0 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 1, x: 0 }
  }

  const pageTransition = {
    duration: 0
  }

  const renderContent = () => {
    // Handle focus mode
    if (currentView === 'focus') {
      return (
        <motion.div
          key="focus"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="h-full"
        >
          <FocusModeWindow
            onBack={handleBackToFloating}
            onDone={handleBackToNormal}
            activeTask={activeTask}
            timer={timer}
            isTimerRunning={isTimerRunning}
            onToggleTimer={handleToggleTimer}
            onCompleteTask={handleCompleteTask}
            onSkipTask={handleSkipTask}
            onToggleNotes={(taskId) => {
              // Handle notes toggling
              console.log('Toggle notes for task:', taskId)
            }}
            selectedList={selectedList}
            onTaskUpdate={(updatedColumns) => {
              // Update the selectedList with new task data
              if (selectedList) {
                const allTasks = [
                  ...(updatedColumns.today || []),
                  ...(updatedColumns.thisWeek || []),
                  ...(updatedColumns.done || [])
                ]
                setSelectedList({
                  ...selectedList,
                  tasks: allTasks
                })
              }
            }}
          />
        </motion.div>
      )
    }

    // Handle floating mode
    if (currentView === 'floating') {
      const todayTasks = selectedList ? selectedList.tasks : []
      return (
        <motion.div
          key="floating"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="h-full"
        >
          <FloatingTodayWindow
            onClose={handleBackToHome}
            onFocusMode={handleFocusMode}
            selectedList={selectedList}
            todayTasks={todayTasks}
            activeTask={activeTask}
            timer={timer}
            isTimerRunning={isTimerRunning}
            onActivateTask={handleActivateTask}
            onToggleTimer={handleToggleTimer}
            onCompleteTask={handleCompleteTask}
            onSkipTask={handleSkipTask}
            onTaskUpdate={(updatedColumns) => {
              // Update the selectedList with new task data
              if (selectedList) {
                const allTasks = [
                  ...(updatedColumns.today || []),
                  ...(updatedColumns.thisWeek || []),
                  ...(updatedColumns.done || [])
                ]
                setSelectedList({
                  ...selectedList,
                  tasks: allTasks
                })
              }
            }}
          />
        </motion.div>
      )
    }

    // Handle task progress mode
    if (currentView === 'taskProgress') {
      return (
        <motion.div
          key="taskProgress"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          <TaskProgress 
            onBack={handleBackToHome} 
            selectedList={selectedList} 
            activeView={activeTaskView} 
            onTaskClick={handleTaskClick}
            onLeapIt={handleLeapIt}
          />
        </motion.div>
      )
    }

    // Handle other menu items
    switch (activeMenu) {
      case 'home':
        return (
          <motion.div
            key="home"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <HomePage onCardClick={handleCardClick} activeWorkspace={activeWorkspace} />
          </motion.div>
        )
      case 'tasks':
        return (
          <motion.div
            key="tasks"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="p-8"
          >
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
              <p className="text-muted-foreground">Manage your tasks here.</p>
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Tasks page coming soon...</p>
              </div>
            </div>
          </motion.div>
        )
      case 'calendar':
        return (
          <motion.div
            key="calendar"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="p-8"
          >
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
              <p className="text-muted-foreground">View your schedule here.</p>
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Calendar page coming soon...</p>
              </div>
            </div>
          </motion.div>
        )
      case 'settings':
        return (
          <motion.div
            key="settings"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="p-8"
          >
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Configure your preferences here.</p>
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Settings page coming soon...</p>
              </div>
            </div>
          </motion.div>
        )
      default:
        return (
          <motion.div
            key="default"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <HomePage onCardClick={handleCardClick} activeWorkspace={activeWorkspace} />
          </motion.div>
        )
    }
  }

  // Show loading screen while checking authentication
  if (isAuthChecking) {
    return (
      <ThemeProvider>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 text-3xl font-bold text-primary">TaskLeap</div>
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  // Show login screen if user is not authenticated
  if (!currentUser) {
    return (
      <ThemeProvider>
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    )
  }

  // Show main app if user is authenticated
  return (
    <ThemeProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* Hide TitleBar in floating and focus modes */}
        {windowMode !== 'floating' && windowMode !== 'focus' && <TitleBar />}
        
        <div className="relative flex-1 overflow-hidden">
          {/* Hide Sidebar in floating and focus modes */}
          <AnimatePresence>
            {currentView !== 'taskProgress' && windowMode !== 'floating' && windowMode !== 'focus' && (
              <Sidebar
                key="sidebar"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                activeWorkspace={activeWorkspace}
                setActiveWorkspace={setActiveWorkspace}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}
          </AnimatePresence>
          
          <motion.div
            className="absolute inset-0 flex flex-col overflow-hidden"
            animate={{
              left: (currentView === 'taskProgress' || windowMode === 'floating' || windowMode === 'focus') ? '0px' : '288px',
              width: (currentView === 'taskProgress' || windowMode === 'floating' || windowMode === 'focus') ? '100%' : 'calc(100% - 288px)'
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              duration: 0.4
            }}
          >
            {/* Hide TopNavbar in floating and focus modes */}
            {windowMode !== 'floating' && windowMode !== 'focus' && (
              <TopNavbar
                currentView={currentView}
                activeMenu={activeMenu}
                onBack={handleBackToHome}
                selectedList={selectedList}
                activeTaskView={activeTaskView}
                setActiveTaskView={setActiveTaskView}
                currentUser={currentUser}
                onLogout={handleLogout}
                onListChange={handleListChange}
                activeWorkspace={activeWorkspace}
              />
            )}
            
            <main className={`flex-1 overflow-y-auto ${(windowMode === 'floating' || windowMode === 'focus') ? 'h-full' : ''}`}>
              <AnimatePresence>
                {renderContent()}
              </AnimatePresence>
            </main>
          </motion.div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
