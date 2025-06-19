import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, ExpandIcon, Edit, Copy, Archive, MoreVertical } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import useAppStore from '../stores/useAppStore'

const HomePage = ({ onCardClick }) => {
  const [lists, setLists] = useState([])
  const [newListName, setNewListName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Get activeWorkspace from Zustand store
  const { activeWorkspace } = useAppStore()

  useEffect(() => {
    if (activeWorkspace) {
      const fetchLists = async () => {
        try {
          const fetchedLists = await window.db.getLists(activeWorkspace)
          setLists(fetchedLists)
        } catch (error) {
          console.error('Failed to fetch lists for workspace:', activeWorkspace, error)
          setLists([])
        }
      }
      fetchLists()
    } else {
      setLists([])
    }
  }, [activeWorkspace])

  const handleCreateList = async () => {
    if (newListName.trim() && activeWorkspace) {
      try {
        const newListData = {
          name: newListName,
          icon: newListName.charAt(0).toUpperCase(),
          iconColor: 'bg-gray-500',
          workspaceId: activeWorkspace
        }
        const newList = await window.db.createList(newListData)
        setLists([...lists, newList])
        setNewListName('')
        setIsDialogOpen(false)
      } catch (error) {
        console.error('Failed to create list:', error)
        alert('Failed to create list. Please try again.')
      }
    }
  }

  const handleEditList = (listId) => {
    console.log('Edit list:', listId)
    // TODO: Implement edit functionality
  }

  const handleDuplicateList = (listId) => {
    const listToDuplicate = lists.find(list => list.id === listId)
    if (listToDuplicate) {
      const duplicatedList = {
        ...listToDuplicate,
        id: lists.length + 1,
        name: `${listToDuplicate.name} (Copy)`,
        tasks: [...listToDuplicate.tasks]
      }
      setLists([...lists, duplicatedList])
    }
  }

  const handleArchiveList = (listId) => {
    setLists(lists.filter(list => list.id !== listId))
  }

  const getIconInitials = (name) => {
    const words = name.split(' ')
    if (words.length >= 2) {
      return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  // Instant appearance - no fade animations
  const cardVariants = {
    hidden: { y: 10 },
    visible: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 25,
        duration: 0.2
      }
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-[1700px] bg-background p-6 px-10">
      <div className="flex-col">
        {/* Header */}
        <div className="mb-8 mt-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Your Lists</h1>
          <p className="text-muted-foreground">Lists with your upcoming tasks</p>
        </div>

        {/* No Workspace Selected State */}
        {!activeWorkspace ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">No Workspace Selected</h3>
            <p className="mb-6 max-w-md text-muted-foreground">
              Please select a workspace from the sidebar to view and manage your task lists, or create a new workspace to get started.
            </p>
            <div className="text-sm text-muted-foreground">
              💡 Tip: Use the sidebar to create or select a workspace
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-5">
            {/* Existing Lists */}
            {lists.map((list, index) => (
          <motion.div
            key={list.id}
            variants={cardVariants}
            whileHover={{
              y: -4,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
          >
            <Card
              className="group relative flex h-80 cursor-pointer flex-col rounded-xl border bg-[#FCFBFB] transition-all duration-200 hover:shadow-xl hover:ring-2 hover:ring-primary hover:ring-opacity-50 dark:border-zinc-700 dark:bg-[#171717]"
              onClick={() => onCardClick && onCardClick(list)}
            >
         <div className='px-6 pt-3'>
         <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${list.iconColor} text-white rounded-md w-6 h-6 flex items-center justify-center text-sm font-bold`}>
                    {list.icon}
                  </div>
                  <CardTitle className="text-md text-card-foreground">{list.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-20 min-w-[7rem] rounded-lg border border-border bg-background drop-shadow-2xl">
                    <DropdownMenuItem onClick={() => handleEditList(list.id)} className="py-1 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateList(list.id)} className="py-1 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={() => handleArchiveList(list.id)}
                      className="py-1 text-xs text-destructive hover:bg-accent focus:text-destructive"
                    >
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
         </div>
            <CardContent className="flex flex-1 flex-col p-0">
              {/* Tasks List with Gradient Fade */}
              <div className="relative flex-1 overflow-hidden">
                <div className="p-6 pb-0 pt-4">
                  <div className="space-y-3">
                    {Array.from({ length: 4 }, (_, index) => {
                      const task = list.tasks ? list.tasks[index] : undefined;
                      return (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg h-10 ${
                          task ? (task.isActive ? 'bg-primary/10 border border-primary/20' : 'dark:bg-[#222222] bg-white border border-border') : 'bg-transparent'
                        }`}>
                          {task ? (
                            <>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-muted-foreground">{index + 1}</span>
                                <span className="flex-1 text-sm text-foreground">{task.title}</span>
                              </div>
                              <div className="flex items-center">
                               
                                <span className="text-xs text-muted-foreground">{task.time}</span>
                              </div>
                            </>
                          ) : (
                            <div className="h-full w-full"></div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Gradient Fade Effect */}
                {list.tasks && list.tasks.length > 4 && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent"></div>
                )}
                {/* Hover Open Button Overlay */}
                {list.tasks && list.tasks.some(task => task.isActive) && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Button
                      className="rounded-full bg-primary px-6 text-primary-foreground shadow-xl hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCardClick && onCardClick(list)
                      }}
                    >
                      <ExpandIcon className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              <div className="p-6 pt-3">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    {list.tasks ? list.tasks.filter(t => t.status !== 'done').length : 0} pending tasks
                  </span>
                  
                </div>
              </div>
            </CardContent>
            </Card>
          </motion.div>
        ))}

            {/* Create New List Card */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Card className="h-80 w-full cursor-pointer rounded-xl border-2 border-dashed border-border transition-colors hover:border-primary dark:bg-[#171717]">
                  <CardContent className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 font-semibold text-muted-foreground">CREATE LIST</h3>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="border-border bg-card sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">Create New List</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Create a new task list to organize your todos.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="">
                    
                    <Input
                      id="name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="col-span-3"
                      placeholder="Enter list name..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateList()
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateList}>
                    Create List
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage