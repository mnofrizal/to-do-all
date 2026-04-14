import { app, shell, BrowserWindow, ipcMain, screen, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { PrismaClient } from '@prisma/client'
import icon from '../../resources/icon.png?asset'

const appIconPath = !app.isPackaged ? join(app.getAppPath(), 'build', 'icon.png') : icon

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
  return await prisma.$transaction(async (tx) => {
    const lists = await tx.list.findMany({
      where: { workspaceId: id },
      select: { id: true }
    })

    const listIds = lists.map((list) => list.id)

    if (listIds.length > 0) {
      const tasks = await tx.task.findMany({
        where: { listId: { in: listIds } },
        select: { id: true }
      })

      const taskIds = tasks.map((task) => task.id)

      if (taskIds.length > 0) {
        await tx.subtask.deleteMany({
          where: { taskId: { in: taskIds } }
        })

        await tx.timeSession.deleteMany({
          where: { taskId: { in: taskIds } }
        })

        await tx.task.deleteMany({
          where: { id: { in: taskIds } }
        })
      }

      await tx.list.deleteMany({
        where: { id: { in: listIds } }
      })
    }

    return await tx.workspace.delete({ where: { id } })
  })
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
  return await prisma.$transaction(async (tx) => {
    const tasks = await tx.task.findMany({
      where: { listId: id },
      select: { id: true }
    })

    const taskIds = tasks.map((task) => task.id)

    if (taskIds.length > 0) {
      await tx.subtask.deleteMany({
        where: { taskId: { in: taskIds } }
      })

      await tx.timeSession.deleteMany({
        where: { taskId: { in: taskIds } }
      })

      await tx.task.deleteMany({
        where: { id: { in: taskIds } }
      })
    }

    return await tx.list.delete({ where: { id } })
  })
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

const EXPORT_HEADERS = [
  'entityType',
  'workspaceName',
  'workspaceIsDefault',
  'listName',
  'listDescription',
  'listIcon',
  'listIconColor',
  'listIsArchived',
  'taskTitle',
  'taskStatus',
  'taskPriority',
  'taskEstimatedTime',
  'taskTimeSpent',
  'taskDeadline',
  'taskScheduledForToday',
  'taskTodayScheduledAt',
  'taskWeekNumber',
  'taskWeekYear',
  'taskAssignedWeek',
  'taskOrderInColumn',
  'taskNotes',
  'taskCompletedAt',
  'subtaskTitle',
  'subtaskCompleted',
  'subtaskOrder'
]

const csvEscape = (value) => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const splitCsvLine = (line) => {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

const parseBoolean = (value, fallback = false) => {
  if (value === '' || value === null || value === undefined) return fallback
  return String(value).toLowerCase() === 'true'
}

const parseNullableInt = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const parseNullableDate = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const serializeUserData = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workspaces: {
        orderBy: { createdAt: 'asc' },
        include: {
          lists: {
            orderBy: { createdAt: 'asc' },
            include: {
              tasks: {
                orderBy: [{ orderInColumn: 'asc' }, { createdAt: 'asc' }],
                include: {
                  subtasks: {
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar
    },
    workspaces: user.workspaces.map((workspace) => ({
      name: workspace.name,
      isDefault: workspace.isDefault,
      lists: workspace.lists.map((list) => ({
        name: list.name,
        description: list.description,
        icon: list.icon,
        iconColor: list.iconColor,
        isArchived: list.isArchived,
        archivedAt: list.archivedAt?.toISOString() || null,
        tasks: list.tasks.map((task) => ({
          title: task.title,
          status: task.status,
          priority: task.priority,
          estimatedTime: task.estimatedTime,
          timeSpent: task.timeSpent,
          lastStartTime: task.lastStartTime?.toISOString() || null,
          deadline: task.deadline?.toISOString() || null,
          scheduledForToday: task.scheduledForToday,
          todayScheduledAt: task.todayScheduledAt?.toISOString() || null,
          weekNumber: task.weekNumber,
          weekYear: task.weekYear,
          assignedWeek: task.assignedWeek,
          orderInColumn: task.orderInColumn,
          notes: task.notes,
          completedAt: task.completedAt?.toISOString() || null,
          subtasks: task.subtasks.map((subtask) => ({
            title: subtask.title,
            completed: subtask.completed,
            order: subtask.order
          }))
        }))
      }))
    }))
  }
}

const convertExportToCsv = (exportData) => {
  const rows = [EXPORT_HEADERS.join(',')]

  exportData.workspaces.forEach((workspace) => {
    workspace.lists.forEach((list) => {
      if (!list.tasks.length) {
        rows.push(EXPORT_HEADERS.map((header) => {
          const row = {
            entityType: 'list',
            workspaceName: workspace.name,
            workspaceIsDefault: workspace.isDefault,
            listName: list.name,
            listDescription: list.description,
            listIcon: list.icon,
            listIconColor: list.iconColor,
            listIsArchived: list.isArchived
          }
          return csvEscape(row[header])
        }).join(','))
      }

      list.tasks.forEach((task) => {
        if (!task.subtasks.length) {
          rows.push(EXPORT_HEADERS.map((header) => {
            const row = {
              entityType: 'task',
              workspaceName: workspace.name,
              workspaceIsDefault: workspace.isDefault,
              listName: list.name,
              listDescription: list.description,
              listIcon: list.icon,
              listIconColor: list.iconColor,
              listIsArchived: list.isArchived,
              taskTitle: task.title,
              taskStatus: task.status,
              taskPriority: task.priority,
              taskEstimatedTime: task.estimatedTime,
              taskTimeSpent: task.timeSpent,
              taskDeadline: task.deadline,
              taskScheduledForToday: task.scheduledForToday,
              taskTodayScheduledAt: task.todayScheduledAt,
              taskWeekNumber: task.weekNumber,
              taskWeekYear: task.weekYear,
              taskAssignedWeek: task.assignedWeek,
              taskOrderInColumn: task.orderInColumn,
              taskNotes: task.notes,
              taskCompletedAt: task.completedAt
            }
            return csvEscape(row[header])
          }).join(','))
        }

        task.subtasks.forEach((subtask) => {
          rows.push(EXPORT_HEADERS.map((header) => {
            const row = {
              entityType: 'subtask',
              workspaceName: workspace.name,
              workspaceIsDefault: workspace.isDefault,
              listName: list.name,
              listDescription: list.description,
              listIcon: list.icon,
              listIconColor: list.iconColor,
              listIsArchived: list.isArchived,
              taskTitle: task.title,
              taskStatus: task.status,
              taskPriority: task.priority,
              taskEstimatedTime: task.estimatedTime,
              taskTimeSpent: task.timeSpent,
              taskDeadline: task.deadline,
              taskScheduledForToday: task.scheduledForToday,
              taskTodayScheduledAt: task.todayScheduledAt,
              taskWeekNumber: task.weekNumber,
              taskWeekYear: task.weekYear,
              taskAssignedWeek: task.assignedWeek,
              taskOrderInColumn: task.orderInColumn,
              taskNotes: task.notes,
              taskCompletedAt: task.completedAt,
              subtaskTitle: subtask.title,
              subtaskCompleted: subtask.completed,
              subtaskOrder: subtask.order
            }
            return csvEscape(row[header])
          }).join(','))
        })
      })
    })
  })

  return rows.join('\n')
}

const parseCsvImport = (content) => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length <= 1) {
    return { workspaces: [] }
  }

  const headers = splitCsvLine(lines[0])
  const workspacesMap = new Map()

  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line)
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))

    const workspaceKey = row.workspaceName || 'Imported Workspace'
    if (!workspacesMap.has(workspaceKey)) {
      workspacesMap.set(workspaceKey, {
        name: workspaceKey,
        isDefault: parseBoolean(row.workspaceIsDefault),
        lists: []
      })
    }

    const workspace = workspacesMap.get(workspaceKey)
    const listKey = row.listName || 'Imported List'
    let list = workspace.lists.find((item) => item.name === listKey)
    if (!list) {
      list = {
        name: listKey,
        description: row.listDescription || null,
        icon: row.listIcon || 'L',
        iconColor: row.listIconColor || 'bg-blue-500',
        isArchived: parseBoolean(row.listIsArchived),
        tasks: []
      }
      workspace.lists.push(list)
    }

    if (!row.taskTitle) {
      continue
    }

    let task = list.tasks.find((item) => item.title === row.taskTitle)
    if (!task) {
      task = {
        title: row.taskTitle,
        status: row.taskStatus || 'inprogress',
        priority: row.taskPriority || 'medium',
        estimatedTime: parseNullableInt(row.taskEstimatedTime) ?? 60,
        timeSpent: parseNullableInt(row.taskTimeSpent) ?? 0,
        deadline: row.taskDeadline || null,
        scheduledForToday: parseBoolean(row.taskScheduledForToday),
        todayScheduledAt: row.taskTodayScheduledAt || null,
        weekNumber: parseNullableInt(row.taskWeekNumber),
        weekYear: parseNullableInt(row.taskWeekYear),
        assignedWeek: row.taskAssignedWeek || null,
        orderInColumn: parseNullableInt(row.taskOrderInColumn) ?? 0,
        notes: row.taskNotes || null,
        completedAt: row.taskCompletedAt || null,
        subtasks: []
      }
      list.tasks.push(task)
    }

    if (row.subtaskTitle) {
      task.subtasks.push({
        title: row.subtaskTitle,
        completed: parseBoolean(row.subtaskCompleted),
        order: parseNullableInt(row.subtaskOrder) ?? task.subtasks.length
      })
    }
  }

  return {
    workspaces: Array.from(workspacesMap.values())
  }
}

