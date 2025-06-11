import React, { useState } from 'react'
import { Plus, MoreHorizontal, Clock, ExpandIcon, Edit, Copy, Archive } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'

const HomePage = ({ onCardClick }) => {
  const [lists, setLists] = useState([
    {
      id: 1,
      name: 'All Lists',
      icon: 'TK',
      iconColor: 'bg-blue-500',
      tasks: [
        { id: 1, title: 'tes ajsa ini jalan kem...', time: '00:00', completed: false },
        { id: 2, title: 'test To do 3', time: '21:10', completed: false },
        { id: 3, title: 'jalan jalkan', time: '00:00', completed: false,},
        { id: 4, title: 'jalan jalkan', time: '00:00', completed: false, isActive: true }
      ],
      pendingTasks: 3,
      estimatedTime: '21hr 10min'
    },
    {
      id: 2,
      name: 'tes',
      icon: 'T',
      iconColor: 'bg-yellow-500',
      tasks: [
        { id: 4, title: 'tes ajsa ini jalan kem...', time: '00:00', completed: false }
      ],
      pendingTasks: 1,
      estimatedTime: null
    },
    {
      id: 3,
      name: 'Kerja',
      icon: 'K',
      iconColor: 'bg-blue-600',
      tasks: [
        { id: 5, title: 'test To d...', time: '21:10', completed: false },
        { id: 6, title: 'jalan jalkan', time: '00:00', completed: false }
      ],
      pendingTasks: 2,
      estimatedTime: '21hr 10min'
    }
  ])

  const [newListName, setNewListName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList = {
        id: lists.length + 1,
        name: newListName,
        icon: newListName.charAt(0).toUpperCase(),
        iconColor: 'bg-gray-500',
        tasks: [],
        pendingTasks: 0,
        estimatedTime: null
      }
      setLists([...lists, newList])
      setNewListName('')
      setIsDialogOpen(false)
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

  return (
    <div className="p-6 pt-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Your Lists</h1>
        <p className="text-muted-foreground">Lists with your upcoming tasks</p>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {/* Existing Lists */}
        {lists.map((list) => (
          <Card
            key={list.id}
            className="group relative flex aspect-square w-full cursor-pointer flex-col rounded-xl transition-all duration-200 hover:shadow-xl hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50"
            onClick={() => onCardClick && onCardClick(list)}
          >
         <div className='px-6 pt-3'>
         <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${list.iconColor} text-white rounded-md w-6 h-6 flex items-center justify-center text-sm font-bold`}>
                    {list.icon}
                  </div>
                  <CardTitle className="text-md">{list.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-20 min-w-[7rem] rounded-lg drop-shadow-2xl">
                    <DropdownMenuItem onClick={() => handleEditList(list.id)} className="py-1 text-xs">
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateList(list.id)} className="py-1 text-xs">
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleArchiveList(list.id)}
                      className="py-1 text-xs text-red-600 focus:text-red-600"
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
                      const task = list.tasks[index]
                      return (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg h-10 ${
                          task ? (task.isActive ? 'bg-green-100 border border-green-200' : 'bg-white border border-gray-200') : 'bg-transparent'
                        }`}>
                          {task ? (
                            <>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-zinc-300">{index + 1}</span>
                                <span className="flex-1 text-sm text-zinc-600">{task.title}</span>
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
                {list.tasks.length > 4 && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                )}
                {/* Hover Open Button Overlay */}
                {list.tasks.some(task => task.isActive) && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Button
                      className="rounded-full bg-emerald-400 px-6 text-black shadow-xl hover:bg-emerald-200"
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
                  <span className="text-xs font-bold text-muted-foreground">
                    {list.pendingTasks} pending tasks
                  </span>
                  
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New List Card */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="aspect-square w-full cursor-pointer rounded-xl border-2 border-dashed transition-colors hover:border-primary/50">
              <CardContent className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-muted-foreground">CREATE LIST</h3>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Create a new task list to organize your todos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm font-medium">
                  Name
                </label>
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
    </div>
  )
}

export default HomePage