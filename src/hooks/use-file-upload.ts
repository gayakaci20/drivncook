import { useRef, useState, useCallback } from "react"

export interface FileWithId {
  id: string
  file: File | { type: string; name: string; size: number; url?: string }
}

export interface UseFileUploadOptions {
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

export interface UseFileUploadReturn {
  files: FileWithId[]
  isDragging: boolean
  errors: string[]
}

export interface UseFileUploadActions {
  handleDragEnter: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  openFileDialog: () => void
  removeFile: (id: string) => void
  clearFiles: () => void
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>
}

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export const useFileUpload = (
  options: UseFileUploadOptions = {}
): [UseFileUploadReturn, UseFileUploadActions] => {
  const {
    multiple = false,
    maxFiles = 1,
    maxSize = 5 * 1024 * 1024, // 5MB default
    accept,
    initialFiles = [],
    onFilesChange,
  } = options

  const [files, setFiles] = useState<FileWithId[]>(() =>
    initialFiles.map((file, index) => ({
      id: file.id || `${file.name}-${Date.now()}-${index}`,
      file,
    }))
  )
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${formatBytes(maxSize)}`
    }
    return null
  }

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: FileWithId[] = []
      const newErrors: string[] = []

      for (const file of newFiles) {
        if (files.length + validFiles.length >= maxFiles) {
          newErrors.push(`Maximum ${maxFiles} files allowed`)
          break
        }

        const error = validateFile(file)
        if (error) {
          newErrors.push(error)
          continue
        }

        validFiles.push({
          id: generateId(),
          file,
        })
      }

      if (validFiles.length > 0) {
        const updatedFiles = multiple 
          ? [...files, ...validFiles]
          : validFiles

        setFiles(updatedFiles)
        onFilesChange?.(updatedFiles)
      }

      setErrors(newErrors)
    },
    [files, maxFiles, maxSize, multiple, onFilesChange]
  )

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((file) => file.id !== id)
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles)
    },
    [files, onFilesChange]
  )

  const clearFiles = useCallback(() => {
    setFiles([])
    setErrors([])
    onFilesChange?.([])
  }, [onFilesChange])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounter.current = 0

      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    },
    [addFiles]
  )

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      addFiles(selectedFiles)
      // Reset input value to allow selecting the same file again
      e.target.value = ""
    },
    [addFiles]
  )

  const getInputProps = useCallback(
    (): React.InputHTMLAttributes<HTMLInputElement> => ({
      ref: inputRef,
      type: "file",
      multiple,
      accept,
      onChange: handleInputChange,
    }),
    [multiple, accept, handleInputChange]
  )

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
      getInputProps,
    },
  ]
}