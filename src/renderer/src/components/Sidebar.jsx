import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, CheckSquare, Calendar, Settings, Plus, X, Check, MoreVertical, Edit, Trash2, LogOut, User } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'

const Sidebar = ({ activeMenu, setActiveMenu, activeWorkspace, setActiveWorkspace, currentUser, onLogout }) => {
  const [workspaces, setWorkspaces] = useState([])
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [showWorkspaceInput, setShowWorkspaceInput] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  
  // Edit workspace state
  const [editingWorkspace, setEditingWorkspace] = useState(null)
  const [editWorkspaceName, setEditWorkspaceName] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false)
  
  // Delete workspace state
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false)

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: '4' },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Fetch workspaces from database
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!currentUser?.id) return
      
      try {
        const fetchedWorkspaces = await window.db.getWorkspaces(currentUser.id)
        
        // Calculate task counts for each workspace
        const workspacesWithCounts = await Promise.all(
          fetchedWorkspaces.map(async (workspace) => {
            try {
              const lists = await window.db.getLists(workspace.id)
              let totalTaskCount = 0
              
              // Count tasks in all lists for this workspace
              for (const list of lists) {
                const tasks = await window.db.getTasks(list.id)
                // Count only incomplete tasks
                totalTaskCount += tasks.filter(task => task.status !== 'done').length
              }
              
              return {
                ...workspace,
                icon: workspace.name.charAt(0).toUpperCase(),
                color: getWorkspaceColor(workspace.id),
                totalCount: totalTaskCount
              }
            } catch (error) {
              console.error('Error calculating task count for workspace:', workspace.id, error)
              return {
                ...workspace,
                icon: workspace.name.charAt(0).toUpperCase(),
                color: getWorkspaceColor(workspace.id),
                totalCount: 0
              }
            }
          })
        )
        
        setWorkspaces(workspacesWithCounts)
        
        // Set first workspace as active if none selected
        if (workspacesWithCounts.length > 0 && !activeWorkspace) {
          setActiveWorkspace(workspacesWithCounts[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
      }
    }
    
    fetchWorkspaces()
  }, [activeWorkspace, currentUser?.id])

  // Helper function to assign colors to workspaces
  const getWorkspaceColor = (workspaceId) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500'
    ]
    // Use workspace ID to consistently assign colors
    return colors[workspaceId % colors.length]
  }

  // Handle showing workspace input
  const handleShowWorkspaceInput = () => {
    setShowWorkspaceInput(true)
    setNewWorkspaceName('')
  }

  // Handle creating new workspace
  const handleCreateWorkspace = async () => {
    if (isCreatingWorkspace || !newWorkspaceName.trim() || !currentUser?.id) return
    
    setIsCreatingWorkspace(true)
    try {
      const newWorkspace = await window.db.createWorkspace(newWorkspaceName.trim(), currentUser.id)
      
      const workspaceWithExtras = {
        ...newWorkspace,
        icon: newWorkspace.name.charAt(0).toUpperCase(),
        color: getWorkspaceColor(newWorkspace.id),
        totalCount: 0
      }
      
      setWorkspaces(prev => [...prev, workspaceWithExtras])
      setActiveWorkspace(newWorkspace.id)
      
      // Reset input state
      setShowWorkspaceInput(false)
      setNewWorkspaceName('')
    } catch (error) {
      console.error('Failed to create workspace:', error)
      alert('Failed to create workspace. Please try again.')
    } finally {
      setIsCreatingWorkspace(false)
    }
  }

  // Handle canceling workspace creation
  const handleCancelWorkspaceCreation = () => {
    setShowWorkspaceInput(false)
    setNewWorkspaceName('')
  }

  // Handle workspace input key press
  const handleWorkspaceInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateWorkspace()
    } else if (e.key === 'Escape') {
      handleCancelWorkspaceCreation()
    }
  }

  // Handle edit workspace
  const handleEditWorkspace = (workspace) => {
    setEditingWorkspace(workspace)
    setEditWorkspaceName(workspace.name)
    setIsEditDialogOpen(true)
  }

  // Handle update workspace
  const handleUpdateWorkspace = async () => {
    if (!editingWorkspace || !editWorkspaceName.trim() || isUpdatingWorkspace) return

    setIsUpdatingWorkspace(true)
    try {
      await window.db.updateWorkspace(editingWorkspace.id, { name: editWorkspaceName.trim() })
      
      // Update local state
      setWorkspaces(prev => prev.map(workspace =>
        workspace.id === editingWorkspace.id
          ? {
              ...workspace,
              name: editWorkspaceName.trim(),
              icon: editWorkspaceName.trim().charAt(0).toUpperCase()
            }
          : workspace
      ))
      
      // Close dialog
      setIsEditDialogOpen(false)
      setEditingWorkspace(null)
      setEditWorkspaceName('')
    } catch (error) {
      console.error('Failed to update workspace:', error)
      alert('Failed to update workspace. Please try again.')
    } finally {
      setIsUpdatingWorkspace(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingWorkspace(null)
    setEditWorkspaceName('')
  }

  // Handle delete workspace
  const handleDeleteWorkspace = async (workspace) => {
    if (isDeletingWorkspace) return

    const confirmDelete = confirm(`Are you sure you want to delete "${workspace.name}"? This will also delete all lists and tasks in this workspace.`)
    if (!confirmDelete) return

    setIsDeletingWorkspace(true)
    try {
      await window.db.deleteWorkspace(workspace.id)
      
      // Update local state
      setWorkspaces(prev => prev.filter(w => w.id !== workspace.id))
      
      // If deleted workspace was active, switch to first available workspace
      if (activeWorkspace === workspace.id) {
        const remainingWorkspaces = workspaces.filter(w => w.id !== workspace.id)
        if (remainingWorkspaces.length > 0) {
          setActiveWorkspace(remainingWorkspaces[0].id)
        } else {
          setActiveWorkspace(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      alert('Failed to delete workspace. Please try again.')
    } finally {
      setIsDeletingWorkspace(false)
    }
  }

  // Handle edit dialog key press
  const handleEditDialogKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUpdateWorkspace()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  // Animation variants
  const sidebarVariants = {
    initial: { x: -280, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.4
      }
    },
    exit: {
      x: -280,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 25,
        duration: 0.3
      }
    }
  }

  return (
    <motion.div
      className="bg-sidebar flex h-full w-72 flex-col overflow-hidden"
      variants={sidebarVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
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
            <div
              key={workspace.id}
              className={`group relative flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ${
                activeWorkspace === workspace.id ? 'bg-zinc-100 dark:bg-zinc-800 text-accent-foreground' : ''
              }`}
            >
              <button
                onClick={() => setActiveWorkspace(workspace.id)}
                className="flex flex-1 items-center space-x-3 text-left"
              >
                <div className={`${workspace.color} text-white rounded w-6 h-6 flex items-center justify-center text-xs font-bold`}>
                  {workspace.icon}
                </div>
                <span className="text-sm font-medium text-card-foreground">{workspace.name}</span>
              </button>
              
              <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">{workspace.totalCount}</span>
                
                {/* Dropdown Menu - Shows on hover */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditWorkspace(workspace)
                      }}
                      className="text-xs"
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteWorkspace(workspace)
                      }}
                      className="text-xs text-destructive focus:text-destructive"
                      disabled={isDeletingWorkspace}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      {isDeletingWorkspace ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {/* Add Workspace Button/Input */}
        <div className="mt-4">
          {showWorkspaceInput ? (
            <div className="space-y-2">
              <Input
                placeholder="Workspace name..."
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={handleWorkspaceInputKeyPress}
                className="text-sm"
                autoFocus
                disabled={isCreatingWorkspace}
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={handleCreateWorkspace}
                  disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                  className="flex-1"
                >
                  <Check size={12} className="mr-1" />
                  {isCreatingWorkspace ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelWorkspaceCreation}
                  disabled={isCreatingWorkspace}
                >
                  <X size={12} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-muted-foreground hover:text-foreground"
              onClick={handleShowWorkspaceInput}
            >
              <Plus size={14} className="mr-2" />
              Add Workspace
            </Button>
          )}
        </div>
      </div>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update the name of your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Workspace name..."
              value={editWorkspaceName}
              onChange={(e) => setEditWorkspaceName(e.target.value)}
              onKeyDown={handleEditDialogKeyPress}
              autoFocus
              disabled={isUpdatingWorkspace}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isUpdatingWorkspace}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateWorkspace}
              disabled={isUpdatingWorkspace || !editWorkspaceName.trim()}
            >
              {isUpdatingWorkspace ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default Sidebar