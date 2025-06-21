import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Archive, Search, Filter } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import useAppStore from '../stores/useAppStore'

const ArchivedPage = ({ currentUser }) => {
  // Get archived lists from Zustand store
  const { archivedLists, setArchivedLists, unarchiveList } = useAppStore()
  
  const [filteredLists, setFilteredLists] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, name

  useEffect(() => {
    const fetchArchivedLists = async () => {
      if (!currentUser?.id) return
      
      try {
        // Get all workspaces for the user
        const userWorkspaces = await window.db.getWorkspaces(currentUser.id)
        
        // Get all archived lists from all user's workspaces
        const allArchivedLists = []
        for (const workspace of userWorkspaces) {
          const lists = await window.db.getLists(workspace.id)
          const archivedListsInWorkspace = lists.filter(list => list.isArchived)
          // Add workspace info to each list
          const listsWithWorkspace = archivedListsInWorkspace.map(list => ({
            ...list,
            workspaceName: workspace.name
          }))
          allArchivedLists.push(...listsWithWorkspace)
        }
        
        setArchivedLists(allArchivedLists)
        setFilteredLists(allArchivedLists)
      } catch (error) {
        console.error('Failed to fetch archived lists:', error)
      }
    }
    
    fetchArchivedLists()
  }, [currentUser?.id])

  // Filter and sort lists
  useEffect(() => {
    let filtered = archivedLists.filter(list =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      list.workspaceName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort lists
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.archivedAt) - new Date(a.archivedAt)
        case 'oldest':
          return new Date(a.archivedAt) - new Date(b.archivedAt)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredLists(filtered)
  }, [archivedLists, searchQuery, sortBy])

  const handleUnarchiveList = async (listId) => {
    try {
      const now = new Date().toISOString()
      await window.db.updateList(listId, {
        isArchived: false,
        archivedAt: null,
        updatedAt: now
      })
      
      // Update Zustand store - this will automatically update workspace counts and archived lists
      unarchiveList(listId)
    } catch (error) {
      console.error('Failed to unarchive list:', error)
      alert('Failed to unarchive list. Please try again.')
    }
  }

  // Calculate days since archived
  const getDaysSinceArchived = (archivedAt) => {
    if (!archivedAt) return 0
    const now = new Date()
    const archived = new Date(archivedAt)
    const diffTime = Math.abs(now - archived)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Format archive date
  const formatArchiveDate = (archivedAt) => {
    const days = getDaysSinceArchived(archivedAt)
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
  }

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
      <div className="w-full flex-col">
        {/* Header */}
        <div className="mb-8 mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Archive className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-xl font-bold text-foreground">Archived Lists</h1>
          </div>
          <p className="text-muted-foreground">{archivedLists.length} archived lists</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search archived lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Sort by</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                Oldest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name A-Z
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Archived Lists Grid */}
        {filteredLists.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {searchQuery ? 'No matching archived lists' : 'No archived lists'}
            </h3>
            <p className="mb-6 max-w-md text-muted-foreground">
              {searchQuery 
                ? 'Try adjusting your search terms or filters.'
                : 'When you archive lists, they will appear here for easy management.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-5">
            {filteredLists.map((list) => (
              <motion.div
                key={list.id}
                variants={cardVariants}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
              >
                <Card className="group relative flex h-80 flex-col rounded-xl border bg-[#FCFBFB] opacity-75 transition-all duration-200 hover:opacity-100 hover:shadow-xl hover:ring-2 hover:ring-primary hover:ring-opacity-50 dark:border-zinc-700 dark:bg-[#171717]">
                  <div className='px-6 pt-3'>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`${list.iconColor} shadow-2xl text-white rounded-md w-5 h-5 flex items-center justify-center text-sm font-bold opacity-60`}>
                          {list.icon}
                        </div>
                        <div className="flex flex-col">
                          <CardTitle className="text-md max-w-[180px] truncate text-muted-foreground" title={list.name}>
                            {list.name}
                          </CardTitle>
                          {list.description && (
                            <p className="max-w-[180px] truncate text-xs text-muted-foreground/70" title={list.description}>
                              {list.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
                        onClick={() => handleUnarchiveList(list.id)}
                        title="Unarchive list"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="flex flex-1 flex-col p-6 pt-4">
                    {/* Archive Info */}
                    <div className="mb-4 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Archived {formatArchiveDate(list.archivedAt)}</span>
                        <span>From: {list.workspaceName}</span>
                      </div>
                    </div>
                    
                    {/* Placeholder content area */}
                    <div className="flex-1 rounded-lg border border-dashed border-border/50 p-4 text-center">
                      <p className="text-xs text-muted-foreground/50">
                        Archived list content
                      </p>
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-4 border-t border-border/50 pt-3">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnarchiveList(list.id)}
                          className="text-xs"
                        >
                          <RotateCcw className="mr-2 h-3 w-3" />
                          Unarchive
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArchivedPage