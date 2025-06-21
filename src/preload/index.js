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
      updateList: (id, data) => ipcRenderer.invoke('update-list', { id, data }),
      deleteList: (id) => ipcRenderer.invoke('delete-list', id),
      getTasks: (listId) => ipcRenderer.invoke('get-tasks', listId),
      getTask: (taskId) => ipcRenderer.invoke('get-task', taskId),
      createTask: (data) => ipcRenderer.invoke('create-task', data),
      updateTask: (id, data) => ipcRenderer.invoke('update-task', { id, data }),
      deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
      createSubtask: (data) => ipcRenderer.invoke('create-subtask', data),
      updateSubtask: (id, data) => ipcRenderer.invoke('update-subtask', { id, data }),
      deleteSubtask: (id) => ipcRenderer.invoke('delete-subtask', id),
      // TimelineNode operations
      getTimelineNodes: (listId) => ipcRenderer.invoke('get-timeline-nodes', listId),
      createTimelineNode: (data) => ipcRenderer.invoke('create-timeline-node', data),
      updateTimelineNodePosition: (id, position) =>
        ipcRenderer.invoke('update-timeline-node-position', { id, position }),
      updateTimelineNodeFinished: (id, isFinished) =>
        ipcRenderer.invoke('update-timeline-node-finished', { id, isFinished }),
      deleteTimelineNode: (id) => ipcRenderer.invoke('delete-timeline-node', id),
      // TimelineEdge operations
      getTimelineEdges: (listId) => ipcRenderer.invoke('get-timeline-edges', listId),
      createTimelineEdge: (data) => ipcRenderer.invoke('create-timeline-edge', data),
      deleteTimelineEdge: (sourceId, targetId) =>
        ipcRenderer.invoke('delete-timeline-edge', { sourceId, targetId }),
      // Simplified Timer operations (no TimeSession creation)
      getTaskTotalTime: (taskId) => ipcRenderer.invoke('get-task-total-time', taskId),
      getTasksWithActiveTimers: () => ipcRenderer.invoke('get-tasks-with-active-timers'),
      // Legacy TimeSession operations (for historical data only)
      getTaskTimeSessions: (taskId) => ipcRenderer.invoke('get-task-time-sessions', taskId),
      getAllTaskSessions: (taskId) => ipcRenderer.invoke('get-all-task-sessions', taskId),
      // Global search
      globalSearch: (query) => ipcRenderer.invoke('global-search', query)
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
    updateList: (id, data) => ipcRenderer.invoke('update-list', { id, data }),
    deleteList: (id) => ipcRenderer.invoke('delete-list', id),
    getTasks: (listId) => ipcRenderer.invoke('get-tasks', listId),
    getTask: (taskId) => ipcRenderer.invoke('get-task', taskId),
    createTask: (data) => ipcRenderer.invoke('create-task', data),
    updateTask: (id, data) => ipcRenderer.invoke('update-task', { id, data }),
    deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
    createSubtask: (data) => ipcRenderer.invoke('create-subtask', data),
    updateSubtask: (id, data) => ipcRenderer.invoke('update-subtask', { id, data }),
    deleteSubtask: (id) => ipcRenderer.invoke('delete-subtask', id),
    // TimelineNode operations
    getTimelineNodes: (listId) => ipcRenderer.invoke('get-timeline-nodes', listId),
    createTimelineNode: (data) => ipcRenderer.invoke('create-timeline-node', data),
    updateTimelineNodePosition: (id, position) =>
      ipcRenderer.invoke('update-timeline-node-position', { id, position }),
    updateTimelineNodeFinished: (id, isFinished) =>
      ipcRenderer.invoke('update-timeline-node-finished', { id, isFinished }),
    deleteTimelineNode: (id) => ipcRenderer.invoke('delete-timeline-node', id),
    // TimelineEdge operations
    getTimelineEdges: (listId) => ipcRenderer.invoke('get-timeline-edges', listId),
    createTimelineEdge: (data) => ipcRenderer.invoke('create-timeline-edge', data),
    deleteTimelineEdge: (sourceId, targetId) =>
      ipcRenderer.invoke('delete-timeline-edge', { sourceId, targetId }),
    // Simplified Timer operations (no TimeSession creation)
    getTaskTotalTime: (taskId) => ipcRenderer.invoke('get-task-total-time', taskId),
    getTasksWithActiveTimers: () => ipcRenderer.invoke('get-tasks-with-active-timers'),
    // Legacy TimeSession operations (for historical data only)
    getTaskTimeSessions: (taskId) => ipcRenderer.invoke('get-task-time-sessions', taskId),
    getAllTaskSessions: (taskId) => ipcRenderer.invoke('get-all-task-sessions', taskId),
    // Global search
    globalSearch: (query) => ipcRenderer.invoke('global-search', query)
  }
}
