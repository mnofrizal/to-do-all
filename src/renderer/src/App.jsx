import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import HomePage from './components/HomePage'
import TaskProgress from './components/TaskProgress'
import TitleBar from './components/TitleBar'
import TopNavbar from './components/TopNavbar'
import FloatingTodayWindow from './components/FloatingTodayWindow'
import FocusModeWindow from './components/FocusModeWindow'
import { ThemeProvider } from './contexts/ThemeContext'

const App = () => {
  const [activeMenu, setActiveMenu] = useState('home')
  const [currentView, setCurrentView] = useState('home') // 'home' | 'taskProgress' | 'floating'
  const [selectedList, setSelectedList] = useState(null)
  const [activeTaskView, setActiveTaskView] = useState('kanban')
  const [windowMode, setWindowMode] = useState('normal') // 'normal' | 'floating' | 'focus'

  const handleCardClick = (list) => {
    setSelectedList(list)
    setCurrentView('taskProgress')
  }

  const handleBackToHome = () => {
    if (windowMode === 'floating') {
      handleBackToNormal()
    } else {
      setCurrentView('home')
      setSelectedList(null)
    }
  }

  const handleLeapIt = () => {
    // Switch to floating mode
    setCurrentView('floating')
    setWindowMode('floating')
    
    // Request window resize to floating dimensions
    if (window.api && window.api.windowControls && window.api.windowControls.resizeToFloating) {
      window.api.windowControls.resizeToFloating()
    }
  }

  const handleFocusMode = () => {
    // Switch to focus mode
    setCurrentView('focus')
    setWindowMode('focus')
    
    // Request window resize to focus dimensions, disable resizing, and hide window controls
    if (window.api && window.api.windowControls) {
      if (window.api.windowControls.resizeToFocus) {
        window.api.windowControls.resizeToFocus()
      }
      if (window.api.windowControls.setResizable) {
        window.api.windowControls.setResizable(false)
      }
      if (window.api.windowControls.hideWindowControls) {
        window.api.windowControls.hideWindowControls()
      }
    }
  }

  const handleBackToFloating = () => {
    // Switch back to floating mode
    setCurrentView('floating')
    setWindowMode('floating')
    
    // Request window resize to floating dimensions, re-enable resizing, and show window controls
    if (window.api && window.api.windowControls) {
      if (window.api.windowControls.setResizable) {
        window.api.windowControls.setResizable(true)
      }
      if (window.api.windowControls.showWindowControls) {
        window.api.windowControls.showWindowControls()
      }
      if (window.api.windowControls.resizeToFloating) {
        window.api.windowControls.resizeToFloating()
      }
    }
  }

  const handleBackToNormal = () => {
    // Switch back to normal mode
    setCurrentView('taskProgress')
    setWindowMode('normal')
    
    // Request window resize to normal dimensions, re-enable resizing, and show window controls
    if (window.api && window.api.windowControls) {
      if (window.api.windowControls.setResizable) {
        window.api.windowControls.setResizable(true)
      }
      if (window.api.windowControls.showWindowControls) {
        window.api.windowControls.showWindowControls()
      }
      if (window.api.windowControls.resizeToNormal) {
        window.api.windowControls.resizeToNormal()
      }
    }
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
            onClose={handleBackToNormal}
            onFocusMode={handleFocusMode}
            todayTasks={todayTasks}
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
            <HomePage onCardClick={handleCardClick} />
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
            <HomePage onCardClick={handleCardClick} />
          </motion.div>
        )
    }
  }

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