const normalizeImportData = (data) => {
  if (Array.isArray(data)) {
    return { workspaces: data }
  }

  if (data?.workspaces && Array.isArray(data.workspaces)) {
    return data
  }

  if (data?.data?.workspaces && Array.isArray(data.data.workspaces)) {
    return { workspaces: data.data.workspaces }
  }

  if (data?.user?.workspaces && Array.isArray(data.user.workspaces)) {
    return { workspaces: data.user.workspaces }
  }

  throw new Error('Invalid import data format')
}

const importStructuredData = async (userId, data) => {
  const normalizedData = normalizeImportData(data)

  const summary = {
    workspaces: 0,
    lists: 0,
    tasks: 0,
    subtasks: 0
  }

  await prisma.$transaction(async (tx) => {
    for (const workspaceData of normalizedData.workspaces) {
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceData.name || 'Imported Workspace',
          isDefault: Boolean(workspaceData.isDefault),
          userId
        }
      })
      summary.workspaces += 1

      for (const listData of workspaceData.lists || []) {
        const list = await tx.list.create({
          data: {
            name: listData.name || 'Imported List',
            description: listData.description || null,
            icon: listData.icon || 'L',
            iconColor: listData.iconColor || 'bg-blue-500',
            isArchived: Boolean(listData.isArchived),
            archivedAt: parseNullableDate(listData.archivedAt),
            workspaceId: workspace.id
          }
        })
        summary.lists += 1

        for (const taskData of listData.tasks || []) {
          const task = await tx.task.create({
            data: {
              title: taskData.title || 'Imported Task',
              status: taskData.status || 'inprogress',
              priority: taskData.priority || 'medium',
              estimatedTime: Number.isInteger(taskData.estimatedTime) ? taskData.estimatedTime : 60,
              timeSpent: Number.isInteger(taskData.timeSpent) ? taskData.timeSpent : 0,
              lastStartTime: parseNullableDate(taskData.lastStartTime),
              deadline: parseNullableDate(taskData.deadline),
              scheduledForToday: Boolean(taskData.scheduledForToday),
              todayScheduledAt: parseNullableDate(taskData.todayScheduledAt),
              weekNumber: taskData.weekNumber ?? null,
              weekYear: taskData.weekYear ?? null,
              assignedWeek: taskData.assignedWeek || null,
              orderInColumn: Number.isInteger(taskData.orderInColumn) ? taskData.orderInColumn : 0,
              notes: taskData.notes || null,
              completedAt: parseNullableDate(taskData.completedAt),
              listId: list.id
            }
          })
          summary.tasks += 1

          for (const subtaskData of taskData.subtasks || []) {
            await tx.subtask.create({
              data: {
                title: subtaskData.title || 'Imported Subtask',
                completed: Boolean(subtaskData.completed),
                order: Number.isInteger(subtaskData.order) ? subtaskData.order : 0,
                taskId: task.id
              }
            })
            summary.subtasks += 1
          }
        }
      }
    }
  })

  return summary
}

