import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const PropertiesSidebar = ({
  selectedNode,
  handleSidebarClose,
  handleMakeFinish,
  handleNodeDelete,
}) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
      className="absolute right-0 top-0 z-20 h-full w-80 border-l border-border bg-white shadow-lg dark:bg-zinc-900"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Properties</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Ctrl+2</div>
            <button
              onClick={handleSidebarClose}
              className="rounded p-1 text-muted-foreground hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Task Header */}
            <div className="flex items-center gap-2">
              <div className={`${selectedNode.data.taskGroup?.color || 'bg-gray-400'} h-6 w-6 rounded text-xs font-bold text-white flex items-center justify-center`}>
                {selectedNode.data.taskGroup?.name || 'T'}
              </div>
              <div>
                <div className="font-semibold text-foreground">{selectedNode.data.label}</div>
                <div className="text-xs text-muted-foreground">Task</div>
              </div>
            </div>

            {/* Properties */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated Time</label>
                <div className="mt-1 rounded border bg-background p-2 text-sm">
                  {selectedNode.data.estimate || 'Not set'}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Priority</label>
                <div className="mt-1">
                  <select className="w-full rounded border bg-background p-2 text-sm">
                    <option value={selectedNode.data.priority}>{selectedNode.data.priority || 'medium'}</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Finish Status</label>
                <div className="mt-1">
                  <select
                    className="w-full rounded border bg-background p-2 text-sm"
                    value={selectedNode.data.isFinished ? 'finished' : 'task'}
                    onChange={(e) => {
                      if (e.target.value === 'finished') {
                        handleMakeFinish();
                      }
                    }}
                  >
                    <option value="task">Regular Task</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
              </div>

              {selectedNode.data.completedAt && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completed At</label>
                  <div className="mt-1 rounded border bg-background p-2 text-sm">
                    {new Date(selectedNode.data.completedAt).toLocaleString()}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Comment</label>
                <textarea
                  className="mt-1 w-full rounded border bg-background p-2 text-sm"
                  rows={3}
                  placeholder="Add notes about this task..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={handleNodeDelete}
            className="w-full rounded bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Remove from Timeline
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertiesSidebar;