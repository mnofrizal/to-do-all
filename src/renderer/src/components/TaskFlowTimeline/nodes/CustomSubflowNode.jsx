import React from 'react';
import { Handle, Position } from 'reactflow';
import { Paperclip } from 'lucide-react';

// Custom Subflow/Group Node Component for Attachment Containers
const CustomSubflowNode = ({ data, selected }) => {
  // Calculate dynamic size based on attachment count using the same logic
  const attachmentCount = data.attachmentCount || 0;
  const itemsPerRow = Math.ceil(attachmentCount / 2);
  const rows = attachmentCount > itemsPerRow ? 2 : 1;
  
  // Use the same calculations as the helper function
  const itemWidth = 130;
  const itemSpacing = 15;
  const paddingX = 25;
  const dynamicWidth = Math.max(350, paddingX * 2 + (itemsPerRow * itemWidth) + ((itemsPerRow - 1) * itemSpacing));
  
  const itemHeight = 75;
  const rowSpacing = 15;
  const paddingY = 40;
  const dynamicHeight = Math.max(180, paddingY * 2 + (rows * itemHeight) + ((rows - 1) * rowSpacing));
 
  return (
    <div
      className={`relative rounded-lg border-2 transition-all duration-300 ${
        selected ? 'border-purple-500 shadow-purple-200' : 'border-purple-300 dark:border-purple-600'
      }`}
      style={{
        backgroundColor: data.backgroundColor || 'rgba(196, 181, 253, 0.1)',
        width: dynamicWidth,
        height: dynamicHeight,
        padding: '16px',
        transition: 'width 0.3s ease, height 0.3s ease'
      }}
    >
      {/* Subflow Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
          <Paperclip className="h-4 w-4" />
          {data.label }
        </div>
        <div className="text-xs text-purple-600 dark:text-purple-400">
          ({attachmentCount} items)
        </div>
      </div>
      {/* Connection Handle - Target for when connected to a task */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-white !bg-purple-500"
        style={{ top: '20px' }}
      />
      
      {/* Source Handle for standalone subflows - only show if not connected to a task */}
      {!data.taskId && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-white !bg-purple-500"
          style={{ top: '20px' }}
        />
      )}
    </div>
  );
};

export default CustomSubflowNode;