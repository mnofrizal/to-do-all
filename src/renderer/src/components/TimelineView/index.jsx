import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import useTaskStore from '../../stores/useTaskStore'
import useAppStore from '../../stores/useAppStore'
import TaskNode from './CustomNodes/TaskNode'
import NoteNode from './CustomNodes/NoteNode'
import AttachmentNode from './CustomNodes/AttachmentNode'
import UrlNode from './CustomNodes/UrlNode'
import ContextMenu from './ContextMenu'
import AddTaskDialog from './AddTaskDialog'
import DetailSidebar from './DetailSidebar'

const nodeWidth = 200
const nodeHeight = 50
const horizontalSpacing = 150
const verticalSpacing = 100

const solidEdgeStyle = { strokeWidth: 2 }
const dashedEdgeStyle = { strokeDasharray: '5 5' }

const doneNodeStyle = {
  background: '#22c55e',
  color: 'white',
  border: '1px solid #16a34a',
  width: nodeWidth,
  height: nodeHeight
}

const inProgressNodeStyle = {
  background: '#f97316',
  color: 'white',
  border: '1px solid #ea580c',
  width: nodeWidth,
  height: nodeHeight
}

const startNodeStyle = {
  background: '#3b82f6',
  color: 'white',
  border: '1px solid #2563eb',
  width: nodeWidth,
  height: nodeHeight
}

