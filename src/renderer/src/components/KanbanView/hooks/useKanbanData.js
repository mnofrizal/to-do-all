import { useState, useEffect } from 'react';
import { getDefaultTaskColumns, createNewTask, updateTaskToCurrentWeek, getCurrentWeek } from '../../../data/taskData';

export const useKanbanData = (selectedList) => {
  const [columns, setColumns] = useState(getDefaultTaskColumns());
  const [newTaskInputs, setNewTaskInputs] = useState({});

  useEffect(() => {
    if (selectedList) {
      const fetchTasks = async () => {
        const tasks = await window.db.getTasks(selectedList.id);
        const newColumns = getDefaultTaskColumns();
        
        tasks.forEach(task => {
          let targetColumnId = task.status;
          
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
          
          if (task.status === 'done') {
            targetColumnId = 'done';
          } else if (task.status === 'backlog') {
            targetColumnId = 'backlog';
          } else if (task.scheduledForToday === true && task.status !== 'done') {
            targetColumnId = 'today';
          } else if (task.status === 'inprogress') {
            const currentWeek = getCurrentWeek();
            if (task.assignedWeek === currentWeek.weekString) {
              targetColumnId = 'thisweek';
            } else {
              targetColumnId = 'backlog';
            }
          } else {
            targetColumnId = 'backlog';
          }
          
          const column = newColumns.find(c => c.id === targetColumnId);
          if (column) {
            column.tasks.push(task);
          }
        });
        
        newColumns.forEach(column => {
          column.tasks.sort((a, b) => (a.orderInColumn || 0) - (b.orderInColumn || 0));
        });
        
        setColumns(newColumns);
      };
      fetchTasks();
    }
  }, [selectedList]);

  const handleAddTask = async (columnId, taskTitle) => {
    if (!taskTitle.trim() || !selectedList) return;

    const currentColumn = columns.find(col => col.id === columnId);
    const orderInColumn = currentColumn ? currentColumn.tasks.length : 0;

    const newTaskData = {
      ...createNewTask(taskTitle, columnId, selectedList.id),
      orderInColumn
    };
    const newTask = await window.db.createTask(newTaskData);

    const newColumns = columns.map(col =>
      col.id === columnId
        ? { ...col, tasks: [...col.tasks, { ...newTask, orderInColumn }] }
        : col
    );
    
    setColumns(newColumns);
    setNewTaskInputs({ ...newTaskInputs, [columnId]: '' });
  };

  return {
    columns,
    setColumns,
    newTaskInputs,
    setNewTaskInputs,
    handleAddTask,
  };
};