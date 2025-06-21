import React from 'react';
import { Handle, Position } from 'reactflow';

// Custom Node Component with refined UI
const CustomTaskNode = ({ data, selected }) => {
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-lg transition-all duration-200 dark:bg-zinc-800 ${
      selected ? 'border-blue-500 shadow-blue-200' : 'border-zinc-300 dark:border-zinc-600'
    } ${data.isFinished ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''} ${
      data.isDropTarget ? 'border-orange-400 shadow-orange-200 bg-orange-50 dark:bg-orange-900/20' : ''
    } ${data.isContextSelected ? 'border-purple-500 shadow-purple-200 bg-purple-50 dark:bg-purple-900/20' : ''}`}>
      {/* Top Handle for task flow */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!h-3 !w-3 !border-2 !border-white !bg-blue-500"
      />
      
      {/* Left Handle for attachments */}
      <Handle
        type="target"
        position={Position.Left}
        id="attachment-left"
        className="!h-2 !w-2 !border-2 !border-white !bg-orange-500"
        style={{ top: '50%' }}
      />
      
      {/* Right Handle for attachments */}
      <Handle
        type="source"
        position={Position.Right}
        id="attachment-right"
        className="!h-2 !w-2 !border-2 !border-white !bg-orange-500"
        style={{ top: '50%' }}
      />
      
      <div className="min-w-[200px] p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className={`${data.taskGroup?.color || 'bg-gray-400'} w-6 h-6 rounded text-xs font-bold text-white flex items-center justify-center`}>
            {data.taskGroup?.name || 'T'}
          </div>
          <div className="flex-1 truncate text-sm font-semibold text-foreground">{data.label}</div>
          {data.isFinished && (
            <div className="rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white">
              FINISH
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 text-xs">
          {data.estimate && (
            <span className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {data.estimate}
            </span>
          )}
          {data.priority && (
            <span className={`px-2 py-1 rounded ${
              data.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              data.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {data.priority}
            </span>
          )}
          {data.completedAt && (
            <span className="rounded bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900 dark:text-green-200">
              ✓ Done
            </span>
          )}
        </div>
      </div>
      
      {/* Bottom Handle for task flow - hide if finished */}
      {!data.isFinished && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!h-3 !w-3 !border-2 !border-white !bg-blue-500"
        />
      )}
    </div>
  );
};

export default CustomTaskNode;