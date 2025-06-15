import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
  Zap,
  X,
  Clock,
  FileText,
  FileSpreadsheet,
  Presentation,
  StickyNote,
  Image,
  Music,
  Video,
  Archive,
  File,
  Paperclip,
  Group,
  Copy,
  Trash2,
  List,
  Plus,
  Check
} from 'lucide-react';
import { getDefaultTaskColumns } from '../data/taskData';

// Custom Node Component with refined UI
const CustomTaskNode = ({ data, selected }) => {
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-lg transition-all duration-200 dark:bg-zinc-800 ${
      selected ? 'border-blue-500 shadow-blue-200' : 'border-zinc-300 dark:border-zinc-600'
    } ${data.isFinished ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''} ${
      data.isDropTarget ? 'border-orange-400 shadow-orange-200 bg-orange-50 dark:bg-orange-900/20' : ''
    } ${data.isContextSelected ? 'border-purple-500 shadow-purple-200 bg-purple-50 dark:bg-purple-900/20' : ''}`}>
      {/* Top Handle for task flow */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!h-3 !w-3 !border-2 !border-white !bg-blue-500"
      />
      
      {/* Left Handle for attachments */}
      <Handle
        type="target"
        position={Position.Left}
        id="attachment-left"
        className="!h-2 !w-2 !border-2 !border-white !bg-orange-500"
        style={{ top: '50%' }}
      />
      
      {/* Right Handle for attachments */}
      <Handle
        type="source"
        position={Position.Right}
        id="attachment-right"
        className="!h-2 !w-2 !border-2 !border-white !bg-orange-500"
        style={{ top: '50%' }}
      />
      
      <div className="min-w-[200px] p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className={`${data.taskGroup?.color || 'bg-gray-400'} w-6 h-6 rounded text-xs font-bold text-white flex items-center justify-center`}>
            {data.taskGroup?.name || 'T'}
          </div>
          <div className="flex-1 truncate text-sm font-semibold text-foreground">{data.label}</div>
          {data.isFinished && (
            <div className="rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white">
              FINISH
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 text-xs">
          {data.estimate && (
            <span className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {data.estimate}
            </span>
          )}
          {data.priority && (
            <span className={`px-2 py-1 rounded ${
              data.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              data.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {data.priority}
            </span>
          )}
          {data.completedAt && (
            <span className="rounded bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900 dark:text-green-200">
              ✓ Done
            </span>
          )}
        </div>
      </div>
      
      {/* Bottom Handle for task flow - hide if finished */}
      {!data.isFinished && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!h-3 !w-3 !border-2 !border-white !bg-blue-500"
        />
      )}
    </div>
  );
};

