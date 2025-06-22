import React from 'react';
import { File, FileImage, FileText, FileArchive, FileSpreadsheet,  } from 'lucide-react';

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
    return <FileImage className="h-4 w-4 text-muted-foreground" />;
  }

  switch (extension) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    case 'doc':
    case 'docx':
      return <File className="h-4 w-4 text-muted-foreground" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />;
    case 'ppt':
    case 'pptx':
      return <File className="text-red h-4 w-4" />;
    case 'zip':
    case 'rar':
      return <FileArchive className="h-4 w-4 text-muted-foreground" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
};

const FileIcon = ({ fileName }) => {
  return getFileIcon(fileName);
};

export default FileIcon;