import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import HomePage from './components/HomePage'
import TaskProgress from './components/TaskProgress'
import TitleBar from './components/TitleBar'
import TopNavbar from './components/TopNavbar'
import { ThemeProvider } from './contexts/ThemeContext'

const App = () => {
  const [activeMenu, setActiveMenu] = useState('home')
  const [currentView, setCurrentView] = useState('home') // 'home' or 'taskProgress'
  const [selectedList, setSelectedList] = useState(null)
  const [activeTaskView, setActiveTaskView] = useState('kanban')

  const handleCardClick = (list) => {
    setSelectedList(list)
    setCurrentView('taskProgress')
  }

  const handleBackToHome = () => {
    setCurrentView('home')
    setSelectedList(null)
  }

  const handleTaskClick = (task) => {
    setActiveTaskView('timeline')
  }

  const renderContent = () => {
    if (currentView === 'taskProgress') {
      return <TaskProgress onBack={handleBackToHome} selectedList={selectedList} activeView={activeTaskView} onTaskClick={handleTaskClick} />
    }

    switch (activeMenu) {
      case 'home':
        return <HomePage onCardClick={handleCardClick} />
      case 'tasks':
        return (
          <div className="p-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
              <p className="text-muted-foreground">Manage your tasks here.</p>
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Tasks page coming soon...</p>
              </div>
            </div>
          </div>
        )
      case 'calendar':
        return (
          <div className="p-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
              <p className="text-muted-foreground">View your schedule here.</p>
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Calendar page coming soon...</p>
              </div>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="p-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Configure your preferences here.</p>
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">Settings page coming soon...</p>
              </div>
            </div>
          </div>
        )
      default:
        return <HomePage />
    }
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          {currentView !== 'taskProgress' && (
            <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
          )}
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopNavbar
              currentView={currentView}
              activeMenu={activeMenu}
              onBack={handleBackToHome}
              selectedList={selectedList}
              activeTaskView={activeTaskView}
              setActiveTaskView={setActiveTaskView}
            />
            <main className="flex-1 overflow-y-auto">
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
