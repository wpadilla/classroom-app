// File utility functions for handling file operations

/**
 * Get Bootstrap icon class based on file MIME type or extension
 */
export function getFileIcon(type: string, filename?: string): string {
  const lowerType = type.toLowerCase();
  const extension = filename ? getFileExtension(filename).toLowerCase() : '';

  // PDF
  if (lowerType.includes('pdf') || extension === 'pdf') {
    return 'bi-filetype-pdf';
  }

  // PowerPoint
  if (lowerType.includes('presentation') ||
      ['ppt', 'pptx'].includes(extension)) {
    return 'bi-filetype-ppt';
  }

  // Word
  if (lowerType.includes('word') || lowerType.includes('document') ||
      ['doc', 'docx'].includes(extension)) {
    return 'bi-filetype-doc';
  }

  // Excel
  if (lowerType.includes('spreadsheet') || lowerType.includes('excel') ||
      ['xls', 'xlsx'].includes(extension)) {
    return 'bi-filetype-xls';
  }

  // Images
  if (lowerType.includes('image/png') || extension === 'png') {
    return 'bi-filetype-png';
  }
  if (lowerType.includes('image/jpeg') || lowerType.includes('image/jpg') ||
      ['jpg', 'jpeg'].includes(extension)) {
    return 'bi-filetype-jpg';
  }
  if (lowerType.includes('image/gif') || extension === 'gif') {
    return 'bi-filetype-gif';
  }
  if (lowerType.includes('image/svg') || extension === 'svg') {
    return 'bi-filetype-svg';
  }
  if (lowerType.includes('image')) {
    return 'bi-file-image';
  }

  // Video
  if (lowerType.includes('video/mp4') || extension === 'mp4') {
    return 'bi-filetype-mp4';
  }
  if (lowerType.includes('video/avi') || extension === 'avi') {
    return 'bi-filetype-avi';
  }
  if (lowerType.includes('video')) {
    return 'bi-file-play';
  }

  // Audio
  if (lowerType.includes('audio/mpeg') || extension === 'mp3') {
    return 'bi-filetype-mp3';
  }
  if (lowerType.includes('audio/wav') || extension === 'wav') {
    return 'bi-filetype-wav';
  }
  if (lowerType.includes('audio')) {
    return 'bi-file-music';
  }

  // Text/Code
  if (lowerType.includes('text') || ['txt'].includes(extension)) {
    return 'bi-filetype-txt';
  }
  if (['js', 'jsx'].includes(extension)) {
    return 'bi-filetype-js';
  }
  if (['ts', 'tsx'].includes(extension)) {
    return 'bi-filetype-tsx';
  }
  if (extension === 'json') {
    return 'bi-filetype-json';
  }

  // Archive
  if (lowerType.includes('zip') || extension === 'zip') {
    return 'bi-file-zip';
  }

  // Default
  return 'bi-file-earmark';
}

/**
 * Format file size from bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Validate file size (default max 50MB)
 */
export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Get color for file badge based on type
 */
export function getFileTypeColor(type: string): string {
  if (type.includes('pdf')) return 'danger';
  if (type.includes('presentation') || type.includes('ppt')) return 'warning';
  if (type.includes('word') || type.includes('doc')) return 'primary';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'success';
  if (type.includes('image')) return 'info';
  if (type.includes('video')) return 'dark';
  if (type.includes('audio')) return 'secondary';
  return 'secondary';
}