// Custom Attachment Node Component
const CustomAttachmentNode = ({ data, selected, parentNode, ...nodeProps }) => {
  // Get the icon component based on the attachment type
  const getIconComponent = (iconName) => {
    const iconMap = {
      'FileText': FileText,
      'FileSpreadsheet': FileSpreadsheet,
      'Presentation': Presentation,
      'StickyNote': StickyNote,
      'Image': Image,
      'Music': Music,
      'Video': Video,
      'Archive': Archive,
      'File': File
    };
    return iconMap[iconName] || File;
  };
  
  const IconComponent = getIconComponent(data.iconName);
  // Check if attachment is inside a subflow - use parentNode from props or nodeProps
  const isInSubflow = !!(parentNode || nodeProps.parentNode);
  
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-lg transition-all duration-200 dark:bg-zinc-800 ${
      selected ? 'border-orange-500 shadow-orange-200' : 'border-orange-300 dark:border-orange-600'
    } ${isInSubflow ? 'shadow-sm' : ''} ${data.isContextSelected ? 'border-purple-500 shadow-purple-200 bg-purple-50 dark:bg-purple-900/20' : ''}`}>
      {/* Left Handle for attachment connections - only show if NOT in subflow */}
      {!isInSubflow && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2 !w-2 !border-2 !border-white !bg-orange-500"
        />
      )}
      
      <div className="min-w-[120px] p-3">
        <div className="flex items-center gap-2">
          <div className={`${data.color} h-6 w-6 rounded text-xs font-bold text-white flex items-center justify-center`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">{data.name}</div>
            <div className="text-xs text-muted-foreground">{data.extension}</div>
          </div>
        </div>
      </div>
      
      {/* Right Handle for attachment connections - only show if NOT in subflow */}
      {!isInSubflow && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2 !w-2 !border-2 !border-white !bg-orange-500"
        />
      )}
    </div>
  );
};

// Custom Subflow/Group Node Component for Attachment Containers
const CustomSubflowNode = ({ data, selected }) => {
  // Calculate dynamic size based on attachment count using the same logic
  const attachmentCount = data.attachmentCount || 0;
  const itemsPerRow = Math.ceil(attachmentCount / 2);
  const rows = attachmentCount > itemsPerRow ? 2 : 1;
  
  // Use the same calculations as the helper function
  const itemWidth = 130;
  const itemSpacing = 15;
  const paddingX = 25;
  const dynamicWidth = Math.max(350, paddingX * 2 + (itemsPerRow * itemWidth) + ((itemsPerRow - 1) * itemSpacing));
  
  const itemHeight = 75;
  const rowSpacing = 15;
  const paddingY = 50;
  const dynamicHeight = Math.max(180, paddingY * 2 + (rows * itemHeight) + ((rows - 1) * rowSpacing));
  
  return (
    <div
      className={`relative rounded-lg border-2 transition-all duration-300 ${
        selected ? 'border-purple-500 shadow-purple-200' : 'border-purple-300 dark:border-purple-600'
      }`}
      style={{
        backgroundColor: data.backgroundColor || 'rgba(196, 181, 253, 0.1)',
        width: dynamicWidth,
        height: dynamicHeight,
        padding: '16px',
        transition: 'width 0.3s ease, height 0.3s ease'
      }}
    >
      {/* Subflow Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
          {data.label || 'Attachments'}
        </div>
        <div className="text-xs text-purple-600 dark:text-purple-400">
          ({attachmentCount} items)
        </div>
      </div>
      
      {/* Connection Handle - Target for when connected to a task */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-white !bg-purple-500"
        style={{ top: '20px' }}
      />
      
      {/* Source Handle for standalone subflows - only show if not connected to a task */}
      {!data.taskId && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-white !bg-purple-500"
          style={{ top: '20px' }}
        />
      )}
    </div>
  );
};

function TaskFlowTimelineInner() {
  // Memoize nodeTypes to prevent recreation
  const nodeTypes = useMemo(() => ({
    customTask: CustomTaskNode,
    customAttachment: CustomAttachmentNode,
    customSubflow: CustomSubflowNode,
  }), []);
  const { getIntersectingNodes } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [showAttachmentList, setShowAttachmentList] = useState(false);
  const [showAttachmentSubmenu, setShowAttachmentSubmenu] = useState(false);
  
  // Helper function to calculate dynamic subflow dimensions and attachment positions
  const calculateSubflowLayout = (attachmentCount) => {
    // For 2 rows max, calculate how many items per row
    const itemsPerRow = Math.ceil(attachmentCount / 2);
    const rows = attachmentCount > itemsPerRow ? 2 : 1;
    
    // Width: padding + (items per row * item width + spacing between items)
    const itemWidth = 130;
    const itemSpacing = 15;
    const paddingX = 25;
    const dynamicWidth = Math.max(350, paddingX * 2 + (itemsPerRow * itemWidth) + ((itemsPerRow - 1) * itemSpacing));
    
    // Height: padding + (rows * item height + spacing between rows)
    const itemHeight = 75;
    const rowSpacing = 15;
    const paddingY = 50;
    const dynamicHeight = Math.max(180, paddingY * 2 + (rows * itemHeight) + ((rows - 1) * rowSpacing));
    
    return {
      width: dynamicWidth,
      height: dynamicHeight,
      itemsPerRow,
      rows,
      itemWidth,
      itemHeight,
      itemSpacing,
      rowSpacing,
      paddingX,
      paddingY
    };
  };
  
  // Helper function to get attachment position within subflow
  const getAttachmentPositionInSubflow = (index, attachmentCount) => {
    const { itemsPerRow, itemWidth, itemHeight, itemSpacing, rowSpacing, paddingX, paddingY } = calculateSubflowLayout(attachmentCount);
    
    // Calculate row and column for this index
    const rowIndex = Math.floor(index / itemsPerRow);
    const colIndex = index % itemsPerRow;
    
    return {
      x: paddingX + (colIndex * (itemWidth + itemSpacing)),
      y: paddingY + (rowIndex * (itemHeight + rowSpacing))
    };
  };
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeId, setNodeId] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasksInNodes, setTasksInNodes] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set(['tasks']));
  const [draggedAttachment, setDraggedAttachment] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [hoveredTaskNode, setHoveredTaskNode] = useState(null);
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);
  
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      // Clear context highlighting when menu closes
      setNodes(currentNodes =>
        currentNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isContextSelected: false
          }
        }))
      );
    };
    
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu, setNodes]);

  // Attachment library data
  const attachmentTypes = [
    { id: 'word', name: 'Word', icon: FileText, iconName: 'FileText', color: 'bg-blue-500', extension: '.docx' },
    { id: 'excel', name: 'Excel', icon: FileSpreadsheet, iconName: 'FileSpreadsheet', color: 'bg-green-500', extension: '.xlsx' },
    { id: 'powerpoint', name: 'PowerPoint', icon: Presentation, iconName: 'Presentation', color: 'bg-orange-500', extension: '.pptx' },
    { id: 'notes', name: 'Notes', icon: StickyNote, iconName: 'StickyNote', color: 'bg-yellow-500', extension: '.txt' },
    { id: 'image', name: 'Image', icon: Image, iconName: 'Image', color: 'bg-purple-500', extension: '.jpg' },
    { id: 'audio', name: 'Audio', icon: Music, iconName: 'Music', color: 'bg-pink-500', extension: '.mp3' },
    { id: 'video', name: 'Video', icon: Video, iconName: 'Video', color: 'bg-red-500', extension: '.mp4' },
    { id: 'archive', name: 'Archive', icon: Archive, iconName: 'Archive', color: 'bg-gray-500', extension: '.zip' },
    { id: 'generic', name: 'File', icon: File, iconName: 'File', color: 'bg-slate-500', extension: '.file' },
  ];

  // Get all tasks grouped by column
  const columns = getDefaultTaskColumns();
  const filteredColumns = columns.map(col => ({
    ...col,
    tasks: col.tasks.filter(task =>
      task.title.toLowerCase().includes(search.toLowerCase())
    ),
  }));

  // Initialize nodes from done tasks, ordered by completedAt
  useEffect(() => {
    const doneColumn = columns.find(col => col.id === 'done');
    if (doneColumn && doneColumn.tasks.length > 0) {
      // Sort done tasks by completedAt (oldest first for timeline order)
      const sortedDoneTasks = [...doneColumn.tasks].sort((a, b) =>
        new Date(a.completedAt) - new Date(b.completedAt)
      );
      
      const initialNodes = sortedDoneTasks.map((task, index) => ({
        id: String(index + 1),
        type: 'customTask',
        data: {
          label: task.title,
          taskGroup: task.taskGroup,
          estimate: task.estimate,
          priority: task.priority,
          completedAt: task.completedAt,
          taskId: task.id,
          isFinished: false
        },
        position: { x: 300, y: 100 + index * 150 },
      }));

      const initialEdges = [];
      // Auto-connect done tasks in sequence
      for (let i = 0; i < initialNodes.length - 1; i++) {
        initialEdges.push({
          id: `e${i + 1}-${i + 2}`,
          source: String(i + 1),
          target: String(i + 2),
          sourceHandle: 'bottom', // Explicitly use bottom handle
          targetHandle: 'top', // Explicitly use top handle
          type: 'straight', // Use straight line instead of default curved
          style: { stroke: '#3b82f6', strokeWidth: 2 }, // Blue for task flow
          animated: false
        });
      }

      setNodes(initialNodes);
      setEdges(initialEdges);
      setNodeId(initialNodes.length + 1);
      
      // Track which tasks are already in nodes
      const taskIds = new Set(sortedDoneTasks.map(task => task.id));
      setTasksInNodes(taskIds);
    }
  }, []);

  const onConnect = useCallback(
    (params) => {
      // Get source and target nodes to determine connection type
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      // Handle standalone subflow connection (both directions)
      if ((sourceNode && sourceNode.type === 'customSubflow' && !sourceNode.data.taskId &&
           targetNode && targetNode.type === 'customTask') ||
          (sourceNode && sourceNode.type === 'customTask' &&
           targetNode && targetNode.type === 'customSubflow' && !targetNode.data.taskId)) {
        
        // Determine which is the task and which is the subflow
        const taskNode = sourceNode.type === 'customTask' ? sourceNode : targetNode;
        const subflowNode = sourceNode.type === 'customSubflow' ? sourceNode : targetNode;
        
        // Update the subflow to be connected to the task
        setNodes((currentNodes) =>
          currentNodes.map(node =>
            node.id === subflowNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    taskId: taskNode.id,
                    label: `${taskNode.data.label} Attachments`
                  },
                  position: {
                    x: taskNode.position.x + 280,
                    y: taskNode.position.y - 20,
                  }
                }
              : node
          )
        );
        
        // Determine if task is active (not done) - check if task is finished or completed
        const isActiveTask = !taskNode.data.isFinished && !taskNode.data.completedAt;
        
        // Create the connection with proper styling (always task -> subflow)
        setEdges((eds) => addEdge({
          id: `subflow-${taskNode.id}-${subflowNode.id}`,
          source: taskNode.id,
          target: subflowNode.id,
          sourceHandle: 'attachment-right',
          targetHandle: null,
          type: 'default',
          style: { stroke: '#8b5cf6', strokeWidth: 2 }, // Purple for subflow connections
          animated: isActiveTask // Animate if task is active (not done)
        }, eds));
        
        return;
      }
      
      // Check if this is an attachment connection (involving attachment nodes or attachment handles)
      const isAttachmentConnection =
        (sourceNode && sourceNode.type === 'customAttachment') ||
        (targetNode && targetNode.type === 'customAttachment') ||
        params.sourceHandle === 'attachment-right' ||
        params.targetHandle === 'attachment-left';
      
      // Check if this is a task flow connection (blue handles)
      const isTaskFlowConnection =
        params.sourceHandle === 'bottom' ||
        params.targetHandle === 'top';
      
      // Prevent invalid connections:
      // 1. Orange handles (attachment) should not connect to blue handles (task flow)
      // 2. Blue handles (task flow) should not connect to orange handles (attachment)
      const isInvalidConnection =
        (params.sourceHandle === 'attachment-right' && (params.targetHandle === 'top' || !params.targetHandle)) ||
        (params.sourceHandle === 'bottom' && params.targetHandle === 'attachment-left') ||
        (params.targetHandle === 'attachment-left' && (params.sourceHandle === 'bottom' || !params.sourceHandle)) ||
        (params.targetHandle === 'top' && params.sourceHandle === 'attachment-right');
      
      // Block invalid connections
      if (isInvalidConnection) {
        return;
      }
      
      const edgeStyle = isAttachmentConnection ?
        { stroke: '#f97316', strokeWidth: 2 } : // Orange for attachments
        { stroke: '#3b82f6', strokeWidth: 2 };  // Blue for task flow
      
      const edgeType = isAttachmentConnection ? 'default' : 'straight'; // Straight lines for task flow
      
      // Determine if connection should be animated (for active tasks)
      let shouldAnimate = false;
      if (isAttachmentConnection && sourceNode && sourceNode.type === 'customTask') {
        // Animate attachment connections from active tasks
        shouldAnimate = !sourceNode.data.isFinished && !sourceNode.data.completedAt;
      } else if (!isAttachmentConnection && sourceNode && targetNode &&
                 sourceNode.type === 'customTask' && targetNode.type === 'customTask') {
        // Animate task flow connections if either task is active
        shouldAnimate = (!sourceNode.data.isFinished && !sourceNode.data.completedAt) ||
                       (!targetNode.data.isFinished && !targetNode.data.completedAt);
      }
      
      // For task connections, ensure we use the correct handles
      let connectionParams = { ...params };
      if (!isAttachmentConnection && sourceNode && targetNode &&
          sourceNode.type === 'customTask' && targetNode.type === 'customTask') {
        connectionParams.sourceHandle = 'bottom';
        connectionParams.targetHandle = 'top';
      }
      
      setEdges((eds) => addEdge({
        ...connectionParams,
        type: edgeType,
        style: edgeStyle,
        animated: shouldAnimate
      }, eds));
    },
    [setEdges, nodes, setNodes]
  );

  // Drag-and-drop logic with improved coordinate calculation
  const onDragStart = (event, task) => {
    // Don't allow dragging if task is already in nodes
    if (tasksInNodes.has(task.id)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/reactflow', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedTask(task);
  };

  // Task drag end
  const onTaskDragEnd = () => {
    setDraggedTask(null);
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      // Check for task data
      const taskData = event.dataTransfer.getData('application/reactflow');
      const attachmentData = event.dataTransfer.getData('application/attachment');
      
      if (!taskData && !attachmentData) return;

      // Calculate drop position using modern API
      let position = { x: 0, y: 0 };
      
      if (reactFlowInstance.current) {
        position = reactFlowInstance.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        // Fallback if ReactFlow instance not available
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 50,
        };
      }

      if (taskData) {
        // Handle task drop
        const task = JSON.parse(taskData);
        if (tasksInNodes.has(task.id)) return;

        const newNode = {
          id: String(nodeId),
          type: 'customTask',
          data: {
            label: task.title,
            taskGroup: task.taskGroup,
            estimate: task.estimate,
            priority: task.priority,
            completedAt: task.completedAt,
            taskId: task.id,
            isFinished: false
          },
          position,
        };
        
        setNodes((nds) => [...nds, newNode]);
        setNodeId((id) => id + 1);
        setTasksInNodes(prev => new Set([...prev, task.id]));
      } else if (attachmentData) {
        // Handle attachment drop with subflow creation
        const attachment = JSON.parse(attachmentData);
        
        // Find the closest task node within connection range (200px)
        const connectionRange = 200;
        let closestTaskNode = null;
        let minDistance = connectionRange;
        
        nodes.forEach(node => {
          if (node.type === 'customTask') {
            // Calculate distance from drop position to center of task node
            const nodeCenterX = node.position.x + 100;
            const nodeCenterY = node.position.y + 50;
            
            const distance = Math.sqrt(
              Math.pow(position.x - nodeCenterX, 2) +
              Math.pow(position.y - nodeCenterY, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closestTaskNode = node;
            }
          }
        });
        
        if (closestTaskNode) {
          // Count existing attachments connected to this task
          const existingAttachments = edges.filter(edge =>
            edge.source === closestTaskNode.id && edge.sourceHandle === 'attachment-right'
          ).length;
          
          const existingSubflow = nodes.find(node =>
            node.type === 'customSubflow' && node.data.taskId === closestTaskNode.id
          );
          
          // Check if we need to create/use subflow (2+ attachments) or use basic connection (1 attachment)
          if (existingAttachments === 0) {
            // First attachment - use basic line connection
            const attachmentPosition = {
              x: closestTaskNode.position.x + 280,
              y: closestTaskNode.position.y,
            };
            
            const newAttachmentNode = {
              id: String(nodeId),
              type: 'customAttachment',
              data: {
                name: attachment.name,
                extension: attachment.extension,
                iconName: attachment.iconName,
                color: attachment.color,
                attachmentId: attachment.id
              },
              position: attachmentPosition,
            };
            
            setNodes((nds) => [...nds, newAttachmentNode]);
            
            // Create basic line connection
            const newEdge = {
              id: `attachment-${closestTaskNode.id}-${nodeId}`,
              source: closestTaskNode.id,
              target: String(nodeId),
              sourceHandle: 'attachment-right',
              targetHandle: null,
              type: 'default',
              style: { stroke: '#f97316', strokeWidth: 2 }, // Orange for basic connections
              animated: false
            };
            
            setEdges((eds) => [...eds, newEdge]);
            setNodeId((id) => id + 1);
            
          } else if (existingAttachments === 1 && !existingSubflow) {
            // Second attachment - convert to subflow system
            // Find the existing single attachment
            const existingAttachmentEdge = edges.find(edge =>
              edge.source === closestTaskNode.id && edge.sourceHandle === 'attachment-right'
            );
            const existingAttachmentNode = nodes.find(node =>
              node.id === existingAttachmentEdge?.target
            );
            
            if (existingAttachmentNode) {
              // Create subflow with dynamic sizing
              const subflowId = String(nodeId);
              const { width, height } = calculateSubflowLayout(2);
              
              const newSubflowNode = {
                id: subflowId,
                type: 'customSubflow',
                data: {
                  label: `${closestTaskNode.data.label} Attachments`,
                  taskId: closestTaskNode.id,
                  attachmentCount: 2,
                  backgroundColor: 'rgba(196, 181, 253, 0.15)',
                },
                position: {
                  x: closestTaskNode.position.x + 280,
                  y: closestTaskNode.position.y - 20,
                },
                style: { width, height }
              };
              
              // Move existing attachment into subflow
              const updatedExistingAttachment = {
                ...existingAttachmentNode,
                position: getAttachmentPositionInSubflow(0, 2), // First position
                parentNode: subflowId,
                extent: 'parent'
              };
              
              // Create new attachment in subflow
              const newAttachmentNode = {
                id: String(nodeId + 1),
                type: 'customAttachment',
                data: {
                  name: attachment.name,
                  extension: attachment.extension,
                  iconName: attachment.iconName,
                  color: attachment.color,
                  attachmentId: attachment.id
                },
                position: getAttachmentPositionInSubflow(1, 2), // Second position
                parentNode: subflowId,
                extent: 'parent'
              };
              
              // Update nodes
              setNodes(currentNodes => [
                ...currentNodes.filter(n => n.id !== existingAttachmentNode.id),
                newSubflowNode,
                updatedExistingAttachment,
                newAttachmentNode
              ]);
              
              // Update edges - remove old connection, add subflow connection
              setEdges(currentEdges => [
                ...currentEdges.filter(e => e.id !== existingAttachmentEdge.id),
                {
                  id: `subflow-${closestTaskNode.id}-${subflowId}`,
                  source: closestTaskNode.id,
                  target: subflowId,
                  sourceHandle: 'attachment-right',
                  targetHandle: null,
                  type: 'default',
                  style: { stroke: '#8b5cf6', strokeWidth: 2 },
                  animated: false
                }
              ]);
              
              setNodeId((id) => id + 2);
            }
            
          } else if (existingSubflow) {
            // Add to existing subflow (3+ attachments)
            const currentAttachments = nodes.filter(node =>
              node.parentNode === existingSubflow.id && node.type === 'customAttachment'
            );
            
            const newAttachmentCount = currentAttachments.length + 1;
            const { width, height } = calculateSubflowLayout(newAttachmentCount);
            
            const newAttachmentNode = {
              id: String(nodeId),
              type: 'customAttachment',
              data: {
                name: attachment.name,
                extension: attachment.extension,
                iconName: attachment.iconName,
                color: attachment.color,
                attachmentId: attachment.id
              },
              position: getAttachmentPositionInSubflow(currentAttachments.length, newAttachmentCount),
              parentNode: existingSubflow.id,
              extent: 'parent'
            };
            
            // Recalculate positions for ALL attachments in the subflow
            const updatedAttachments = currentAttachments.map((attachment, index) => ({
              ...attachment,
              position: getAttachmentPositionInSubflow(index, newAttachmentCount)
            }));
            
            setNodes((nds) => [
              // Keep all nodes except the ones we're updating
              ...nds.filter(node =>
                node.id !== existingSubflow.id &&
                !currentAttachments.some(att => att.id === node.id)
              ),
              // Update subflow with new size and count
              {
                ...existingSubflow,
                data: { ...existingSubflow.data, attachmentCount: newAttachmentCount },
                style: { width, height }
              },
              // Add all updated existing attachments
              ...updatedAttachments,
              // Add new attachment
              newAttachmentNode
            ]);
            
            setNodeId((id) => id + 1);
          }
        } else {
          // Create standalone attachment (no subflow)
          const newAttachmentNode = {
            id: String(nodeId),
            type: 'customAttachment',
            data: {
              name: attachment.name,
              extension: attachment.extension,
              iconName: attachment.iconName,
              color: attachment.color,
              attachmentId: attachment.id
            },
            position,
          };
          
          setNodes((nds) => [...nds, newAttachmentNode]);
          setNodeId((id) => id + 1);
        }
      }
      
      // Clear highlighting after drop
      setDraggedAttachment(null);
      setDraggedTask(null);
      setHoveredTaskNode(null);
      setNodes(currentNodes =>
        currentNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isDropTarget: false
          }
        }))
      );
    },
    [nodeId, setNodes, setEdges, tasksInNodes, nodes]
  );

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Check if dragging an attachment by looking at data transfer types
    const isDraggingAttachment = event.dataTransfer.types.includes('application/attachment');
    
    // Only highlight if dragging an attachment
    if (isDraggingAttachment && reactFlowInstance.current) {
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Find the closest task node within connection range
      const connectionRange = 200;
      let closestTaskNode = null;
      let minDistance = connectionRange;
      
      nodes.forEach(node => {
        if (node.type === 'customTask') {
          // Calculate distance from cursor position to center of task node
          const nodeCenterX = node.position.x + 100; // Node center
          const nodeCenterY = node.position.y + 50;  // Node center
          
          const distance = Math.sqrt(
            Math.pow(position.x - nodeCenterX, 2) +
            Math.pow(position.y - nodeCenterY, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestTaskNode = node;
          }
        }
      });
      
      // Update hovered task node
      const newHoveredId = closestTaskNode ? closestTaskNode.id : null;
      if (newHoveredId !== hoveredTaskNode) {
        setHoveredTaskNode(newHoveredId);
        
        // Update nodes to show drop target highlighting
        setNodes(currentNodes =>
          currentNodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isDropTarget: node.id === newHoveredId
            }
          }))
        );
      }
    } else if (!isDraggingAttachment) {
      // Clear highlighting if not dragging attachment
      if (hoveredTaskNode) {
        setHoveredTaskNode(null);
        setNodes(currentNodes =>
          currentNodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isDropTarget: false
            }
          }))
        );
      }
    }
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSidebarOpen(true);
  }, []);

  // Handle right-click context menu on nodes
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    
    // Highlight the selected node
    setNodes(currentNodes =>
      currentNodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          isContextSelected: n.id === node.id
        }
      }))
    );
    
    const pane = reactFlowWrapper.current.getBoundingClientRect();
    setContextMenu({
      id: node.id,
      type: node.type,
      data: node.data,
      x: event.clientX - pane.left,
      y: event.clientY - pane.top,
    });
  }, [setNodes]);

  // Handle right-click context menu on pane (empty area)
  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    
    const pane = reactFlowWrapper.current.getBoundingClientRect();
    
    // Store both screen coordinates (for menu positioning) and flow coordinates (for attachment placement)
    let flowPosition = { x: 0, y: 0 };
    if (reactFlowInstance.current) {
      flowPosition = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
    }
    
    setContextMenu({
      type: 'pane',
      x: event.clientX - pane.left,
      y: event.clientY - pane.top,
      flowX: flowPosition.x,
      flowY: flowPosition.y,
    });
  }, []);

  // Handle disconnect functionality
  const handleDisconnect = useCallback((nodeId) => {
    setEdges(currentEdges =>
      currentEdges.filter(edge =>
        edge.source !== nodeId && edge.target !== nodeId
      )
    );
    setContextMenu(null);
    // Clear context highlighting
    setNodes(currentNodes =>
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isContextSelected: false
        }
      }))
    );
  }, [setEdges, setNodes]);

  // Handle context menu actions
  const handleContextMenuAction = useCallback((action, nodeId, position) => {
    if (action === 'showAttachments') {
      setShowAttachmentList(true);
      setContextMenu(null);
      // Clear context highlighting
      setNodes(currentNodes =>
        currentNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isContextSelected: false
          }
        }))
      );
      return;
    }

    if (action === 'addAttachment') {
      setShowAttachmentSubmenu(true);
      return;
    }

    if (action === 'disconnect') {
      handleDisconnect(nodeId);
      return;
    }

    if (action === 'markAsFinish') {
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type === 'customTask') {
        const newFinishedState = !node.data.isFinished;
        
        setNodes(currentNodes =>
          currentNodes.map(n =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, isFinished: newFinishedState } }
              : n
          )
        );
        
        // Update edge animations based on new task status
        setEdges(currentEdges =>
          currentEdges.map(edge => {
            // Update edges where this task is the source
            if (edge.source === nodeId) {
              const shouldAnimate = !newFinishedState && !node.data.completedAt;
              return { ...edge, animated: shouldAnimate };
            }
            // Update edges where this task is the target (for task flow connections)
            if (edge.target === nodeId && edge.sourceHandle === 'bottom') {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const shouldAnimate = (sourceNode && !sourceNode.data.isFinished && !sourceNode.data.completedAt) ||
                                   (!newFinishedState && !node.data.completedAt);
              return { ...edge, animated: shouldAnimate };
            }
            return edge;
          })
        );
      }
      setContextMenu(null);
      // Clear context highlighting
      setNodes(currentNodes =>
        currentNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isContextSelected: false
          }
        }))
      );
      return;
    }

    if (action.startsWith('addAttachment:')) {
      const attachmentType = action.split(':')[1];
      const attachment = attachmentTypes.find(a => a.id === attachmentType);
      if (attachment) {
        // Use flow coordinates from context menu for proper positioning
        const flowPosition = position || (contextMenu.flowX !== undefined ? { x: contextMenu.flowX, y: contextMenu.flowY } : null);
        handleAddAttachment(attachment, nodeId, flowPosition);
      }
      setContextMenu(null);
      setShowAttachmentSubmenu(false);
      // Clear context highlighting
      setNodes(currentNodes =>
        currentNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isContextSelected: false
          }
        }))
      );
      return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    switch (action) {
      case 'duplicate':
        if (node.type === 'customAttachment') {
          // Create a duplicate attachment
          const newAttachmentNode = {
            id: String(nodeId + Date.now()), // Unique ID
            type: 'customAttachment',
            data: {
              ...node.data,
              name: `${node.data.name} (Copy)`,
            },
            position: {
              x: node.position.x + 150, // Offset position
              y: node.position.y + 20,
            },
            parentNode: node.parentNode,
            extent: node.extent
          };
          
          setNodes((nds) => [...nds, newAttachmentNode]);
          setNodeId((id) => id + 1);
        }
        break;
        
      case 'delete':
        if (node.type === 'customTask') {
          // Find any subflow connected to this task
          const connectedSubflow = nodes.find(n =>
            n.type === 'customSubflow' && n.data.taskId === nodeId
          );
          
          if (connectedSubflow) {
            // Update subflow to be standalone (remove taskId reference)
            // and add handles so it can be reconnected
            setNodes((nds) => nds.map(n => {
              if (n.id === connectedSubflow.id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    taskId: null, // Remove task reference
                    label: 'Standalone Attachments' // Update label
                  }
                };
              }
              return n;
            }).filter(n => n.id !== nodeId)); // Remove only the task
            
            // Remove only edges connected to the deleted task
            setEdges((eds) => eds.filter((e) =>
              e.source !== nodeId && e.target !== nodeId
            ));
          } else {
            // Handle task with basic attachment connections
            // Convert directly connected attachments to standalone
            const directlyConnectedAttachments = edges
              .filter(edge => edge.source === nodeId && edge.sourceHandle === 'attachment-right')
              .map(edge => nodes.find(n => n.id === edge.target))
              .filter(Boolean);
            
            // Remove only the task, keep attachments as standalone
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            
            // Remove only edges connected to the deleted task
            setEdges((eds) => eds.filter((e) =>
              e.source !== nodeId && e.target !== nodeId
            ));
          }
          
          // Remove from tasksInNodes set to make it available in library again
          if (node.data.taskId) {
            setTasksInNodes(prev => {
              const newSet = new Set(prev);
              newSet.delete(node.data.taskId);
              return newSet;
            });
          }
        } else if (node.type === 'customAttachment') {
          // Delete attachment
          setNodes((nds) => nds.filter((n) => n.id !== nodeId));
          setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
          
          // If this attachment was in a subflow, we need to handle subflow reorganization
          if (node.parentNode) {
            const subflowNode = nodes.find(n => n.id === node.parentNode);
            if (subflowNode) {
              const remainingAttachments = nodes.filter(n =>
                n.parentNode === node.parentNode &&
                n.type === 'customAttachment' &&
                n.id !== nodeId
              );
              
              if (remainingAttachments.length === 1) {
                // Convert back to basic connection if only one attachment remains
                const lastAttachment = remainingAttachments[0];
                const taskNode = nodes.find(n => n.data.taskId && subflowNode.data.taskId === n.id);
                
                if (taskNode && lastAttachment) {
                  // Remove subflow and move attachment out
                  setNodes((currentNodes) => [
                    ...currentNodes.filter(n =>
                      n.id !== nodeId &&
                      n.id !== subflowNode.id &&
                      n.id !== lastAttachment.id
                    ),
                    {
                      ...lastAttachment,
                      position: {
                        x: taskNode.position.x + 280,
                        y: taskNode.position.y
                      },
                      parentNode: undefined,
                      extent: undefined
                    }
                  ]);
                  
                  // Update edges - remove subflow connection, add basic connection
                  setEdges((currentEdges) => [
                    ...currentEdges.filter(e =>
                      e.target !== subflowNode.id &&
                      e.source !== subflowNode.id
                    ),
                    {
                      id: `attachment-${taskNode.id}-${lastAttachment.id}`,
                      source: taskNode.id,
                      target: lastAttachment.id,
                      sourceHandle: 'attachment-right',
                      targetHandle: null,
                      type: 'default',
                      style: { stroke: '#f97316', strokeWidth: 2 },
                      animated: false
                    }
                  ]);
                }
              } else if (remainingAttachments.length > 1) {
                // Reorganize remaining attachments in subflow
                const newAttachmentCount = remainingAttachments.length;
                const { width, height } = calculateSubflowLayout(newAttachmentCount);
                
                const updatedAttachments = remainingAttachments.map((attachment, index) => ({
                  ...attachment,
                  position: getAttachmentPositionInSubflow(index, newAttachmentCount)
                }));
                
                setNodes((currentNodes) => [
                  ...currentNodes.filter(n =>
                    n.id !== nodeId &&
                    n.id !== subflowNode.id &&
                    !remainingAttachments.some(att => att.id === n.id)
                  ),
                  {
                    ...subflowNode,
                    data: { ...subflowNode.data, attachmentCount: newAttachmentCount },
                    style: { width, height }
                  },
                  ...updatedAttachments
                ]);
              }
            }
          }
        }
        break;
    }
    
    setContextMenu(null);
    // Clear context highlighting
    setNodes(currentNodes =>
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isContextSelected: false
        }
      }))
    );
  }, [nodes, setNodes, setEdges, setTasksInNodes, setNodeId, calculateSubflowLayout, getAttachmentPositionInSubflow]);

  // Handle adding attachment
  const handleAddAttachment = useCallback((attachment, taskNodeId, position) => {
    const newNodeId = nodeId;
    
    if (taskNodeId) {
      // Adding to specific task
      const taskNode = nodes.find(n => n.id === taskNodeId);
      if (!taskNode) return;

      // Count existing attachments connected to this task
      const existingAttachments = edges.filter(edge =>
        edge.source === taskNode.id && edge.sourceHandle === 'attachment-right'
      ).length;
      
      const existingSubflow = nodes.find(node =>
        node.type === 'customSubflow' && node.data.taskId === taskNode.id
      );

      if (existingAttachments === 0) {
        // First attachment - use basic line connection
        const attachmentPosition = {
          x: taskNode.position.x + 280,
          y: taskNode.position.y,
        };
        
        const newAttachmentNode = {
          id: String(newNodeId),
          type: 'customAttachment',
          data: {
            name: attachment.name,
            extension: attachment.extension,
            iconName: attachment.iconName,
            color: attachment.color,
            attachmentId: `${attachment.id}-${Date.now()}`
          },
          position: attachmentPosition,
        };
        
        setNodes((nds) => [...nds, newAttachmentNode]);
        
        // Create basic line connection
        const newEdge = {
          id: `attachment-${taskNode.id}-${newNodeId}`,
          source: taskNode.id,
          target: String(newNodeId),
          sourceHandle: 'attachment-right',
          targetHandle: null,
          type: 'default',
          style: { stroke: '#f97316', strokeWidth: 2 },
          animated: false
        };
        
        setEdges((eds) => [...eds, newEdge]);
        setNodeId((id) => id + 1);
        
      } else if (existingAttachments === 1 && !existingSubflow) {
        // Second attachment - convert to subflow system
        const existingAttachmentEdge = edges.find(edge =>
          edge.source === taskNode.id && edge.sourceHandle === 'attachment-right'
        );
        const existingAttachmentNode = nodes.find(node =>
          node.id === existingAttachmentEdge?.target
        );
        
        if (existingAttachmentNode) {
          const subflowId = String(newNodeId);
          const { width, height } = calculateSubflowLayout(2);
          
          const newSubflowNode = {
            id: subflowId,
            type: 'customSubflow',
            data: {
              label: `${taskNode.data.label} Attachments`,
              taskId: taskNode.id,
              attachmentCount: 2,
              backgroundColor: 'rgba(196, 181, 253, 0.15)',
            },
            position: {
              x: taskNode.position.x + 280,
              y: taskNode.position.y - 20,
            },
            style: { width, height }
          };
          
          // Move existing attachment into subflow
          const updatedExistingAttachment = {
            ...existingAttachmentNode,
            position: getAttachmentPositionInSubflow(0, 2),
            parentNode: subflowId,
            extent: 'parent'
          };
          
          // Create new attachment in subflow
          const newAttachmentNode = {
            id: String(newNodeId + 1),
            type: 'customAttachment',
            data: {
              name: attachment.name,
              extension: attachment.extension,
              iconName: attachment.iconName,
              color: attachment.color,
              attachmentId: `${attachment.id}-${Date.now()}`
            },
            position: getAttachmentPositionInSubflow(1, 2),
            parentNode: subflowId,
            extent: 'parent'
          };
          
          // Update nodes
          setNodes(currentNodes => [
            ...currentNodes.filter(n => n.id !== existingAttachmentNode.id),
            newSubflowNode,
            updatedExistingAttachment,
            newAttachmentNode
          ]);
          
          // Update edges
          setEdges(currentEdges => [
            ...currentEdges.filter(e => e.id !== existingAttachmentEdge.id),
            {
              id: `subflow-${taskNode.id}-${subflowId}`,
              source: taskNode.id,
              target: subflowId,
              sourceHandle: 'attachment-right',
              targetHandle: null,
              type: 'default',
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
              animated: false
            }
          ]);
          
          setNodeId((id) => id + 2);
        }
        
      } else if (existingSubflow) {
        // Add to existing subflow
        const currentAttachments = nodes.filter(node =>
          node.parentNode === existingSubflow.id && node.type === 'customAttachment'
        );
        
        const newAttachmentCount = currentAttachments.length + 1;
        const { width, height } = calculateSubflowLayout(newAttachmentCount);
        
        const newAttachmentNode = {
          id: String(newNodeId),
          type: 'customAttachment',
          data: {
            name: attachment.name,
            extension: attachment.extension,
            iconName: attachment.iconName,
            color: attachment.color,
            attachmentId: `${attachment.id}-${Date.now()}`
          },
          position: getAttachmentPositionInSubflow(currentAttachments.length, newAttachmentCount),
          parentNode: existingSubflow.id,
          extent: 'parent'
        };
        
        // Recalculate positions for ALL attachments in the subflow
        const updatedAttachments = currentAttachments.map((attachment, index) => ({
          ...attachment,
          position: getAttachmentPositionInSubflow(index, newAttachmentCount)
        }));
        
        setNodes((nds) => [
          ...nds.filter(node =>
            node.id !== existingSubflow.id &&
            !currentAttachments.some(att => att.id === node.id)
          ),
          {
            ...existingSubflow,
            data: { ...existingSubflow.data, attachmentCount: newAttachmentCount },
            style: { width, height }
          },
          ...updatedAttachments,
          newAttachmentNode
        ]);
        
        setNodeId((id) => id + 1);
      }
    } else {
      // Adding to empty area - position should already be in flow coordinates
      const flowPosition = position || { x: 100, y: 100 }; // fallback position
      
      const newAttachmentNode = {
        id: String(newNodeId),
        type: 'customAttachment',
        data: {
          name: attachment.name,
          extension: attachment.extension,
          iconName: attachment.iconName,
          color: attachment.color,
          attachmentId: `${attachment.id}-${Date.now()}`
        },
        position: flowPosition,
      };
      
      setNodes((nds) => [...nds, newAttachmentNode]);
      setNodeId((id) => id + 1);
    }
  }, [nodeId, nodes, edges, setNodes, setEdges, setNodeId, calculateSubflowLayout, getAttachmentPositionInSubflow, reactFlowInstance]);

  const handleMakeFinish = () => {
    if (selectedNode) {
      const newFinishedState = !selectedNode.data.isFinished;
      
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? { ...n, data: { ...n.data, isFinished: newFinishedState } }
            : n
        )
      );
      
      // Update edge animations based on new task status
      setEdges(currentEdges =>
        currentEdges.map(edge => {
          // Update edges where this task is the source
          if (edge.source === selectedNode.id) {
            const shouldAnimate = !newFinishedState && !selectedNode.data.completedAt;
            return { ...edge, animated: shouldAnimate };
          }
          // Update edges where this task is the target (for task flow connections)
          if (edge.target === selectedNode.id && edge.sourceHandle === 'bottom') {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const shouldAnimate = (sourceNode && !sourceNode.data.isFinished && !sourceNode.data.completedAt) ||
                                 (!newFinishedState && !selectedNode.data.completedAt);
            return { ...edge, animated: shouldAnimate };
          }
          return edge;
        })
      );
    }
  };

  const handleNodeDelete = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      // Remove from tasksInNodes set
      if (selectedNode.data.taskId) {
        setTasksInNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedNode.data.taskId);
          return newSet;
        });
      }
      setSelectedNode(null);
      setSidebarOpen(false);
    }
  };

  const handleSidebarClose = () => {
    setSelectedNode(null);
    setSidebarOpen(false);
  };

  const onInit = (instance) => {
    reactFlowInstance.current = instance;
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Attachment drag start
  const onAttachmentDragStart = (event, attachment) => {
    event.dataTransfer.setData('application/attachment', JSON.stringify(attachment));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedAttachment(attachment);
  };

  // Attachment drag end
  const onAttachmentDragEnd = () => {
    setDraggedAttachment(null);
    setHoveredTaskNode(null);
    // Clear all highlighting
    setNodes(currentNodes =>
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isDropTarget: false
        }
      }))
    );
  };

  // Handle node drag for intersection-based connection with subflows
  const onNodeDrag = useCallback((_, draggedNode) => {
    const intersections = getIntersectingNodes(draggedNode);
    
    // Filter for valid attachment-task intersections (only standalone attachments can be moved)
    const validIntersections = intersections.filter(intersectingNode =>
      (draggedNode.type === 'customAttachment' && !draggedNode.parentNode && intersectingNode.type === 'customTask') ||
      (draggedNode.type === 'customTask' && intersectingNode.type === 'customAttachment' && !intersectingNode.parentNode)
    );

    // Update node highlighting for intersections
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isDropTarget: validIntersections.some(intersection => intersection.id === node.id)
        }
      }))
    );

    // Handle edge preview for intersections (show connection to future subflow)
    setEdges((currentEdges) => {
      // Remove any temporary edges
      const permanentEdges = currentEdges.filter((e) => e.className !== 'temp');

      if (validIntersections.length > 0 && draggedNode.type === 'customAttachment') {
        // Show preview of subflow connection for attachment
        const tempEdges = validIntersections.map(intersectingNode => ({
          id: `temp-subflow-${intersectingNode.id}-${draggedNode.id}`,
          source: intersectingNode.id,
          target: `temp-subflow-${intersectingNode.id}`, // Temporary subflow target
          sourceHandle: 'attachment-right',
          targetHandle: null,
          style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5,5' },
          className: 'temp',
          type: 'default',
          animated: false
        }));

        return [...permanentEdges, ...tempEdges];
      }

      return permanentEdges;
    });
  }, [getIntersectingNodes, setNodes, setEdges]);

  // Handle node drag stop for intersection-based connection with subflows
  const onNodeDragStop = useCallback((_, draggedNode) => {
    const intersections = getIntersectingNodes(draggedNode);
    
    // Filter for valid intersections including standalone subflows
    const validIntersections = intersections.filter(intersectingNode =>
      (draggedNode.type === 'customAttachment' && !draggedNode.parentNode && intersectingNode.type === 'customTask') ||
      (draggedNode.type === 'customTask' && intersectingNode.type === 'customAttachment' && !intersectingNode.parentNode) ||
      (draggedNode.type === 'customSubflow' && !draggedNode.data.taskId && intersectingNode.type === 'customTask') ||
      (draggedNode.type === 'customTask' && intersectingNode.type === 'customSubflow' && !intersectingNode.data.taskId)
    );

    // Clear all highlighting
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isDropTarget: false
        }
      }))
    );

    // Handle standalone subflow reconnection
    if (validIntersections.length > 0 && draggedNode.type === 'customSubflow' && !draggedNode.data.taskId) {
      const targetTask = validIntersections[0];
      
      // Check if target task already has attachments
      const existingSubflow = nodes.find(node =>
        node.type === 'customSubflow' && node.data.taskId === targetTask.id
      );
      
      if (!existingSubflow) {
        // Target task has no subflow, connect the standalone subflow
        setNodes((currentNodes) =>
          currentNodes.map(node =>
            node.id === draggedNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    taskId: targetTask.id,
                    label: `${targetTask.data.label} Attachments`
                  },
                  position: {
                    x: targetTask.position.x + 280,
                    y: targetTask.position.y - 20,
                  }
                }
              : node
          )
        );
        
        // Determine if task is active (not done) - check if task is finished or completed
        const isActiveTask = !targetTask.data.isFinished && !targetTask.data.completedAt;
        
        // Create connection edge
        setEdges((currentEdges) => [
          ...currentEdges.filter((e) => e.className !== 'temp'),
          {
            id: `subflow-${targetTask.id}-${draggedNode.id}`,
            source: targetTask.id,
            target: draggedNode.id,
            sourceHandle: 'attachment-right',
            targetHandle: null,
            type: 'default',
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
            animated: isActiveTask // Animate if task is active (not done)
          }
        ]);
      }
    }
    // Handle connection creation based on attachment count
    else if (validIntersections.length > 0 && draggedNode.type === 'customAttachment' && !draggedNode.parentNode) {
      const targetTask = validIntersections[0];
      
      // Check if task already has a subflow (easier way to count)
      const existingSubflow = nodes.find(node =>
        node.type === 'customSubflow' && node.data.taskId === targetTask.id
      );
      
      // Count existing attachments - either from edges (basic connections) or subflow children
      let existingAttachments = 0;
      if (existingSubflow) {
        // Count attachments in subflow
        existingAttachments = nodes.filter(node =>
          node.parentNode === existingSubflow.id && node.type === 'customAttachment'
        ).length;
      } else {
        // Count basic edge connections (exclude temporary edges)
        existingAttachments = edges.filter(edge =>
          edge.source === targetTask.id &&
          edge.sourceHandle === 'attachment-right' &&
          edge.className !== 'temp'
        ).length;
      }
      
      if (existingAttachments === 0 && !existingSubflow) {
        // First attachment - use basic line connection
        setNodes((currentNodes) =>
          currentNodes.map(node =>
            node.id === draggedNode.id
              ? {
                  ...node,
                  position: {
                    x: targetTask.position.x + 280,
                    y: targetTask.position.y
                  }
                }
              : node
          )
        );
        
        setEdges((currentEdges) => {
          let updatedEdges = currentEdges.filter((e) => e.className !== 'temp');
          
          // Remove any existing connections from this attachment
          updatedEdges = updatedEdges.filter(edge =>
            edge.target !== draggedNode.id && edge.source !== draggedNode.id
          );
          
          // Create basic line connection
          const newEdge = {
            id: `attachment-${targetTask.id}-${draggedNode.id}`,
            source: targetTask.id,
            target: draggedNode.id,
            sourceHandle: 'attachment-right',
            targetHandle: null,
            type: 'default',
            style: { stroke: '#f97316', strokeWidth: 2 },
            animated: false
          };
          
          updatedEdges.push(newEdge);
          return updatedEdges;
        });
        
      } else if (existingAttachments === 1 && !existingSubflow) {
        // Second attachment - convert to subflow system
        const existingAttachmentEdge = edges.find(edge =>
          edge.source === targetTask.id && edge.sourceHandle === 'attachment-right'
        );
        const existingAttachmentNode = nodes.find(node =>
          node.id === existingAttachmentEdge?.target
        );
        
        if (existingAttachmentNode) {
          const subflowId = `subflow-${targetTask.id}-${Date.now()}`;
          const { width, height } = calculateSubflowLayout(2);
          
          setNodes((currentNodes) => {
            const newSubflowNode = {
              id: subflowId,
              type: 'customSubflow',
              data: {
                label: `${targetTask.data.label} Attachments`,
                taskId: targetTask.id,
                attachmentCount: 2,
                backgroundColor: 'rgba(196, 181, 253, 0.15)',
              },
              position: {
                x: targetTask.position.x + 280,
                y: targetTask.position.y - 20,
              },
              style: { width, height }
            };
            
            return [
              ...currentNodes.filter(n => n.id !== existingAttachmentNode.id && n.id !== draggedNode.id),
              newSubflowNode,
              {
                ...existingAttachmentNode,
                position: getAttachmentPositionInSubflow(0, 2),
                parentNode: subflowId,
                extent: 'parent'
              },
              {
                ...draggedNode,
                position: getAttachmentPositionInSubflow(1, 2),
                parentNode: subflowId,
                extent: 'parent'
              }
            ];
          });
          
          setEdges((currentEdges) => {
            let updatedEdges = currentEdges.filter((e) => e.className !== 'temp');
            
            // Remove old connections
            updatedEdges = updatedEdges.filter(edge =>
              edge.id !== existingAttachmentEdge.id &&
              edge.target !== draggedNode.id &&
              edge.source !== draggedNode.id
            );
            
            // Add subflow connection
            updatedEdges.push({
              id: `subflow-${targetTask.id}-${subflowId}`,
              source: targetTask.id,
              target: subflowId,
              sourceHandle: 'attachment-right',
              targetHandle: null,
              type: 'default',
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
              animated: false
            });
            
            return updatedEdges;
          });
        }
        
      } else if (existingSubflow) {
        // Add to existing subflow (2+ attachments already in subflow)
        const currentAttachments = nodes.filter(node =>
          node.parentNode === existingSubflow.id && node.type === 'customAttachment'
        );
        
        const newAttachmentCount = currentAttachments.length + 1;
        const { width, height } = calculateSubflowLayout(newAttachmentCount);
        
        // Recalculate positions for ALL attachments in the subflow
        const updatedAttachments = currentAttachments.map((attachment, index) => ({
          ...attachment,
          position: getAttachmentPositionInSubflow(index, newAttachmentCount)
        }));
        
        setNodes((currentNodes) => [
          // Keep all nodes except the ones we're updating
          ...currentNodes.filter(node =>
            node.id !== draggedNode.id &&
            node.id !== existingSubflow.id &&
            !currentAttachments.some(att => att.id === node.id)
          ),
          // Update subflow with new size and count
          {
            ...existingSubflow,
            data: { ...existingSubflow.data, attachmentCount: newAttachmentCount },
            style: { width, height }
          },
          // Add all updated existing attachments
          ...updatedAttachments,
          // Add dragged attachment at correct position
          {
            ...draggedNode,
            position: getAttachmentPositionInSubflow(currentAttachments.length, newAttachmentCount),
            parentNode: existingSubflow.id,
            extent: 'parent'
          }
        ]);
        
        setEdges((currentEdges) =>
          currentEdges.filter((e) => e.className !== 'temp' &&
            e.target !== draggedNode.id && e.source !== draggedNode.id)
        );
      }
    } else {
      // Remove temporary edges for non-subflow interactions
      setEdges((currentEdges) => currentEdges.filter((e) => e.className !== 'temp'));
    }
  }, [getIntersectingNodes, setNodes, setEdges, nodes]);

  // Auto-arrange all attachments in subflow groups
  const autoArrangeGroups = () => {
    const taskNodes = nodes.filter(node => node.type === 'customTask');
    const subflowNodes = nodes.filter(node => node.type === 'customSubflow');
    
    let updatedNodes = [...nodes];
    
    taskNodes.forEach(taskNode => {
      // Find subflow connected to this task
      const connectedSubflow = subflowNodes.find(subflow =>
        subflow.data.taskId === taskNode.id
      );
      
      if (connectedSubflow) {
        // Get attachments in this subflow
        const attachmentsInSubflow = nodes.filter(node =>
          node.parentNode === connectedSubflow.id && node.type === 'customAttachment'
        );
        
        const attachmentCount = attachmentsInSubflow.length;
        const { width, height } = calculateSubflowLayout(attachmentCount);
        
        // Update subflow position and size
        const subflowIndex = updatedNodes.findIndex(n => n.id === connectedSubflow.id);
        if (subflowIndex !== -1) {
          updatedNodes[subflowIndex] = {
            ...updatedNodes[subflowIndex],
            position: {
              x: taskNode.position.x + 280,
              y: taskNode.position.y - 20,
            },
            style: { width, height },
            data: {
              ...updatedNodes[subflowIndex].data,
              attachmentCount
            }
          };
        }
        
        // Rearrange attachments within subflow using dynamic positioning
        attachmentsInSubflow.forEach((attachment, index) => {
          const newPosition = getAttachmentPositionInSubflow(index, attachmentCount);
          
          // Update the attachment position within subflow
          const nodeIndex = updatedNodes.findIndex(n => n.id === attachment.id);
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: newPosition
            };
          }
        });
      }
    });
    
    setNodes(updatedNodes);
  };

  return (
    <div className="flex h-full w-full flex-col" style={{ minHeight: 0, minWidth: 0 }}>
      {/* Top Bar */}
      <div className="flex h-12 items-center justify-between border-b border-border bg-zinc-50 px-4 dark:bg-zinc-800">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-foreground">Task Flow Timeline</div>
          <div className="text-xs text-muted-foreground">Ctrl+1</div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mx-2 h-4 w-px bg-border"></div>
            <button
              onClick={autoArrangeGroups}
              className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              title="Auto-arrange groups"
            >
              <Group className="h-4 w-4" />
            </button>
            <button className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900 dark:text-green-200">
              {nodes.filter(n => n.data.isFinished).length} finished
            </span>
            <button className="rounded bg-red-100 px-2 py-1 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800">
              Clear All
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-foreground">Properties</div>
            <div className="text-xs text-muted-foreground">Ctrl+2</div>
          </div>
        </div>
      </div>

      <div className="flex h-full flex-row">
        {/* Task List Sidebar */}
        <div className="flex h-full w-80 min-w-[18rem] max-w-xs flex-col border-r border-border bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-semibold text-foreground">Task Library</div>
            <div className="text-xs text-muted-foreground">Ctrl+1</div>
          </div>
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full rounded border border-border bg-background py-1.5 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {/* Tasks Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('tasks')}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-semibold text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {expandedSections.has('tasks') ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                Tasks
                <span className="ml-auto rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {filteredColumns.reduce((total, col) => total + col.tasks.length, 0)} items
                </span>
              </button>
              
              {expandedSections.has('tasks') && (
                <div className="mt-2">
                  {filteredColumns.map((col) =>
                    col.tasks.length > 0 ? (
                      <div key={col.id} className="mb-3">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                          {col.title}
                          <span className="ml-auto rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            {col.tasks.length}
                          </span>
                        </div>
                        <div className="space-y-1 px-2">
                          {col.tasks.map((task) => {
                            const isInNodes = tasksInNodes.has(task.id);
                            return (
                              <div
                                key={task.id}
                                className={`group rounded-lg border px-3 py-2.5 transition-all ${
                                  isInNodes
                                    ? 'border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-800'
                                    : draggedTask?.id === task.id
                                    ? 'border-zinc-200 bg-white opacity-50 cursor-grabbing scale-95 dark:border-zinc-700 dark:bg-zinc-900'
                                    : 'border-zinc-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-grab dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600'
                                }`}
                                draggable={!isInNodes}
                                onDragStart={(e) => onDragStart(e, task)}
                                onDragEnd={onTaskDragEnd}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`${task.taskGroup?.color || 'bg-gray-400'} mt-0.5 h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}>
                                    {task.taskGroup?.name || 'T'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-foreground">{task.title}</div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                      {task.estimate && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {task.estimate}
                                        </span>
                                      )}
                                      {task.priority && (
                                        <span className={`${
                                          task.priority === 'high' ? 'text-red-600' :
                                          task.priority === 'medium' ? 'text-yellow-600' :
                                          'text-green-600'
                                        }`}>
                                          {task.priority}
                                        </span>
                                      )}
                                      {isInNodes && (
                                        <span className="text-blue-600">• In Timeline</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('attachments')}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-xs font-semibold text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {expandedSections.has('attachments') ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <Paperclip className="h-3 w-3" />
                Attachments
                <span className="ml-auto rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {attachmentTypes.length} types
                </span>
              </button>
              
              {expandedSections.has('attachments') && (
                <div className="mt-2 space-y-1 px-2">
                  {attachmentTypes.map((attachment) => (
                    <div
                      key={attachment.id}
                      className={`group rounded-lg border border-zinc-200 bg-white px-3 py-2.5 transition-all hover:border-orange-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-orange-600 ${
                        draggedAttachment?.id === attachment.id
                          ? 'opacity-50 cursor-grabbing scale-95'
                          : 'cursor-grab'
                      }`}
                      draggable
                      onDragStart={(e) => onAttachmentDragStart(e, attachment)}
                      onDragEnd={onAttachmentDragEnd}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`${attachment.color} h-4 w-4 rounded text-xs font-bold text-white flex items-center justify-center`}>
                          <attachment.icon className="h-3 w-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">{attachment.name}</div>
                          <div className="text-xs text-muted-foreground">{attachment.extension}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Map */}
        <div className="relative flex h-full min-w-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2 dark:bg-zinc-800">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              Drag tasks from the library to create your timeline flow
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{nodes.length} blocks</span>
              <span>{edges.length} connections</span>
              <span>Complexity: {Math.max(1, Math.floor(nodes.length / 2))}</span>
            </div>
          </div>
          <div
            ref={reactFlowWrapper}
            style={{ height: 800 }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeContextMenu={onNodeContextMenu}
              onPaneContextMenu={onPaneContextMenu}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              onInit={onInit}
              fitView
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <MiniMap />
              <Controls />
              <Background variant="dots" gap={16} size={1} />
            </ReactFlow>
            
            {/* Context Menu */}
            {contextMenu && (
              <div
                className="absolute z-50 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
                style={{
                  left: contextMenu.x,
                  top: contextMenu.y,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {contextMenu.type === 'customAttachment' && (
                  <>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                      onClick={() => handleContextMenuAction('duplicate', contextMenu.id)}
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                      onClick={() => handleContextMenuAction('disconnect', contextMenu.id)}
                    >
                      <X className="h-4 w-4" />
                      Disconnect
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => handleContextMenuAction('delete', contextMenu.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                )}
                
                {contextMenu.type === 'customTask' && (
                  <>
                    <div className="relative">
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                        onClick={() => handleContextMenuAction('addAttachment', contextMenu.id)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Attachment
                        <ChevronRight className="ml-auto h-3 w-3" />
                      </button>
                      
                      {/* Attachment submenu */}
                      {showAttachmentSubmenu && (
                        <div className="absolute left-full top-0 ml-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800">
                          {attachmentTypes.map((attachment) => (
                            <button
                              key={attachment.id}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                              onClick={() => handleContextMenuAction(`addAttachment:${attachment.id}`, contextMenu.id)}
                            >
                              <div className={`${attachment.color} h-4 w-4 rounded flex items-center justify-center`}>
                                <attachment.icon className="h-3 w-3 text-white" />
                              </div>
                              {attachment.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                      onClick={() => handleContextMenuAction('markAsFinish', contextMenu.id)}
                    >
                      <Check className="h-4 w-4" />
                      {contextMenu.data?.isFinished ? 'Unmark as Finish' : 'Mark as Finish'}
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                      onClick={() => handleContextMenuAction('disconnect', contextMenu.id)}
                    >
                      <X className="h-4 w-4" />
                      Disconnect
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => handleContextMenuAction('delete', contextMenu.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Return to Library
                    </button>
                  </>
                )}
                
                {contextMenu.type === 'pane' && (
                  <>
                    <div className="relative">
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                        onClick={() => handleContextMenuAction('addAttachment', null, { x: contextMenu.x, y: contextMenu.y })}
                      >
                        <Plus className="h-4 w-4" />
                        Add Attachment
                        <ChevronRight className="ml-auto h-3 w-3" />
                      </button>
                      
                      {/* Attachment submenu */}
                      {showAttachmentSubmenu && (
                        <div className="absolute left-full top-0 ml-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800">
                          {attachmentTypes.map((attachment) => (
                            <button
                              key={attachment.id}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                              onClick={() => handleContextMenuAction(`addAttachment:${attachment.id}`, null, { x: contextMenu.flowX, y: contextMenu.flowY })}
                            >
                              <div className={`${attachment.color} h-4 w-4 rounded flex items-center justify-center`}>
                                <attachment.icon className="h-3 w-3 text-white" />
                              </div>
                              {attachment.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700"
                      onClick={() => handleContextMenuAction('showAttachments')}
                    >
                      <List className="h-4 w-4" />
                      Show Attachments
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Properties Sidebar */}
        <div className={`h-full w-80 bg-white border-l border-border shadow-lg transform transition-transform duration-300 ease-in-out dark:bg-zinc-900 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {selectedNode && (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="text-sm font-semibold text-foreground">Properties</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Ctrl+2</div>
                  <button
                    onClick={handleSidebarClose}
                    className="rounded p-1 text-muted-foreground hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Task Header */}
                  <div className="flex items-center gap-2">
                    <div className={`${selectedNode.data.taskGroup?.color || 'bg-gray-400'} h-6 w-6 rounded text-xs font-bold text-white flex items-center justify-center`}>
                      {selectedNode.data.taskGroup?.name || 'T'}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{selectedNode.data.label}</div>
                      <div className="text-xs text-muted-foreground">Task</div>
                    </div>
                  </div>

                  {/* Properties */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated Time</label>
                      <div className="mt-1 rounded border bg-background p-2 text-sm">
                        {selectedNode.data.estimate || 'Not set'}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Priority</label>
                      <div className="mt-1">
                        <select className="w-full rounded border bg-background p-2 text-sm">
                          <option value={selectedNode.data.priority}>{selectedNode.data.priority || 'medium'}</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Finish Status</label>
                      <div className="mt-1">
                        <select
                          className="w-full rounded border bg-background p-2 text-sm"
                          value={selectedNode.data.isFinished ? 'finished' : 'task'}
                          onChange={(e) => {
                            if (e.target.value === 'finished') {
                              handleMakeFinish();
                            }
                          }}
                        >
                          <option value="task">Regular Task</option>
                          <option value="finished">Finished</option>
                        </select>
                      </div>
                    </div>

                    {selectedNode.data.completedAt && (
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completed At</label>
                        <div className="mt-1 rounded border bg-background p-2 text-sm">
                          {new Date(selectedNode.data.completedAt).toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Comment</label>
                      <textarea
                        className="mt-1 w-full rounded border bg-background p-2 text-sm"
                        rows={3}
                        placeholder="Add notes about this task..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border p-4">
                <button
                  onClick={handleNodeDelete}
                  className="w-full rounded bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Remove from Timeline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Attachment List Modal */}
      {showAttachmentList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-zinc-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-600">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Timeline Attachments
              </h2>
              <button
                onClick={() => setShowAttachmentList(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {(() => {
                const attachmentNodes = nodes.filter(node => node.type === 'customAttachment');
                const subflowNodes = nodes.filter(node => node.type === 'customSubflow');
                
                if (attachmentNodes.length === 0) {
                  return (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <Paperclip className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>No attachments in timeline</p>
                    </div>
                  );
                }
                
                // Group attachments by their parent task
                const attachmentsByTask = {};
                const standaloneAttachments = [];
                
                attachmentNodes.forEach(attachment => {
                  if (attachment.parentNode) {
                    // Find the subflow and its associated task
                    const subflow = subflowNodes.find(s => s.id === attachment.parentNode);
                    if (subflow && subflow.data.taskId) {
                      const taskNode = nodes.find(n => n.id === subflow.data.taskId);
                      const taskName = taskNode ? taskNode.data.label : 'Unknown Task';
                      
                      if (!attachmentsByTask[taskName]) {
                        attachmentsByTask[taskName] = [];
                      }
                      attachmentsByTask[taskName].push(attachment);
                    }
                  } else {
                    // Find connected task through edges
                    const connectedEdge = edges.find(edge =>
                      edge.target === attachment.id || edge.source === attachment.id
                    );
                    
                    if (connectedEdge) {
                      const taskId = connectedEdge.source === attachment.id ? connectedEdge.target : connectedEdge.source;
                      const taskNode = nodes.find(n => n.id === taskId && n.type === 'customTask');
                      
                      if (taskNode) {
                        const taskName = taskNode.data.label;
                        if (!attachmentsByTask[taskName]) {
                          attachmentsByTask[taskName] = [];
                        }
                        attachmentsByTask[taskName].push(attachment);
                      } else {
                        standaloneAttachments.push(attachment);
                      }
                    } else {
                      standaloneAttachments.push(attachment);
                    }
                  }
                });
                
                return (
                  <div className="space-y-6">
                    {/* Grouped attachments by task */}
                    {Object.entries(attachmentsByTask).map(([taskName, attachments]) => (
                      <div key={taskName} className="rounded-lg border p-4 dark:border-zinc-600">
                        <h3 className="mb-3 font-medium text-gray-900 dark:text-gray-100">
                          {taskName} ({attachments.length} attachment{attachments.length !== 1 ? 's' : ''})
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {attachments.map(attachment => {
                            const IconComponent = (() => {
                              const iconMap = {
                                'FileText': FileText,
                                'FileSpreadsheet': FileSpreadsheet,
                                'Presentation': Presentation,
                                'StickyNote': StickyNote,
                                'Image': Image,
                                'Music': Music,
                                'Video': Video,
                                'Archive': Archive,
                                'File': File
                              };
                              return iconMap[attachment.data.iconName] || File;
                            })();
                            
                            return (
                              <div
                                key={attachment.id}
                                className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-700"
                              >
                                <div className={`${attachment.data.color} h-8 w-8 rounded flex items-center justify-center`}>
                                  <IconComponent className="h-4 w-4 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {attachment.data.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {attachment.data.extension}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    
                    {/* Standalone attachments */}
                    {standaloneAttachments.length > 0 && (
                      <div className="rounded-lg border p-4 dark:border-zinc-600">
                        <h3 className="mb-3 font-medium text-gray-900 dark:text-gray-100">
                          Standalone Attachments ({standaloneAttachments.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {standaloneAttachments.map(attachment => {
                            const IconComponent = (() => {
                              const iconMap = {
                                'FileText': FileText,
                                'FileSpreadsheet': FileSpreadsheet,
                                'Presentation': Presentation,
                                'StickyNote': StickyNote,
                                'Image': Image,
                                'Music': Music,
                                'Video': Video,
                                'Archive': Archive,
                                'File': File
                              };
                              return iconMap[attachment.data.iconName] || File;
                            })();
                            
                            return (
                              <div
                                key={attachment.id}
                                className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-700"
                              >
                                <div className={`${attachment.data.color} h-8 w-8 rounded flex items-center justify-center`}>
                                  <IconComponent className="h-4 w-4 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {attachment.data.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {attachment.data.extension}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Summary */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <List className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Total: {attachmentNodes.length} attachment{attachmentNodes.length !== 1 ? 's' : ''}
                          {Object.keys(attachmentsByTask).length > 0 && ` across ${Object.keys(attachmentsByTask).length} task${Object.keys(attachmentsByTask).length !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper component with ReactFlowProvider
function TaskFlowTimeline() {
  return (
    <ReactFlowProvider>
      <TaskFlowTimelineInner />
    </ReactFlowProvider>
  );
}

export default TaskFlowTimeline;