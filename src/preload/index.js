import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    resizeToFloating: () => ipcRenderer.send('window-resize-floating'),
    resizeToFocus: () => ipcRenderer.send('window-resize-focus'),
    resizeToNormal: () => ipcRenderer.send('window-resize-normal'),
    setResizable: (resizable) => ipcRenderer.send('window-set-resizable', resizable),
    hideWindowControls: () => ipcRenderer.send('window-hide-controls'),
    showWindowControls: () => ipcRenderer.send('window-show-controls')
  },
  cursorTracking: {
    start: () => ipcRenderer.send('start-cursor-tracking'),
    stop: () => ipcRenderer.send('stop-cursor-tracking'),
    onUpdate: (callback) => ipcRenderer.on('cursor-position-update', callback),
    removeListener: (callback) => ipcRenderer.removeListener('cursor-position-update', callback)
  },
  positionTracking: {
    start: () => ipcRenderer.send('start-position-tracking'),
    stop: () => ipcRenderer.send('stop-position-tracking')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ipcRenderer: {
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        on: (channel, callback) => ipcRenderer.on(channel, callback),
        removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
      }
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = {
    ...electronAPI,
    ipcRenderer: {
      send: (channel, ...args) => ipcRenderer.send(channel, ...args),
      on: (channel, callback) => ipcRenderer.on(channel, callback),
      removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
    }
  }
  window.api = api
}
