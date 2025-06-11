import React from 'react'
import { Minus, Square, X } from 'lucide-react'

const TitleBar = () => {
  const handleMinimize = () => {
    window.electron?.ipcRenderer?.send('window-minimize')
  }

  const handleMaximize = () => {
    window.electron?.ipcRenderer?.send('window-maximize')
  }

  const handleClose = () => {
    window.electron?.ipcRenderer?.send('window-close')
  }

  return (
    <div className="flex h-8 select-none items-center justify-between bg-gray-50">
      {/* Draggable area */}
      <div 
        className="h-full flex-1 cursor-move"
        style={{ WebkitAppRegion: 'drag' }}
      >
        {/* Empty draggable space */}
      </div>
      
      {/* Window controls */}
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-gray-200"
        >
          <Minus className="h-4 w-4 text-gray-600" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-gray-200"
        >
          <Square className="h-3 w-3 text-gray-600" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-red-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default TitleBar