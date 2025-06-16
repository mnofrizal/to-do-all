import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  SkipForward, 
  Target, 
  Menu, 
  FileText, 
  MoreVertical, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Trash2,
  Save
} from 'lucide-react'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'

const FloatingTaskCard = ({
  task,
  index,
  isActive,
  isTimerRunning,
  onActivateTask,
  onSkipTask,
  onToggleTimer,
  onCompleteTask,
  onGetCurrentTimer,
  onGetTaskTimer,
  // Subtask handlers
  expandedSubtasks,
  setExpandedSubtasks,
  newSubtaskInputs,
  handleSubtaskInputChange,
  handleSubtaskKeyPress,
  handleAddSubtask,
  handleToggleSubtask,
  handleMoveSubtask,
  handleDeleteSubtask,
  // Notes handlers
  expandedNotes,
  setExpandedNotes,
  taskNotes,
  handleNotesChange,
  handleSaveNotes,
  handleDeleteNotes,
  // Task handlers
  handleDeleteTask,
  handleDuplicateTask,
  handleChangePriority,
  getPriorityColor,
  // Edit handlers
  editingTask,
  setEditingTask,
  editingTaskValue,
  setEditingTaskValue,
  handleEditTask,
  handleSaveTaskEdit,
  handleCancelTaskEdit,
  editingSubtask,
  setEditingSubtask,
  editingSubtaskValue,
  setEditingSubtaskValue,
  handleSaveSubtaskEdit,
  handleCancelSubtaskEdit,
  hoveredSubtask,
  setHoveredSubtask
}) => {
  const [hoveredTask, setHoveredTask] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleToggleSubtasks = () => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [task.id]: !prev[task.id]
    }))
  }

  const handleShowSubtaskInput = () => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [task.id]: true
    }))
  }

  const handleToggleNotes = () => {
    setExpandedNotes(prev => ({
      ...prev,
      [task.id]: !prev[task.id]
    }))
  }

  const handleEditSubtask = (taskId, subtaskId, title) => {
    setEditingSubtask(`${taskId}-${subtaskId}`)
    setEditingSubtaskValue(title)
  }

  // Format timer for display - only for active task
  const formatTimer = () => {
    if (isActive) {
      const timer = onGetCurrentTimer ? onGetCurrentTimer() : { hours: 0, minutes: 0, seconds: 0 }
      return `${timer.hours.toString().padStart(2, '0')}:${timer.minutes.toString().padStart(2, '0')}:${timer.seconds.toString().padStart(2, '0')}`
    }
    return null
  }

  return (
    <motion.div
      className={`rounded-lg cursor-pointer transition-all relative p-3 shadow-sm ${
        isActive
          ? 'bg-card dark:bg-[#262626]'
          : 'border border-zinc-300 dark:border-zinc-800 bg-card dark:bg-[#262626] hover:bg-accent'
      }`}
      style={isActive ? {
        border: '2px solid transparent',
        background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899) border-box',
        backgroundClip: 'padding-box, border-box'
      } : {}}
      onMouseEnter={() => setHoveredTask(true)}
      onMouseLeave={() => setHoveredTask(false)}
      onKeyDown={(e) => {
        // Prevent card-level key events when not in edit mode
        if (editingTask !== task.id) {
          e.stopPropagation()
        }
      }}
      layout
    >
      {/* Active Task: Hover overlay for title/timer area only */}
      {isActive && (
        <div className="relative flex min-h-[32px] items-center justify-between gap-2">
          <AnimatePresence>
            {hoveredTask && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white px-2 py-1 dark:bg-[#262626]"
              >
                <div className="flex items-center justify-center gap-1">
                  <ControlButton
                    icon={isTimerRunning ? Pause : Play}
                    label={isTimerRunning ? "Pause" : "Play"}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleTimer()
                    }}
                    size="sm"
                  />
                  
                  <ControlButton
                    icon={FileText}
                    label="Notes"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleNotes()
                    }}
                    size="sm"
                  />
                  
                  <ControlButton
                    icon={Menu}
                    label="Subtasks"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (task.subtasks && task.subtasks.length > 0) {
                        handleToggleSubtasks()
                      } else {
                        handleShowSubtaskInput()
                      }
                    }}
                    size="sm"
                  />
                  
                  <ControlButton
                    icon={SkipForward}
                    label="Skip"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSkipTask()
                    }}
                    color="orange"
                    size="sm"
                  />
                  
                  <ControlButton
                    icon={CheckCircle2}
                    label="Done"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCompleteTask(task.id)
                    }}
                    color="green"
                    size="sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active task content - always present to maintain layout */}
          <div className={`flex items-center justify-between gap-2 w-full ${hoveredTask ? 'opacity-0' : 'opacity-100'}`}>
              {editingTask === task.id ? (
                <input
                  type="text"
                  value={editingTaskValue}
                  onChange={(e) => setEditingTaskValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSaveTaskEdit(task.id)
                    } else if (e.key === 'Escape') {
                      e.preventDefault()
                      handleCancelTaskEdit()
                    }
                  }}
                  onBlur={() => handleSaveTaskEdit(task.id)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex-1 rounded border-none bg-white px-2 py-1 text-lg font-semibold outline-none focus:outline-none focus:ring-0"
                  placeholder="Add task title here"
                  autoFocus
                />
              ) : (
                <span
                  className="cursor-pointer truncate text-lg font-semibold text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditTask(task.id, task.title)
                  }}
                >
                  {task.title}
                </span>
              )}
              
              <div className="text-lg font-bold text-primary">
                {formatTimer()}
              </div>
          </div>
        </div>
      )}

      {/* Inactive Task: Original TaskCard behavior */}
      {!isActive && (
        <div className="flex items-start justify-between gap-2">
          <div className="relative flex min-w-0 flex-1 items-start gap-2">
            {/* Checklist button */}
            <AnimatePresence>
              {hoveredTask && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCompleteTask(task.id)
                  }}
                  className="absolute z-10 mt-0.5 text-muted-foreground transition-colors hover:text-green-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CheckCircle2 size={16} strokeWidth={2} fill="none" />
                </motion.button>
              )}
            </AnimatePresence>
            
            {/* Title with smooth slide animation */}
            {editingTask === task.id ? (
              <motion.input
                type="text"
                value={editingTaskValue}
                onChange={(e) => setEditingTaskValue(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveTaskEdit(task.id)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    handleCancelTaskEdit()
                  }
                }}
                onBlur={() => handleSaveTaskEdit(task.id)}
                onPointerDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex-1 rounded border-none bg-white px-2 py-1 text-sm font-light text-foreground outline-none focus:outline-none focus:ring-0"
                placeholder="Add task title here"
                animate={{
                  x: hoveredTask ? 24 : 0
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                autoFocus
              />
            ) : (
              <motion.span
                className="cursor-pointer truncate text-sm font-light text-foreground"
                animate={{
                  x: hoveredTask ? 24 : 0
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditTask(task.id, task.title)
                }}
              >
                {task.title}
              </motion.span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {(hoveredTask || dropdownOpen) ? (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="z-50 mt-0.5 flex items-center gap-2 bg-background pl-3"
                >
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (task.subtasks && task.subtasks.length > 0) {
                        handleToggleSubtasks()
                      } else {
                        handleShowSubtaskInput()
                      }
                    }}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Menu size={16} />
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleNotes()
                    }}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FileText size={16} />
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      onActivateTask(task.id)
                    }}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Target size={16} />
                  </motion.button>
                  <DropdownMenu
                    onOpenChange={(open) => {
                      setDropdownOpen(open)
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical size={16} />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-24">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateTask(task.id)
                        }}
                        className="text-xs"
                      >
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleChangePriority(task.id, 'high')
                        }}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          High
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleChangePriority(task.id, 'medium')
                        }}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          Medium
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleChangePriority(task.id, 'low')
                        }}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          Low
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTask(task.id)
                        }}
                        className="text-xs text-destructive focus:text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ) : (
                <div key="badges" className="flex items-center gap-2">
                  {/* Priority Badge */}
                  <div
                    className={`${getPriorityColor(task.priority)} h-3 w-3 rounded-full`}
                    title={`Priority: ${task.priority}`}
                  />
                  {/* Task Group Badge */}
                  <div
                    className={`${task.taskGroup?.color || 'bg-gray-500'} h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}
                  >
                    {task.taskGroup?.name || 'T'}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
      

      {/* Subtasks Section */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleSubtasks()
            }}
          >
            <div className="flex items-center gap-2">
              {/* Circular Progress Bar */}
              <div className="relative h-4 w-4">
                <svg className="h-4 w-4 -rotate-90 transform" viewBox="0 0 16 16">
                  {/* Background circle */}
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-muted-foreground/30"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 6}`}
                    strokeDashoffset={`${2 * Math.PI * 6 * (1 - (task.subtasks.filter(st => st.completed).length / task.subtasks.length))}`}
                    className="text-primary transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-sm text-muted-foreground">
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} Subtasks
              </span>
            </div>
            {expandedSubtasks[task.id] ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </div>

          <AnimatePresence>
            {expandedSubtasks[task.id] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="mt-3 space-y-2"
              >
                {/* Subtask List */}
                {task.subtasks.length > 0 && (
                  <div className="space-y-1">
                    {task.subtasks.map((subtask, subtaskIndex) => (
                      <div
                        key={subtask.id}
                        className="group relative flex items-center gap-2 py-1"
                        onMouseEnter={() => setHoveredSubtask(`${task.id}-${subtask.id}`)}
                        onMouseLeave={() => setHoveredSubtask(null)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleSubtask(task.id, subtask.id)
                          }}
                          className="text-muted-foreground hover:text-green-600"
                        >
                          <CheckCircle2
                            size={16}
                            className={subtask.completed ? 'text-green-600' : 'text-muted-foreground'}
                            fill={subtask.completed ? 'currentColor' : 'none'}
                          />
                        </button>
                        
                        {/* Editable title */}
                        {editingSubtask === `${task.id}-${subtask.id}` ? (
                          <input
                            type="text"
                            value={editingSubtaskValue}
                            onChange={(e) => setEditingSubtaskValue(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation()
                              if (e.key === 'Enter') {
                                handleSaveSubtaskEdit(task.id, subtask.id)
                              } else if (e.key === 'Escape') {
                                handleCancelSubtaskEdit()
                              }
                            }}
                            onBlur={() => handleSaveSubtaskEdit(task.id, subtask.id)}
                            onPointerDown={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex-1 rounded border border-primary bg-background px-2 py-1 text-sm focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={`flex-1 text-sm cursor-pointer ${
                              subtask.completed
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSubtask(task.id, subtask.id, subtask.title)
                            }}
                          >
                            {subtask.title}
                          </span>
                        )}

                        {/* Hover controls */}
                        <AnimatePresence>
                          {hoveredSubtask === `${task.id}-${subtask.id}` && editingSubtask !== `${task.id}-${subtask.id}` && (
                            <motion.div
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveSubtask(task.id, subtask.id, 'up')
                                }}
                                disabled={subtaskIndex === 0}
                                className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveSubtask(task.id, subtask.id, 'down')
                                }}
                                disabled={subtaskIndex === task.subtasks.length - 1}
                                className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ArrowDown size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSubtask(task.id, subtask.id)
                                }}
                                className="text-muted-foreground hover:text-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Subtask Input - Now below the subtask list */}
                <div className="relative">
                  <Input
                    placeholder="Enter subtask task title*"
                    value={newSubtaskInputs[task.id] || ''}
                    onChange={(e) => handleSubtaskInputChange(task.id, e.target.value)}
                    onKeyPress={(e) => handleSubtaskKeyPress(e, task.id)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="m-0 h-10 border bg-background p-0 px-2 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedSubtasks(prev => ({ ...prev, [task.id]: false }))
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Subtask Input for tasks with no subtasks */}
      {task.subtasks && task.subtasks.length === 0 && expandedSubtasks[task.id] && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="mt-3 border-t border-border pt-3"
        >
          <div className="relative">
            <Input
              placeholder="Enter subtask task title*"
              value={newSubtaskInputs[task.id] || ''}
              onChange={(e) => handleSubtaskInputChange(task.id, e.target.value)}
              onKeyPress={(e) => handleSubtaskKeyPress(e, task.id)}
              onKeyDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-10 border-2 border-primary bg-background pr-10 text-sm text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedSubtasks(prev => ({ ...prev, [task.id]: false }))
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Notes Section */}
      <AnimatePresence>
        {expandedNotes[task.id] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
              opacity: { duration: 0.2, ease: "easeOut" },
              height: {
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1],
                delay: expandedNotes[task.id] ? 0 : 0.15
              }
            }}
            className="mt-3 border-t border-border pt-3"
            style={{ overflow: 'hidden' }}
          >
            {/* Notes Textarea */}
            <div className="relative">
              <textarea
                placeholder="Enter your notes here..."
                value={taskNotes[task.id] || ''}
                onChange={(e) => handleNotesChange(task.id, e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <div className="absolute right-3 top-3 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveNotes(task.id)
                  }}
                  className="text-muted-foreground hover:text-green-600"
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedNotes(prev => ({ ...prev, [task.id]: false }))
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Indicator */}
      {task.notes && !expandedNotes[task.id] && (
        <div className="mt-3 border-t border-border pt-3">
          <div
            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleNotes()
            }}
          >
            <FileText size={14} />
            <span>{task.notes}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ControlButton component for hover controls
const ControlButton = ({ icon: Icon, label, onClick, color = "default", size = "default" }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      case "green":
        return "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
      case "orange":
        return "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
      default:
        return "text-muted-foreground hover:text-foreground hover:bg-accent"
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs"
      default:
        return "px-3 py-2 text-sm"
    }
  }

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return 14
      default:
        return 16
    }
  }

  return (
    <motion.button
      className={`flex items-center gap-1 rounded-lg font-medium transition-all ${getColorClasses()} ${getSizeClasses()}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Icon size={getIconSize()} />
      <motion.span
        initial={{ width: 0, opacity: 0 }}
        animate={{
          width: isHovered ? "auto" : 0,
          opacity: isHovered ? 1 : 0
        }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="overflow-hidden whitespace-nowrap"
      >
        {label}
      </motion.span>
    </motion.button>
  )
}

export default FloatingTaskCard