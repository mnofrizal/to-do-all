import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, ExpandIcon, Edit, Copy, Archive, MoreVertical, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import useAppStore from '../stores/useAppStore'
import ListFormDialog from './ListFormDialog'

const HomePage = ({ onCardClick }) => {
  const [lists, setLists] = useState([])
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState(null)
  const [selectedColor, setSelectedColor] = useState('bg-blue-500')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [iconFile, setIconFile] = useState(null)

  // Get activeWorkspace and store actions from Zustand store
  const { activeWorkspace, archiveList, setWorkspaceLists } = useAppStore()

  // Color options for list icons
  const colorOptions = [
    { id: 'gradient', name: 'Gradient', class: 'bg-gradient-to-br from-purple-400 via-pink-400 to-red-400' },
    { id: 'blue', name: 'Blue', class: 'bg-blue-500' },
    { id: 'green', name: 'Green', class: 'bg-green-500' },
    { id: 'pink', name: 'Pink', class: 'bg-pink-500' },
    { id: 'teal', name: 'Teal', class: 'bg-teal-500' },
    { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500' },
    { id: 'yellow', name: 'Yellow', class: 'bg-yellow-500' },
    { id: 'black', name: 'Black', class: 'bg-black' }
  ]

  useEffect(() => {
    if (activeWorkspace) {
      const fetchLists = async () => {
        try {
          const fetchedLists = await window.db.getLists(activeWorkspace)
          
          // Filter out archived lists from normal view
          const activeLists = fetchedLists.filter(list => !list.isArchived)
          
          // Fetch tasks for each list to calculate pending task counts
          const listsWithTasks = await Promise.all(
            activeLists.map(async (list) => {
              try {
                const tasks = await window.db.getTasks(list.id)
                return {
                  ...list,
                  tasks: tasks
                }
              } catch (error) {
                console.error('Failed to fetch tasks for list:', list.id, error)
                return {
                  ...list,
                  tasks: []
                }
              }
            })
          )
          
          setLists(listsWithTasks)
          // Also update the Zustand store
          setWorkspaceLists(listsWithTasks)
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
    if (newListName.trim() && (activeWorkspace || editingList)) {
      try {
        if (editingList) {
          // Edit mode
          const updateData = {
            name: newListName,
            description: newListDescription || null,
            icon: selectedIcon || newListName.charAt(0).toUpperCase(),
            iconColor: selectedColor
          }
          await updateList(editingList.id, updateData)
        } else {
          // Create mode
          const newListData = {
            name: newListName,
            description: newListDescription || null,
            icon: selectedIcon || newListName.charAt(0).toUpperCase(),
            iconColor: selectedColor,
            workspaceId: activeWorkspace
          }
          const newList = await window.db.createList(newListData)
          setLists([...lists, newList])
        }
        
        // Reset form
        handleDialogClose()
      } catch (error) {
        console.error('Failed to save list:', error)
        window.alert('Failed to save list. Please try again.')
      }
    }
  }

  const handleIconUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setIconFile(file)
      // For now, we'll use the file name as icon text
      // In a real implementation, you'd upload the file and get a URL
      setSelectedIcon(file.name.charAt(0).toUpperCase())
    }
  }

  const handleDialogClose = () => {
    // Reset form when closing
    setNewListName('')
    setNewListDescription('')
    setSelectedColor('bg-blue-500')
    setSelectedIcon('')
    setIconFile(null)
    setEditingList(null)
    setIsDialogOpen(false)
  }

  const handleEditList = (listId) => {
    const listToEdit = lists.find(list => list.id === listId)
    if (listToEdit) {
      setEditingList(listToEdit)
      setNewListName(listToEdit.name)
      setNewListDescription(listToEdit.description || '')
      setSelectedColor(listToEdit.iconColor)
      setSelectedIcon(listToEdit.icon)
      setIsDialogOpen(true)
    }
  }

  const handleDuplicateList = async (listId) => {
    const listToDuplicate = lists.find(list => list.id === listId)
    if (listToDuplicate && activeWorkspace) {
      try {
        const duplicatedListData = {
          name: `${listToDuplicate.name} (Copy)`,
          description: listToDuplicate.description,
          icon: listToDuplicate.icon,
          iconColor: listToDuplicate.iconColor,
          workspaceId: activeWorkspace
        }
        const newList = await window.db.createList(duplicatedListData)
        setLists([...lists, newList])
      } catch (error) {
        console.error('Failed to duplicate list:', error)
        alert('Failed to duplicate list. Please try again.')
      }
    }
  }

  const handleDeleteList = async (listId) => {
    const listToDelete = lists.find(list => list.id === listId)
    if (listToDelete) {
      // Using window.confirm which should work in Electron
      const confirmDelete = window.confirm(`Are you sure you want to delete "${listToDelete.name}"? This action cannot be undone.`)
      if (confirmDelete) {
        try {
          await window.db.deleteList(listId)
          setLists(lists.filter(list => list.id !== listId))
        } catch (error) {
          console.error('Failed to delete list:', error)
          window.alert('Failed to delete list. Please try again.')
        }
      }
    }
  }

  const handleArchiveList = async (listId) => {
    const listToArchive = lists.find(list => list.id === listId)
    if (listToArchive) {
      const confirmArchive = window.confirm(`Archive "${listToArchive.name}"? It will be moved to the archived section.`)
      if (confirmArchive) {
        try {
          const now = new Date().toISOString()
          await window.db.updateList(listId, {
            isArchived: true,
            archivedAt: now,
            updatedAt: now
          })
          // Remove from current lists view
          setLists(lists.filter(list => list.id !== listId))
          
          // Update Zustand store - this will automatically update workspace counts
          archiveList(listId)
        } catch (error) {
          console.error('Failed to archive list:', error)
          window.alert('Failed to archive list. Please try again.')
        }
      }
    }
  }

  const updateList = async (listId, updateData) => {
    try {
      const updatedList = await window.db.updateList(listId, updateData)
      setLists(lists.map(list => list.id === listId ? updatedList : list))
    } catch (error) {
      console.error('Failed to update list:', error)
      alert('Failed to update list. Please try again.')
    }
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
                 <div className={`${list.iconColor} shadow-2xl text-white rounded-md w-5 h-5 flex items-center justify-center text-sm font-bold`}>
                   {list.icon}
                 </div>
                 <div className="flex flex-col">
                   <CardTitle className="text-md max-w-[180px] truncate text-card-foreground" title={list.name}>{list.name}</CardTitle>
                   {list.description && (
                     <p className="max-w-[180px] truncate text-xs text-muted-foreground" title={list.description}>
                       {list.description}
                     </p>
                   )}
                 </div>
               </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditList(list.id)
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicateList(list.id)
                      }}
                    >
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchiveList(list.id)
                      }}
                      className="text-orange-600 focus:text-orange-600"
                    >
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteList(list.id)
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      Delete
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
                                <span className="max-w-[150px] flex-1 truncate text-sm text-muted-foreground" title={task.title}>{task.title}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-muted-foreground">       {task.timeSpent ?
                        `${Math.floor(task.timeSpent / 60).toString().padStart(2, '0')}:${(task.timeSpent % 60).toString().padStart(2, '0')}`
                        : '-'
                      }</span>
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
            <Card
              className="h-80 w-full cursor-pointer rounded-xl border-2 border-dashed border-border transition-colors hover:border-primary dark:bg-[#171717]"
              onClick={() => setIsDialogOpen(true)}
            >
              <CardContent className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-muted-foreground">CREATE LIST</h3>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Create/Edit List Dialog */}
        <ListFormDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          editingList={editingList}
          newListName={newListName}
          setNewListName={setNewListName}
          newListDescription={newListDescription}
          setNewListDescription={setNewListDescription}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedIcon={selectedIcon}
          iconFile={iconFile}
          handleIconUpload={handleIconUpload}
          handleCreateList={handleCreateList}
          colorOptions={colorOptions}
        />
      </div>
    </div>
  )
}

export default HomePage