ipcMain.handle('export-data', async (_, { userId, format }) => {
  try {
    if (!userId) throw new Error('Missing user id')
    if (!['json', 'csv'].includes(format)) throw new Error('Unsupported export format')

    const exportData = await serializeUserData(userId)
    const defaultPath = join(app.getPath('downloads'), `taskleap-export-${new Date().toISOString().slice(0, 10)}.${format}`)
    const saveResult = await dialog.showSaveDialog({
      title: `Export data as ${format.toUpperCase()}`,
      defaultPath,
      filters: [
        {
          name: format.toUpperCase(),
          extensions: [format]
        }
      ]
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true }
    }

    const content = format === 'json'
      ? JSON.stringify(exportData, null, 2)
      : convertExportToCsv(exportData)

    await writeFile(saveResult.filePath, content, 'utf8')

    return {
      canceled: false,
      filePath: saveResult.filePath
    }
  } catch (error) {
    console.error('Export data error:', error)
    return {
      canceled: false,
      error: error.message || 'Failed to export data'
    }
  }
})

ipcMain.handle('import-data', async (_, { userId }) => {
  try {
    if (!userId) throw new Error('Missing user id')

    const openResult = await dialog.showOpenDialog({
      title: 'Import data',
      properties: ['openFile'],
      filters: [
        { name: 'Supported Files', extensions: ['json', 'csv'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] }
      ]
    })

    if (openResult.canceled || !openResult.filePaths?.[0]) {
      return { canceled: true }
    }

    const filePath = openResult.filePaths[0]
    const content = await readFile(filePath, 'utf8')
    const isJson = filePath.toLowerCase().endsWith('.json')
    const parsedData = isJson ? JSON.parse(content) : parseCsvImport(content)
    const summary = await importStructuredData(userId, parsedData)

    return {
      canceled: false,
      filePath,
      summary
    }
  } catch (error) {
    console.error('Import data error:', error)
    return {
      canceled: false,
      error: error.message || 'Failed to import data'
    }
  }
})

