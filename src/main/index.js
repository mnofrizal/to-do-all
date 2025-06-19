import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import icon from '../../resources/icon.png?asset'

const prisma = new PrismaClient()

// Simple development check
const isDev = !app.isPackaged

let mainWindow = null
let cursorTracker = null
let focusModePosition = null // Store focus mode position

// IPC handlers for database operations

// User authentication handlers
ipcMain.handle('create-user', async (_, userData) => {
  return await prisma.user.create({ data: userData })
})

ipcMain.handle('get-user-by-username', async (_, username) => {
  return await prisma.user.findUnique({ where: { username } })
})

ipcMain.handle('get-user-by-email', async (_, email) => {
  return await prisma.user.findUnique({ where: { email } })
})

ipcMain.handle('update-user', async (_, { id, data }) => {
  return await prisma.user.update({ where: { id }, data })
})

// Workspace handlers
ipcMain.handle('get-workspaces', async (_, userId) => {
  return await prisma.workspace.findMany({
    where: { userId },
    include: { lists: true }
  })
})

ipcMain.handle('create-workspace', async (_, { name, userId }) => {
  return await prisma.workspace.create({
    data: { name, userId },
    include: { lists: true }
  })
})

ipcMain.handle('update-workspace', async (_, { id, data }) => {
  return await prisma.workspace.update({ where: { id }, data })
})

ipcMain.handle('delete-workspace', async (_, id) => {
  // Delete workspace and all related data (cascading delete)
  return await prisma.workspace.delete({ where: { id } })
})

ipcMain.handle('get-lists', async (_, workspaceId) => {
  return await prisma.list.findMany({ where: { workspaceId } })
})

ipcMain.handle('create-list', async (_, data) => {
  return await prisma.list.create({ data })
})

ipcMain.handle('update-list', async (_, { id, data }) => {
  return await prisma.list.update({ where: { id }, data })
})

ipcMain.handle('delete-list', async (_, id) => {
  return await prisma.list.delete({ where: { id } })
})

ipcMain.handle('get-tasks', async (_, listId) => {
  return await prisma.task.findMany({ where: { listId }, include: { subtasks: true } })
})

ipcMain.handle('create-task', async (_, data) => {
  return await prisma.task.create({ data })
})

ipcMain.handle('update-task', async (_, { id, data }) => {
  return await prisma.task.update({ where: { id }, data })
})

ipcMain.handle('delete-task', async (_, id) => {
  return await prisma.task.delete({ where: { id } })
})

ipcMain.handle('create-subtask', async (_, data) => {
  return await prisma.subtask.create({ data })
})

ipcMain.handle('update-subtask', async (_, { id, data }) => {
  return await prisma.subtask.update({ where: { id }, data })
})

ipcMain.handle('delete-subtask', async (_, id) => {
  return await prisma.subtask.delete({ where: { id } })
})

// Simplified Timer handlers (no TimeSession creation)
ipcMain.handle('get-task-total-time', async (_, taskId) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { timeSpent: true }
    })
    
    return task?.timeSpent || 0
  } catch (error) {
    console.error('Error getting task total time:', error)
    return 0
  }
})

ipcMain.handle('get-tasks-with-active-timers', async () => {
  try {
    return await prisma.task.findMany({
      where: {
        lastStartTime: { not: null }
      },
      select: {
        id: true,
        title: true,
        timeSpent: true,
        lastStartTime: true
      }
    })
  } catch (error) {
    console.error('Error getting tasks with active timers:', error)
    return []
  }
})

ipcMain.handle('get-task', async (_, taskId) => {
  try {
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: { subtasks: true }
    })
  } catch (error) {
    console.error('Error getting task:', error)
    return null
  }
})

// Keep legacy TimeSession handlers for historical data (optional)
ipcMain.handle('get-task-time-sessions', async (_, taskId) => {
  return await prisma.timeSession.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' }
  })
})

ipcMain.handle('get-all-task-sessions', async (_, taskId) => {
  try {
    const sessions = await prisma.timeSession.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    })
    return sessions
  } catch (error) {
    console.error('Error getting all task sessions:', error)
    return []
  }
})

