import React from 'react';
import {
  Copy,
  Trash2,
  X,
  Plus,
  Check,
  ChevronRight,
  List,
} from 'lucide-react';
import { attachmentTypes } from '../lib/attachmentTypes';

const ContextMenu = ({
  contextMenu,
  handleContextMenuAction,
  nodes,
  showAttachmentSubmenu,
  showDeleteGroupConfirm,
}) => {
  if (!contextMenu) return null;

  return (
    <div
      className="absolute z-50 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.type === 'customAttachment' && (
        <>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
            onClick={() => handleContextMenuAction('duplicate', contextMenu.id)}
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          {/* Only show disconnect for standalone attachments (not in subflow) */}
          {!nodes.find(n => n.id === contextMenu.id)?.parentNode && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
              onClick={() => handleContextMenuAction('disconnect', contextMenu.id)}
            >
              <X className="h-4 w-4" />
              Disconnect
            </button>
          )}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => handleContextMenuAction('delete', contextMenu.id)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </>
      )}
      
      {contextMenu.type === 'customTask' && (
        <>
          <div className="relative">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
              onClick={() => handleContextMenuAction('addAttachment', contextMenu.id)}
            >
              <Plus className="h-4 w-4" />
              Add Attachment
              <ChevronRight className="ml-auto h-3 w-3" />
            </button>
            
            {/* Attachment submenu */}
            {showAttachmentSubmenu && (
              <div className="absolute left-full top-0 ml-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800">
                {attachmentTypes.map((attachment) => (
                  <button
                    key={attachment.id}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                    onClick={() => handleContextMenuAction(`addAttachment:${attachment.id}`, contextMenu.id)}
                  >
                    <div className={`${attachment.color} h-4 w-4 rounded flex items-center justify-center`}>
                      <attachment.icon className="h-3 w-3 text-white" />
                    </div>
                    {attachment.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
            onClick={() => handleContextMenuAction('markAsFinish', contextMenu.id)}
          >
            <Check className="h-4 w-4" />
            {contextMenu.data?.isFinished ? 'Unmark as Finish' : 'Mark as Finish'}
          </button>
          {!contextMenu.data?.completedAt && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
              onClick={() => handleContextMenuAction('markAsDone', contextMenu.id)}
            >
              <Check className="h-4 w-4" />
              Mark as Done
            </button>
          )}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
            onClick={() => handleContextMenuAction('disconnect', contextMenu.id)}
          >
            <X className="h-4 w-4" />
            Disconnect
          </button>
          {contextMenu.data?.completedAt ? (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
              onClick={() => handleContextMenuAction('undone', contextMenu.id)}
            >
              <X className="h-4 w-4" />
              Mark as Undone
            </button>
          ) : (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => handleContextMenuAction('returnToLibrary', contextMenu.id)}
            >
              <Trash2 className="h-4 w-4" />
              Return to Library
            </button>
          )}
        </>
      )}
      
      {contextMenu.type === 'customSubflow' && (
        <>
          {!showDeleteGroupConfirm ? (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => handleContextMenuAction('deleteGroup', contextMenu.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Group
            </button>
          ) : (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => handleContextMenuAction('confirmDeleteGroup', contextMenu.id)}
            >
              <Trash2 className="h-4 w-4" />
              Confirm?
            </button>
          )}
        </>
      )}
      
      {contextMenu.type === 'pane' && (
        <>
          <div className="relative">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
              onClick={() => handleContextMenuAction('addAttachment', null, { x: contextMenu.x, y: contextMenu.y })}
            >
              <Plus className="h-4 w-4" />
              Add Attachment
              <ChevronRight className="ml-auto h-3 w-3" />
            </button>
            
            {/* Attachment submenu */}
            {showAttachmentSubmenu && (
              <div className="absolute left-full top-0 ml-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800">
                {attachmentTypes.map((attachment) => (
                  <button
                    key={attachment.id}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                    onClick={() => handleContextMenuAction(`addAttachment:${attachment.id}`, null, { x: contextMenu.flowX, y: contextMenu.flowY })}
                  >
                    <div className={`${attachment.color} h-4 w-4 rounded flex items-center justify-center`}>
                      <attachment.icon className="h-3 w-3 text-white" />
                    </div>
                    {attachment.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
            onClick={() => handleContextMenuAction('showAttachments')}
          >
            <List className="h-4 w-4" />
            Show Attachments
          </button>
        </>
      )}
    </div>
  );
};

export default ContextMenu;