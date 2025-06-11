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
    <div className="flex h-full w-64 flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900">Todo Dashboard</h1>
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
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
            <Plus size={16} className="mr-2" />
            Add Task
          </Button>
        </div>
      </nav>

      {/* User Profile - Moved to Bottom */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="bg-slate-600 text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">John Doe</p>
            <p className="truncate text-xs text-gray-500">john@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar