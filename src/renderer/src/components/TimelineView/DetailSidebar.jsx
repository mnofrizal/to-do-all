import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Paperclip, FileText, Plus, CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import useTaskStore from '../../stores/useTaskStore'
import useAppStore from '../../stores/useAppStore'

const DetailSidebar = ({ node, onClose }) => {
  const [newNote, setNewNote] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [urlName, setUrlName] = useState(node?.data?.urlNode?.name || '')
  const [urlValue, setUrlValue] = useState(node?.data?.urlNode?.url || '')
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteContent, setNoteContent] = useState(node?.data?.note?.content || '')
  const [isEditingAttachment, setIsEditingAttachment] = useState(false)
  const [attachmentName, setAttachmentName] = useState(node?.data?.attachment?.name || '')
  const [fileChangeSuccess, setFileChangeSuccess] = useState(false)
  const { addAttachment, deleteAttachment, addSubtask, deleteSubtask, updateSubtask, deleteTask, taskColumns } = useTaskStore()
  const { selectedList, triggerNoteUpdate, triggerAttachmentUpdate, triggerUrlUpdate } = useAppStore()

  React.useEffect(() => {
    if (node?.data?.urlNode) {
      setUrlName(node.data.urlNode.name || '')
      setUrlValue(node.data.urlNode.url || '')
    }
  }, [node, node?.data?.urlNode?.name, node?.data?.urlNode?.url])

  React.useEffect(() => {
    if (node?.data?.note) {
      setNoteContent(node.data.note.content || '')
    }
    if (node?.data?.attachment) {
      setAttachmentName(node.data.attachment.name || '')
    }
  }, [node, node?.data?.note?.content, node?.data?.attachment?.name])

  // Find the most up-to-date task data from the store
  const latestTaskData = node?.data?.task
    ? taskColumns
        .flatMap((col) => col.tasks)
        .find((t) => t.id === node.data.task.id)
    : null

  // Use latestTaskData if available, otherwise fallback to node.data.task
  const task = latestTaskData || node?.data?.task

  const handleAddNote = async () => {
    if (newNote.trim() && node && task) {
      await window.db.createNote({
        content: newNote,
        taskId: task.id
      })
      setNewNote('')
      triggerNoteUpdate()
      if (selectedList) {
        useTaskStore.getState().loadTasks(selectedList.id)
      }
    }
  }

  const handleDeleteNote = async (noteId) => {
    await window.db.deleteNote(noteId)
    triggerNoteUpdate()
    if (selectedList) {
      useTaskStore.getState().loadTasks(selectedList.id)
    }
  }

  const handleAddSubtask = async () => {
    if (newSubtask.trim() && node && task) {
      addSubtask(task.id, newSubtask)
      setNewSubtask('')
    }
  }

  const handleDeleteSubtask = (subtaskId) => {
    if (node && task) {
      deleteSubtask(task.id, subtaskId)
    }
  }

  const handleToggleSubtask = (subtaskId, completed) => {
    if (node && task) {
      updateSubtask(task.id, subtaskId, { completed: !completed })
    }
  }

  const handleAddAttachment = () => {
    if (node && task) {
      const input = document.createElement('input')
      input.type = 'file'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          const newAttachmentData = {
            name: file.name,
            url: file.path,
            fileType: file.type,
            taskId: task.id
          }
          addAttachment(task.id, newAttachmentData)
        }
      }
      input.click()
    }
  }

  const handleDeleteAttachment = (attachmentId) => {
    if (node && task) {
      deleteAttachment(task.id, attachmentId)
    }
  }

  const handleDelete = async () => {
    if (!node) return
    const { type, data } = node
    switch (type) {
      case 'taskNode':
        deleteTask(data.task.id)
        break
      case 'noteNode':
        await window.db.deleteNote(data.note.id)
        triggerNoteUpdate()
        break
      case 'attachmentNode':
        if (data.attachment.taskId) {
          deleteAttachment(data.attachment.taskId, data.attachment.id)
        } else {
          await window.db.deleteAttachment(data.attachment.id)
          triggerAttachmentUpdate()
        }
        break
      case 'urlNode':
        await window.db.deleteUrlNode(data.urlNode.id)
        if (selectedList) {
          useTaskStore.getState().loadTasks(selectedList.id)
        } else {
          triggerUrlUpdate()
        }
        break
      default:
        break
    }
    onClose()
  }

  const renderNodeDetails = () => {
    if (!node || !node.data) {
      return <p>No details available.</p>
    }

    const { type, data } = node

    switch (type) {
      case 'taskNode':
        return (
          <div>
            <h3 className="mb-2 text-lg font-semibold">Task Details</h3>
            <p><strong>Title:</strong> {data.label}</p>
            <p><strong>Status:</strong> {task?.status || 'N/A'}</p>

            {/* Subtasks */}
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Subtasks</h4>
              {task?.subtasks?.length > 0 ? (
                <ul>
                  {task.subtasks.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleToggleSubtask(sub.id, sub.completed)}>
                          <CheckCircle2
                            size={16}
                            className={sub.completed ? 'text-green-500' : 'text-muted-foreground'}
                          />
                        </button>
                        <span className={sub.completed ? 'line-through text-muted-foreground' : ''}>
                          {sub.title}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSubtask(sub.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No subtasks.</p>
              )}
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSubtask()
                    }
                  }}
                />
                <Button onClick={handleAddSubtask}>Add</Button>
              </div>
            </div>

            {/* Attachments */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="mb-2 font-semibold">Attachments</h4>
                <Button variant="ghost" size="sm" onClick={handleAddAttachment}>
                  <Plus size={16} className="mr-2" />
                  Add
                </Button>
              </div>
              {task?.attachments?.length > 0 ? (
                <ul>
                  {task.attachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2">
                        <Paperclip size={16} />
                        <span>{att.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(att.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No attachments.</p>
              )}
            </div>

            {/* Notes */}
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Notes</h4>
              {task?.notes?.length > 0 ? (
                <ul>
                  {task.notes.map((note) => (
                    <li key={note.id} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2">
                        <FileText size={16} />
                        <span>{note.content}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No notes.</p>
              )}
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNote()
                    }
                  }}
                />
                <Button onClick={handleAddNote}>Add</Button>
              </div>
            </div>
          </div>
        )
      case 'noteNode':
        return (
          <div>
            <h3 className="mb-2 text-lg font-semibold">Note Details</h3>
            {isEditingNote ? (
              <div className="space-y-2">
                <Input
                  placeholder="Note content"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={async () => {
                      await window.db.updateNote(data.note.id, { content: noteContent })
                      setIsEditingNote(false)
                      if (selectedList) {
                        useTaskStore.getState().loadTasks(selectedList.id)
                      } else {
                        triggerNoteUpdate()
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditingNote(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p>{noteContent}</p>
                <Button onClick={() => setIsEditingNote(true)}>Edit</Button>
              </div>
            )}
          </div>
        )
      case 'attachmentNode':
        return (
          <div>
            <h3 className="mb-2 text-lg font-semibold">Attachment Details</h3>
            {isEditingAttachment ? (
              <div className="space-y-2">
                <Input
                  placeholder="Attachment name"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.onchange = async (e) => {
                      const file = e.target.files[0]
                      if (file) {
                        await window.db.updateAttachment(data.attachment.id, {
                          name: file.name,
                          url: file.path,
                          fileType: file.type
                        })
                        setFileChangeSuccess(true)
                        setTimeout(() => setFileChangeSuccess(false), 3000)
                        if (selectedList) {
                          useTaskStore.getState().loadTasks(selectedList.id)
                        } else {
                          triggerAttachmentUpdate()
                        }
                      }
                    }
                    input.click()
                  }}
                >
                  Change File
                </Button>
                {fileChangeSuccess && <span className="text-sm text-green-500">File changed successfully!</span>}
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={async () => {
                      await window.db.updateAttachment(data.attachment.id, { name: attachmentName })
                      setIsEditingAttachment(false)
                      if (selectedList) {
                        useTaskStore.getState().loadTasks(selectedList.id)
                      } else {
                        triggerAttachmentUpdate()
                      }
                    }}
                  >
                    Save Name
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditingAttachment(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Name:</strong> {attachmentName}</p>
                <p><strong>Type:</strong> {data.attachment?.fileType || 'N/A'}</p>
                <Button onClick={() => setIsEditingAttachment(true)}>Edit</Button>
              </div>
            )}
          </div>
        )
      case 'urlNode':
        return (
          <div>
            <h3 className="mb-2 text-lg font-semibold">URL Details</h3>
            {isEditingUrl ? (
              <div className="space-y-2">
                <Input
                  placeholder="Name (optional)"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                />
                <Input
                  placeholder="URL"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={async () => {
                      await window.db.updateUrlNode(data.urlNode.id, { name: urlName, url: urlValue })
                      triggerUrlUpdate()
                      setIsEditingUrl(false)
                    }}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditingUrl(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {urlName || 'N/A'}
                </p>
                <p>
                  <strong>URL:</strong>{' '}
                  <a href={urlValue} target="_blank" rel="noopener noreferrer">
                    {urlValue}
                  </a>
                </p>
                <Button onClick={() => setIsEditingUrl(true)}>Edit</Button>
              </div>
            )}
          </div>
        )
      default:
        return <p>No details available for this node type.</p>
    }
  }

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 z-50 h-full w-96 border-l bg-card shadow-lg"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold">Details</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">{renderNodeDetails()}</div>
            <div className="border-t p-4">
              <Button variant="destructive" className="w-full" onClick={handleDelete}>
                Delete {node.type.replace('Node', '')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DetailSidebar