// Global search handler
ipcMain.handle('global-search', async (_, query) => {
  try {
    if (!query || query.trim().length === 0) {
      return {
        users: [],
        workspaces: [],
        lists: [],
        tasks: [],
        subtasks: []
      }
    }

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { name: { contains: query } },
          { email: { contains: query } }
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    // Search workspaces
    const workspaces = await prisma.workspace.findMany({
      where: {
        name: { contains: query }
      },
      include: {
        user: {
          select: { username: true, name: true }
        }
      }
    })

    // Search lists
    const lists = await prisma.list.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        iconColor: true,
        isArchived: true,
        archivedAt: true,
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { notes: { contains: query } }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        notes: true,
        estimatedTime: true,
        listId: true,
        list: {
          select: {
            id: true,
            name: true,
            workspace: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        subtasks: true
      }
    })

    // Search subtasks
    const subtasks = await prisma.subtask.findMany({
      where: {
        title: { contains: query }
      },
      select: {
        id: true,
        title: true,
        completed: true,
        task: {
          select: {
            id: true,
            title: true,
            list: {
              select: {
                id: true,
                name: true,
                workspace: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return {
      users,
      workspaces,
      lists,
      tasks,
      subtasks
    }
  } catch (error) {
    console.error('Global search error:', error)
    return {
      users: [],
      workspaces: [],
      lists: [],
      tasks: [],
      subtasks: []
    }
  }
})

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC handlers for window controls
ipcMain.on('window-minimize', () => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) window.minimize()
})

ipcMain.on('window-maximize', () => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  }
})

ipcMain.on('window-close', () => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) window.close()
})

ipcMain.on('window-set-resizable', (event, resizable) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setResizable(resizable)
  }
})

ipcMain.on('window-hide-controls', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (process.platform === 'darwin') {
      mainWindow.setWindowButtonVisibility(false)
    }
  }
})

ipcMain.on('window-show-controls', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (process.platform === 'darwin') {
      mainWindow.setWindowButtonVisibility(true)
    }
  }
})

// IPC handlers for window resize
ipcMain.on('window-resize-floating', () => {
  stopPositionTracking() // Stop tracking when leaving focus mode
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
    
    // Calculate floating window size and position
    const windowHeight = Math.floor(screenHeight * 0.96)
    const targetX = Math.floor(screenWidth * 0.005)
    const targetY = Math.floor(screenHeight * 0.035)
    
    // Animate to floating size
    const currentBounds = mainWindow.getBounds()
    const animationSteps = 30
    const stepDuration = 10
    
    const deltaX = (targetX - currentBounds.x) / animationSteps
    const deltaY = (targetY - currentBounds.y) / animationSteps
    const deltaWidth = (330 - currentBounds.width) / animationSteps
    const deltaHeight = (windowHeight - currentBounds.height) / animationSteps
    
    let step = 0
    
    const animateStep = () => {
      if (step <= animationSteps && mainWindow && !mainWindow.isDestroyed()) {
        const progress = step / animationSteps
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        const newBounds = {
          x: Math.round(currentBounds.x + (deltaX * animationSteps * easeProgress)),
          y: Math.round(currentBounds.y + (deltaY * animationSteps * easeProgress)),
          width: Math.round(currentBounds.width + (deltaWidth * animationSteps * easeProgress)),
          height: Math.round(currentBounds.height + (deltaHeight * animationSteps * easeProgress))
        }
        
        mainWindow.setBounds(newBounds, false)
        step++
        
        if (step <= animationSteps) {
          setTimeout(animateStep, stepDuration)
        }
      }
    }
    
    animateStep()
  }
})

ipcMain.on('window-resize-focus', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
    
    // Calculate focus window size
    const focusWidth = 300
    const focusHeight = Math.floor(screenHeight * 0.04) // 4% of screen height
    
    // Use saved position or default to center
    let targetX, targetY
    if (focusModePosition) {
      targetX = focusModePosition.x
      targetY = focusModePosition.y
      
      // Ensure position is still within screen bounds
      targetX = Math.max(0, Math.min(targetX, screenWidth - focusWidth))
      targetY = Math.max(0, Math.min(targetY, screenHeight - focusHeight))
    } else {
      // Default to center if no saved position
      targetX = Math.floor((screenWidth - focusWidth) / 2)
      targetY = Math.floor((screenHeight - focusHeight) / 2)
    }
    
    // Animate to focus size and position
    const currentBounds = mainWindow.getBounds()
    const animationSteps = 30
    const stepDuration = 10
    
    const deltaX = (targetX - currentBounds.x) / animationSteps
    const deltaY = (targetY - currentBounds.y) / animationSteps
    const deltaWidth = (focusWidth - currentBounds.width) / animationSteps
    const deltaHeight = (focusHeight - currentBounds.height) / animationSteps
    
    let step = 0
    
    const animateStep = () => {
      if (step <= animationSteps && mainWindow && !mainWindow.isDestroyed()) {
        const progress = step / animationSteps
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        const newBounds = {
          x: Math.round(currentBounds.x + (deltaX * animationSteps * easeProgress)),
          y: Math.round(currentBounds.y + (deltaY * animationSteps * easeProgress)),
          width: Math.round(currentBounds.width + (deltaWidth * animationSteps * easeProgress)),
          height: Math.round(currentBounds.height + (deltaHeight * animationSteps * easeProgress))
        }
        
        mainWindow.setBounds(newBounds, false)
        step++
        
        if (step <= animationSteps) {
          setTimeout(animateStep, stepDuration)
        } else {
          // Start tracking position changes after animation completes
          startPositionTracking()
        }
      }
    }
    
    animateStep()
  }
})

