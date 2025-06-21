import {
  FileText,
  FileSpreadsheet,
  Presentation,
  StickyNote,
  Image,
  Music,
  Video,
  Archive,
  File,
} from 'lucide-react';

export const attachmentTypes = [
  { id: 'word', name: 'Word', icon: FileText, iconName: 'FileText', color: 'bg-blue-500', extension: '.docx' },
  { id: 'excel', name: 'Excel', icon: FileSpreadsheet, iconName: 'FileSpreadsheet', color: 'bg-green-500', extension: '.xlsx' },
  { id: 'powerpoint', name: 'PPT', icon: Presentation, iconName: 'Presentation', color: 'bg-orange-500', extension: '.pptx' },
  { id: 'notes', name: 'Notes', icon: StickyNote, iconName: 'StickyNote', color: 'bg-yellow-500', extension: '.txt' },
  { id: 'image', name: 'Image', icon: Image, iconName: 'Image', color: 'bg-purple-500', extension: '.jpg' },
  { id: 'audio', name: 'Audio', icon: Music, iconName: 'Music', color: 'bg-pink-500', extension: '.mp3' },
  { id: 'video', name: 'Video', icon: Video, iconName: 'Video', color: 'bg-red-500', extension: '.mp4' },
  { id: 'archive', name: 'Archive', icon: Archive, iconName: 'Archive', color: 'bg-gray-500', extension: '.zip' },
  { id: 'generic', name: 'File', icon: File, iconName: 'File', color: 'bg-slate-500', extension: '.file' },
];