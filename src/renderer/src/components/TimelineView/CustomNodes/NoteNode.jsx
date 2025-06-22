import React, { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import { FileText } from 'lucide-react'
import useAppStore from '../../../stores/useAppStore'

const NoteNode = ({ data, id }) => {
  const [content, setContent] = useState(data.label || '')
  const [isEditing, setIsEditing] = useState(!data.label)
  const { triggerNoteUpdate } = useAppStore()

  useEffect(() => {
    setContent(data.label || '')
    setIsEditing(!data.label)
  }, [data.label])

  const handleContentChange = (e) => {
    setContent(e.target.value)
  }

  const handleSave = async () => {
    if (content.trim()) {
      await window.db.updateNote(data.note.id, { content })
      triggerNoteUpdate()
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSave()
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ddd',
        padding: '10px',
        borderRadius: '3px',
        width: '200px',
        minHeight: '100px'
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Right} />
      {isEditing ? (
        <textarea
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          style={{
            width: '100%',
            height: '80px',
            border: 'none',
            resize: 'none',
            outline: 'none'
          }}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FileText size={16} style={{ marginRight: '8px' }} />
          <p style={{ margin: 0, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</p>
        </div>
      )}
    </div>
  )
}

export default NoteNode