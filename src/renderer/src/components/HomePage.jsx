import React, { useState } from 'react'
import { Plus, MoreHorizontal, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'

const HomePage = () => {
  const [lists, setLists] = useState([
    {
      id: 1,
      name: 'All Lists',
      icon: 'TK',
      iconColor: 'bg-blue-500',
      tasks: [
        { id: 1, title: 'tes ajsa ini jalan kem...', time: '00:00', completed: false },
        { id: 2, title: 'test To do 3', time: '21:10', completed: false },
        { id: 3, title: 'jalan jalkan', time: '00:00', completed: false, isActive: true }
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

  const getIconInitials = (name) => {
    const words = name.split(' ')
    if (words.length >= 2) {
      return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Your Lists</h1>
        <p className="text-muted-foreground">Lists with your upcoming tasks</p>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Existing Lists */}
        {lists.map((list) => (
          <Card key={list.id} className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${list.iconColor} text-white rounded-md w-8 h-8 flex items-center justify-center text-sm font-bold`}>
                    {list.icon}
                  </div>
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Tasks List */}
              <div className="space-y-2">
                {list.tasks.map((task, index) => (
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${task.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground">{index + 1}</span>
                      <span className="flex-1 text-sm">{task.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{task.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Task Button */}
              {list.tasks.some(task => task.isActive) && (
                <Button className="w-full bg-green-500 text-white hover:bg-green-600">
                  Open
                </Button>
              )}

              {/* Footer Stats */}
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  {list.pendingTasks} pending tasks
                </span>
                {list.estimatedTime && (
                  <span className="text-sm text-muted-foreground">
                    Est: {list.estimatedTime}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New List Card */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="h-fit cursor-pointer border-2 border-dashed transition-colors hover:border-primary/50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
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