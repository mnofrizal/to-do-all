import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, Building, List, CheckSquare, Square, Clock, Calendar, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import useAppStore from '../stores/useAppStore'

const SearchDialog = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({
    users: [],
    workspaces: [],
    lists: [],
    tasks: [],
    subtasks: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const { setActiveWorkspace, navigateToTaskProgress, setSelectedList } = useAppStore()

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length === 0) {
        setResults({
          users: [],
          workspaces: [],
          lists: [],
          tasks: [],
          subtasks: []
        })
        return
      }

      if (query.trim().length < 2) return

      setIsLoading(true)
      try {
        const searchResults = await window.db.globalSearch(query)
        setResults(searchResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search failed:', error)
        setResults({
          users: [],
          workspaces: [],
          lists: [],
          tasks: [],
          subtasks: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  // Get all results as flat array for keyboard navigation
  const getAllResults = () => {
    const allResults = []
    
    results.users.forEach(user => allResults.push({ type: 'user', data: user }))
    results.workspaces.forEach(workspace => allResults.push({ type: 'workspace', data: workspace }))
    results.lists.forEach(list => allResults.push({ type: 'list', data: list }))
    results.tasks.forEach(task => allResults.push({ type: 'task', data: task }))
    results.subtasks.forEach(subtask => allResults.push({ type: 'subtask', data: subtask }))
    
    return allResults
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const allResults = getAllResults()
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allResults[selectedIndex]) {
        handleResultClick(allResults[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Handle result click
  const handleResultClick = async (result) => {
    try {
      switch (result.type) {
        case 'workspace':
          setActiveWorkspace(result.data.id)
          onClose()
          break
        case 'list':
          // Fetch complete list data with tasks
          const completeListData = await window.db.getTasks(result.data.id)
          const listWithTasks = {
            ...result.data,
            tasks: completeListData
          }
          navigateToTaskProgress(listWithTasks)
          setSelectedList(listWithTasks)
          onClose()
          break
        case 'task':
          // Fetch complete list data for the task's list
          const taskListId = result.data.listId || result.data.list?.id
          if (taskListId) {
            const taskListTasks = await window.db.getTasks(taskListId)
            const taskListWithTasks = {
              id: taskListId,
              name: result.data.list.name,
              workspace: result.data.list.workspace,
              tasks: taskListTasks
            }
            navigateToTaskProgress(taskListWithTasks)
            setSelectedList(taskListWithTasks)
          }
          onClose()
          break
        case 'subtask':
          // Fetch complete list data for the subtask's task's list
          const subtaskListId = result.data.task.list?.id
          if (subtaskListId) {
            const subtaskListTasks = await window.db.getTasks(subtaskListId)
            const subtaskListWithTasks = {
              id: subtaskListId,
              name: result.data.task.list.name,
              workspace: result.data.task.list.workspace,
              tasks: subtaskListTasks
            }
            navigateToTaskProgress(subtaskListWithTasks)
            setSelectedList(subtaskListWithTasks)
          }
          onClose()
          break
        default:
          onClose()
      }
    } catch (error) {
      console.error('Error handling search result click:', error)
      onClose()
    }
  }

  // Format time for display
  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-500'
      case 'inprogress': return 'bg-blue-500'
      case 'todo': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const renderResultItem = (result, index) => {
    const isSelected = index === selectedIndex
    const { type, data } = result

    const baseClasses = `flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
      isSelected ? 'bg-accent' : 'hover:bg-accent/50'
    }`

    switch (type) {
      case 'user':
        return (
          <motion.div
            key={`user-${data.id}`}
            className={baseClasses}
            onClick={() => handleResultClick(result)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{data.name || data.username}</div>
              <div className="text-sm text-muted-foreground">{data.email}</div>
            </div>
            <Badge variant="secondary" className="text-xs">User</Badge>
          </motion.div>
        )

      case 'workspace':
        return (
          <motion.div
            key={`workspace-${data.id}`}
            className={baseClasses}
            onClick={() => handleResultClick(result)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white">
              <Building className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{data.name}</div>
              <div className="text-sm text-muted-foreground">
                Owner: {data.user.name || data.user.username}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">Workspace</Badge>
          </motion.div>
        )

      case 'list':
        return (
          <motion.div
            key={`list-${data.id}`}
            className={baseClasses}
            onClick={() => handleResultClick(result)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
              <List className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{data.name}</div>
              <div className="text-sm text-muted-foreground">
                Workspace: {data.workspace.name}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">List</Badge>
          </motion.div>
        )

      case 'task':
        return (
          <motion.div
            key={`task-${data.id}`}
            className={baseClasses}
            onClick={() => handleResultClick(result)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{data.title}</div>
              <div className="text-sm text-muted-foreground">
                {data.list.workspace.name} → {data.list.name}
              </div>
              {data.notes && (
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {data.notes}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs text-white ${getStatusColor(data.status)}`}>
                {data.status}
              </Badge>
              <Badge className={`text-xs text-white ${getPriorityColor(data.priority)}`}>
                {data.priority}
              </Badge>
              {data.estimatedTime > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatTime(data.estimatedTime)}
                </div>
              )}
            </div>
          </motion.div>
        )

      case 'subtask':
        return (
          <motion.div
            key={`subtask-${data.id}`}
            className={baseClasses}
            onClick={() => handleResultClick(result)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
              <Square className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{data.title}</div>
              <div className="text-sm text-muted-foreground">
                Task: {data.task.title} → {data.task.list.workspace.name} → {data.task.list.name}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={data.completed ? "default" : "secondary"} className="text-xs">
                {data.completed ? 'Completed' : 'Pending'}
              </Badge>
              <Badge variant="outline" className="text-xs">Subtask</Badge>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  const allResults = getAllResults()
  const hasResults = allResults.length > 0
  const totalResults = results.users.length + results.workspaces.length + results.lists.length + results.tasks.length + results.subtasks.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Global Search</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search users, workspaces, lists, tasks..."
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 transform p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Searching...</div>
            </div>
          ) : query.trim().length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <div className="mb-2 text-lg font-medium text-foreground">Search Everything</div>
              <div className="text-muted-foreground">
                Find users, workspaces, lists, tasks, and subtasks across your entire workspace
              </div>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <div className="mb-2 text-lg font-medium text-foreground">No results found</div>
              <div className="text-muted-foreground">
                Try adjusting your search terms or check spelling
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-6 pt-0">
              <div className="mb-4 text-sm text-muted-foreground">
                Found {totalResults} result{totalResults !== 1 ? 's' : ''}
              </div>
              
              <div className="space-y-2">
                <AnimatePresence>
                  {allResults.map((result, index) => renderResultItem(result, index))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {hasResults && (
          <div className="border-t p-4 text-xs text-muted-foreground">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog