import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // Authentication state
    currentUser: null,
    isAuthChecking: true,
    
    // Navigation state
    activeMenu: 'home',
    currentView: 'home', // 'home' | 'taskProgress' | 'floating' | 'focus'
    windowMode: 'normal', // 'normal' | 'floating' | 'focus'
    
    // Workspace and List state
    activeWorkspace: null,
    selectedList: null,
    workspaceLists: [],
    archivedLists: [],
    workspaces: [],
    
    // Task view state
    activeTaskView: 'kanban',
    
    // Timer state
    activeTask: null,
    timer: { hours: 0, minutes: 0, seconds: 0 },
    isTimerRunning: false,
    
    attachmentTrigger: 0,
    noteTrigger: 0,
    urlTrigger: 0,
    
    // Actions for authentication
    setCurrentUser: (user) => set({ currentUser: user }),
    setIsAuthChecking: (checking) => set({ isAuthChecking: checking }),
    
    login: (user) => {
      localStorage.setItem('currentUser', JSON.stringify(user))
      set({ currentUser: user })
    },
    
    logout: () => {
      localStorage.removeItem('currentUser')
      set({
        currentUser: null,
        activeMenu: 'home',
        currentView: 'home',
        selectedList: null,
        activeWorkspace: null,
        activeTask: null,
        timer: { hours: 0, minutes: 0, seconds: 0 },
        isTimerRunning: false,
        windowMode: 'normal'
      })
    },
    
    // Actions for navigation
    setActiveMenu: (menu) => set({ activeMenu: menu }),
    setCurrentView: (view) => set({ currentView: view }),
    setWindowMode: (mode) => set({ windowMode: mode }),
    
    // Actions for workspace and lists
    setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
    setSelectedList: (list) => set({ selectedList: list }),
    setWorkspaceLists: (lists) => set({ workspaceLists: lists }),
    setArchivedLists: (lists) => set({ archivedLists: lists }),
    setWorkspaces: (workspaces) => set({ workspaces: workspaces }),

    // Helper actions for archive operations
    archiveList: (listId) => set((state) => {
      const updatedWorkspaceLists = state.workspaceLists.filter(list => list.id !== listId)
      const archivedList = state.workspaceLists.find(list => list.id === listId)
      const updatedArchivedLists = archivedList
        ? [...state.archivedLists, { ...archivedList, isArchived: true, archivedAt: new Date() }]
        : state.archivedLists
      
      // Update workspace counts
      const updatedWorkspaces = state.workspaces.map(workspace => {
        if (archivedList && workspace.id === archivedList.workspaceId) {
          const currentCount = workspace._count?.lists || workspace.totalCount || 0
          return {
            ...workspace,
            _count: { ...workspace._count, lists: Math.max(0, currentCount - 1) },
            totalCount: Math.max(0, currentCount - 1)
          }
        }
        return workspace
      })

      return {
        workspaceLists: updatedWorkspaceLists,
        archivedLists: updatedArchivedLists,
        workspaces: updatedWorkspaces
      }
    }),

    unarchiveList: (listId) => set((state) => {
      const updatedArchivedLists = state.archivedLists.filter(list => list.id !== listId)
      const unarchivedList = state.archivedLists.find(list => list.id === listId)
      const updatedWorkspaceLists = unarchivedList
        ? [...state.workspaceLists, { ...unarchivedList, isArchived: false, archivedAt: null }]
        : state.workspaceLists
      
      // Update workspace counts
      const updatedWorkspaces = state.workspaces.map(workspace => {
        if (unarchivedList && workspace.id === unarchivedList.workspaceId) {
          const currentCount = workspace._count?.lists || workspace.totalCount || 0
          return {
            ...workspace,
            _count: { ...workspace._count, lists: currentCount + 1 },
            totalCount: currentCount + 1
          }
        }
        return workspace
      })

      return {
        workspaceLists: updatedWorkspaceLists,
        archivedLists: updatedArchivedLists,
        workspaces: updatedWorkspaces
      }
    }),
    
    // Actions for task view
    setActiveTaskView: (view) => set({ activeTaskView: view }),
    
    // Actions for timer
    setActiveTask: (task) => set({ activeTask: task }),
    setTimer: (timer) => set({ timer }),
    setIsTimerRunning: (running) => set({ isTimerRunning: running }),
    
    toggleTimer: () => set((state) => ({ isTimerRunning: !state.isTimerRunning })),
    
    resetTimer: () => set({ 
      timer: { hours: 0, minutes: 0, seconds: 0 },
      isTimerRunning: false 
    }),
    
    activateTask: (task) => set({ 
      activeTask: task,
      isTimerRunning: true 
    }),
    
    // Combined actions for common operations
    navigateToTaskProgress: (list) => set({
      selectedList: list,
      currentView: 'taskProgress'
    }),
    
    navigateToHome: () => set({
      currentView: 'home',
      selectedList: null
    }),

    navigateToTimeline: () => set({
      currentView: 'timeline',
      activeTaskView: 'timeline'
    }),
    
    enterFloatingMode: () => {
      set({
        currentView: 'floating',
        windowMode: 'floating'
      })
      
      // Request window resize to floating dimensions
      if (window.api?.windowControls?.resizeToFloating) {
        window.api.windowControls.resizeToFloating()
      }
      
      // Set always on top for floating mode
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('window-set-always-on-top', true)
      }
    },
    
    enterFocusMode: () => {
      set({
        currentView: 'focus',
        windowMode: 'focus'
      })
      
      // Request window resize to focus dimensions
      if (window.api?.windowControls) {
        if (window.api.windowControls.resizeToFocus) {
          window.api.windowControls.resizeToFocus()
        }
        if (window.api.windowControls.setResizable) {
          window.api.windowControls.setResizable(false)
        }
        if (window.api.windowControls.hideWindowControls) {
          window.api.windowControls.hideWindowControls()
        }
      }
      
      // Set always on top
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('window-set-always-on-top', true)
      }
    },
    
    exitSpecialModes: () => {
      set({
        currentView: 'taskProgress',
        windowMode: 'normal'
      })
      
      // Request window resize to normal dimensions
      if (window.api?.windowControls) {
        if (window.api.windowControls.setResizable) {
          window.api.windowControls.setResizable(true)
        }
        if (window.api.windowControls.showWindowControls) {
          window.api.windowControls.showWindowControls()
        }
        if (window.api.windowControls.resizeToNormal) {
          window.api.windowControls.resizeToNormal()
        }
      }
      
      // Remove always on top
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('window-set-always-on-top', false)
      }
    },
    
    // Initialize auth state from localStorage
    initializeAuth: () => {
      try {
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
          set({ currentUser: JSON.parse(storedUser) })
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
        localStorage.removeItem('currentUser')
      } finally {
        set({ isAuthChecking: false })
      }
    },
    
    // Fetch workspace lists
    fetchWorkspaceLists: async (workspaceId) => {
      if (!workspaceId) {
        set({ workspaceLists: [] })
        return
      }
      
      try {
        const lists = await window.db.getLists(workspaceId)
        set({ workspaceLists: lists })
      } catch (error) {
        console.error('Failed to fetch workspace lists:', error)
        set({ workspaceLists: [] })
      }
    },
    triggerAttachmentUpdate: () => set((state) => ({ attachmentTrigger: state.attachmentTrigger + 1 })),
    triggerNoteUpdate: () => set((state) => ({ noteTrigger: state.noteTrigger + 1 })),
    triggerSubtaskUpdate: () => set((state) => ({ subtaskTrigger: state.subtaskTrigger + 1 })),
    triggerUrlUpdate: () => set((state) => ({ urlTrigger: state.urlTrigger + 1 })),
  }))
)

export default useAppStore