function createWindow() {
  // Create the browser window.
  const windowIcon = nativeImage.createFromPath(appIconPath)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    ...(windowIcon.isEmpty() ? {} : { icon: windowIcon }),
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
    
    // Calculate floating window size and position with bounds checking
    const windowHeight = Math.floor(screenHeight * 0.96)
    const targetX = Math.max(0, Math.floor(screenWidth * 0.005))
    const targetY = Math.max(0, Math.floor(screenHeight * 0.035))
    const floatingWidth = 330
    
    // Ensure floating window fits within screen
    const maxX = Math.max(0, screenWidth - floatingWidth)
    const maxY = Math.max(0, screenHeight - windowHeight)
    const finalX = Math.min(targetX, maxX)
    const finalY = Math.min(targetY, maxY)
    
    // Animate to floating size
    const currentBounds = mainWindow.getBounds()
    const animationSteps = 30
    const stepDuration = 10
    
    const deltaX = (finalX - currentBounds.x) / animationSteps
    const deltaY = (finalY - currentBounds.y) / animationSteps
    const deltaWidth = (floatingWidth - currentBounds.width) / animationSteps
    const deltaHeight = (windowHeight - currentBounds.height) / animationSteps
    
    let step = 0
    
    const animateStep = () => {
      if (step <= animationSteps && mainWindow && !mainWindow.isDestroyed()) {
        const progress = step / animationSteps
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        const newX = Math.round(currentBounds.x + (deltaX * animationSteps * easeProgress))
        const newY = Math.round(currentBounds.y + (deltaY * animationSteps * easeProgress))
        const newWidth = Math.round(currentBounds.width + (deltaWidth * animationSteps * easeProgress))
        const newHeight = Math.round(currentBounds.height + (deltaHeight * animationSteps * easeProgress))
        
        // Validate bounds before setting
        const newBounds = {
          x: Math.max(0, Math.min(newX, screenWidth - newWidth)),
          y: Math.max(0, Math.min(newY, screenHeight - newHeight)),
          width: Math.max(200, Math.min(newWidth, screenWidth)),
          height: Math.max(150, Math.min(newHeight, screenHeight))
        }
        
        // Additional validation to ensure all values are finite numbers
        if (isFinite(newBounds.x) && isFinite(newBounds.y) &&
            isFinite(newBounds.width) && isFinite(newBounds.height) &&
            newBounds.width > 0 && newBounds.height > 0) {
          mainWindow.setBounds(newBounds, false)
        }
        
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
    
    // Calculate focus window size with minimum height
    const focusWidth = 300
    const focusHeight = Math.max(50, Math.floor(screenHeight * 0.04)) // 4% of screen height, minimum 50px
    
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
      targetX = Math.max(0, Math.floor((screenWidth - focusWidth) / 2))
      targetY = Math.max(0, Math.floor((screenHeight - focusHeight) / 2))
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
        
        const newX = Math.round(currentBounds.x + (deltaX * animationSteps * easeProgress))
        const newY = Math.round(currentBounds.y + (deltaY * animationSteps * easeProgress))
        const newWidth = Math.round(currentBounds.width + (deltaWidth * animationSteps * easeProgress))
        const newHeight = Math.round(currentBounds.height + (deltaHeight * animationSteps * easeProgress))
        
        // Validate bounds before setting
        const newBounds = {
          x: Math.max(0, Math.min(newX, screenWidth - newWidth)),
          y: Math.max(0, Math.min(newY, screenHeight - newHeight)),
          width: Math.max(200, Math.min(newWidth, screenWidth)),
          height: Math.max(50, Math.min(newHeight, screenHeight))
        }
        
        // Additional validation to ensure all values are finite numbers
        if (isFinite(newBounds.x) && isFinite(newBounds.y) &&
            isFinite(newBounds.width) && isFinite(newBounds.height) &&
            newBounds.width > 0 && newBounds.height > 0) {
          mainWindow.setBounds(newBounds, false)
        }
        
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
    
    // Use more reasonable default window size that fits within screen bounds
    const maxWidth = Math.min(1400, screenWidth * 0.88)
    const maxHeight = Math.min(900, screenHeight * 0.88)
    const defaultWidth = Math.max(1200, maxWidth)
    const defaultHeight = Math.max(800, maxHeight)
    
    // Calculate center position with bounds checking
    const centerX = Math.max(0, Math.floor((screenWidth - defaultWidth) / 2))
    const centerY = Math.max(0, Math.floor((screenHeight - defaultHeight) / 2))
    
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
        
        const newX = Math.round(currentBounds.x + (deltaX * animationSteps * easeProgress))
        const newY = Math.round(currentBounds.y + (deltaY * animationSteps * easeProgress))
        const newWidth = Math.round(currentBounds.width + (deltaWidth * animationSteps * easeProgress))
        const newHeight = Math.round(currentBounds.height + (deltaHeight * animationSteps * easeProgress))
        
        // Validate bounds before setting
        const newBounds = {
          x: Math.max(0, Math.min(newX, screenWidth - newWidth)),
          y: Math.max(0, Math.min(newY, screenHeight - newHeight)),
          width: Math.max(300, Math.min(newWidth, screenWidth)),
          height: Math.max(200, Math.min(newHeight, screenHeight))
        }
        
        // Additional validation to ensure all values are finite numbers
        if (isFinite(newBounds.x) && isFinite(newBounds.y) &&
            isFinite(newBounds.width) && isFinite(newBounds.height) &&
            newBounds.width > 0 && newBounds.height > 0) {
          mainWindow.setBounds(newBounds, false)
        }
        
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
  app.setAppUserModelId('com.taskleap.desktop')

  if (process.platform === 'darwin') {
    const dockIcon = nativeImage.createFromPath(appIconPath)
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon)
    }
  }

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
