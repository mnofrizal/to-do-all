import React from 'react';
import { Handle, Position } from 'reactflow';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  StickyNote,
  Image,
  Music,
  Video,
  Archive,
  File,
} from 'lucide-react';

// Custom Attachment Node Component
const CustomAttachmentNode = ({ data, selected, parentNode, ...nodeProps }) => {
  // Get the icon component based on the attachment type
  const getIconComponent = (iconName) => {
    const iconMap = {
      'FileText': FileText,
      'FileSpreadsheet': FileSpreadsheet,
      'Presentation': Presentation,
      'StickyNote': StickyNote,
      'Image': Image,
      'Music': Music,
      'Video': Video,
      'Archive': Archive,
      'File': File
    };
    return iconMap[iconName] || File;
  };
  
  const IconComponent = getIconComponent(data.iconName);
  // Check if attachment is inside a subflow - use parentNode from props or nodeProps
  const isInSubflow = !!(parentNode || nodeProps.parentNode);
  
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-lg transition-all duration-200 dark:bg-zinc-800 ${
      selected ? 'border-orange-500 shadow-orange-200' : 'border-orange-300 dark:border-orange-600'
    } ${isInSubflow ? 'shadow-sm' : ''} ${data.isContextSelected ? 'border-purple-500 shadow-purple-200 bg-purple-50 dark:bg-purple-900/20' : ''}`}>
      {/* Left Handle for attachment connections - only show if NOT in subflow */}
      {!isInSubflow && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2 !w-2 !border-2 !border-white !bg-orange-500"
        />
      )}
      
      <div className="min-w-[120px] p-3">
        <div className="flex items-center gap-2">
          <div className={`${data.color} h-6 w-6 rounded text-xs font-bold text-white flex items-center justify-center`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">{data.name}</div>
            <div className="text-xs text-muted-foreground">{data.extension}</div>
          </div>
        </div>
      </div>
      
      {/* Right Handle for attachment connections - only show if NOT in subflow */}
      {!isInSubflow && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2 !w-2 !border-2 !border-white !bg-orange-500"
        />
      )}
    </div>
  );
};

export default CustomAttachmentNode;