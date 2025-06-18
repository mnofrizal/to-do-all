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
    contextBridge.exposeInMainWorld('db', {
      // User authentication
      createUser: (userData) => ipcRenderer.invoke('create-user', userData),
      getUserByUsername: (username) => ipcRenderer.invoke('get-user-by-username', username),
      getUserByEmail: (email) => ipcRenderer.invoke('get-user-by-email', email),
      updateUser: (id, data) => ipcRenderer.invoke('update-user', { id, data }),
      // Workspace operations
      getWorkspaces: (userId) => ipcRenderer.invoke('get-workspaces', userId),
      createWorkspace: (name, userId) => ipcRenderer.invoke('create-workspace', { name, userId }),
      updateWorkspace: (id, data) => ipcRenderer.invoke('update-workspace', { id, data }),
      deleteWorkspace: (id) => ipcRenderer.invoke('delete-workspace', id),
      getLists: (workspaceId) => ipcRenderer.invoke('get-lists', workspaceId),
      createList: (data) => ipcRenderer.invoke('create-list', data),
      getTasks: (listId) => ipcRenderer.invoke('get-tasks', listId),
      createTask: (data) => ipcRenderer.invoke('create-task', data),
      updateTask: (id, data) => ipcRenderer.invoke('update-task', { id, data }),
      deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
      createSubtask: (data) => ipcRenderer.invoke('create-subtask', data),
      updateSubtask: (id, data) => ipcRenderer.invoke('update-subtask', { id, data }),
      deleteSubtask: (id) => ipcRenderer.invoke('delete-subtask', id),
      // TimeSession operations
      createTimeSession: (data) => ipcRenderer.invoke('create-time-session', data),
      updateTimeSession: (id, data) => ipcRenderer.invoke('update-time-session', { id, data }),
      endTimeSession: (id, endTime, duration) => ipcRenderer.invoke('end-time-session', { id, endTime, duration }),
      getTaskTimeSessions: (taskId) => ipcRenderer.invoke('get-task-time-sessions', taskId),
      getTaskTotalTime: (taskId) => ipcRenderer.invoke('get-task-total-time', taskId),
      getActiveTimeSession: (taskId, userId) => ipcRenderer.invoke('get-active-time-session', { taskId, userId }),
      deleteTimeSession: (id) => ipcRenderer.invoke('delete-time-session', id),
      clearTaskTimeSessions: (taskId) => ipcRenderer.invoke('clear-task-time-sessions', taskId),
      getAllTaskSessions: (taskId) => ipcRenderer.invoke('get-all-task-sessions', taskId)
    })
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
  window.db = {
    // User authentication
    createUser: (userData) => ipcRenderer.invoke('create-user', userData),
    getUserByUsername: (username) => ipcRenderer.invoke('get-user-by-username', username),
    getUserByEmail: (email) => ipcRenderer.invoke('get-user-by-email', email),
    updateUser: (id, data) => ipcRenderer.invoke('update-user', { id, data }),
    // Workspace operations
    getWorkspaces: (userId) => ipcRenderer.invoke('get-workspaces', userId),
    createWorkspace: (name, userId) => ipcRenderer.invoke('create-workspace', { name, userId }),
    updateWorkspace: (id, data) => ipcRenderer.invoke('update-workspace', { id, data }),
    deleteWorkspace: (id) => ipcRenderer.invoke('delete-workspace', id),
    getLists: (workspaceId) => ipcRenderer.invoke('get-lists', workspaceId),
    createList: (data) => ipcRenderer.invoke('create-list', data),
    getTasks: (listId) => ipcRenderer.invoke('get-tasks', listId),
    createTask: (data) => ipcRenderer.invoke('create-task', data),
    updateTask: (id, data) => ipcRenderer.invoke('update-task', { id, data }),
    deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
    createSubtask: (data) => ipcRenderer.invoke('create-subtask', data),
    updateSubtask: (id, data) => ipcRenderer.invoke('update-subtask', { id, data }),
    deleteSubtask: (id) => ipcRenderer.invoke('delete-subtask', id),
    // TimeSession operations
    createTimeSession: (data) => ipcRenderer.invoke('create-time-session', data),
    updateTimeSession: (id, data) => ipcRenderer.invoke('update-time-session', { id, data }),
    endTimeSession: (id, endTime, duration) => ipcRenderer.invoke('end-time-session', { id, endTime, duration }),
    getTaskTimeSessions: (taskId) => ipcRenderer.invoke('get-task-time-sessions', taskId),
    getTaskTotalTime: (taskId) => ipcRenderer.invoke('get-task-total-time', taskId),
    getActiveTimeSession: (taskId, userId) => ipcRenderer.invoke('get-active-time-session', { taskId, userId }),
    deleteTimeSession: (id) => ipcRenderer.invoke('delete-time-session', id),
    clearTaskTimeSessions: (taskId) => ipcRenderer.invoke('clear-task-time-sessions', taskId),
    getAllTaskSessions: (taskId) => ipcRenderer.invoke('get-all-task-sessions', taskId)
  }
}
