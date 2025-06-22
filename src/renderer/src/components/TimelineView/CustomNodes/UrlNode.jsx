import React, { useState, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import { Link, Check, X } from 'lucide-react'
import useAppStore from '../../../stores/useAppStore'

const UrlNode = ({ data, id }) => {
  const [name, setName] = useState(data.urlNode.name || '')
  const [url, setUrl] = useState(data.urlNode.url || '')
  const [isEditing, setIsEditing] = useState(!data.urlNode.url)
  const { triggerUrlUpdate } = useAppStore()

  useEffect(() => {
    if (data.urlNode) {
      setName(data.urlNode.name || '')
      setUrl(data.urlNode.url || '')
      setIsEditing(!data.urlNode.url)
    }
  }, [data.urlNode])

  const handleUrlChange = (e) => {
    setUrl(e.target.value)
  }

  const handleNameChange = (e) => {
    setName(e.target.value)
  }

  const handleSave = async () => {
    console.log('Saving URL node:', { id: data.urlNode.id, url, name })
    await window.db.updateUrlNode(data.urlNode.id, { url, name })
    triggerUrlUpdate()
    setIsEditing(false)
  }

  const handleCancel = async () => {
    if (!data.urlNode.url) {
      // If it's a new node with no URL, delete it on cancel
      await window.db.deleteUrlNode(data.urlNode.id)
      triggerUrlUpdate()
    } else {
      setUrl(data.urlNode.url)
      setName(data.urlNode.name)
    }
    setIsEditing(false)
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ddd',
        padding: '10px',
        borderRadius: '5px',
        width: '200px'
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
        <Link size={16} style={{ marginRight: '5px' }} />
        <strong>URL</strong>
      </div>
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={handleNameChange}
            style={{ marginBottom: '5px' }}
          />
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={handleUrlChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
            style={{ width: '100%', marginRight: '5px' }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
            <button onClick={handleSave} style={{ marginRight: '5px' }}>
              <Check size={16} />
            </button>
            <button onClick={handleCancel}>
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer'
          }}
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            {name || url}
          </a>
        </div>
      )}
    </div>
  )
}

export default UrlNode