import React from 'react';
import {
  X,
  Paperclip,
  List,
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

const AttachmentListModal = ({
  setShowAttachmentList,
  nodes,
  edges,
}) => {
  const attachmentNodes = nodes.filter(node => node.type === 'customAttachment');
  const subflowNodes = nodes.filter(node => node.type === 'customSubflow');

  if (attachmentNodes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-zinc-800">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-600">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Timeline Attachments
            </h2>
            <button
              onClick={() => setShowAttachmentList(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <Paperclip className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No attachments in timeline</p>
          </div>
        </div>
      </div>
    );
  }

  // Group attachments by their parent task
  const attachmentsByTask = {};
  const standaloneAttachments = [];
  
  attachmentNodes.forEach(attachment => {
    if (attachment.parentNode) {
      // Find the subflow and its associated task
      const subflow = subflowNodes.find(s => s.id === attachment.parentNode);
      if (subflow && subflow.data.taskId) {
        const taskNode = nodes.find(n => n.id === subflow.data.taskId);
        const taskName = taskNode ? taskNode.data.label : 'Unknown Task';
        
        if (!attachmentsByTask[taskName]) {
          attachmentsByTask[taskName] = [];
        }
        attachmentsByTask[taskName].push(attachment);
      }
    } else {
      // Find connected task through edges
      const connectedEdge = edges.find(edge =>
        edge.target === attachment.id || edge.source === attachment.id
      );
      
      if (connectedEdge) {
        const taskId = connectedEdge.source === attachment.id ? connectedEdge.target : connectedEdge.source;
        const taskNode = nodes.find(n => n.id === taskId && n.type === 'customTask');
        
        if (taskNode) {
          const taskName = taskNode.data.label;
          if (!attachmentsByTask[taskName]) {
            attachmentsByTask[taskName] = [];
          }
          attachmentsByTask[taskName].push(attachment);
        } else {
          standaloneAttachments.push(attachment);
        }
      } else {
        standaloneAttachments.push(attachment);
      }
    }
  });

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-zinc-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Timeline Attachments
          </h2>
          <button
            onClick={() => setShowAttachmentList(false)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Grouped attachments by task */}
            {Object.entries(attachmentsByTask).map(([taskName, attachments]) => (
              <div key={taskName} className="rounded-lg border p-4 dark:border-zinc-600">
                <h3 className="mb-3 font-medium text-gray-900 dark:text-gray-100">
                  {taskName} ({attachments.length} attachment{attachments.length !== 1 ? 's' : ''})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {attachments.map(attachment => {
                    const IconComponent = getIconComponent(attachment.data.iconName);
                    
                    return (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-700"
                      >
                        <div className={`${attachment.data.color} h-8 w-8 rounded flex items-center justify-center`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {attachment.data.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {attachment.data.extension}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* Standalone attachments */}
            {standaloneAttachments.length > 0 && (
              <div className="rounded-lg border p-4 dark:border-zinc-600">
                <h3 className="mb-3 font-medium text-gray-900 dark:text-gray-100">
                  Standalone Attachments ({standaloneAttachments.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {standaloneAttachments.map(attachment => {
                    const IconComponent = getIconComponent(attachment.data.iconName);
                    
                    return (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-700"
                      >
                        <div className={`${attachment.data.color} h-8 w-8 rounded flex items-center justify-center`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {attachment.data.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {attachment.data.extension}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Summary */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <List className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Total: {attachmentNodes.length} attachment{attachmentNodes.length !== 1 ? 's' : ''}
                  {Object.keys(attachmentsByTask).length > 0 && ` across ${Object.keys(attachmentsByTask).length} task${Object.keys(attachmentsByTask).length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentListModal;