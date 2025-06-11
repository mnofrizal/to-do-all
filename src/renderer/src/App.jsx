import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import HomePage from './components/HomePage'

const App = () => {
  const [activeMenu, setActiveMenu] = useState('home')

  const renderContent = () => {
    switch (activeMenu) {
      case 'home':
        return <HomePage />
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
    <div className="flex h-screen bg-background">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
