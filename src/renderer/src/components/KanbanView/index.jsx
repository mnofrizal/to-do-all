import React, { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import KanbanColumn from './ui/KanbanColumn'
import useTaskStore from '../../stores/useTaskStore'
import { getColumnProgress, getPriorityColor } from './lib/utils'

const KanbanView = ({ onLeapIt }) => {
  const scrollRefs = useRef({})
  const {
    taskColumns,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addAttachment,
    deleteAttachment,
    moveTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    selectedList
  } = useTaskStore()

  const [newTaskInputs, setNewTaskInputs] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [hoveredTask, setHoveredTask] = useState(null)
  const [expandedSubtasks, setExpandedSubtasks] = useState({})
  const [newSubtaskInputs, setNewSubtaskInputs] = useState({})
  const [expandedNotes, setExpandedNotes] = useState({})
  const [dropdownOpen, setDropdownOpen] = useState({})
  const [hoveredSubtask, setHoveredSubtask] = useState(null)
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [editingSubtaskValue, setEditingSubtaskValue] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [editingTaskValue, setEditingTaskValue] = useState('')
  const [expandedAttachments, setExpandedAttachments] = useState({})

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    if (selectedList) {
      loadTasks(selectedList.id)
    }
  }, [selectedList, loadTasks])

  const handleInputChange = (columnId, value) => {
    setNewTaskInputs({ ...newTaskInputs, [columnId]: value })
  }

  const handleKeyPress = (e, columnId) => {
    if (e.key === 'Enter') {
      createTask(columnId, newTaskInputs[columnId])
      setNewTaskInputs({ ...newTaskInputs, [columnId]: '' })
    }
  }

  const onDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    const task = taskColumns.flatMap((col) => col.tasks).find((t) => t.id === active.id)
    setDraggedTask(task)
    handleDragStart(event)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex h-[calc(100vh-105px)] flex-col">
        <div
          className="kanban-scrollbar flex-1 overflow-x-auto overflow-y-hidden pt-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}
        >
          <div className="mx-auto flex h-full min-w-fit max-w-7xl gap-4 px-6 pb-4">
            {Array.isArray(taskColumns) &&
              taskColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  scrollRefs={scrollRefs}
                  hoveredTask={hoveredTask}
                  setHoveredTask={setHoveredTask}
                  dropdownOpen={dropdownOpen}
                  setDropdownOpen={setDropdownOpen}
                  handleCompleteTask={(taskId) => {
                    const task = taskColumns
                      .flatMap((col) => col.tasks)
                      .find((t) => t.id === taskId)
                    if (task) {
                      updateTask(taskId, {
                        status: task.status === 'done' ? 'inprogress' : 'done',
                        completedAt: task.status === 'done' ? null : new Date().toISOString()
                      })
                    }
                  }}
                  handleDeleteTask={deleteTask}
                  getPriorityColor={getPriorityColor}
                  expandedNotes={expandedNotes}
                  setExpandedNotes={setExpandedNotes}
                  expandedSubtasks={expandedSubtasks}
                  setExpandedSubtasks={setExpandedSubtasks}
                  newSubtaskInputs={newSubtaskInputs}
                  handleSubtaskInputChange={(taskId, value) => setNewSubtaskInputs(prev => ({ ...prev, [taskId]: value }))}
                  handleSubtaskKeyPress={(e, taskId) => {
                    if (e.key === 'Enter') {
                      addSubtask(taskId, newSubtaskInputs[taskId])
                      setNewSubtaskInputs(prev => ({ ...prev, [taskId]: '' }))
                    }
                  }}
                  editingSubtask={editingSubtask}
                  setEditingSubtask={setEditingSubtask}
                  editingSubtaskValue={editingSubtaskValue}
                  setEditingSubtaskValue={setEditingSubtaskValue}
                  handleSaveSubtaskEdit={(taskId, subtaskId) => {
                    updateSubtask(taskId, subtaskId, { title: editingSubtaskValue })
                    setEditingSubtask(null)
                  }}
                  handleCancelSubtaskEdit={() => setEditingSubtask(null)}
                  editingTask={editingTask}
                  setEditingTask={setEditingTask}
                  editingTaskValue={editingTaskValue}
                  setEditingTaskValue={setEditingTaskValue}
                  handleEditTask={(taskId, title) => {
                    setEditingTask(taskId)
                    setEditingTaskValue(title)
                  }}
                  handleSaveTaskEdit={(taskId) => {
                    updateTask(taskId, { title: editingTaskValue })
                    setEditingTask(null)
                  }}
                  handleCancelTaskEdit={() => setEditingTask(null)}
                  hoveredSubtask={hoveredSubtask}
                  setHoveredSubtask={setHoveredSubtask}
                  handleToggleSubtask={(taskId, subtaskId) => {
                    const task = taskColumns.flatMap(col => col.tasks).find(t => t.id === taskId)
                    const subtask = task.subtasks.find(st => st.id === subtaskId)
                    if (subtask) {
                      updateSubtask(taskId, subtaskId, { completed: !subtask.completed })
                    }
                  }}
                  handleMoveSubtask={(taskId, subtaskId, direction) => {
                    // Implement move subtask logic in store
                  }}
                  handleDeleteSubtask={deleteSubtask}
                  newTaskInputs={newTaskInputs}
                  handleInputChange={handleInputChange}
                  handleKeyPress={handleKeyPress}
                  getColumnProgress={(id) => getColumnProgress(taskColumns, id)}
                  handleLeapItClick={onLeapIt}
                  handleToggleSubtasks={(taskId) => setExpandedSubtasks(prev => ({ ...prev, [taskId]: !prev[taskId] }))}
                  handleShowSubtaskInput={(taskId) => setExpandedSubtasks(prev => ({ ...prev, [taskId]: true }))}
                  handleToggleNotes={(taskId) => setExpandedNotes(prev => ({ ...prev, [taskId]: !prev[taskId] }))}
                  handleMoveTask={moveTask}
                  handleDuplicateTask={(taskId) => {
                    // Implement duplicate task logic in store
                  }}
                  handleChangePriority={(taskId, priority) => updateTask(taskId, { priority })}
                  handleAddSubtask={addSubtask}
                  addAttachment={addAttachment}
                  deleteAttachment={deleteAttachment}
                  expandedAttachments={expandedAttachments}
                  setExpandedAttachments={setExpandedAttachments}
                />
              ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId && draggedTask ? (
          <div className="rotate-3 transform opacity-80">
            <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
              <div className="font-medium text-foreground">{draggedTask.title}</div>
              {draggedTask.taskGroup && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {draggedTask.taskGroup.name}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default KanbanView