const TimelineView = () => {
  const nodeTypes = useMemo(
    () => ({
      taskNode: TaskNode,
      noteNode: NoteNode,
      attachmentNode: AttachmentNode,
      urlNode: UrlNode
    }),
    []
  )

  const {
    taskColumns,
    createTask,
    deleteTask,
    deleteNote,
    deleteAttachment,
    detachNote,
    detachAttachment,
    detachUrl
  } = useTaskStore()
  const {
    selectedList,
    attachmentTrigger,
    noteTrigger,
    subtaskTrigger,
    urlTrigger,
    triggerAttachmentUpdate,
    triggerNoteUpdate,
    triggerUrlUpdate
  } = useAppStore((state) => ({
    selectedList: state.selectedList,
    attachmentTrigger: state.attachmentTrigger,
    noteTrigger: state.noteTrigger,
    subtaskTrigger: state.subtaskTrigger,
    urlTrigger: state.urlTrigger,
    triggerAttachmentUpdate: state.triggerAttachmentUpdate,
    triggerNoteUpdate: state.triggerNoteUpdate,
    triggerUrlUpdate: state.triggerUrlUpdate
  }))
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [menu, setMenu] = useState(null)
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const reactFlowWrapper = useRef(null)
  const { project } = useReactFlow()

  const onConnect = useCallback(
    async (params) => {
      const { source, target } = params
      const sourceNode = nodes.find((node) => node.id === source)
      const targetNode = nodes.find((node) => node.id === target)

      if (sourceNode && targetNode) {
        const sourceIsTask = sourceNode.type === 'taskNode'
        const targetIsTask = targetNode.type === 'taskNode'
        const sourceIsAttachment = sourceNode.type === 'attachmentNode'
        const targetIsAttachment = targetNode.type === 'attachmentNode'
        const sourceIsNote = sourceNode.type === 'noteNode'
        const targetIsNote = targetNode.type === 'noteNode'
        const sourceIsUrl = sourceNode.type === 'urlNode'
        const targetIsUrl = targetNode.type === 'urlNode'

        // Connect Attachment to Task
        if ((sourceIsAttachment && targetIsTask) || (targetIsAttachment && sourceIsTask)) {
          const attachmentNode = sourceIsAttachment ? sourceNode : targetNode
          const taskNode = sourceIsTask ? sourceNode : targetNode
          const attachmentId = parseInt(attachmentNode.id.split('-')[2])
          const taskId = parseInt(taskNode.id.split('-')[1])
          await window.db.updateAttachment(attachmentId, { taskId, listId: null })
          await useTaskStore.getState().loadTasks(selectedList.id)
          triggerAttachmentUpdate()
        }

        // Connect Note to Task
        if ((sourceIsNote && targetIsTask) || (targetIsNote && sourceIsTask)) {
          const noteNode = sourceIsNote ? sourceNode : targetNode
          const taskNode = sourceIsTask ? sourceNode : targetNode
          const noteId = parseInt(noteNode.id.split('-')[2])
          const taskId = parseInt(taskNode.id.split('-')[1])
          await window.db.updateNote(noteId, { taskId, listId: null })
          await useTaskStore.getState().loadTasks(selectedList.id)
          triggerNoteUpdate()
        }

        // Connect URL to Task
        if ((sourceIsUrl && targetIsTask) || (targetIsUrl && sourceIsTask)) {
          const urlNode = sourceIsUrl ? sourceNode : targetNode
          const taskNode = sourceIsTask ? sourceNode : targetNode
          const urlId = parseInt(urlNode.id.split('-')[2])
          const taskId = parseInt(taskNode.id.split('-')[1])
          await window.db.updateUrlNode(urlId, { taskId, listId: null })
          setNodes((nds) => nds.filter((node) => node.id !== urlNode.id))
          await useTaskStore.getState().loadTasks(selectedList.id)
        }
      }

      setEdges((eds) => addEdge(params, eds))
    },
    [nodes, setNodes, setEdges, triggerAttachmentUpdate, triggerNoteUpdate, selectedList]
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    async (event) => {
      event.preventDefault()

      if (!selectedList) return

      const files = event.dataTransfer.files

      if (files && files.length > 0) {
        for (const file of files) {
          await window.db.createAttachment({
            name: file.name,
            url: file.path,
            fileType: file.type,
            listId: selectedList.id
          })
        }
        triggerAttachmentUpdate()
      }
    },
    [project, selectedList, triggerAttachmentUpdate]
  )

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault()
      setMenu({
        x: event.clientX,
        y: event.clientY,
        node: null
      })
    },
    [setMenu]
  )

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault()
      setMenu({
        x: event.clientX,
        y: event.clientY,
        node
      })
    },
    [setMenu]
  )

  const onPaneClick = useCallback(() => {
    setMenu(null)
    setSelectedNode(null)
  }, [setMenu, setSelectedNode])

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  const handleAddTask = (title) => {
    createTask('today', title)
  }

  const handleAddAttachment = async () => {
    if (!selectedList) return

    const newAttachment = await window.db.createAttachment({
      name: 'New Attachment',
      url: null,
      fileType: null,
      listId: selectedList.id
    })
    triggerAttachmentUpdate()
  }

  const handleAddNote = async () => {
    if (!selectedList) return

    await window.db.createNote({
      content: '',
      listId: selectedList.id
    })
    triggerNoteUpdate()
  }

  const handleAddUrl = async () => {
    if (!selectedList) return

    await window.db.createUrlNode({
      url: '',
      listId: selectedList.id
    })
    triggerUrlUpdate()
  }

  const handleDeleteNode = (node) => {
    if (!node) return

    const idParts = node.id.split('-')

    if (node.type === 'taskNode') {
      const taskId = parseInt(idParts[1])
      deleteTask(taskId)
    } else if (node.type === 'noteNode') {
      const noteId = parseInt(idParts[idParts.length - 1])
      if (idParts.length > 2) {
        // Task-specific note
        const taskId = parseInt(idParts[1])
        deleteNote(taskId, noteId)
      } else {
        // List-specific note
        window.db.deleteNote(noteId).then(() => {
          triggerNoteUpdate()
        })
      }
    } else if (node.type === 'attachmentNode') {
      const attachmentId = parseInt(idParts[idParts.length - 1])
      if (idParts.length > 2) {
        // Task-specific attachment
        const taskId = parseInt(idParts[1])
        deleteAttachment(taskId, attachmentId)
      } else {
        // List-specific attachment
        window.db.deleteAttachment(attachmentId).then(() => {
          triggerAttachmentUpdate()
        })
      }
    } else if (node.type === 'urlNode') {
      const urlNodeId = parseInt(idParts[idParts.length - 1])
      window.db.deleteUrlNode(urlNodeId).then(() => {
        if (selectedList) {
          useTaskStore.getState().loadTasks(selectedList.id)
        } else {
          triggerUrlUpdate()
          setNodes((nds) => nds.filter((n) => n.id !== node.id))
        }
      })
    }
  }

  const handleDetachNode = (node) => {
    if (!node) return

    const idParts = node.id.split('-')
    const listId = selectedList.id

    if (node.type === 'noteNode') {
      const noteId = parseInt(idParts[idParts.length - 1])
      const taskId = parseInt(idParts[1])
      window.db.updateNote(noteId, { taskId: null, listId }).then(() => {
        detachNote(taskId, noteId)
        triggerNoteUpdate()
      })
    } else if (node.type === 'attachmentNode') {
      const attachmentId = parseInt(idParts[idParts.length - 1])
      const taskId = parseInt(idParts[1])
      window.db.updateAttachment(attachmentId, { taskId: null, listId }).then(() => {
        detachAttachment(taskId, attachmentId)
        triggerAttachmentUpdate()
      })
    } else if (node.type === 'urlNode') {
      const urlId = parseInt(idParts[idParts.length - 1])
      const taskId = parseInt(idParts[1])
      window.db.updateUrlNode(urlId, { taskId: null, listId }).then(() => {
        detachUrl(taskId, urlId)
        triggerUrlUpdate()
      })
    }
  }

  useEffect(() => {
    const generateLayout = async () => {
      if (!selectedList) return

      const allTasks = taskColumns.flatMap((column) => column.tasks)
      const doneTasks = allTasks
        .filter((task) => task.status === 'done')
        .sort((a, b) => (b.orderInColumn || 0) - (a.orderInColumn || 0))

      const inProgressTasks = allTasks.filter(
        (task) => task.status === 'inprogress' || task.status === 'today' || task.status === 'thisweek'
      )

      const initialNodes = []
      const initialEdges = []

      // Fetch list-specific notes and attachments
      const listNotes = await window.db.getNotes({ listId: selectedList.id })
      const listAttachments = await window.db.getAttachments({ listId: selectedList.id })
      const listUrlNodes = await window.db.getUrls({ listId: selectedList.id })

      // Layout for list-level notes and attachments
      let listNodeX = 0
      const listNodeY = -150 // Position them above the main flow

      listNotes.forEach((note, index) => {
        if (!note.taskId) {
          initialNodes.push({
            id: `list-note-${note.id}`,
            type: 'noteNode',
            data: { label: note.content, note },
            position: { x: listNodeX + index * (nodeWidth / 2 + 10), y: listNodeY }
          })
        }
      })

      listNodeX += listNotes.filter(n => !n.taskId).length * (nodeWidth / 2 + 10) + 50

      listAttachments.forEach((attachment, index) => {
        if (!attachment.taskId) {
          initialNodes.push({
            id: `list-attachment-${attachment.id}`,
            type: 'attachmentNode',
            data: { label: attachment.name, attachment },
            position: { x: listNodeX + index * (nodeWidth / 2 + 10), y: listNodeY }
          })
        }
      })

      listNodeX += listAttachments.filter(a => !a.taskId).length * (nodeWidth / 2 + 10) + 50

      listUrlNodes.forEach((urlNode, index) => {
        if (!urlNode.taskId) {
          initialNodes.push({
            id: `list-url-${urlNode.id}`,
            type: 'urlNode',
            data: { label: urlNode.url, urlNode },
            position: { x: listNodeX + index * (nodeWidth + 20), y: listNodeY }
          })
        }
      })

      let lastDoneNodeId = null
      let currentX = 0
      let currentY = 0

      const addNotesAndAttachments = (task, taskNodeId, taskX, taskY) => {
        if (task.notes && task.notes.length > 0) {
          task.notes.forEach((note, index) => {
            const noteNodeId = `note-${task.id}-${note.id}`
            initialNodes.push({
              id: noteNodeId,
              type: 'noteNode',
              data: { label: note.content, note },
              position: { x: taskX - horizontalSpacing, y: taskY + index * (nodeHeight + 10) }
            })
            initialEdges.push({
              id: `e-${taskNodeId}-to-${noteNodeId}`,
              source: taskNodeId,
              sourceHandle: 'notes',
              target: noteNodeId,
              type: 'smoothstep'
            })
          })
        }

        if (task.attachments && task.attachments.length > 0) {
          task.attachments.forEach((attachment, index) => {
            const attachmentNodeId = `attachment-${task.id}-${attachment.id}`
            initialNodes.push({
              id: attachmentNodeId,
              type: 'attachmentNode',
              data: { label: attachment.name, attachment },
              position: { x: taskX + nodeWidth + horizontalSpacing, y: taskY + index * (nodeHeight + 10) }
            })
            initialEdges.push({
              id: `e-${taskNodeId}-to-${attachmentNodeId}`,
              source: taskNodeId,
              sourceHandle: 'attachments',
              target: attachmentNodeId,
              type: 'smoothstep'
            })
          })
        }

        if (task.urlNodes && task.urlNodes.length > 0) {
          const attachmentCount = task.attachments?.length || 0
          task.urlNodes.forEach((urlNode, index) => {
            const urlNodeId = `url-${task.id}-${urlNode.id}`
            initialNodes.push({
              id: urlNodeId,
              type: 'urlNode',
              data: { label: urlNode.url, urlNode },
              position: {
                x: taskX + nodeWidth + horizontalSpacing,
                y: taskY + (attachmentCount + index) * (nodeHeight + 10)
              }
            })
            initialEdges.push({
              id: `e-${taskNodeId}-to-${urlNodeId}`,
              source: taskNodeId,
              sourceHandle: 'attachments', // Use the same handle as attachments
              target: urlNodeId,
              type: 'smoothstep'
            })
          })
        }
      }

      doneTasks.forEach((task) => {
        const nodeId = `task-${task.id}`
        initialNodes.push({
          id: nodeId,
          type: 'taskNode',
          data: {
            label: task.title,
            task,
            style: doneNodeStyle
          },
          position: { x: currentX, y: currentY }
        })

        addNotesAndAttachments(task, nodeId, currentX, currentY)

        if (lastDoneNodeId) {
          initialEdges.push({
            id: `e-${lastDoneNodeId}-to-${nodeId}`,
            source: lastDoneNodeId,
            target: nodeId,
            style: solidEdgeStyle
          })
        }
        lastDoneNodeId = nodeId
        currentY += nodeHeight + verticalSpacing
      })

      if (lastDoneNodeId) {
        currentX += nodeWidth + horizontalSpacing * 2
        currentY = 0 // Reset Y for the in-progress column
        inProgressTasks.forEach((task) => {
          const nodeId = `task-${task.id}`
          initialNodes.push({
            id: nodeId,
            type: 'taskNode',
            data: {
              label: task.title,
              task,
              style: inProgressNodeStyle
            },
            position: { x: currentX, y: currentY }
          })

          addNotesAndAttachments(task, nodeId, currentX, currentY)

          initialEdges.push({
            id: `e-${lastDoneNodeId}-to-${nodeId}`,
            source: lastDoneNodeId,
            target: nodeId,
            type: 'smoothstep',
            style: dashedEdgeStyle,
            animated: true
          })
          currentY += nodeHeight + verticalSpacing
        })
      } else {
        // If no tasks are done, connect all in-progress tasks from a virtual start node
        if (inProgressTasks.length > 0) {
          initialNodes.push({
            id: 'start',
            type: 'taskNode',
            data: {
              label: 'Start',
              style: startNodeStyle
            },
            position: { x: currentX, y: currentY }
          })
          currentX += nodeWidth + horizontalSpacing * 2
          inProgressTasks.forEach((task) => {
            const nodeId = `task-${task.id}`
            initialNodes.push({
              id: nodeId,
              type: 'taskNode',
              data: {
                label: task.title,
                task,
                style: inProgressNodeStyle
              },
              position: { x: currentX, y: currentY }
            })

            addNotesAndAttachments(task, nodeId, currentX, currentY)

            initialEdges.push({
              id: `e-start-to-${nodeId}`,
              source: 'start',
              target: nodeId,
              type: 'smoothstep',
              style: dashedEdgeStyle,
              animated: true
            })
            currentY += nodeHeight + verticalSpacing
          })
        }
      }

      setNodes(initialNodes)
      setEdges(initialEdges)

      // If a node is selected, find its updated version and update the state
      if (selectedNode) {
        const updatedNode = initialNodes.find((n) => n.id === selectedNode.id)
        if (updatedNode) {
          setSelectedNode(updatedNode)
        }
      }
    }

    generateLayout()
  }, [taskColumns, selectedList, attachmentTrigger, noteTrigger, subtaskTrigger, urlTrigger])

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
          {menu && (
            <ContextMenu
              x={menu.x}
              y={menu.y}
              onClose={() => setMenu(null)}
              onAddTask={() => setIsAddTaskDialogOpen(true)}
              onAddAttachment={handleAddAttachment}
              onAddNote={handleAddNote}
              onAddUrl={handleAddUrl}
              node={menu.node}
              onDelete={handleDeleteNode}
              onDetach={handleDetachNode}
            />
          )}
        </ReactFlow>
        <AddTaskDialog isOpen={isAddTaskDialogOpen} onClose={() => setIsAddTaskDialogOpen(false)} onAddTask={handleAddTask} />
        <DetailSidebar node={selectedNode} onClose={() => setSelectedNode(null)} />
      </ReactFlowProvider>
    </div>
  )
}

const TimelineViewWrapper = () => (
  <ReactFlowProvider>
    <TimelineView />
  </ReactFlowProvider>
)

export default TimelineViewWrapper