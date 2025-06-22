import React from 'react'

const ContextMenu = ({ x, y, onClose, onAddTask, onAddAttachment, onAddNote, onAddUrl, node, onDelete, onDetach }) => {
  const handleDelete = () => {
    if (node) {
      onDelete(node)
    }
    onClose()
  }

  const handleDetach = () => {
    if (node) {
      onDetach(node)
    }
    onClose()
  }

  const isDetachable = node && (node.type === 'noteNode' || node.type === 'attachmentNode' || node.type === 'urlNode') && node.id.includes('-')

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        zIndex: 1000,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        padding: '5px 0'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {!node && (
        <>
          <div
            onClick={onAddTask}
            style={{
              padding: '8px 12px',
              cursor: 'pointer'
            }}
            className="hover:bg-gray-100"
          >
            Add Task
          </div>
          <div
            onClick={onAddAttachment}
            style={{
              padding: '8px 12px',
              cursor: 'pointer'
            }}
            className="hover:bg-gray-100"
          >
            Add Attachment
          </div>
          <div
            onClick={onAddNote}
            style={{
              padding: '8px 12px',
              cursor: 'pointer'
            }}
            className="hover:bg-gray-100"
          >
            Add Note
          </div>
          <div
            onClick={onAddUrl}
            style={{
              padding: '8px 12px',
              cursor: 'pointer'
            }}
            className="hover:bg-gray-100"
          >
            Add URL
          </div>
        </>
      )}
      {node && (
        <>
          {isDetachable && (
            <div
              onClick={handleDetach}
              style={{
                padding: '8px 12px',
                cursor: 'pointer'
              }}
              className="hover:bg-gray-100"
            >
              Detach {node.type.replace('Node', '')}
            </div>
          )}
          <div
            onClick={handleDelete}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              color: 'red'
            }}
            className="hover:bg-gray-100"
          >
            Delete {node.type.replace('Node', '')}
          </div>
        </>
      )}
    </div>
  )
}

export default ContextMenu