import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Zap,
  X,
  List,
  Group
} from 'lucide-react';

import CustomTaskNode from './nodes/CustomTaskNode';
import CustomAttachmentNode from './nodes/CustomAttachmentNode';
import CustomSubflowNode from './nodes/CustomSubflowNode';

import TaskListSidebar from './ui/TaskListSidebar';
import PropertiesSidebar from './ui/PropertiesSidebar';
import ContextMenu from './ui/ContextMenu';
import AttachmentListModal from './ui/AttachmentListModal';

import { useTimelineData } from './hooks/useTimelineData';
import { calculateSubflowLayout, getAttachmentPositionInSubflow } from './lib/layoutUtils';
import { attachmentTypes } from './lib/attachmentTypes';

function TaskFlowTimelineInner({ selectedList, onRefreshKanban }) {
  const { timelineNodes, timelineEdges, allTasks, columns, loading, error, setTimelineEdges, refreshData } = useTimelineData(selectedList);

  const nodeTypes = useMemo(() => ({
    customTask: CustomTaskNode,
    customAttachment: CustomAttachmentNode,
    customSubflow: CustomSubflowNode,
  }), []);

  const { getIntersectingNodes } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
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

  const [contextMenu, setContextMenu] = useState(null);
  const [showAttachmentList, setShowAttachmentList] = useState(false);
  const [showAttachmentSubmenu, setShowAttachmentSubmenu] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setShowDeleteGroupConfirm(false);
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

  useEffect(() => {
    if (timelineNodes.length > 0) {
      const initialNodes = timelineNodes.map((node) => ({
        id: node.nodeId,
        type: node.type,
        data: {
          label: node.task.title,
          taskGroup: node.task.taskGroup,
          estimate: node.task.estimate,
          priority: node.task.priority,
          completedAt: node.task.completedAt,
          taskId: node.task.id,
          isFinished: node.isFinished,
          dbId: node.id
        },
        position: { x: node.positionX, y: node.positionY },
      }));

      const initialEdges = timelineEdges.map(edge => {
        const sourceNode = initialNodes.find(n => n.id === edge.sourceId);
        const targetNode = initialNodes.find(n => n.id === edge.targetId);

        let style = { stroke: '#3b82f6', strokeWidth: 2 }; // Default blue
        let sourceHandle = null;
        let targetHandle = null;
        let animated = false;

        if (sourceNode && targetNode) {
            const isSourceTask = sourceNode.type === 'customTask';
            const isTargetTask = targetNode.type === 'customTask';
            const isTargetAttachment = targetNode.type === 'customAttachment';
            const isTargetSubflow = targetNode.type === 'customSubflow';

            if (isSourceTask && isTargetTask) {
                sourceHandle = 'bottom';
                targetHandle = 'top';
                animated = (!sourceNode.data.isFinished && !sourceNode.data.completedAt) ||
                           (!targetNode.data.isFinished && !targetNode.data.completedAt);
            } else if (isSourceTask && isTargetAttachment) {
                style = { stroke: '#f97316', strokeWidth: 2 }; // Orange
                sourceHandle = 'attachment-right';
            } else if (isSourceTask && isTargetSubflow) {
                style = { stroke: '#8b5cf6', strokeWidth: 2 }; // Purple
                sourceHandle = 'attachment-right';
            }
        }

        return {
            id: edge.id,
            source: edge.sourceId,
            target: edge.targetId,
            type: 'default',
            style: style,
            animated: animated,
            sourceHandle: sourceHandle,
            targetHandle: targetHandle
        };
      });

      setNodes(initialNodes);
      setEdges(initialEdges);
      setNodeId(initialNodes.length + 1);
      
      const taskIds = new Set(timelineNodes.map(node => node.taskId));
      setTasksInNodes(taskIds);
    } else {
        setNodes([]);
        setEdges([]);
        setTasksInNodes(new Set());
    }
  }, [timelineNodes, timelineEdges]);

  const filteredColumns = columns.map(col => ({
    ...col,
    tasks: col.tasks.filter(task =>
      task.title.toLowerCase().includes(search.toLowerCase())
    ),
  }));

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      const isTaskToTaskOrangeConnection =
        sourceNode && targetNode &&
        sourceNode.type === 'customTask' && targetNode.type === 'customTask' &&
        (params.sourceHandle === 'attachment-right' || params.sourceHandle === 'attachment-left');
      
      if ((sourceNode && sourceNode.type === 'customSubflow' && !sourceNode.data.taskId &&
           targetNode && targetNode.type === 'customTask') ||
          (sourceNode && sourceNode.type === 'customTask' &&
           targetNode && targetNode.type === 'customSubflow' && !targetNode.data.taskId)) {
        
        const taskNode = sourceNode.type === 'customTask' ? sourceNode : targetNode;
        const subflowNode = sourceNode.type === 'customSubflow' ? sourceNode : targetNode;
        
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
        
        const isActiveTask = !taskNode.data.isFinished && !taskNode.data.completedAt;
        
        setEdges((eds) => addEdge({
          id: `subflow-${taskNode.id}-${subflowNode.id}`,
          source: taskNode.id,
          target: subflowNode.id,
          sourceHandle: 'attachment-right',
          targetHandle: null,
          type: 'default',
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          animated: isActiveTask
        }, eds));
        
        return;
      }
      
      const isAttachmentConnection =
        (sourceNode && sourceNode.type === 'customAttachment') ||
        (targetNode && targetNode.type === 'customAttachment') ||
        params.sourceHandle === 'attachment-right' ||
        params.targetHandle === 'attachment-left';
      
      const isTaskFlowConnection =
        params.sourceHandle === 'bottom' ||
        params.targetHandle === 'top';
      
      const isInvalidConnection =
        (params.sourceHandle === 'attachment-right' && params.targetHandle === 'top') ||
        (params.sourceHandle === 'bottom' && params.targetHandle === 'attachment-left') ||
        (params.targetHandle === 'attachment-left' && params.sourceHandle === 'bottom') ||
        (params.targetHandle === 'top' && params.sourceHandle === 'attachment-right') ||
        isTaskToTaskOrangeConnection ||
        (params.sourceHandle === 'bottom' && sourceNode && sourceNode.data.isFinished);
      
      if (isInvalidConnection) {
        return;
      }
      
      if (isAttachmentConnection && sourceNode && targetNode &&
          ((sourceNode.type === 'customAttachment' && targetNode.type === 'customTask') ||
           (sourceNode.type === 'customTask' && targetNode.type === 'customAttachment'))) {
        
        const taskNode = sourceNode.type === 'customTask' ? sourceNode : targetNode;
        const attachmentNode = sourceNode.type === 'customAttachment' ? sourceNode : targetNode;
        
        if (attachmentNode.parentNode) {
          return;
        }
        
        const existingAttachments = edges.filter(edge =>
          edge.source === taskNode.id && edge.sourceHandle === 'attachment-right'
        ).length;
        
        const existingSubflow = nodes.find(node =>
          node.type === 'customSubflow' && node.data.taskId === taskNode.id
        );
        
        if (existingAttachments === 0) {
          const newEdge = {
            id: `attachment-${taskNode.id}-${attachmentNode.id}`,
            source: taskNode.id,
            target: attachmentNode.id,
            sourceHandle: 'attachment-right',
            targetHandle: null,
            type: 'default',
            style: { stroke: '#f97316', strokeWidth: 2 },
            animated: false
          };
          
          setNodes((currentNodes) =>
            currentNodes.map(node =>
              node.id === attachmentNode.id
                ? {
                    ...node,
                    position: {
                      x: taskNode.position.x + 280,
                      y: taskNode.position.y
                    }
                  }
                : node
            )
          );
          
          setEdges((eds) => addEdge(newEdge, eds));
          
        } else if (existingAttachments === 1 && !existingSubflow) {
          const existingAttachmentEdge = edges.find(edge =>
            edge.source === taskNode.id && edge.sourceHandle === 'attachment-right'
          );
          const existingAttachmentNode = nodes.find(node =>
            node.id === existingAttachmentEdge?.target
          );
          
          if (existingAttachmentNode) {
            const subflowId = String(nodeId);
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
            
            const updatedExistingAttachment = {
              ...existingAttachmentNode,
              position: getAttachmentPositionInSubflow(0, 2),
              parentNode: subflowId,
              extent: 'parent'
            };
            
            const updatedNewAttachment = {
              ...attachmentNode,
              position: getAttachmentPositionInSubflow(1, 2),
              parentNode: subflowId,
              extent: 'parent'
            };
            
            setNodes(currentNodes => [
              ...currentNodes.filter(n => n.id !== existingAttachmentNode.id && n.id !== attachmentNode.id),
              newSubflowNode,
              updatedExistingAttachment,
              updatedNewAttachment
            ]);
            
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
            
            setNodeId((id) => id + 1);
          }
          
        } else if (existingSubflow) {
          const currentAttachments = nodes.filter(node =>
            node.parentNode === existingSubflow.id && node.type === 'customAttachment'
          );
          
          const newAttachmentCount = currentAttachments.length + 1;
          const { width, height } = calculateSubflowLayout(newAttachmentCount);
          
          const updatedNewAttachment = {
            ...attachmentNode,
            position: getAttachmentPositionInSubflow(currentAttachments.length, newAttachmentCount),
            parentNode: existingSubflow.id,
            extent: 'parent'
          };
          
          const updatedAttachments = currentAttachments.map((attachment, index) => ({
            ...attachment,
            position: getAttachmentPositionInSubflow(index, newAttachmentCount)
          }));
          
          setNodes((nds) => [
            ...nds.filter(node =>
              node.id !== existingSubflow.id &&
              node.id !== attachmentNode.id &&
              !currentAttachments.some(att => att.id === node.id)
            ),
            {
              ...existingSubflow,
              data: { ...existingSubflow.data, attachmentCount: newAttachmentCount },
              style: { width, height }
            },
            ...updatedAttachments,
            updatedNewAttachment
          ]);
        }
        
        return;
      }
      
      const edgeStyle = isAttachmentConnection ?
        { stroke: '#f97316', strokeWidth: 2 } :
        { stroke: '#3b82f6', strokeWidth: 2 };
      
      const edgeType = isAttachmentConnection ? 'default' : 'default';
      
      let shouldAnimate = false;
      if (isAttachmentConnection && sourceNode && sourceNode.type === 'customTask') {
        shouldAnimate = !sourceNode.data.isFinished && !sourceNode.data.completedAt;
      } else if (!isAttachmentConnection && sourceNode && targetNode &&
                 sourceNode.type === 'customTask' && targetNode.type === 'customTask') {
        shouldAnimate = (!sourceNode.data.isFinished && !sourceNode.data.completedAt) ||
                       (!targetNode.data.isFinished && !targetNode.data.completedAt);
      }
      
      let connectionParams = { ...params };
      if (!isAttachmentConnection && sourceNode && targetNode &&
          sourceNode.type === 'customTask' && targetNode.type === 'customTask') {
        connectionParams.sourceHandle = 'bottom';
        connectionParams.targetHandle = 'top';
      }
      
      const newEdge = {
        ...connectionParams,
        type: edgeType,
        style: edgeStyle,
        animated: shouldAnimate
      };
      
      window.db.createTimelineEdge({
        sourceId: newEdge.source,
        targetId: newEdge.target,
        listId: selectedList.id
      }).then(createdEdge => {
        newEdge.id = createdEdge.id;
        setEdges((eds) => addEdge(newEdge, eds));
      });
    },
    [setEdges, nodes, setNodes, nodeId, setNodeId, calculateSubflowLayout, getAttachmentPositionInSubflow, selectedList.id]
  );

  const onDragStart = (event, task) => {
    if (tasksInNodes.has(task.id)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/reactflow', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedTask(task);
  };

  const onTaskDragEnd = () => {
    setDraggedTask(null);
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const taskData = event.dataTransfer.getData('application/reactflow');
      const attachmentData = event.dataTransfer.getData('application/attachment');
      
      if (!taskData && !attachmentData) return;

      let position = { x: 0, y: 0 };
      
      if (reactFlowInstance.current) {
        position = reactFlowInstance.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 50,
        };
      }

      if (taskData) {
        const task = JSON.parse(taskData);
        if (tasksInNodes.has(task.id)) return;

        const newNodeData = {
          nodeId: `task-${task.id}-${Date.now()}`,
          type: 'customTask',
          positionX: position.x,
          positionY: position.y,
          listId: selectedList.id,
          taskId: task.id,
        };

        window.db.createTimelineNode(newNodeData).then(createdNode => {
          const newNode = {
            id: createdNode.nodeId,
            type: createdNode.type,
            data: {
              label: task.title,
              taskGroup: task.taskGroup,
              estimate: task.estimate,
              priority: task.priority,
              completedAt: task.completedAt,
              taskId: task.id,
              isFinished: false,
              dbId: createdNode.id
            },
            position: { x: createdNode.positionX, y: createdNode.positionY },
          };

          setNodes((nds) => [...nds, newNode]);

          const connectionRange = 200;
          let closestTaskNode = null;
          let minDistance = connectionRange;
          
          nodes.forEach(node => {
            if (node.type === 'customTask') {
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
            const existingConnection = edges.find(edge =>
              (edge.source === newNode.id && edge.target === closestTaskNode.id) ||
              (edge.source === closestTaskNode.id && edge.target === newNode.id)
            );
            
            if (!existingConnection) {
              const belowPosition = {
                x: closestTaskNode.position.x,
                y: closestTaskNode.position.y + 150
              };
              
              const hasTaskBelow = nodes.some(node =>
                node.id !== newNode.id &&
                node.id !== closestTaskNode.id &&
                node.type === 'customTask' &&
                Math.abs(node.position.x - belowPosition.x) < 100 &&
                Math.abs(node.position.y - belowPosition.y) < 100
              );
              
              const smartPosition = hasTaskBelow
                ? {
                    x: closestTaskNode.position.x + 280,
                    y: closestTaskNode.position.y + 130
                  }
                : belowPosition;
              
              newNode.position = smartPosition;
              
              window.db.updateTimelineNodePosition(newNode.data.dbId, smartPosition);
              
              const isActiveConnection = (!newNode.data.isFinished && !newNode.data.completedAt) ||
                                       (!closestTaskNode.data.isFinished && !closestTaskNode.data.completedAt);
              
              const newEdge = {
                id: `task-${closestTaskNode.id}-${newNode.id}`,
                source: closestTaskNode.id,
                target: newNode.id,
                sourceHandle: 'bottom',
                targetHandle: 'top',
                type: 'default',
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                animated: isActiveConnection
              };
              
              window.db.createTimelineEdge({
                sourceId: newEdge.source,
                targetId: newEdge.target,
                listId: selectedList.id
              }).then(createdEdge => {
                newEdge.id = createdEdge.id;
                setEdges((eds) => [...eds, newEdge]);
              });
            }
          }
          
          setTasksInNodes(prev => new Set([...prev, task.id]));
        }).catch(error => {
          console.error("Failed to create timeline node:", error);
        });
      } else if (attachmentData) {
        const attachment = JSON.parse(attachmentData);
        
        const connectionRange = 200;
        let closestTaskNode = null;
        let minDistance = connectionRange;
        
        nodes.forEach(node => {
          if (node.type === 'customTask') {
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
          const existingAttachments = edges.filter(edge =>
            edge.source === closestTaskNode.id && edge.sourceHandle === 'attachment-right'
          ).length;
          
          const existingSubflow = nodes.find(node =>
            node.type === 'customSubflow' && node.data.taskId === closestTaskNode.id
          );
          
          if (existingAttachments === 0) {
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
            
            const newEdge = {
              id: `attachment-${closestTaskNode.id}-${nodeId}`,
              source: closestTaskNode.id,
              target: String(nodeId),
              sourceHandle: 'attachment-right',
              targetHandle: null,
              type: 'default',
              style: { stroke: '#f97316', strokeWidth: 2 },
              animated: false
            };
            
            setEdges((eds) => [...eds, newEdge]);
            setNodeId((id) => id + 1);
            
          } else if (existingAttachments === 1 && !existingSubflow) {
            const existingAttachmentEdge = edges.find(edge =>
              edge.source === closestTaskNode.id && edge.sourceHandle === 'attachment-right'
            );
            const existingAttachmentNode = nodes.find(node =>
              node.id === existingAttachmentEdge?.target
            );
            
            if (existingAttachmentNode) {
              const subflowId = String(nodeId);
              const { width, height } = calculateSubflowLayout(2);
              
              const newSubflowNode = {
                id: subflowId,
                type: 'customSubflow',
                data: {
                  label: `${closestTaskNode.data.label}`,
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
              
              const updatedExistingAttachment = {
                ...existingAttachmentNode,
                position: getAttachmentPositionInSubflow(0, 2),
                parentNode: subflowId,
                extent: 'parent'
              };
              
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
                position: getAttachmentPositionInSubflow(1, 2),
                parentNode: subflowId,
                extent: 'parent'
              };
              
              setNodes(currentNodes => [
                ...currentNodes.filter(n => n.id !== existingAttachmentNode.id),
                newSubflowNode,
                updatedExistingAttachment,
                newAttachmentNode
              ]);
              
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
    
    const isDraggingAttachment = event.dataTransfer.types.includes('application/attachment');
    const isDraggingTask = event.dataTransfer.types.includes('application/reactflow');
    
    if ((isDraggingAttachment || isDraggingTask) && reactFlowInstance.current) {
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const connectionRange = 200;
      let closestTaskNode = null;
      let minDistance = connectionRange;
      
      nodes.forEach(node => {
        if (node.type === 'customTask') {
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
      
      const newHoveredId = closestTaskNode ? closestTaskNode.id : null;
      if (newHoveredId !== hoveredTaskNode) {
        setHoveredTaskNode(newHoveredId);
        
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
    } else if (!isDraggingAttachment && !isDraggingTask) {
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

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    
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

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    
    const pane = reactFlowWrapper.current.getBoundingClientRect();
    
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

  const handleDisconnect = useCallback((nodeId) => {
    const connectedSubflow = nodes.find(node =>
      node.type === 'customSubflow' && node.data.taskId === nodeId
    );
    
    const edgesToRemove = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
    edgesToRemove.forEach(edge => window.db.deleteTimelineEdge(edge.source, edge.target));
    setEdges(currentEdges =>
      currentEdges.filter(edge =>
        edge.source !== nodeId && edge.target !== nodeId
      )
    );
    
    if (connectedSubflow) {
      setNodes(currentNodes =>
        currentNodes.map(node => {
          if (node.id === connectedSubflow.id) {
            return {
              ...node,
              data: {
                ...node.data,
                taskId: null,
                label: 'Standalone Attachments'
              }
            };
          }
          return {
            ...node,
            data: {
              ...node.data,
              isContextSelected: false
            }
          };
        })
      );
    } else {
      setNodes(currentNodes =>
        currentNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isContextSelected: false
          }
        }))
      );
    }
    
    setContextMenu(null);
  }, [setEdges, setNodes, nodes]);

  const handleDeleteGroup = useCallback((nodeId) => {
    const subflowNode = nodes.find(n => n.id === nodeId);
    if (subflowNode && subflowNode.type === 'customSubflow') {
      const attachmentsInSubflow = nodes.filter(node =>
        node.parentNode === nodeId && node.type === 'customAttachment'
      );
      
      setNodes((currentNodes) =>
        currentNodes.filter(node =>
          node.id !== nodeId && !attachmentsInSubflow.some(att => att.id === node.id)
        )
      );
      
      const edgesToRemove = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
      edgesToRemove.forEach(edge => window.db.deleteTimelineEdge(edge.source, edge.target));
      setEdges((currentEdges) =>
        currentEdges.filter(edge =>
          edge.source !== nodeId && edge.target !== nodeId
        )
      );
    }
    
    setShowDeleteGroupConfirm(false);
    setContextMenu(null);
    setNodes(currentNodes =>
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isContextSelected: false
        }
      }))
    );
  }, [nodes, setNodes, setEdges]);

  const handleContextMenuAction = useCallback((action, nodeId, position) => {
    if (action === 'showAttachments') {
      setShowAttachmentList(true);
      setContextMenu(null);
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

    if (action === 'deleteGroup') {
      setShowDeleteGroupConfirm(true);
      return;
    }

    if (action === 'confirmDeleteGroup') {
      handleDeleteGroup(nodeId);
      return;
    }

    if (action === 'markAsFinish') {
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type === 'customTask') {
        const newFinishedState = !node.data.isFinished;
        
        window.db.updateTimelineNodeFinished(node.data.dbId, newFinishedState).then(() => {
          setNodes(currentNodes =>
            currentNodes.map(n =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, isFinished: newFinishedState } }
                : n
            )
          );
        });
        
        setEdges(currentEdges => {
          let updatedEdges = currentEdges;
          
          if (newFinishedState) {
            updatedEdges = currentEdges.filter(edge =>
              !(edge.source === nodeId && edge.sourceHandle === 'bottom')
            );
          }
          
          return updatedEdges.map(edge => {
            if (edge.source === nodeId) {
              const shouldAnimate = !newFinishedState && !node.data.completedAt;
              return { ...edge, animated: shouldAnimate };
            }
            if (edge.target === nodeId && edge.sourceHandle === 'bottom') {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const shouldAnimate = (sourceNode && !sourceNode.data.isFinished && !sourceNode.data.completedAt) ||
                                   (!newFinishedState && !node.data.completedAt);
              return { ...edge, animated: shouldAnimate };
            }
            return edge;
          });
        });
      }
      setContextMenu(null);
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

    if (action === 'markAsDone') {
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type === 'customTask') {
        const updatedTask = {
          status: 'done',
          completedAt: new Date().toISOString(),
        };
        window.db.updateTask(node.data.taskId, updatedTask).then(() => {
          setNodes(currentNodes =>
            currentNodes.map(n =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, completedAt: updatedTask.completedAt } }
                : n
            )
          );
          setEdges(currentEdges =>
            currentEdges.map(edge => {
              if (edge.source === nodeId || edge.target === nodeId) {
                return { ...edge, animated: false };
              }
              return edge;
            })
          );
          refreshData();
          if (onRefreshKanban) {
            onRefreshKanban();
          }
        });
      }
      setContextMenu(null);
      return;
    }

    if (action === 'undone') {
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type === 'customTask') {
        const updatedTask = {
          status: 'inprogress',
          completedAt: null,
          scheduledForToday: true,
        };
        window.db.updateTask(node.data.taskId, updatedTask).then(() => {
          setNodes(currentNodes =>
            currentNodes.map(n =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, completedAt: null, status: 'inprogress' } }
                : n
            )
          );
          refreshData();
          if (onRefreshKanban) {
            onRefreshKanban();
          }
        });
      }
      setContextMenu(null);
      return;
    }

    if (action.startsWith('addAttachment:')) {
      const attachmentType = action.split(':')[1];
      const attachment = attachmentTypes.find(a => a.id === attachmentType);
      if (attachment) {
        const flowPosition = position || (contextMenu.flowX !== undefined ? { x: contextMenu.flowX, y: contextMenu.flowY } : null);
        handleAddAttachment(attachment, nodeId, flowPosition);
      }
      setContextMenu(null);
      setShowAttachmentSubmenu(false);
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
          const newAttachmentNode = {
            id: String(nodeId + Date.now()),
            type: 'customAttachment',
            data: {
              ...node.data,
              name: `${node.data.name} (Copy)`,
            },
            position: {
              x: node.position.x + 150,
              y: node.position.y + 20,
            },
            parentNode: node.parentNode,
            extent: node.extent
          };
          
          setNodes((nds) => [...nds, newAttachmentNode]);
          setNodeId((id) => id + 1);
        }
        break;
        
      case 'returnToLibrary': {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.type !== 'customTask') break;

        // Delete from DB
        window.db.deleteTimelineNode(node.data.dbId);
        const edgesToRemove = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
        edgesToRemove.forEach(edge => window.db.deleteTimelineEdge({ sourceId: edge.source, targetId: edge.target }));

        // Update state
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
        
        if (node.data.taskId) {
          setTasksInNodes(prev => {
            const newSet = new Set(prev);
            newSet.delete(node.data.taskId);
            return newSet;
          });
        }

        // Handle connected subflow
        const connectedSubflow = nodes.find(n => n.type === 'customSubflow' && n.data.taskId === nodeId);
        if (connectedSubflow) {
          setNodes(nds => nds.map(n => {
            if (n.id === connectedSubflow.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  taskId: null,
                  label: 'Standalone Attachments'
                }
              };
            }
            return n;
          }));
        }
        
        setContextMenu(null);
        break;
      }
      case 'delete':
        if (node.type === 'customAttachment') {
          setNodes((nds) => nds.filter((n) => n.id !== nodeId));
          const edgesToRemove = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
          edgesToRemove.forEach(edge => window.db.deleteTimelineEdge({ sourceId: edge.source, targetId: edge.target }));
          setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
          
          if (node.parentNode) {
            const subflowNode = nodes.find(n => n.id === node.parentNode);
            if (subflowNode) {
              const remainingAttachments = nodes.filter(n =>
                n.parentNode === node.parentNode &&
                n.type === 'customAttachment' &&
                n.id !== nodeId
              );
              
              if (remainingAttachments.length === 1) {
                const lastAttachment = remainingAttachments[0];
                const taskNode = nodes.find(n => n.data.taskId && subflowNode.data.taskId === n.id);
                
                if (taskNode && lastAttachment) {
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

  const handleAddAttachment = useCallback((attachment, taskNodeId, position) => {
    const newNodeId = nodeId;
    
    if (taskNodeId) {
      const taskNode = nodes.find(n => n.id === taskNodeId);
      if (!taskNode) return;

      const existingAttachments = edges.filter(edge =>
        edge.source === taskNode.id && edge.sourceHandle === 'attachment-right'
      ).length;
      
      const existingSubflow = nodes.find(node =>
        node.type === 'customSubflow' && node.data.taskId === taskNode.id
      );

      if (existingAttachments === 0) {
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
          
          const updatedExistingAttachment = {
            ...existingAttachmentNode,
            position: getAttachmentPositionInSubflow(0, 2),
            parentNode: subflowId,
            extent: 'parent'
          };
          
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
          
          setNodes(currentNodes => [
            ...currentNodes.filter(n => n.id !== existingAttachmentNode.id),
            newSubflowNode,
            updatedExistingAttachment,
            newAttachmentNode
          ]);
          
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
      const flowPosition = position || { x: 100, y: 100 };
      
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
      
      window.db.updateTimelineNodeFinished(selectedNode.data.dbId, newFinishedState).then(() => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === selectedNode.id
              ? { ...n, data: { ...n.data, isFinished: newFinishedState } }
              : n
          )
        );
      });
      
      setEdges(currentEdges => {
        let updatedEdges = currentEdges;
        
        if (newFinishedState) {
          updatedEdges = currentEdges.filter(edge =>
            !(edge.source === selectedNode.id && edge.sourceHandle === 'bottom')
          );
        }
        
        return updatedEdges.map(edge => {
          if (edge.source === selectedNode.id) {
            const shouldAnimate = !newFinishedState && !selectedNode.data.completedAt;
            return { ...edge, animated: shouldAnimate };
          }
          if (edge.target === selectedNode.id && edge.sourceHandle === 'bottom') {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const shouldAnimate = (sourceNode && !sourceNode.data.isFinished && !sourceNode.data.completedAt) ||
                                 (!newFinishedState && !selectedNode.data.completedAt);
            return { ...edge, animated: shouldAnimate };
          }
          return edge;
        });
      });
    }
  };

  const handleNodeDelete = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
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

  const onAttachmentDragStart = (event, attachment) => {
    event.dataTransfer.setData('application/attachment', JSON.stringify(attachment));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedAttachment(attachment);
  };

  const onAttachmentDragEnd = () => {
    setDraggedAttachment(null);
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
  };

  const onNodeDrag = useCallback((_, draggedNode) => {
    const intersections = getIntersectingNodes(draggedNode);
    
    const validIntersections = intersections.filter(intersectingNode =>
      (draggedNode.type === 'customAttachment' && !draggedNode.parentNode && intersectingNode.type === 'customTask') ||
      (draggedNode.type === 'customTask' && intersectingNode.type === 'customAttachment' && !intersectingNode.parentNode) ||
      (draggedNode.type === 'customTask' && intersectingNode.type === 'customTask' && draggedNode.id !== intersectingNode.id)
    );

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isDropTarget: validIntersections.some(intersection => intersection.id === node.id)
        }
      }))
    );

    setEdges((currentEdges) => {
      const permanentEdges = currentEdges.filter((e) => e.className !== 'temp');

      if (validIntersections.length > 0) {
        const tempEdges = [];
        
        validIntersections.forEach(intersectingNode => {
          if (draggedNode.type === 'customAttachment') {
            tempEdges.push({
              id: `temp-subflow-${intersectingNode.id}-${draggedNode.id}`,
              source: intersectingNode.id,
              target: `temp-subflow-${intersectingNode.id}`,
              sourceHandle: 'attachment-right',
              targetHandle: null,
              style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5,5' },
              className: 'temp',
              type: 'default',
              animated: false
            });
          } else if (draggedNode.type === 'customTask' && intersectingNode.type === 'customTask') {
            tempEdges.push({
              id: `temp-task-${intersectingNode.id}-${draggedNode.id}`,
              source: intersectingNode.id,
              target: draggedNode.id,
              sourceHandle: 'bottom',
              targetHandle: 'top',
              style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' },
              className: 'temp',
              type: 'default',
              animated: false
            });
          }
        });

        return [...permanentEdges, ...tempEdges];
      }

      return permanentEdges;
    });
  }, [getIntersectingNodes, setNodes, setEdges]);

  const onNodeDragStop = useCallback(async (_, draggedNode) => {
    if (draggedNode.data.dbId) {
      try {
        await window.db.updateTimelineNodePosition(draggedNode.data.dbId, draggedNode.position);
      } catch (error) {
        console.error('Failed to update node position:', error);
      }
    }
    const intersections = getIntersectingNodes(draggedNode);
    
    const validIntersections = intersections.filter(intersectingNode =>
      (draggedNode.type === 'customAttachment' && !draggedNode.parentNode && intersectingNode.type === 'customTask') ||
      (draggedNode.type === 'customTask' && intersectingNode.type === 'customAttachment' && !intersectingNode.parentNode) ||
      (draggedNode.type === 'customSubflow' && !draggedNode.data.taskId && intersectingNode.type === 'customTask') ||
      (draggedNode.type === 'customTask' && intersectingNode.type === 'customSubflow' && !intersectingNode.data.taskId) ||
      (draggedNode.type === 'customTask' && intersectingNode.type === 'customTask' && draggedNode.id !== intersectingNode.id)
    );

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isDropTarget: false
        }
      }))
    );

    const taskToTaskIntersection = validIntersections.find(node =>
      draggedNode.type === 'customTask' && node.type === 'customTask' && node.id !== draggedNode.id
    );
    
    if (taskToTaskIntersection) {
      const existingConnection = edges.find(edge =>
        edge.className !== 'temp' && (
          (edge.source === draggedNode.id && edge.target === taskToTaskIntersection.id) ||
          (edge.source === taskToTaskIntersection.id && edge.target === draggedNode.id)
        )
      );
      
      if (!existingConnection) {
        const isActiveConnection = (!draggedNode.data.isFinished && !draggedNode.data.completedAt) ||
                                 (!taskToTaskIntersection.data.isFinished && !taskToTaskIntersection.data.completedAt);
        
        const belowPosition = {
          x: taskToTaskIntersection.position.x,
          y: taskToTaskIntersection.position.y + 150
        };
        
        const hasTaskBelow = nodes.some(node =>
          node.id !== draggedNode.id &&
          node.id !== taskToTaskIntersection.id &&
          node.type === 'customTask' &&
          Math.abs(node.position.x - belowPosition.x) < 100 &&
          Math.abs(node.position.y - belowPosition.y) < 100
        );
        
        const newPosition = hasTaskBelow
          ? {
              x: taskToTaskIntersection.position.x + 280,
              y: taskToTaskIntersection.position.y + 130
            }
          : belowPosition;
        
        setNodes((currentNodes) =>
          currentNodes.map(node =>
            node.id === draggedNode.id
              ? { ...node, position: newPosition }
              : node
          )
        );

        const newEdge = {
          id: `task-${taskToTaskIntersection.id}-${draggedNode.id}`,
          source: taskToTaskIntersection.id,
          target: draggedNode.id,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'default',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          animated: isActiveConnection
        };

        window.db.createTimelineEdge({
          sourceId: newEdge.source,
          targetId: newEdge.target,
          listId: selectedList.id
        }).then(createdEdge => {
          newEdge.id = createdEdge.id;
          setEdges((currentEdges) => [
            ...currentEdges.filter((e) => e.className !== 'temp'),
            newEdge
          ]);
        });
      } else {
        setEdges((currentEdges) => currentEdges.filter((e) => e.className !== 'temp'));
      }
      return;
    }

    if (validIntersections.length > 0 && draggedNode.type === 'customSubflow' && !draggedNode.data.taskId) {
      const targetTask = validIntersections[0];
      
      const existingSubflow = nodes.find(node =>
        node.type === 'customSubflow' && node.data.taskId === targetTask.id
      );
      
      if (!existingSubflow) {
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
        
        const isActiveTask = !targetTask.data.isFinished && !targetTask.data.completedAt;
        
        const newEdge = {
          id: `subflow-${targetTask.id}-${draggedNode.id}`,
          source: targetTask.id,
          target: draggedNode.id,
          sourceHandle: 'attachment-right',
          targetHandle: null,
          type: 'default',
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          animated: isActiveTask
        };

        window.db.createTimelineEdge({
          sourceId: newEdge.source,
          targetId: newEdge.target,
          listId: selectedList.id
        }).then(createdEdge => {
          newEdge.id = createdEdge.id;
          setEdges((currentEdges) => [
            ...currentEdges.filter((e) => e.className !== 'temp'),
            newEdge
          ]);
        });
      }
    }
    else if (validIntersections.length > 0 && draggedNode.type === 'customAttachment' && !draggedNode.parentNode) {
      const targetTask = validIntersections[0];
      
      const existingSubflow = nodes.find(node =>
        node.type === 'customSubflow' && node.data.taskId === targetTask.id
      );
      
      let existingAttachments = 0;
      if (existingSubflow) {
        existingAttachments = nodes.filter(node =>
          node.parentNode === existingSubflow.id && node.type === 'customAttachment'
        ).length;
      } else {
        existingAttachments = edges.filter(edge =>
          edge.source === targetTask.id &&
          edge.sourceHandle === 'attachment-right' &&
          edge.className !== 'temp'
        ).length;
      }
      
      if (existingAttachments === 0 && !existingSubflow) {
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

        window.db.createTimelineEdge({
          sourceId: newEdge.source,
          targetId: newEdge.target,
          listId: selectedList.id
        }).then(createdEdge => {
          newEdge.id = createdEdge.id;
          setEdges((currentEdges) => {
            let updatedEdges = currentEdges.filter((e) => e.className !== 'temp');
            
            updatedEdges = updatedEdges.filter(edge =>
              edge.target !== draggedNode.id && edge.source !== draggedNode.id
            );
            
            updatedEdges.push(newEdge);
            return updatedEdges;
          });
        });
        
      } else if (existingAttachments === 1 && !existingSubflow) {
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
          
          const newEdge = {
            id: `subflow-${targetTask.id}-${subflowId}`,
            source: targetTask.id,
            target: subflowId,
            sourceHandle: 'attachment-right',
            targetHandle: null,
            type: 'default',
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
            animated: false
          };

          window.db.createTimelineEdge({
            sourceId: newEdge.source,
            targetId: newEdge.target,
            listId: selectedList.id
          }).then(createdEdge => {
            newEdge.id = createdEdge.id;
            setEdges((currentEdges) => {
              let updatedEdges = currentEdges.filter((e) => e.className !== 'temp');
              
              updatedEdges = updatedEdges.filter(edge =>
                edge.id !== existingAttachmentEdge.id &&
                edge.target !== draggedNode.id &&
                edge.source !== draggedNode.id
              );
              
              updatedEdges.push(newEdge);
              
              return updatedEdges;
            });
          });
        }
        
      } else if (existingSubflow) {
        const currentAttachments = nodes.filter(node =>
          node.parentNode === existingSubflow.id && node.type === 'customAttachment'
        );
        
        const newAttachmentCount = currentAttachments.length + 1;
        const { width, height } = calculateSubflowLayout(newAttachmentCount);
        
        const updatedAttachments = currentAttachments.map((attachment, index) => ({
          ...attachment,
          position: getAttachmentPositionInSubflow(index, newAttachmentCount)
        }));
        
        setNodes((currentNodes) => [
          ...currentNodes.filter(node =>
            node.id !== draggedNode.id &&
            node.id !== existingSubflow.id &&
            !currentAttachments.some(att => att.id === node.id)
          ),
          {
            ...existingSubflow,
            data: { ...existingSubflow.data, attachmentCount: newAttachmentCount },
            style: { width, height }
          },
          ...updatedAttachments,
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
      setEdges((currentEdges) => currentEdges.filter((e) => e.className !== 'temp'));
    }
  }, [getIntersectingNodes, setNodes, setEdges, nodes]);

  const autoArrangeGroups = () => {
    const taskNodes = nodes.filter(node => node.type === 'customTask');
    const subflowNodes = nodes.filter(node => node.type === 'customSubflow');
    
    let updatedNodes = [...nodes];
    
    taskNodes.forEach(taskNode => {
      const connectedSubflow = subflowNodes.find(subflow =>
        subflow.data.taskId === taskNode.id
      );
      
      if (connectedSubflow) {
        const attachmentsInSubflow = nodes.filter(node =>
          node.parentNode === connectedSubflow.id && node.type === 'customAttachment'
        );
        
        const attachmentCount = attachmentsInSubflow.length;
        const { width, height } = calculateSubflowLayout(attachmentCount);
        
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
        
        attachmentsInSubflow.forEach((attachment, index) => {
          const newPosition = getAttachmentPositionInSubflow(index, attachmentCount);
          
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

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center justify-center" style={{ height: 'calc(100vh - 122px)', minHeight: 0, minWidth: 0 }}>
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading timeline tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full flex-col items-center justify-center" style={{ height: 'calc(100vh - 122px)', minHeight: 0, minWidth: 0 }}>
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <X className="mx-auto h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Failed to Load Timeline</h3>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selectedList) {
    return (
      <div className="flex w-full flex-col items-center justify-center" style={{ height: 'calc(100vh - 122px)', minHeight: 0, minWidth: 0 }}>
        <div className="text-center">
          <div className="mb-4 text-muted-foreground">
            <List className="mx-auto h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">No List Selected</h3>
          <p className="text-sm text-muted-foreground">Please select a task list to view the timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col" style={{ height: 'calc(100vh - 122px)', minHeight: 0, minWidth: 0 }}>
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

      <div className="relative flex flex-row" style={{ height: 'calc(100vh - 122px - 3rem)' }}>
        <TaskListSidebar
          search={search}
          setSearch={setSearch}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          filteredColumns={filteredColumns}
          tasksInNodes={tasksInNodes}
          draggedTask={draggedTask}
          onDragStart={onDragStart}
          onTaskDragEnd={onTaskDragEnd}
          draggedAttachment={draggedAttachment}
          onAttachmentDragStart={onAttachmentDragStart}
          onAttachmentDragEnd={onAttachmentDragEnd}
        />

        <div className="relative flex h-full min-w-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-900" style={{
          marginLeft: '17.8rem',
          marginRight: sidebarOpen ? '20rem' : '0'
        }}>
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2 dark:bg-zinc-800">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              {allTasks.length === 0
                ? "No tasks found in this list. Create some tasks to get started."
                : timelineNodes.length === 0
                ? "No completed tasks found. Complete some tasks to see them in the timeline."
                : "Drag tasks from the library to create your timeline flow"
              }
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{nodes.length} blocks</span>
              <span>{edges.length} connections</span>
              <span>Complexity: {Math.max(1, Math.floor(nodes.length / 2))}</span>
            </div>
          </div>
          <div
            ref={reactFlowWrapper}
            className='h-full w-full overflow-hidden'
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={() => setSidebarOpen(false)}
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
            
            <ContextMenu
              contextMenu={contextMenu}
              handleContextMenuAction={handleContextMenuAction}
              nodes={nodes}
              showAttachmentSubmenu={showAttachmentSubmenu}
              showDeleteGroupConfirm={showDeleteGroupConfirm}
            />
          </div>
        </div>

        <AnimatePresence>
          {sidebarOpen && selectedNode && (
            <PropertiesSidebar
              selectedNode={selectedNode}
              handleSidebarClose={handleSidebarClose}
              handleMakeFinish={handleMakeFinish}
              handleNodeDelete={handleNodeDelete}
            />
          )}
        </AnimatePresence>
      </div>
      
      {showAttachmentList && (
        <AttachmentListModal
          setShowAttachmentList={setShowAttachmentList}
          nodes={nodes}
          edges={edges}
        />
      )}
      
    </div>
  );
}

function TaskFlowTimeline({ selectedList, onRefreshKanban }) {
  return (
    <ReactFlowProvider>
      <TaskFlowTimelineInner selectedList={selectedList} onRefreshKanban={onRefreshKanban} />
    </ReactFlowProvider>
  );
}

export default TaskFlowTimeline;