import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Menu, FileText, ChevronLeft, ChevronRight, MoreVertical, CheckCircle2, ChevronDown, ChevronUp, X, Bold, Italic, Strikethrough, List, ListOrdered, Undo, Redo, ArrowUp, ArrowDown, Trash2, Zap } from 'lucide-react'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Progress } from './ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import DayWithLabel from './DayWithLabel'
import TaskCard from './TaskCard' // Import the new component

const KanbanColumn = ({
  column,
  scrollRefs,
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
  taskSubtasks, // Assuming subtasks are managed at a higher level or passed per task
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
  editingTask,
  setEditingTask,
  editingTaskValue,
  setEditingTaskValue,
  handleEditTask,
  handleSaveTaskEdit,
  handleCancelTaskEdit,
  hoveredSubtask,
  setHoveredSubtask,
  handleToggleSubtask,
  handleMoveSubtask,
  handleDeleteSubtask,
  newTaskInputs,
  handleInputChange,
  handleKeyPress,
  getColumnProgress,
  handleLeapItClick,
}) => {
  // Note: Some state like newSubtaskInputs, taskNotes, etc., might need to be scoped per task or column
  // For simplicity, passing them down for now. Refinements might be needed.

  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div key={column.id} className="flex h-[calc(100vh-150px)] w-full min-w-[350px] max-w-[370px] flex-col">
      <Card className={`flex h-full flex-col border ${column.color} bg-card`}>
        {/* Column Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-card-foreground">{column.title}</h3>
            {column.id !== 'done' && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                <Plus className="h-5 w-5 text-zinc-700" />
              </Button>
            )}
          </div>
          {(column.id === 'thisweek' || column.id === 'today') && (
            <span className="text-sm text-muted-foreground">
              {(() => {
                const progress = getColumnProgress(column.id);
                return progress ? `${progress.completed}/${progress.total} Done` : '0/0 Done';
              })()}
            </span>
          )}
          {column.id === 'done' && (
            <p className="text-sm font-medium text-muted-foreground">
              {(() => {
                const groupedTasks = column.tasks.reduce((groups, task) => {
                  if (!task.completedAt) return groups;
                  const completionDate = new Date(task.completedAt).toDateString();
                  if (!groups[completionDate]) {
                    groups[completionDate] = [];
                  }
                  groups[completionDate].push(task);
                  return groups;
                }, {});
                
                const groupCount = Object.keys(groupedTasks).length;
                const totalTasks = column.tasks.length;
                
                if (groupCount === 0) return 'No completed tasks';
                if (groupCount === 1) return `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'} completed`;
                return `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'} in ${groupCount} days`;
              })()}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {(column.id === 'thisweek' || column.id === 'today') && (
          <div className="mx-4 mb-6">
            <Progress
              value={(() => {
                const progress = getColumnProgress(column.id);
                return progress && progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
              })()}
              className="h-2 w-full"
            />
          </div>
        )}

        {/* Done Column Header Info */}
        {column.id === 'done' && (
          <div className="px-4 pb-4">
            <div className="flex justify-between text-right">
              <p className="text-sm text-muted-foreground">
                {(() => {
                  if (column.tasks.length === 0) return 'No tasks completed';
                  
                  // Get the most recent completion date
                  const mostRecentTask = column.tasks.reduce((latest, task) => {
                    if (!task.completedAt) return latest;
                    if (!latest.completedAt) return task;
                    return new Date(task.completedAt) > new Date(latest.completedAt) ? task : latest;
                  }, {});
                  
                  if (!mostRecentTask.completedAt) return 'No completion date';
                  
                  return new Date(mostRecentTask.completedAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                })()}
              </p>
              <p className="text-sm text-muted-foreground">
                {column.tasks.length} {column.tasks.length === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          </div>
        )}

        {/* Tasks and Add Task Container */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Scrollable Tasks */}
          <CardContent
            ref={(el) => {
              scrollRefs.current[column.id] = el
              setNodeRef(el)
            }}
            className="min-h-0 space-y-3 overflow-y-auto p-4 pt-0"
          >
            <SortableContext
              items={column.tasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {column.id === 'done' ? (
                // Group tasks by completion date for Done column
                (() => {
                  // Group tasks by completion date
                  const groupedTasks = column.tasks.reduce((groups, task) => {
                    if (!task.completedAt) return groups;
                    
                    const completionDate = new Date(task.completedAt).toDateString();
                    if (!groups[completionDate]) {
                      groups[completionDate] = [];
                    }
                    groups[completionDate].push(task);
                    return groups;
                  }, {});
                  
                  // Sort groups by date (most recent first)
                  const sortedGroups = Object.entries(groupedTasks).sort(([dateA], [dateB]) =>
                    new Date(dateB) - new Date(dateA)
                  );
                  
                  return sortedGroups.map(([dateString, tasks]) => (
                    <div key={dateString} className="mb-4">
                      {/* Date Header */}
                      <div className="mb-2 text-xs font-medium text-muted-foreground">
                        {new Date(dateString).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      
                      {/* Tasks for this date */}
                      <div className="space-y-3">
                        {tasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            columnId={column.id}
                            hoveredTask={hoveredTask}
                            setHoveredTask={setHoveredTask}
                            dropdownOpen={dropdownOpen}
                            setDropdownOpen={setDropdownOpen}
                            handleCompleteTask={handleCompleteTask}
                            handleToggleSubtasks={handleToggleSubtasks}
                            handleShowSubtaskInput={handleShowSubtaskInput}
                            handleToggleNotes={handleToggleNotes}
                            handleMoveTask={handleMoveTask}
                            handleDuplicateTask={handleDuplicateTask}
                            handleChangePriority={handleChangePriority}
                            handleDeleteTask={handleDeleteTask}
                            getPriorityColor={getPriorityColor}
                            taskNotes={taskNotes}
                            handleNotesChange={handleNotesChange}
                            handleSaveNotes={handleSaveNotes}
                            handleDeleteNotes={handleDeleteNotes}
                            expandedNotes={expandedNotes}
                            setExpandedNotes={setExpandedNotes}
                            expandedSubtasks={expandedSubtasks}
                            setExpandedSubtasks={setExpandedSubtasks}
                            newSubtaskInputs={newSubtaskInputs}
                            handleSubtaskInputChange={handleSubtaskInputChange}
                            handleSubtaskKeyPress={handleSubtaskKeyPress}
                            handleAddSubtask={handleAddSubtask}
                            editingSubtask={editingSubtask}
                            setEditingSubtask={setEditingSubtask}
                            editingSubtaskValue={editingSubtaskValue}
                            setEditingSubtaskValue={setEditingSubtaskValue}
                            handleSaveSubtaskEdit={handleSaveSubtaskEdit}
                            handleCancelSubtaskEdit={handleCancelSubtaskEdit}
                            hoveredSubtask={hoveredSubtask}
                            setHoveredSubtask={setHoveredSubtask}
                            handleToggleSubtask={handleToggleSubtask}
                            handleMoveSubtask={handleMoveSubtask}
                            handleDeleteSubtask={handleDeleteSubtask}
                            editingTask={editingTask}
                            setEditingTask={setEditingTask}
                            editingTaskValue={editingTaskValue}
                            setEditingTaskValue={setEditingTaskValue}
                            handleEditTask={handleEditTask}
                            handleSaveTaskEdit={handleSaveTaskEdit}
                            handleCancelTaskEdit={handleCancelTaskEdit}
                          />
                        ))}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                // Regular task list for other columns
                column.tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    columnId={column.id}
                    hoveredTask={hoveredTask}
                    setHoveredTask={setHoveredTask}
                    dropdownOpen={dropdownOpen}
                    setDropdownOpen={setDropdownOpen}
                    handleCompleteTask={handleCompleteTask}
                    handleToggleSubtasks={handleToggleSubtasks}
                    handleShowSubtaskInput={handleShowSubtaskInput}
                    handleToggleNotes={handleToggleNotes}
                    handleMoveTask={handleMoveTask}
                    handleDuplicateTask={handleDuplicateTask}
                    handleChangePriority={handleChangePriority}
                    handleDeleteTask={handleDeleteTask}
                    getPriorityColor={getPriorityColor}
                    taskNotes={taskNotes}
                    handleNotesChange={handleNotesChange}
                    handleSaveNotes={handleSaveNotes}
                    handleDeleteNotes={handleDeleteNotes}
                    expandedNotes={expandedNotes}
                    setExpandedNotes={setExpandedNotes}
                    expandedSubtasks={expandedSubtasks}
                    setExpandedSubtasks={setExpandedSubtasks}
                    newSubtaskInputs={newSubtaskInputs}
                    handleSubtaskInputChange={handleSubtaskInputChange}
                    handleSubtaskKeyPress={handleSubtaskKeyPress}
                    handleAddSubtask={handleAddSubtask}
                    editingSubtask={editingSubtask}
                    setEditingSubtask={setEditingSubtask}
                    editingSubtaskValue={editingSubtaskValue}
                    setEditingSubtaskValue={setEditingSubtaskValue}
                    handleSaveSubtaskEdit={handleSaveSubtaskEdit}
                    handleCancelSubtaskEdit={handleCancelSubtaskEdit}
                    hoveredSubtask={hoveredSubtask}
                    setHoveredSubtask={setHoveredSubtask}
                    handleToggleSubtask={handleToggleSubtask}
                    handleMoveSubtask={handleMoveSubtask}
                    handleDeleteSubtask={handleDeleteSubtask}
                    editingTask={editingTask}
                    setEditingTask={setEditingTask}
                    editingTaskValue={editingTaskValue}
                    setEditingTaskValue={setEditingTaskValue}
                    handleEditTask={handleEditTask}
                    handleSaveTaskEdit={handleSaveTaskEdit}
                    handleCancelTaskEdit={handleCancelTaskEdit}
                  />
                ))
              )}
            </SortableContext>
          </CardContent>

          {/* Add Task Input - Always visible, right after tasks */}
          <div className="flex-shrink-0 px-4 pb-2">
            <Input
              placeholder="+ ADD TASK"
              value={newTaskInputs[column.id] || ''}
              onChange={(e) => handleInputChange(column.id, e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, column.id)}
              className="h-12 border-dashed border-zinc-300 bg-transparent text-sm text-foreground placeholder:font-semibold placeholder:text-muted-foreground dark:border-zinc-700"
            />
          </div>
        </div>

        {/* Column Footer - Fixed at bottom */}
        <div className="mt-auto p-4 pt-2">
          {column.id === 'backlog' && (
            <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-border" />
                All Clear
              </div>
            </Button>
          )}
          {column.id === 'thisweek' && (
            <div className="w-full px-16">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Week Progress</span>
                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between gap-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                  const today = new Date()
                  const currentDayOfWeek = today.getDay()
                  const mondayBasedDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
                  const isPassed = index <= mondayBasedDay
                  const isToday = index === mondayBasedDay
                  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                  
                  return (
                    <DayWithLabel
                      key={index}
                      day={day}
                      dayName={dayNames[index]}
                      isToday={isToday}
                      isPassed={isPassed}
                    />
                  )
                })}
              </div>
            </div>
          )}
          {column.id === 'today' && (
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleLeapItClick}
            >
              <Zap className="mr-2 h-4 w-4" />
              Leap It!
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default KanbanColumn