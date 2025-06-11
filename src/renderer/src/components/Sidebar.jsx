import React from 'react'
import { Home, CheckSquare, Calendar, Settings, Plus, User } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: '4' },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="border-b p-6">
        <h1 className="text-xl font-bold text-foreground">Todo Dashboard</h1>
      </div>

      {/* User Profile */}
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">John Doe</p>
            <p className="truncate text-xs text-muted-foreground">john@example.com</p>
          </div>
        </div>
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
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
          <Button className="w-full">
            <Plus size={16} className="mr-2" />
            Add Task
          </Button>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p>Todo App v1.0</p>
          <p className="mt-1">Built with shadcn/ui</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar