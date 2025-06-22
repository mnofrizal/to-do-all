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
  const [isEditingTaskTitle, setIsEditingTaskTitle] = useState(false)
  const [taskTitle, setTaskTitle] = useState(node?.data?.label || '')
  const [newUrl, setNewUrl] = useState('')
  const [newUrlName, setNewUrlName] = useState('')
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [editingNote, setEditingNote] = useState(null)
  const [editingUrl, setEditingUrl] = useState(null)
  const [editingAttachment, setEditingAttachment] = useState(null)
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

  React.useEffect(() => {
    if (node?.data?.label) {
      setTaskTitle(node.data.label)
    }
  }, [node, node?.data?.label])

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

  const handleAddUrl = async () => {
    if (newUrl.trim() && node && task) {
      await window.db.createUrlNode({
        name: newUrlName,
        url: newUrl,
        taskId: task.id
      })
      setNewUrl('')
      setNewUrlName('')
      if (selectedList) {
        useTaskStore.getState().loadTasks(selectedList.id)
      } else {
        triggerUrlUpdate()
      }
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
            {isEditingTaskTitle ? (
              <div className="space-y-2">
                <Input
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={async () => {
                      await window.db.updateTask(task.id, { title: taskTitle })
                      setIsEditingTaskTitle(false)
                      if (selectedList) {
                        useTaskStore.getState().loadTasks(selectedList.id)
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditingTaskTitle(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p onDoubleClick={() => setIsEditingTaskTitle(true)}><strong>Title:</strong> {taskTitle}</p>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingTaskTitle(true)}>Edit</Button>
                </div>
                <p><strong>Status:</strong> {task?.status || 'N/A'}</p>
              </div>
            )}

            {/* Subtasks */}
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Subtasks</h4>
              {task?.subtasks?.length > 0 ? (
                <ul>
                  {task.subtasks.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between space-x-2">
                      {editingSubtask?.id === sub.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingSubtask.title}
                            onChange={(e) => setEditingSubtask({ ...editingSubtask, title: e.target.value })}
                          />
                          <Button size="sm" onClick={async () => {
                            await updateSubtask(task.id, sub.id, { title: editingSubtask.title })
                            setEditingSubtask(null)
                          }}>Save</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingSubtask(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
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
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingSubtask(sub)}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSubtask(sub.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </>
                      )}
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
                      {editingAttachment?.id === att.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingAttachment.name}
                            onChange={(e) => setEditingAttachment({ ...editingAttachment, name: e.target.value })}
                          />
                          <Button size="sm" onClick={async () => {
                            await window.db.updateAttachment(att.id, { name: editingAttachment.name })
                            setEditingAttachment(null)
                            if (selectedList) {
                              useTaskStore.getState().loadTasks(selectedList.id)
                            }
                          }}>Save Name</Button>
                          <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               const input = document.createElement('input')
                               input.type = 'file'
                               input.onchange = async (e) => {
                                 const file = e.target.files[0]
                                 if (file) {
                                   await window.db.updateAttachment(att.id, {
                                     name: file.name,
                                     url: file.path,
                                     fileType: file.type
                                   })
                                   setEditingAttachment(null)
                                   if (selectedList) {
                                     useTaskStore.getState().loadTasks(selectedList.id)
                                   }
                                 }
                               }
                               input.click()
                             }}
                           >
                             Change File
                           </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingAttachment(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <Paperclip size={16} />
                            <span>{att.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingAttachment(att)}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(att.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </>
                      )}
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
                      {editingNote?.id === note.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingNote.content}
                            onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                          />
                          <Button size="sm" onClick={async () => {
                            await window.db.updateNote(note.id, { content: editingNote.content })
                            setEditingNote(null)
                            if (selectedList) {
                              useTaskStore.getState().loadTasks(selectedList.id)
                            }
                          }}>Save</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingNote(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <FileText size={16} />
                            <span>{note.content}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingNote(note)}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </>
                      )}
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

            {/* URLs */}
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">URLs</h4>
              {task?.urlNodes?.length > 0 ? (
                <ul>
                  {task.urlNodes.map((url) => (
                    <li key={url.id} className="flex items-center justify-between space-x-2">
                      {editingUrl?.id === url.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingUrl.name}
                            onChange={(e) => setEditingUrl({ ...editingUrl, name: e.target.value })}
                            placeholder="Name"
                          />
                          <Input
                            value={editingUrl.url}
                            onChange={(e) => setEditingUrl({ ...editingUrl, url: e.target.value })}
                             placeholder="URL"
                          />
                          <Button size="sm" onClick={async () => {
                            await window.db.updateUrlNode(url.id, { name: editingUrl.name, url: editingUrl.url })
                            setEditingUrl(null)
                            if (selectedList) {
                              useTaskStore.getState().loadTasks(selectedList.id)
                            }
                          }}>Save</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingUrl(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <a href={url.url} target="_blank" rel="noopener noreferrer">{url.name || url.url}</a>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingUrl(url)}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={async () => {
                              await window.db.deleteUrlNode(url.id)
                              if (selectedList) {
                                useTaskStore.getState().loadTasks(selectedList.id)
                              }
                            }}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No URLs.</p>
              )}
              <div className="mt-2 flex flex-col gap-2">
                <Input
                  placeholder="URL Name (optional)"
                  value={newUrlName}
                  onChange={(e) => setNewUrlName(e.target.value)}
                />
                <Input
                  placeholder="URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddUrl()
                    }
                  }}
                />
                <Button onClick={handleAddUrl}>Add URL</Button>
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
                      setIsEditingUrl(false)
                      if (selectedList) {
                        useTaskStore.getState().loadTasks(selectedList.id)
                      } else {
                        triggerUrlUpdate()
                      }
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