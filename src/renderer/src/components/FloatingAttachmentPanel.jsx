import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paperclip, Upload, X, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import FileIcon from './FileIcon'
import useAppStore from '../stores/useAppStore'

const FloatingAttachmentPanel = ({ listId, taskId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [attachments, setAttachments] = useState([])
  const { attachmentTrigger, triggerAttachmentUpdate } = useAppStore((state) => ({
    attachmentTrigger: state.attachmentTrigger,
    triggerAttachmentUpdate: state.triggerAttachmentUpdate
  }))

  const fetchAttachments = async () => {
    if (listId) {
      const fetchedAttachments = await window.db.getAttachments({ listId })
      setAttachments(fetchedAttachments)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAttachments()
    }
  }, [isOpen, listId, attachmentTrigger])

  const handleFileSelect = async (event) => {
    const files = event.target.files
    if (files) {
      for (const file of files) {
        const newAttachment = {
          name: file.name,
          url: file.path, // Store file path
          fileType: file.type,
          listId: listId,
          taskId: taskId
        }
        await window.db.createAttachment(newAttachment)
      }
      fetchAttachments() // Refresh attachments
      triggerAttachmentUpdate()
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    await window.db.deleteAttachment(attachmentId)
    fetchAttachments() // Refresh attachments
    triggerAttachmentUpdate()
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <Paperclip size={24} />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 z-50 w-80 rounded-lg border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-semibold">Attachments</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </Button>
            </div>
            <div className="p-3">
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                    <button onClick={() => window.api.openFile(attachment.url)} className="flex items-center gap-2 text-sm text-foreground hover:underline">
                      <FileIcon fileName={attachment.name} />
                      <span className="max-w-48 truncate" title={attachment.name}>{attachment.name}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="attachment-upload"
                />
                <label
                  htmlFor="attachment-upload"
                  className="flex w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/50 p-4 text-center hover:bg-muted"
                >
                  <Upload size={16} className="mr-2" />
                  <span>Upload Files</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingAttachmentPanel