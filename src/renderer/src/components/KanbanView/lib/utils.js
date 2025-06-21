import {
  calculateThisWeekProgress,
  calculateTodayProgress,
} from '../../../data/taskData';

export const getColumnProgress = (columns, columnId) => {
  if (!Array.isArray(columns)) return null;
  
  if (columnId === 'thisweek') {
    return calculateThisWeekProgress(columns);
  } else if (columnId === 'today') {
    return calculateTodayProgress(columns);
  }
  return null;
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

export const findContainer = (columns, id) => {
  if (columns.some(col => col.id === id)) {
    return id;
  }
  return columns.find(col => col.tasks.some(task => task.id === id))?.id;
};