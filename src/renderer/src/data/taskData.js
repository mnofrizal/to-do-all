// Helper functions for task lifecycle management
export const formatTime = (minutes) => {
  if (minutes === 0) return '0min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}hr`;
  return `${hours}hr ${mins}min`;
};

// Week management functions
export const getCurrentWeek = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return {
    weekNumber,
    year: now.getFullYear(),
    weekString: `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
  };
};

export const getNextMonday = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday, next day is Monday
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0); // Set to 00:00 WIB
  return nextMonday.toISOString();
};

// Check if task belongs to current week
export const isCurrentWeekTask = (task) => {
  const currentWeek = getCurrentWeek();
  return task.assignedWeek === currentWeek.weekString;
};

// Update task to current week when manually moved from backlog
export const updateTaskToCurrentWeek = (task) => {
  const currentWeek = getCurrentWeek();
  const now = new Date().toISOString();
  
  return {
    ...task,
    weekNumber: currentWeek.weekNumber,
    weekYear: currentWeek.year,
    assignedWeek: currentWeek.weekString,
    deadline: getNextMonday(),
    updatedAt: now,
    status: 'inprogress'
  };
};

// Helper function to check if date is today
export const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isTaskExpired = (deadline) => {
  if (!deadline) return false;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return now > deadlineDate;
};

export const moveExpiredTasksToBacklog = async (columns) => {
  const updatedColumns = { ...columns };
  const backlogTasks = [];

  for (const columnId in updatedColumns) {
    if (columnId === 'thisweek' || columnId === 'today') {
      const { activeTasks, expiredTasks } = updatedColumns[columnId].tasks.reduce(
        (acc, task) => {
          if (isTaskExpired(task.deadline)) {
            acc.expiredTasks.push({ ...task, status: 'backlog' });
          } else {
            acc.activeTasks.push(task);
          }
          return acc;
        },
        { activeTasks: [], expiredTasks: [] }
      );

      updatedColumns[columnId].tasks = activeTasks;
      backlogTasks.push(...expiredTasks);
    }
  }

  if (backlogTasks.length > 0) {
    for (const task of backlogTasks) {
      await window.db.updateTask(task.id, { status: 'backlog' });
    }
    if (updatedColumns.backlog) {
      updatedColumns.backlog.tasks.push(...backlogTasks);
    }
  }

  return updatedColumns;
};


// Dynamic progress calculation functions
export const calculateThisWeekProgress = (columns) => {
  const thisWeekColumn = columns.find(col => col.id === 'thisweek');
  const todayColumn = columns.find(col => col.id === 'today');
  const doneColumn = columns.find(col => col.id === 'done');
  
  // Get all tasks assigned to current week using isCurrentWeekTask
  // Note: Only count tasks that actually belong to current week for accurate progress
  const allCurrentWeekTasks = [
    ...(thisWeekColumn?.tasks.filter(task => {
      // For This Week column, only count current week tasks
      return task.assignedWeek ? isCurrentWeekTask(task) : true;
    }) || []),
    ...(todayColumn?.tasks.filter(task => {
      // For Today column, only count current week tasks
      return task.assignedWeek ? isCurrentWeekTask(task) : true;
    }) || []),
    ...(doneColumn?.tasks.filter(task => {
      if (task.assignedWeek) {
        return isCurrentWeekTask(task) && task.status === 'done';
      }
      // Fallback: include completed tasks from this week
      return task.status === 'done' && task.completedAt &&
             new Date(task.completedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }) || [])
  ];
  
  const completed = allCurrentWeekTasks.filter(task => task.status === 'done').length;
  const total = allCurrentWeekTasks.length;
  
  return { completed, total };
};

export const calculateTodayProgress = (columns) => {
  const todayColumn = columns.find(col => col.id === 'today');
  const doneColumn = columns.find(col => col.id === 'done');
  
  // Get tasks in today column (all tasks in today are considered scheduled for today)
  const todayTasks = todayColumn?.tasks.filter(task => {
    // Use scheduledForToday if available, otherwise include all tasks in today column
    return task.scheduledForToday !== undefined ? task.scheduledForToday : true;
  }) || [];
  
  // Get completed tasks that were scheduled for today
  const completedTodayTasks = doneColumn?.tasks.filter(task => {
    if (task.scheduledForToday && task.completedAt) {
      return isToday(new Date(task.completedAt));
    }
    // Fallback: tasks completed today that belong to current week
    if (task.status === 'done' && task.completedAt && isToday(new Date(task.completedAt))) {
      return task.assignedWeek ? isCurrentWeekTask(task) : true;
    }
    return false;
  }) || [];
  
  const completed = completedTodayTasks.length;
  const total = todayTasks.length + completedTodayTasks.length;
  
  return { completed, total };
};

// Default task columns data
export const getDefaultTaskColumns = () => ([
  {
    id: 'backlog',
    title: 'Backlog',
    tasks: [],
    color: 'dark:border-zinc-700 border-zinc-300',
  },
  {
    id: 'thisweek',
    title: 'This Week',
    tasks: [],
    color: 'dark:border-zinc-700 border-zinc-300'
  },
  {
    id: 'today',
    title: 'Today',
    tasks: [],
    color: 'border-primary'
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [],
    color: 'dark:border-zinc-700 border-zinc-300',
  }
]);

// Task creation helper
export const createNewTask = (taskTitle, columnId, listId) => {
  const now = new Date().toISOString();
  const currentWeek = getCurrentWeek();
  const status = columnId === 'backlog' ? 'backlog' : columnId === 'done' ? 'done' : 'inprogress';
  
  return {
    title: taskTitle,
    status: status,
    priority: 'medium',
    timeSpent: 0,
    estimatedTime: 60,
    weekNumber: currentWeek.weekNumber,
    weekYear: currentWeek.year,
    createdAt: now,
    updatedAt: now,
    completedAt: columnId === 'done' ? now : null, // Set completedAt for done tasks
    deadline: getNextMonday(),
    assignedWeek: currentWeek.weekString,
    scheduledForToday: columnId === 'today',
    todayScheduledAt: columnId === 'today' ? now : null,
    listId: listId,
  };
};