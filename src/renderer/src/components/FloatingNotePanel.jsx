import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, X, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import useAppStore from '../stores/useAppStore'

const FloatingNotePanel = ({ listId, taskId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState([])
  const { noteTrigger, triggerNoteUpdate } = useAppStore((state) => ({
    noteTrigger: state.noteTrigger,
    triggerNoteUpdate: state.triggerNoteUpdate
  }))

  const fetchNotes = async () => {
    if (listId) {
      const fetchedNotes = await window.db.getNotes({ listId })
      const unlinkedNotes = fetchedNotes.filter(note => !note.taskId)
      setNotes(unlinkedNotes)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotes()
    }
  }, [isOpen, listId, noteTrigger])

  const handleCreateNote = async (content) => {
    if (content.trim()) {
      await window.db.createNote({
        content,
        listId,
        taskId
      })
      fetchNotes()
      triggerNoteUpdate()
    }
  }

  const handleDeleteNote = async (noteId) => {
    await window.db.deleteNote(noteId)
    fetchNotes()
    triggerNoteUpdate()
  }

  return (
    <>
      <div className="fixed bottom-4 left-20 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <FileText size={24} />
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
              <h3 className="font-semibold">Notes</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </Button>
            </div>
            <div className="p-3">
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                    <p className="text-sm">{note.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Input
                  placeholder="Add a note..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNote(e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingNotePanel