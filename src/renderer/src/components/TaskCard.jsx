import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Menu, FileText, ChevronLeft, ChevronRight, MoreVertical, CheckCircle2, ChevronDown, ChevronUp, X, Bold, Italic, Strikethrough, List, ListOrdered, Undo, Redo, ArrowUp, ArrowDown, Trash2, Save } from 'lucide-react'
import {
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'

const TaskCard = ({
  task,
  index,
  columnId,
  hoveredTask,
  setHoveredTask,
  dropdownOpen,
  setDropdownOpen,
  handleCompleteTask,
  handleToggleSubtasks,
  handleShowSubtaskInput,
  handleToggleNotes,
  handleMoveTask,
  handleDuplicateTask,
  handleChangePriority,
  handleDeleteTask,
  getPriorityColor,
  taskNotes,
  handleNotesChange,
  handleSaveNotes,
  handleDeleteNotes,
  expandedNotes,
  setExpandedNotes,
  expandedSubtasks,
  setExpandedSubtasks,
  newSubtaskInputs,
  handleSubtaskInputChange,
  handleSubtaskKeyPress,
  handleAddSubtask,
  editingSubtask,
  setEditingSubtask,
  editingSubtaskValue,
  setEditingSubtaskValue,
  handleSaveSubtaskEdit,
  handleCancelSubtaskEdit,
  hoveredSubtask,
  setHoveredSubtask,
  handleToggleSubtask,
  handleMoveSubtask,
  handleDeleteSubtask,
  editingTask,
  setEditingTask,
  editingTaskValue,
  setEditingTaskValue,
  handleEditTask,
  handleSaveTaskEdit,
  handleCancelTaskEdit
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleEditSubtask = (taskId, subtaskId, title) => {
    setEditingSubtask(`${taskId}-${subtaskId}`)
    setEditingSubtaskValue(title)
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      key={task.id}
      className={`rounded-lg border border-zinc-300 dark:border-zinc-800 dark:bg-[#262626] p-3 shadow-sm cursor-pointer hover:bg-accent transition-colors relative ${
        task.status === 'done' ? 'opacity-75' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
      onMouseEnter={() => setHoveredTask(task.id)}
      onMouseLeave={() => setHoveredTask(null)}
      onKeyDown={(e) => {
        // Prevent card-level key events when not in edit mode
        if (editingTask !== task.id) {
          e.stopPropagation()
        }
      }}
    >
      {/* Default content - always visible */}
      <div className="flex items-start justify-between gap-2">
        <div className="relative flex min-w-0 flex-1 items-start gap-2">
          {columnId === 'today' && (
            <span className="mt-0.5 text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
          )}
          
          {/* Checklist button */}
          <AnimatePresence>
            {(hoveredTask === task.id || columnId === 'done') && (
              <motion.button
                initial={columnId === 'done' ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={columnId === 'done' ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCompleteTask(task.id)
                }}
                className={`absolute z-10 mt-0.5 transition-colors ${
                  columnId === 'done'
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-muted-foreground hover:text-green-600'
                } ${
                  columnId === 'today' ? 'left-4' : 'left-0'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <CheckCircle2
                  size={16}
                  strokeWidth={2}
                  fill={columnId === 'done' ? 'currentColor' : 'none'}
                />
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Title with smooth slide animation - Editable */}
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
              className={`flex-1 bg-white rounded px-2 py-1 text-sm font-light border-none outline-none focus:outline-none focus:ring-0 ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
              placeholder="Add task title here"
              animate={{
                x: hoveredTask === task.id ? 24 : 0
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              autoFocus
            />
          ) : (
            <motion.span
              className={`font-light text-sm truncate cursor-pointer ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
              animate={{
                x: hoveredTask === task.id ? 24 : 0
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
            {(hoveredTask === task.id || dropdownOpen[task.id]) ? (
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
                      handleToggleSubtasks(task.id)
                    } else {
                      handleShowSubtaskInput(task.id)
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
                    handleToggleNotes(task.id)
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
                    handleMoveTask(task.id, 'left')
                  }}
                  className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  disabled={columnId === 'backlog'}
                  whileHover={{ scale: columnId !== 'backlog' ? 1.1 : 1 }}
                  whileTap={{ scale: columnId !== 'backlog' ? 0.95 : 1 }}
                >
                  <ChevronLeft size={16} />
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveTask(task.id, 'right')
                  }}
                  className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  disabled={columnId === 'done'}
                  whileHover={{ scale: columnId !== 'done' ? 1.1 : 1 }}
                  whileTap={{ scale: columnId !== 'done' ? 0.95 : 1 }}
                >
                  <ChevronRight size={16} />
                </motion.button>
                <DropdownMenu
                  onOpenChange={(open) => {
                    setDropdownOpen(prev => ({ ...prev, [task.id]: open }))
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
                {task.taskGroup && (
                  <div
                    className={`${task.taskGroup.color} h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}
                  >
                    {task.taskGroup.name}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      
      {task.estimate && (
        <div className="mt-2 flex items-center justify-between gap-1">
          <span className="text-xs text-muted-foreground">+ {task.estimate}</span>
          <span className="text-xs text-muted-foreground">{task.time}</span>
        </div>
      )}

      {/* Subtasks Section */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleSubtasks(task.id)
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
              <Plus size={14} className="text-muted-foreground" />
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
          {/* Formatting Toolbar */}
          <div className='flex w-full items-center justify-between'>
          <div className="mb-3 flex items-center justify-between gap-1 rounded-lg border border-border bg-muted/50 p-2">
            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
              <Bold size={14} />
            </button>
            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
              <Italic size={14} />
            </button>
            <div className="mx-1 h-4 w-px bg-border"></div>
            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
              <List size={14} />
            </button>
            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
              <ListOrdered size={14} />
            </button>
            <div className="mx-1 h-4 w-px bg-border"></div>
            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
              <Undo size={14} />
            </button>
            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
              <Redo size={14} />
            </button>
            </div>
            <div className="mb-3 flex items-center justify-between gap-1 rounded-lg border border-border bg-muted/50 p-2">
            <button className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
            <Save size={14} strokeWidth={2} />
            </button>
            <button className="rounded p-1 text-red-500 hover:bg-background hover:text-foreground">
            <Trash2 size={14} strokeWidth={2} />
            </button>
            </div>
          </div>
   

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
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedNotes(prev => ({ ...prev, [task.id]: false }))
              }}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          {/* Save and Delete Buttons  DONT DELETE USED LATER*/}
          {/* <div className="mt-3 flex justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteNotes(task.id)
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={14} />
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleSaveNotes(task.id)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save size={14} />
            </Button>
          </div> */}
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
              handleToggleNotes(task.id)
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

export default TaskCard