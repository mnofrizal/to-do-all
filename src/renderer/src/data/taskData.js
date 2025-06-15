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
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return now > deadlineDate;
};

export const moveExpiredTasksToBacklog = (columns) => {
  const updatedColumns = columns.map(column => {
    if (column.id === 'thisweek' || column.id === 'today') {
      const activeTasks = [];
      const expiredTasks = [];
      
      column.tasks.forEach(task => {
        if (task.deadline && isTaskExpired(task.deadline) && task.status !== 'done') {
          expiredTasks.push({
            ...task,
            status: 'backlog',
            updatedAt: new Date().toISOString()
          });
        } else {
          activeTasks.push(task);
        }
      });
      
      return { ...column, tasks: activeTasks };
    }
    return column;
  });
  
  // Add expired tasks to backlog
  const backlogColumn = updatedColumns.find(col => col.id === 'backlog');
  if (backlogColumn) {
    const allExpiredTasks = [];
    updatedColumns.forEach(column => {
      if (column.id === 'thisweek' || column.id === 'today') {
        column.tasks.forEach(task => {
          if (task.deadline && isTaskExpired(task.deadline) && task.status !== 'done') {
            allExpiredTasks.push({
              ...task,
              status: 'backlog',
              updatedAt: new Date().toISOString()
            });
          }
        });
      }
    });
    
    backlogColumn.tasks = [...backlogColumn.tasks, ...allExpiredTasks];
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
        return isCurrentWeekTask(task) && task.completed;
      }
      // Fallback: include completed tasks from this week
      return task.completed && task.completedAt && 
             new Date(task.completedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }) || [])
  ];
  
  const completed = allCurrentWeekTasks.filter(task => task.completed).length;
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
    if (task.completed && task.completedAt && isToday(new Date(task.completedAt))) {
      return task.assignedWeek ? isCurrentWeekTask(task) : true;
    }
    return false;
  }) || [];
  
  const completed = completedTodayTasks.length;
  const total = todayTasks.length + completedTodayTasks.length;
  
  return { completed, total };
};

