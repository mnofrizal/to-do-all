import React, { useState } from 'react'
import { Home, CheckSquare, Calendar, Settings, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const [activeWorkspace, setActiveWorkspace] = useState('personal')

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: '4' },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const workspaces = [
    {
      id: 'personal',
      name: 'Personal',
      icon: 'P',
      color: 'bg-blue-500',
      totalCount: 7
    },
    {
      id: 'work',
      name: 'Work',
      icon: 'W',
      color: 'bg-green-500',
      totalCount: 5
    },
    {
      id: 'family',
      name: 'Family',
      icon: 'F',
      color: 'bg-purple-500',
      totalCount: 5
    }
  ]

  return (
    <div className="bg-sidebar flex h-full w-72 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-border p-4 px-6">
        <h1 className="text-3xl font-bold text-primary">TaskLeap</h1>
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left ${
                  activeMenu === item.id
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-accent-foreground'
                    : 'text-muted-foreground hover:bg-zinc-100 hover:dark:bg-zinc-800 hover:text-accent-foreground'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Add Task Button */}
        <div className="mt-8">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus size={16} className="mr-2" />
            Add Task
          </Button>
        </div>
      </nav>

      {/* Workspaces Section - Moved to bottom */}
      <div className="border-t border-border p-4">
        <div className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workspaces</h3>
        </div>
        
        <div className="space-y-1">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => setActiveWorkspace(workspace.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left hover:bg-accent hover:text-accent-foreground ${
                activeWorkspace === workspace.id ? 'bg-zinc-100 dark:bg-zinc-800 text-accent-foreground' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`${workspace.color} text-white rounded w-6 h-6 flex items-center justify-center text-xs font-bold`}>
                  {workspace.icon}
                </div>
                <span className="text-sm font-medium text-card-foreground">{workspace.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{workspace.totalCount}</span>
            </button>
          ))}
        </div>

        {/* Add Workspace Button */}
        <div className="mt-4">
          <Button variant="ghost" className="w-full justify-start text-sm text-muted-foreground hover:text-foreground">
            <Plus size={14} className="mr-2" />
            Add Workspace
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar