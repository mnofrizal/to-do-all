import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Paperclip, Trash2 } from 'lucide-react'
import FileIcon from './FileIcon'

const ListFormDialog = ({
  isOpen,
  onClose,
  editingList,
  newListName,
  setNewListName,
  newListDescription,
  setNewListDescription,
  selectedColor,
  setSelectedColor,
  selectedIcon,
  iconFile,
  handleIconUpload,
  handleCreateList,
  colorOptions
}) => {
  const isEditMode = !!editingList

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit list' : 'Create a new list'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update your list name, color, and icon.' 
              : 'Create a new task list to organize your todos.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center">
          {/* Icon Preview */}
          <div className="mb-4">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white ${selectedColor}`}>
              {selectedIcon || newListName.charAt(0).toUpperCase() || 'L'}
            </div>
          </div>

          {/* Upload Icon Section */}
          <div className="mb-6">
            <h3 className="mb-1 text-sm font-semibold text-card-foreground">UPLOAD AN ICON</h3>
            <p className="mb-3 text-xs text-muted-foreground">Optional (jpg, png, svg)</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleIconUpload}
              className="hidden"
              id="icon-upload"
            />
            <label
              htmlFor="icon-upload"
              className="cursor-pointer text-xs text-primary hover:underline"
            >
              Choose file
            </label>
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <h3 className="mb-3 text-left text-sm font-medium text-card-foreground">Pick a list color</h3>
            <div className="flex justify-center space-x-2">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.class)}
                  className={`h-8 w-8 rounded-full transition-all ${color.class} ${
                    selectedColor === color.class
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:scale-110'
                  }`}
                  title={color.name}
                >
                  {selectedColor === color.class && (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white/30" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List Name Input */}
          <div className="mb-4">
            <Input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="h-10 rounded-lg border-2 border-primary/20 bg-background px-3 text-center focus:border-primary"
              placeholder="List name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateList()
                }
              }}
            />
          </div>

          {/* List Description Input */}
          <div className="mb-6">
            <Input
              value={newListDescription}
              onChange={(e) => setNewListDescription(e.target.value)}
              className="h-10 rounded-lg border-2 border-primary/20 bg-background px-3 text-center focus:border-primary"
              placeholder="List description (optional)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateList()
                }
              }}
            />
          </div>

        </div>

        <DialogFooter>
          <div className="flex w-full space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 flex-1 rounded-full border-2 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateList}
              disabled={!newListName.trim()}
              className="h-10 flex-1 rounded-full bg-gradient-to-r from-teal-400 to-green-400 font-medium text-white hover:from-teal-500 hover:to-green-500 disabled:opacity-50"
            >
              {isEditMode ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ListFormDialog