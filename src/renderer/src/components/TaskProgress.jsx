import React, { useState } from 'react'
import { Plus, ArrowLeft, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'

const TaskProgress = ({ onBack, activeView = 'kanban', onTaskClick }) => {
  const [columns, setColumns] = useState([
    {
      id: 'backlog',
      title: 'Backlog',
      tasks: [],
      color: 'dark:border-zinc-700 border-zinc-300',
    },
    {
      id: 'thisweek',
      title: 'This Week',
      tasks: [
        {
          id: 1,
          title: 'jalan jalkan',
          time: '0min',
          estimate: 'EST',
          priority: 'K',
          priorityColor: 'bg-blue-500'
        }
      ],
      color: 'dark:border-zinc-700 border-zinc-300',
      progress: { completed: 2, total: 5 }
    },
    {
      id: 'today',
      title: 'Today',
      tasks: [
        {
          id: 2,
          title: 'kamu taki tahu satasdsasa',
          time: '0min',
          estimate: 'EST',
          priority: 'T',
          priorityColor: 'bg-yellow-500'
        },
        {
          id: 3,
          title: 'mauku jadi maumuu',
          time: '0min',
          estimate: 'EST',
          priority: 'T',
          priorityColor: 'bg-yellow-500'
        }
      ],
      color: 'border-primary',
      progress: { completed: 0, total: 2 }
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        {
          id: 4,
          title: 'Test to do 2 makan enak makar',
          time: '10min',
          priority: 'K',
          priorityColor: 'bg-blue-500',
          completed: true
        },
        {
          id: 5,
          title: 'Kerjain to do app',
          time: '10hr 24min',
          priority: 'K',
          priorityColor: 'bg-blue-500',
          completed: true
        }
      ],
      color: 'dark:border-zinc-700 border-zinc-300',
      subtitle: '2 tasks this month',
      date: 'Wed, Jun 11, 2025',
      taskCount: '2 tasks'
    }
  ])

  const [newTaskInputs, setNewTaskInputs] = useState({})

  const handleAddTask = (columnId, taskTitle) => {
    if (!taskTitle.trim()) return

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      time: '0min',
      estimate: 'EST',
      priority: 'T',
      priorityColor: 'bg-gray-500'
    }

    setColumns(columns.map(col => 
      col.id === columnId 
        ? { ...col, tasks: [...col.tasks, newTask] }
        : col
    ))

    setNewTaskInputs({ ...newTaskInputs, [columnId]: '' })
  }

  const handleInputChange = (columnId, value) => {
    setNewTaskInputs({ ...newTaskInputs, [columnId]: value })
  }

  const handleKeyPress = (e, columnId) => {
    if (e.key === 'Enter') {
      handleAddTask(columnId, newTaskInputs[columnId])
    }
  }

  const renderViewContent = () => {
    switch (activeView) {
      case 'kanban':
        return (
          <div
            className="kanban-scrollbar flex-1 overflow-x-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}
          >
            <div className="mx-auto flex h-full min-w-fit max-w-7xl gap-4 p-6">
            {columns.map((column) => (
          <div key={column.id} className="flex w-full min-w-[350px] max-w-[370px] flex-col">
            <Card className={`flex h-full flex-col border ${column.color} bg-card`}>
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-card-foreground">{column.title}</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                    <Plus className="h-5 w-5 text-zinc-700" />
                  </Button>
                </div>
                {column.progress && (
                  <span className="text-sm text-muted-foreground">
                    {column.progress.completed}/{column.progress.total} Done
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {column.progress && (
                <div className="mx-4 mb-6">
                  <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div 
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(column.progress.completed / column.progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Done Column Header Info */}
              {column.id === 'done' && (
                <div className="px-4 pb-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">{column.subtitle}</p>
                    <p className="text-sm text-muted-foreground">{column.date}</p>
                    <p className="text-sm text-muted-foreground">{column.taskCount}</p>
                  </div>
                </div>
              )}

              {/* Tasks */}
              <CardContent className="flex-1 space-y-3 p-4 pt-0">
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-lg border border-zinc-300 dark:border-zinc-800 dark:bg-[#262626] p-3 shadow-sm cursor-pointer hover:bg-accent transition-colors ${
                      task.completed ? 'opacity-75' : ''
                    }`}
                    onClick={() => onTaskClick && onTaskClick(task)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`${task.priorityColor} mt-0.5 h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}>
                          {task.priority}
                        </div>
                        <span className={`font-light text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{task.time}</span>
                    </div>
                    {task.estimate && !task.completed && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">+ {task.estimate}</span>
                        <span className="text-xs text-muted-foreground">{task.time}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Task Input */}
                <div className="space-y-2">
                  <Input
                    placeholder="+ ADD TASK"
                    value={newTaskInputs[column.id] || ''}
                    onChange={(e) => handleInputChange(column.id, e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, column.id)}
                    className="h-12 border-dashed border-zinc-700 bg-transparent text-sm text-foreground placeholder:font-semibold placeholder:text-muted-foreground"
                  />
                </div>
              </CardContent>

              {/* Column Footer */}
              <div className="p-4 pt-0">
                {column.id === 'backlog' && (
                  <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-border" />
                      All Clear
                    </div>
                  </Button>
                )}
                {column.id === 'today' && (
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Zap className="mr-2 h-4 w-4" />
                    Leap It!
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ))}
           </div>
         </div>
       )
     
     case 'files':
       return (
         <div className="flex h-full items-center justify-center p-6">
           <div className="text-center">
             <h2 className="mb-4 text-2xl font-bold text-foreground">Files View</h2>
             <p className="mb-6 text-muted-foreground">File management interface coming soon...</p>
             <div className="grid max-w-md grid-cols-3 gap-4">
               <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-card">
                 <span className="text-sm text-muted-foreground">Document 1</span>
               </div>
               <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-card">
                 <span className="text-sm text-muted-foreground">Document 2</span>
               </div>
               <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-card">
                 <span className="text-sm text-muted-foreground">Document 3</span>
               </div>
             </div>
           </div>
         </div>
       )
     
     case 'timeline':
       return (
         <div className="flex h-full flex-col p-6">
           <div className="mb-6">
             <h2 className="mb-2 text-2xl font-bold text-foreground">Timeline Map</h2>
             <p className="text-muted-foreground">Visual timeline of task progress and milestones</p>
           </div>
           <div className="flex-1 rounded-lg border border-border bg-card p-6">
             <div className="relative">
               {/* Timeline line */}
               <div className="absolute bottom-0 left-8 top-0 w-0.5 bg-border"></div>
               
               {/* Timeline items */}
               <div className="space-y-8">
                 <div className="flex items-start space-x-4">
                   <div className="relative z-10 h-4 w-4 rounded-full border-2 border-background bg-blue-500"></div>
                   <div className="flex-1">
                     <div className="rounded-lg border border-border bg-background p-4">
                       <h3 className="font-semibold text-foreground">Project Started</h3>
                       <p className="text-sm text-muted-foreground">Initial setup and planning phase</p>
                       <span className="text-xs text-muted-foreground">2 days ago</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-start space-x-4">
                   <div className="relative z-10 h-4 w-4 rounded-full border-2 border-background bg-yellow-500"></div>
                   <div className="flex-1">
                     <div className="rounded-lg border border-border bg-background p-4">
                       <h3 className="font-semibold text-foreground">Development Phase</h3>
                       <p className="text-sm text-muted-foreground">Core features implementation</p>
                       <span className="text-xs text-muted-foreground">1 day ago</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-start space-x-4">
                   <div className="relative z-10 h-4 w-4 rounded-full border-2 border-background bg-green-500"></div>
                   <div className="flex-1">
                     <div className="rounded-lg border border-border bg-background p-4">
                       <h3 className="font-semibold text-foreground">Testing & Review</h3>
                       <p className="text-sm text-muted-foreground">Quality assurance and bug fixes</p>
                       <span className="text-xs text-muted-foreground">Today</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )
     
     case 'details':
       return (
         <div className="flex h-full flex-col p-6">
           <div className="mb-6">
             <h2 className="mb-2 text-2xl font-bold text-foreground">Details/List View</h2>
             <p className="text-muted-foreground">Detailed task list interface</p>
           </div>
           <div className="flex-1 rounded-lg border border-border bg-card p-4">
             <div className="space-y-3">
               <div className="flex items-center justify-between border-b border-border p-3">
                 <span className="font-medium text-foreground">Task Title</span>
                 <span className="text-sm text-muted-foreground">Status</span>
               </div>
               <div className="flex items-center justify-between rounded p-3 hover:bg-accent">
                 <span className="text-foreground">jalan jalkan</span>
                 <span className="text-sm text-blue-500">In Progress</span>
               </div>
               <div className="flex items-center justify-between rounded p-3 hover:bg-accent">
                 <span className="text-foreground">kamu taki tahu satasdsasa</span>
                 <span className="text-sm text-yellow-500">Pending</span>
               </div>
               <div className="flex items-center justify-between rounded p-3 hover:bg-accent">
                 <span className="text-foreground">Test to do 2 makan enak makar</span>
                 <span className="text-sm text-green-500">Completed</span>
               </div>
             </div>
           </div>
         </div>
       )
     
     default:
       return (
         <div className="flex h-full items-center justify-center">
           <p className="text-muted-foreground">View not found</p>
         </div>
       )
   }
 }

 return (
   <div className="flex h-full flex-col">
     {renderViewContent()}
   </div>
 )
}

export default TaskProgress