ipcMain.on('window-resize-normal', () => {
  stopPositionTracking() // Stop tracking when leaving focus mode
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Get screen dimensions for centering
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
    
    // Default main window size and center position
    const defaultWidth = 1920
    const defaultHeight = 1080
    const centerX = Math.floor((screenWidth - defaultWidth) / 2)
    const centerY = Math.floor((screenHeight - defaultHeight) / 2)
    
    // Animate back to normal size
    const currentBounds = mainWindow.getBounds()
    const animationSteps = 30
    const stepDuration = 10
    
    const deltaX = (centerX - currentBounds.x) / animationSteps
    const deltaY = (centerY - currentBounds.y) / animationSteps
    const deltaWidth = (defaultWidth - currentBounds.width) / animationSteps
    const deltaHeight = (defaultHeight - currentBounds.height) / animationSteps
    
    let step = 0
    
    const animateStep = () => {
      if (step <= animationSteps && mainWindow && !mainWindow.isDestroyed()) {
        const progress = step / animationSteps
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        const newBounds = {
          x: Math.round(currentBounds.x + (deltaX * animationSteps * easeProgress)),
          y: Math.round(currentBounds.y + (deltaY * animationSteps * easeProgress)),
          width: Math.round(currentBounds.width + (deltaWidth * animationSteps * easeProgress)),
          height: Math.round(currentBounds.height + (deltaHeight * animationSteps * easeProgress))
        }
        
        mainWindow.setBounds(newBounds, false)
        step++
        
        if (step <= animationSteps) {
          setTimeout(animateStep, stepDuration)
        }
      }
    }
    
    animateStep()
  }
})

// Set always on top handler
ipcMain.on('window-set-always-on-top', (event, flag) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(!!flag)
  }
})

// Cursor tracking functions
function startCursorTracking() {
  if (cursorTracker) {
    clearInterval(cursorTracker)
  }
  
  cursorTracker = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        const point = screen.getCursorScreenPoint()
        const bounds = mainWindow.getBounds()
        
        const isOverWindow = (
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.height
        )
        
        mainWindow.webContents.send('cursor-position-update', {
          isOverWindow,
          position: point,
          windowBounds: bounds
        })
      } catch (error) {
        console.error('Cursor tracking error:', error)
      }
    }
  }, 50) // 50ms for smooth detection
}

function stopCursorTracking() {
  if (cursorTracker) {
    clearInterval(cursorTracker)
    cursorTracker = null
  }
}

// Position tracking functions
let positionTracker = null

function startPositionTracking() {
  if (positionTracker) {
    clearInterval(positionTracker)
  }
  
  positionTracker = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds()
      // Save current position
      focusModePosition = { x: bounds.x, y: bounds.y }
    }
  }, 500) // Check every 500ms
}

function stopPositionTracking() {
  if (positionTracker) {
    clearInterval(positionTracker)
    positionTracker = null
  }
}

// IPC handlers for cursor tracking
ipcMain.on('start-cursor-tracking', () => {
  startCursorTracking()
})

ipcMain.on('stop-cursor-tracking', () => {
  stopCursorTracking()
})

// IPC handlers for position tracking
ipcMain.on('start-position-tracking', () => {
  startPositionTracking()
})

ipcMain.on('stop-position-tracking', () => {
  stopPositionTracking()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  app.setAppUserModelId('com.electron')

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  stopCursorTracking() // Clean up cursor tracking
  stopPositionTracking() // Clean up position tracking
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
