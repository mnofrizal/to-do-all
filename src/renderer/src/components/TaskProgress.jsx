import React, { useState } from 'react'
import { Plus, ArrowLeft, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'

const TaskProgress = ({ onBack }) => {
  const [columns, setColumns] = useState([
    {
      id: 'backlog',
      title: 'Backlog',
      tasks: [],
      color: 'border-gray-200'
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
      color: 'border-gray-200',
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
      color: 'border-cyan-200',
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
      color: 'border-gray-200',
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Task Progress</h1>
          <p className="text-sm text-muted-foreground">Manage your tasks across different stages</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="mx-auto flex h-full min-w-fit max-w-7xl gap-4 p-6 pt-2">
        {columns.map((column) => (
          <div key={column.id} className="flex min-w-[380px] flex-col">
            <Card className={`flex h-full flex-col border ${column.color} bg-white`}>
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-700">{column.title}</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {column.progress && (
                  <span className="text-sm text-gray-500">
                    {column.progress.completed}/{column.progress.total} Done
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {column.progress && (
                <div className="mx-4 mb-4">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div 
                      className="h-2 rounded-full bg-gray-400"
                      style={{ width: `${(column.progress.completed / column.progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Done Column Header Info */}
              {column.id === 'done' && (
                <div className="px-4 pb-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">{column.subtitle}</p>
                    <p className="text-sm text-gray-500">{column.date}</p>
                    <p className="text-sm text-gray-500">{column.taskCount}</p>
                  </div>
                </div>
              )}

              {/* Tasks */}
              <CardContent className="flex-1 space-y-3 p-4 pt-0">
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-lg border bg-white p-3 shadow-sm ${
                      task.completed ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`${task.priorityColor} mt-0.5 h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}>
                          {task.priority}
                        </div>
                        <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{task.time}</span>
                    </div>
                    {task.estimate && !task.completed && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-xs text-gray-400">+ {task.estimate}</span>
                        <span className="text-xs text-gray-500">{task.time}</span>
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
                    className="border-dashed border-gray-300 bg-transparent text-sm placeholder:text-gray-400"
                  />
                </div>
              </CardContent>

              {/* Column Footer */}
              <div className="p-4 pt-0">
                {column.id === 'backlog' && (
                  <Button variant="ghost" className="w-full text-sm text-gray-500 hover:text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      All Clear
                    </div>
                  </Button>
                )}
                {column.id === 'today' && (
                  <Button className="w-full bg-emerald-400 text-black hover:bg-emerald-500">
                    <Zap className="mr-2 h-4 w-4" />
                    Blitzit now
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}

export default TaskProgress