// Default task columns data
export const getDefaultTaskColumns = () => [
  {
    id: 'backlog',
    title: 'Backlog',
    tasks: [],
    color: 'dark:border-zinc-700 border-zinc-300',
  },
  {
    id: 'thisweek',
    title: 'This Week',
    tasks: [
      {
        id: 1,
        title: 'jalan jalan',
        timeSpent: 0,
        estimatedTime: 120, // 2 hours
        time: formatTime(0),
        estimate: formatTime(120),
        taskGroup: {
          name: 'K',
          color: 'bg-blue-500'
        },
        priority: 'medium',
        status: 'inprogress',
        createdAt: '2025-06-10T10:00:00.000Z',
        updatedAt: '2025-06-10T10:00:00.000Z',
        completedAt: null,
        deadline: getNextMonday(),
        // Week tracking fields
        weekNumber: getCurrentWeek().weekNumber,
        weekYear: getCurrentWeek().year,
        assignedWeek: getCurrentWeek().weekString,
        scheduledForToday: false,
        todayScheduledAt: null,
        subtasks: [],
        notes: '',
        completed: false
      }
    ],
    color: 'dark:border-zinc-700 border-zinc-300'
  },
  {
    id: 'today',
    title: 'Today',
    tasks: [
      {
        id: 2,
        title: 'masak sate',
        timeSpent: 600, // 10 hours
        estimatedTime: 480, // 8 hours
        time: formatTime(600),
        estimate: formatTime(480),
        taskGroup: {
          name: 'K',
          color: 'bg-blue-500'
        },
        priority: 'high',
        status: 'inprogress',
        createdAt: '2025-06-14T08:00:00.000Z',
        updatedAt: '2025-06-15T14:00:00.000Z',
        completedAt: null,
        deadline: getNextMonday(),
        // Week tracking fields
        weekNumber: getCurrentWeek().weekNumber,
        weekYear: getCurrentWeek().year,
        assignedWeek: getCurrentWeek().weekString,
        scheduledForToday: true,
        todayScheduledAt: '2025-06-15T08:00:00.000Z',
        subtasks: [
          { id: 21, title: 'makan sarapasan', completed: true, order: 0 },
          { id: 22, title: 'makan malam', completed: true, order: 1 }
        ],
        notes: 'ini adalah notes',
        completed: false
      },
      {
        id: 3,
        title: 'edwf',
        timeSpent: 0,
        estimatedTime: 60, // 1 hour
        time: formatTime(0),
        estimate: formatTime(60),
        taskGroup: {
          name: 'T',
          color: 'bg-yellow-500'
        },
        priority: 'low',
        status: 'inprogress',
        createdAt: '2025-06-15T09:00:00.000Z',
        updatedAt: '2025-06-15T09:00:00.000Z',
        completedAt: null,
        deadline: getNextMonday(),
        // Week tracking fields
        weekNumber: getCurrentWeek().weekNumber,
        weekYear: getCurrentWeek().year,
        assignedWeek: getCurrentWeek().weekString,
        scheduledForToday: true,
        todayScheduledAt: '2025-06-15T09:00:00.000Z',
        subtasks: [
          { id: 31, title: 'makan sarapasan', completed: true, order: 0 },
          { id: 32, title: 'makan malam', completed: true, order: 1 }
        ],
        notes: '',
        completed: false
      }
    ],
    color: 'border-primary'
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [
      {
        id: 4,
        title: 'Test to do 2 makan enak makar',
        timeSpent: 10,
        estimatedTime: 30,
        time: formatTime(10),
        estimate: formatTime(30),
        taskGroup: {
          name: 'K',
          color: 'bg-blue-500'
        },
        priority: 'medium',
        status: 'done',
        createdAt: '2025-06-10T15:00:00.000Z',
        updatedAt: '2025-06-11T16:30:00.000Z',
        completedAt: '2025-06-11T16:30:00.000Z',
        deadline: '2025-06-16T17:00:00.000Z',
        // Week tracking fields (previous week)
        weekNumber: getCurrentWeek().weekNumber - 1,
        weekYear: getCurrentWeek().year,
        assignedWeek: `${getCurrentWeek().year}-W${(getCurrentWeek().weekNumber - 1).toString().padStart(2, '0')}`,
        scheduledForToday: false,
        todayScheduledAt: null,
        subtasks: [],
        notes: '',
        completed: true
      },
      {
        id: 55,
        title: 'Kerjain to do app',
        timeSpent: 624, // 10hr 24min
        estimatedTime: 480, // 8 hours
        time: formatTime(624),
        estimate: formatTime(480),
        taskGroup: {
          name: 'K',
          color: 'bg-blue-500'
        },
        priority: 'high',
        status: 'done',
        createdAt: '2025-06-08T09:00:00.000Z',
        updatedAt: '2025-06-11T18:24:00.000Z',
        completedAt: '2025-06-11T18:24:00.000Z',
        deadline: '2025-06-16T17:00:00.000Z',
        // Week tracking fields (previous week)
        weekNumber: getCurrentWeek().weekNumber - 1,
        weekYear: getCurrentWeek().year,
        assignedWeek: `${getCurrentWeek().year}-W${(getCurrentWeek().weekNumber - 1).toString().padStart(2, '0')}`,
        scheduledForToday: false,
        todayScheduledAt: null,
        subtasks: [],
        notes: '',
        completed: true
      },
      {
        id: 54,
        title: 'Kerjain to do app',
        timeSpent: 624, // 10hr 24min
        estimatedTime: 480, // 8 hours
        time: formatTime(624),
        estimate: formatTime(480),
        taskGroup: {
          name: 'K',
          color: 'bg-blue-500'
        },
        priority: 'high',
        status: 'done',
        createdAt: '2025-06-08T09:00:00.000Z',
        updatedAt: '2025-06-11T18:24:00.000Z',
        completedAt: '2025-06-11T18:24:00.000Z',
        deadline: '2025-06-16T17:00:00.000Z',
        // Week tracking fields (previous week)
        weekNumber: getCurrentWeek().weekNumber - 1,
        weekYear: getCurrentWeek().year,
        assignedWeek: `${getCurrentWeek().year}-W${(getCurrentWeek().weekNumber - 1).toString().padStart(2, '0')}`,
        scheduledForToday: false,
        todayScheduledAt: null,
        subtasks: [],
        notes: '',
        completed: true
      },
      {
        id: 53,
        title: 'Kerjain to do app',
        timeSpent: 624, // 10hr 24min
        estimatedTime: 480, // 8 hours
        time: formatTime(624),
        estimate: formatTime(480),
        taskGroup: {
          name: 'K',
          color: 'bg-blue-500'
        },
        priority: 'high',
        status: 'done',
        createdAt: '2025-06-08T09:00:00.000Z',
        updatedAt: '2025-06-11T18:24:00.000Z',
        completedAt: '2025-06-11T18:24:00.000Z',
        deadline: '2025-06-16T17:00:00.000Z',
        // Week tracking fields (previous week)
        weekNumber: getCurrentWeek().weekNumber - 1,
        weekYear: getCurrentWeek().year,
        assignedWeek: `${getCurrentWeek().year}-W${(getCurrentWeek().weekNumber - 1).toString().padStart(2, '0')}`,
        scheduledForToday: false,
        todayScheduledAt: null,
        subtasks: [],
        notes: '',
        completed: true
      },
      {
        id: 52,
        title: 'Kerjain to do app',
        timeSpent: 624, // 10hr 24min
        estimatedTime: 480, // 8 hours
        time: formatTime(624),
        estimate: formatTime(480),
        taskGroup: {
          name: 'K',
          color: 'bg-blue-500'
        },
        priority: 'high',
        status: 'done',
        createdAt: '2025-06-08T09:00:00.000Z',
        updatedAt: '2025-06-11T18:24:00.000Z',
        completedAt: '2025-06-11T18:24:00.000Z',
        deadline: '2025-06-16T17:00:00.000Z',
        // Week tracking fields (previous week)
        weekNumber: getCurrentWeek().weekNumber - 1,
        weekYear: getCurrentWeek().year,
        assignedWeek: `${getCurrentWeek().year}-W${(getCurrentWeek().weekNumber - 1).toString().padStart(2, '0')}`,
        scheduledForToday: false,
        todayScheduledAt: null,
        subtasks: [],
        notes: '',
        completed: true
      },
      {
        id: 51,
        title: 'Kerjain to do app',
        timeSpent: 624, // 10hr 24min
        estimatedTime: 480, // 8 hours
        time: formatTime(624),
        estimate: formatTime(480),
        taskGroup: {
          name: 'K',
          color: 'bg-blue-500'
        },
        priority: 'high',
        status: 'done',
        createdAt: '2025-06-08T09:00:00.000Z',
        updatedAt: '2025-06-11T18:24:00.000Z',
        completedAt: '2025-06-11T18:24:00.000Z',
        deadline: '2025-06-16T17:00:00.000Z',
        // Week tracking fields (previous week)
        weekNumber: getCurrentWeek().weekNumber - 1,
        weekYear: getCurrentWeek().year,
        assignedWeek: `${getCurrentWeek().year}-W${(getCurrentWeek().weekNumber - 1).toString().padStart(2, '0')}`,
        scheduledForToday: false,
        todayScheduledAt: null,
        subtasks: [],
        notes: '',
        completed: true
      }
    ],
    color: 'dark:border-zinc-700 border-zinc-300',
    subtitle: '2 tasks this month',
    date: 'Wed, Jun 11, 2025',
    taskCount: '2 tasks'
  }
];

// Task creation helper
export const createNewTask = (taskTitle, columnId, customDate = null) => {
  const now = new Date().toISOString();
  const currentWeek = getCurrentWeek();
  const status = columnId === 'backlog' ? 'backlog' : columnId === 'done' ? 'done' : 'inprogress';
  
  return {
    id: Date.now(),
    title: taskTitle,
    timeSpent: 0,
    estimatedTime: 60, // Default 1 hour estimation
    time: formatTime(0),
    estimate: formatTime(60),
    taskGroup: {
      name: 'T',
      color: 'bg-gray-500'
    },
    priority: 'medium',
    status: status,
    createdAt: customDate || now,
    updatedAt: now,
    completedAt: null,
    deadline: getNextMonday(),
    // Week tracking fields
    weekNumber: currentWeek.weekNumber,
    weekYear: currentWeek.year,
    assignedWeek: currentWeek.weekString,
    scheduledForToday: columnId === 'today',
    todayScheduledAt: columnId === 'today' ? now : null,
    subtasks: [],
    notes: '',
    completed: false
  };
};