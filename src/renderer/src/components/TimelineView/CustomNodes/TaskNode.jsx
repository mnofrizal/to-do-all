import React from 'react'
import { Handle, Position } from 'reactflow'

const TaskNode = ({ data }) => {
  return (
    <div
      style={{
        background: data.style.background,
        color: data.style.color,
        border: data.style.border,
        width: data.style.width,
        height: data.style.height,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '3px'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="notes" style={{ left: '-5px' }} />
      <Handle type="source" position={Position.Right} id="attachments" style={{ right: '-5px' }} />
    </div>
  )
}

export default TaskNode