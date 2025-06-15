import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

// Simple development check
const isDev = !app.isPackaged

let mainWindow = null

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
    
    // Calculate focus window size and position (compact size)
    const focusWidth = 300
    const focusHeight = Math.floor(screenHeight * 0.04) // 10% of screen height
    const centerX = Math.floor((screenWidth - focusWidth) / 2)
    const centerY = Math.floor((screenHeight - focusHeight) / 2)
    
    // Animate to focus size
    const currentBounds = mainWindow.getBounds()
    const animationSteps = 30
    const stepDuration = 10
    
    const deltaX = (centerX - currentBounds.x) / animationSteps
    const deltaY = (centerY - currentBounds.y) / animationSteps
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
        }
      }
    }
    
    animateStep()
  }
})

ipcMain.on('window-resize-normal', () => {
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
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
