import { useState, useCallback, useRef, useEffect } from 'react'

export interface FileWithId {
  id: string
  file: File | { name: string; size: number; type: string; url?: string }
}

interface UseFileUploadOptions {
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  accept?: string
  initialFiles?: Array<{
    name: string
    size: number
    type: string
    url?: string
    id?: string
  }>
  onFilesChange?: (files: FileWithId[]) => void
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    multiple = false,
    maxFiles = 1,
    maxSize = 5 * 1024 * 1024,
    accept = '',
    initialFiles = [],
    onFilesChange
  } = options

  const [files, setFiles] = useState<FileWithId[]>(() =>
    initialFiles.map(file => ({
      id: file.id || Math.random().toString(36).substring(7),
      file: file
    }))
  )
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onFilesChange?.(files)
  }, [files, onFilesChange])

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `Le fichier ${file.name} est trop volumineux (max: ${formatBytes(maxSize)})`
    }
    
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const isValidType = acceptedTypes.some(type => 
        type === fileExtension || 
        file.type.includes(type.replace('*', ''))
      )
      
      if (!isValidType) {
        return `Type de fichier non autorisé: ${file.name}`
      }
    }
    
    return null
  }, [maxSize, accept])

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles: FileWithId[] = []
    const newErrors: string[] = []

    if (files.length + fileArray.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} fichier(s) autorisé(s)`)
      setErrors(newErrors)
      return
    }

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
      } else {
        validFiles.push({
          id: Math.random().toString(36).substring(7),
          file
        })
      }
    })

    if (newErrors.length > 0) {
      setErrors(newErrors)
    } else {
      setErrors([])
      setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles)
    }
  }, [files.length, maxFiles, validateFile, multiple])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
    setErrors([])
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
    setErrors([])
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }, [addFiles])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const getInputProps = useCallback(() => ({
    ref: fileInputRef,
    type: 'file' as const,
    multiple,
    accept,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
    }
  }), [multiple, accept, addFiles])

  return [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps
    }
  ] as const
}