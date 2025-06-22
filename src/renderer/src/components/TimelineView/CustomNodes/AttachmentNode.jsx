import React from 'react'
import { Handle, Position } from 'reactflow'
import { Paperclip, Upload } from 'lucide-react'
import useAppStore from '../../../stores/useAppStore'

const AttachmentNode = ({ data }) => {
  const { triggerAttachmentUpdate } = useAppStore()
  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        await window.db.updateAttachment(data.attachment.id, {
          name: file.name,
          url: file.path,
          fileType: file.type
        })
        triggerAttachmentUpdate()
      }
    }
    input.click()
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ddd',
        padding: '5px',
        borderRadius: '3px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '120px',
        height: '80px'
      }}
    >
      <Handle type="target" position={Position.Left} />
      {data.attachment && data.attachment.url ? (
        <>
          <Paperclip size={20} />
          <span style={{ fontSize: '10px', marginTop: '5px', textAlign: 'center', wordBreak: 'break-word' }}>{data.label}</span>
        </>
      ) : (
        <button
          onClick={handleUpload}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Upload size={20} />
          <span style={{ fontSize: '10px', marginTop: '5px' }}>Upload</span>
        </button>
      )}
    </div>
  )
}

export default AttachmentNode