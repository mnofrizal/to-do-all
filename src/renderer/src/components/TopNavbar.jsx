import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Grid3X3, Settings, ChevronDown, Zap, ArrowLeft, Monitor, Sun, Moon, Kanban, FileText, GitBranch, List } from 'lucide-react'
import { Button } from './ui/button'
import { Switch } from './ui/switch.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogOverlay } from './ui/dialog'
import { useTheme } from '../contexts/ThemeContext'

const TopNavbar = ({ currentView, activeMenu, onBack, selectedList, activeTaskView, setActiveTaskView }) => {
  const { theme, colorTheme, setThemeMode, setColorThemeMode, availableColorThemes } = useTheme()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')
  const [language, setLanguage] = useState('english')
  const [hideEstDoneTimes, setHideEstDoneTimes] = useState(true)

  const taskViewOptions = [
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'timeline', label: 'Timeline Map', icon: GitBranch },
    { id: 'details', label: 'Details', icon: List },
    { id: 'files', label: 'Files', icon: FileText }
  ]

  const themeOptions = [
    { id: 'system', label: 'System' },
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' }
  ]

  const languageOptions = [
    { id: 'english', label: 'English' },
    { id: 'bahasa', label: 'Bahasa Indonesia' }
  ]

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme)
    setThemeMode(newTheme)
    console.log('Theme changed to:', newTheme)
  }

  const handleColorThemeChange = (newColorTheme) => {
    setColorThemeMode(newColorTheme)
    console.log('Color theme changed to:', newColorTheme)
  }

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    console.log('Language changed to:', newLanguage)
  }

  const handleToggleEstDoneTimes = () => {
    setHideEstDoneTimes(!hideEstDoneTimes)
    console.log('Hide est/done times:', !hideEstDoneTimes)
  }

  const renderLeftContent = () => {
    if (currentView === 'taskProgress') {
      return (
        <div className="flex items-center space-x-4">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">BACK</span>
          </Button>
          
          {/* List selector */}
          <div className="flex items-center space-x-2 rounded-lg border border-border bg-card px-3 py-2">
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500 text-xs font-bold text-white">
                  T
                </div>
                <div className="-ml-2 flex h-6 w-6 items-center justify-center rounded bg-yellow-500 text-xs font-bold text-white">
                  P
                </div>
                <div className="-ml-2 flex h-6 w-6 items-center justify-center rounded bg-zinc-600 text-xs font-bold text-white">
                  +2
                </div>
              </div>
              <span className="ml-2 font-semibold text-foreground">
                {selectedList ? selectedList.name : 'All Lists'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )
    }

    // Default greeting for home and other pages
    const getPageTitle = () => {
      switch (activeMenu) {
        case 'home':
          return {
            title: 'Good Evening, Amrizal',
            subtitle: 'Nice! Blitzing through your evening!'
          }
        case 'tasks':
          return {
            title: 'Tasks Overview',
            subtitle: 'Manage all your tasks in one place'
          }
        case 'calendar':
          return {
            title: 'Calendar View',
            subtitle: 'Plan your schedule and deadlines'
          }
        case 'settings':
          return {
            title: 'Settings',
            subtitle: 'Configure your preferences'
          }
        default:
          return {
            title: 'Good Evening, Amrizal',
            subtitle: 'Nice! Blitzing through your evening!'
          }
      }
    }

    const pageInfo = getPageTitle()
    
    return (
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{pageInfo.title}</h1>
        <p className="text-muted-foreground">{pageInfo.subtitle}</p>
      </div>
    )
  }

  const renderMiddleContent = () => {
    if (currentView === 'taskProgress') {
      return (
        <motion.div
          className="flex items-center space-x-1 rounded-lg border border-border bg-card p-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {taskViewOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              >
                <Button
                  variant={activeTaskView === option.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTaskView(option.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm transition-all duration-200 ${
                    activeTaskView === option.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </Button>
              </motion.div>
            )
          })}
        </motion.div>
      )
    }
    return null
  }

  return (
    <div className="flex h-16 items-center justify-between bg-background px-6">
      {/* Left side - Dynamic content */}
      {renderLeftContent()}

      {/* Middle - Task view options for TaskProgress */}
      {renderMiddleContent()}

      {/* Right side - Actions and user profile */}
      <div className="flex items-center space-x-2 rounded-xl border border-border bg-card p-2 px-4">
        {/* Upgrade Now Button - only show on home */}
        {currentView !== 'taskProgress' && (
          <Button className="rounded-full border-2 border-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-padding px-6 font-normal text-white transition-all duration-200 hover:shadow-lg">
            <Zap className="mr-2 h-4 w-4" />
          Leap Now
          </Button>
        )}

        {/* Search */}
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Search className="h-5 w-5" />
        </Button>

        {/* Grid/Apps */}
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Grid3X3 className="h-5 w-5" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Profile Dropdown */}
        <Button variant="ghost" className="flex h-9 items-center space-x-1 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            A
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>

        <DialogContent className="border-border bg-card sm:max-w-[700px]">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-xl text-card-foreground">Settings</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Configure your preferences and application settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* General Settings */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-card-foreground">General</h3>
              
              {/* Hide est/done times toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hide est/done times on tasks</span>
                <Switch
                  checked={hideEstDoneTimes}
                  onCheckedChange={setHideEstDoneTimes}
                />
              </div>

              {/* Theme Settings */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Appearance</span>
                <div className="flex space-x-2">
                  {themeOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant={currentTheme === option.id ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleThemeChange(option.id)}
                      className="h-8 w-20 text-sm font-medium"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Theme Settings */}
              <div className="space-y-3">
                <span className="text-base text-muted-foreground">Color Theme</span>
                <div className="grid grid-cols-2 gap-3">
                  {availableColorThemes.map((colorThemeOption) => (
                    <Button
                      key={colorThemeOption.id}
                      variant={colorTheme === colorThemeOption.id ? "default" : "outline"}
                      onClick={() => handleColorThemeChange(colorThemeOption.id)}
                      className="h-auto justify-start p-4 text-left"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div>
                          <div className="font-medium">{colorThemeOption.name}</div>
                          <div className="text-xs opacity-70">{colorThemeOption.description}</div>
                        </div>
                        {colorTheme === colorThemeOption.id && (
                          <div className="h-2 w-2 rounded-full bg-current"></div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Language Settings */}
              <div className="flex items-center justify-between">
                <span className="text-base text-muted-foreground">Language</span>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="min-w-[200px] rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {languageOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TopNavbar