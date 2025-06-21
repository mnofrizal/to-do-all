import React from 'react';
import { Search, ChevronDown, ChevronRight, Paperclip, Clock } from 'lucide-react';
import { attachmentTypes } from '../lib/attachmentTypes';

const TaskListSidebar = ({
  search,
  setSearch,
  expandedSections,
  toggleSection,
  filteredColumns,
  tasksInNodes,
  draggedTask,
  onDragStart,
  onTaskDragEnd,
  draggedAttachment,
  onAttachmentDragStart,
  onAttachmentDragEnd,
}) => {
  return (
    <div className="absolute left-0 top-0 z-10 flex h-full w-52 min-w-[18rem] max-w-xs flex-col border-r border-border bg-white pb-2 shadow-lg dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-semibold text-foreground">Task Library</div>
        <div className="text-xs text-muted-foreground">Ctrl+1</div>
      </div>
      <div className="pointer-events-none">
        <div className="absolute left-0 right-0 top-0 h-8 bg-gradient-to-b from-white to-transparent px-4 py-2 dark:from-zinc-900" />
        <div className="absolute bottom-1 left-0 right-0 h-14 bg-gradient-to-t from-white to-transparent dark:from-zinc-900" />
      </div>
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded border border-border bg-background py-1.5 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {/* Tasks Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('tasks')}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-semibold text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {expandedSections.has('tasks') ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Tasks
            <span className="ml-auto rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {filteredColumns.reduce((total, col) => total + col.tasks.length, 0)} items
            </span>
          </button>
          
          {expandedSections.has('tasks') && (
            <div className="mt-2">
              {filteredColumns.map((col) =>
                col.tasks.length > 0 ? (
                  <div key={col.id} className="mb-3">
                    <button
                      onClick={() => toggleSection(col.id)}
                      className="flex w-full items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {expandedSections.has(col.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {col.title}
                      <span className="ml-auto rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        {col.tasks.length}
                      </span>
                    </button>
                    {expandedSections.has(col.id) && (
                      <div className="space-y-1 px-2 pt-1">
                        {col.tasks.map((task) => {
                          const isInNodes = tasksInNodes.has(task.id);
                          return (
                            <div
                              key={task.id}
                              className={`group rounded-lg border px-3 py-2.5 transition-all ${
                                isInNodes
                                  ? 'border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-800'
                                  : draggedTask?.id === task.id
                                  ? 'border-zinc-200 bg-white opacity-50 cursor-grabbing scale-95 dark:border-zinc-700 dark:bg-zinc-900'
                                  : 'border-zinc-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-grab dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600'
                              }`}
                              draggable={!isInNodes}
                              onDragStart={(e) => onDragStart(e, task)}
                              onDragEnd={onTaskDragEnd}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`${task.taskGroup?.color || 'bg-gray-400'} mt-0.5 h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}>
                                  {task.taskGroup?.name || 'T'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-foreground">{task.title}</div>
                                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    {task.estimate && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {task.estimate}
                                      </span>
                                    )}
                                    {task.priority && (
                                      <span className={`${
                                        task.priority === 'high' ? 'text-red-600' :
                                        task.priority === 'medium' ? 'text-yellow-600' :
                                        'text-green-600'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    )}
                                    {isInNodes && (
                                      <span className="text-blue-600">• In Timeline</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection('attachments')}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-semibold text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {expandedSections.has('attachments') ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <Paperclip className="h-3 w-3" />
            Attachments
            <span className="ml-auto rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {attachmentTypes.length} types
            </span>
          </button>
          
          {expandedSections.has('attachments') && (
            <div className="mt-2 grid grid-cols-2 gap-4 px-2 pt-1">
              {attachmentTypes.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`group rounded-lg border border-zinc-200 bg-white px-3 py-2.5 transition-all hover:border-orange-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-orange-600 ${
                    draggedAttachment?.id === attachment.id
                      ? 'opacity-50 cursor-grabbing scale-95'
                      : 'cursor-grab'
                  }`}
                  draggable
                  onDragStart={(e) => onAttachmentDragStart(e, attachment)}
                  onDragEnd={onAttachmentDragEnd}
                >
                  <div className="flex items-center gap-2">
                    <div className={`${attachment.color} h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}>
                      <attachment.icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{attachment.name}</div>
                      <div className="text-xs text-muted-foreground">{attachment.extension}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskListSidebar;