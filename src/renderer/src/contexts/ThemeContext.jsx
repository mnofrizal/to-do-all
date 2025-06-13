import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [colorTheme, setColorTheme] = useState('default')

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme')
    const savedColorTheme = localStorage.getItem('colorTheme') || 'default'
    
    setColorTheme(savedColorTheme)
    
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(systemPrefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange')
    
    // Apply dark mode class
    if (theme === 'dark') {
      root.classList.add('dark')
    }
    
    // Apply color theme class
    if (colorTheme !== 'default') {
      root.classList.add(`theme-${colorTheme}`)
    }

    // Save to localStorage
    localStorage.setItem('theme', theme)
    localStorage.setItem('colorTheme', colorTheme)

    // Sync theme to floating window if available
    if (window.api && window.api.floatingWindow && window.api.floatingWindow.syncTheme) {
      window.api.floatingWindow.syncTheme({ theme, colorTheme })
    }
  }, [theme, colorTheme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setThemeMode = (newTheme) => {
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(systemPrefersDark ? 'dark' : 'light')
    } else {
      setTheme(newTheme)
    }
  }

  const setColorThemeMode = (newColorTheme) => {
    setColorTheme(newColorTheme)
  }

  const availableColorThemes = [
    { id: 'default', name: 'Default', description: 'Classic gray theme' },
    { id: 'blue', name: 'Blue', description: 'Professional blue theme' },
    { id: 'green', name: 'Emerald', description: 'Fresh emerald green theme' },
    { id: 'purple', name: 'Purple', description: 'Creative purple theme' },
    { id: 'orange', name: 'Orange', description: 'Energetic orange theme' }
  ]

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorTheme,
      toggleTheme, 
      setThemeMode,
      setColorThemeMode,
      availableColorThemes
    }}>
      {children}
    </ThemeContext.Provider>
  )
}