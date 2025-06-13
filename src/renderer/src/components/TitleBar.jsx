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
    <div className="flex h-8 select-none items-center justify-between bg-background">
      {/* Draggable area */}
      <div 
        className="h-full flex-1 cursor-move"
        style={{ WebkitAppRegion: 'drag' }}
      >
        {/* Empty draggable space */}
      </div>
      
      {/* Window controls */}
      {window.electron?.platform === 'win32' && (
        <div className="flex" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={handleMinimize}
            className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Minus className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={handleMaximize}
            className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Square className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-destructive-foreground" />
          </button>
        </div>
      )}
    </div>
  )
}

export default TitleBar