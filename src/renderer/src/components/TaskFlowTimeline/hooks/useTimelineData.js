import { useState, useEffect, useMemo } from 'react';
import { getDefaultTaskColumns } from '../../../data/taskData';

export const useTimelineData = (selectedList) => {
  const [timelineNodes, setTimelineNodes] = useState([]);
  const [timelineEdges, setTimelineEdges] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    if (selectedList) {
      const fetchTimelineData = async () => {
        setLoading(true);
        setError(null);
        try {
          const tasks = await window.db.getTasks(selectedList.id);
          const nodes = await window.db.getTimelineNodes(selectedList.id);
          const edges = await window.db.getTimelineEdges(selectedList.id);
          
          setAllTasks(tasks);
          setTimelineEdges(edges);

          const nodesMap = new Map(nodes.map(node => [node.taskId, node]));
          const doneTasks = tasks
            .filter(task => task.status === 'done' && task.completedAt)
            .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

          for (const [index, task] of doneTasks.entries()) {
            if (!nodesMap.has(task.id)) {
              const newNode = await window.db.createTimelineNode({
                nodeId: `task-${task.id}-${Date.now()}`,
                type: 'customTask',
                positionX: 300,
                positionY: 100 + index * 150,
                listId: selectedList.id,
                taskId: task.id,
              });
              nodes.push(newNode);
              nodesMap.set(task.id, newNode);
            }
          }
          
          const populatedNodes = nodes
            .map(node => {
              const task = tasks.find(t => t.id === node.taskId);
              return task ? { ...node, task } : null;
            })
            .filter(Boolean)
            .sort((a, b) => new Date(a.task.completedAt) - new Date(b.task.completedAt));

          setTimelineNodes(populatedNodes);

        } catch (error) {
          console.error('Failed to fetch timeline data:', error);
          setError(error.message);
          setAllTasks([]);
          setTimelineNodes([]);
          setTimelineEdges([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchTimelineData();
    } else {
      setAllTasks([]);
      setTimelineNodes([]);
      setTimelineEdges([]);
    }
  }, [selectedList, refreshKey]);

  const columns = useMemo(() => {
    const defaultColumns = getDefaultTaskColumns();
    
    if (selectedList && allTasks.length > 0) {
      allTasks.forEach(task => {
        let targetColumnId = task.status;
        
        if (task.status === 'done') {
          targetColumnId = 'done';
        } else if (task.status === 'backlog') {
          targetColumnId = 'backlog';
        } else if (task.scheduledForToday === true && task.status !== 'done') {
          targetColumnId = 'today';
        } else if (task.status === 'inprogress') {
          targetColumnId = 'thisweek';
        } else {
          targetColumnId = 'backlog';
        }
        
        const column = defaultColumns.find(c => c.id === targetColumnId);
        if (column) {
          if (!column.tasksCleared) {
            column.tasks = [];
            column.tasksCleared = true;
          }
          column.tasks.push(task);
        }
      });
    }
    
    return defaultColumns;
  }, [selectedList, allTasks]);

  return { timelineNodes, timelineEdges, allTasks, columns, loading, error, setAllTasks, setTimelineNodes, setTimelineEdges, refreshData };
};