"use client"

import type React from "react"
import { useState, useCallback } from "react"
import {
  AlertCircleIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
  XIcon,
  CheckCircleIcon,
} from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing"
import { Button } from "@/components/ui/button"

const getFileIcon = (file: File | { type: string; name: string }) => {
  const fileType = file.type
  const fileName = file.name

  if (
    fileType.includes("pdf") ||
    fileName.endsWith(".pdf") ||
    fileType.includes("word") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return <FileTextIcon className="size-4 opacity-60" />
  } else if (
    fileType.includes("zip") ||
    fileType.includes("archive") ||
    fileName.endsWith(".zip") ||
    fileName.endsWith(".rar")
  ) {
    return <FileArchiveIcon className="size-4 opacity-60" />
  } else if (
    fileType.includes("excel") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx")
  ) {
    return <FileSpreadsheetIcon className="size-4 opacity-60" />
  } else if (fileType.includes("video/")) {
    return <VideoIcon className="size-4 opacity-60" />
  } else if (fileType.includes("audio/")) {
    return <HeadphonesIcon className="size-4 opacity-60" />
  } else if (fileType.startsWith("image/")) {
    return <ImageIcon className="size-4 opacity-60" />
  }
  return <FileIcon className="size-4 opacity-60" />
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

interface UploadedFile {
  name: string
  size: number
  type: string
  url: string
  key?: string
}

interface UploadThingFileUploadProps {
  maxSize?: number
  maxFiles?: number
  accept?: string
  label?: string
  description?: string
  documentType?: string
  onFilesChange?: (files: UploadedFile[]) => void
  initialFiles?: UploadedFile[]
}

export default function UploadThingFileUpload({
  maxSize = 8 * 1024 * 1024,  
  maxFiles = 1,
  accept = ".pdf,.jpg,.jpeg,.png",
  label = "Upload files",
  description,
  documentType = "document",
  onFilesChange,
  initialFiles = [],
}: UploadThingFileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string>("")

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: (res) => {
      console.log("Upload completed:", res)
      if (res && res.length > 0) {
        const newUploadedFiles = res.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          url: file.url,
          key: file.key,
        }))
        
        const updatedFiles = [...uploadedFiles, ...newUploadedFiles]
        setUploadedFiles(updatedFiles)
        setFiles([])
        onFilesChange?.(updatedFiles)
        setError("")
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error)
      setError(error.message || "Erreur lors du téléchargement")
      setFiles([])
    },
  })

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileSelection(droppedFiles)
  }, [])

  const handleFileSelection = (selectedFiles: File[]) => {
    setError("")
    
     
    if (uploadedFiles.length + selectedFiles.length > maxFiles) {
      setError(`Vous ne pouvez télécharger que ${maxFiles} fichier${maxFiles > 1 ? 's' : ''} maximum`)
      return
    }

     
    const validFiles: File[] = []
    for (const file of selectedFiles) {
      if (file.size > maxSize) {
        setError(`Le fichier "${file.name}" est trop volumineux (max ${formatBytes(maxSize)})`)
        return
      }
      validFiles.push(file)
    }

    setFiles(validFiles)
    
     
    if (validFiles.length > 0) {
      const formData = new FormData()
      formData.append("documentType", documentType)
      
      startUpload(validFiles, { documentType } as any)
    }
  }

  const openFileDialog = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = maxFiles > 1
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files) {
        handleFileSelection(Array.from(target.files))
      }
    }
    input.click()
  }

  const removeUploadedFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const clearAllFiles = () => {
    setUploadedFiles([])
    setFiles([])
    onFilesChange?.([])
    setError("")
  }

  const totalFiles = uploadedFiles.length + files.length

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-files={totalFiles > 0 || undefined}
        className="border-input data-[dragging=true]:bg-accent/50 flex min-h-32 flex-col items-center rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center"
      >
        {totalFiles > 0 ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-medium">
                {totalFiles > 1 ? `${totalFiles} fichiers` : "1 fichier"}
              </h3>
              {totalFiles > 1 && (
                <Button variant="outline" size="sm" onClick={clearAllFiles}>
                  <Trash2Icon
                    className="-ms-0.5 size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                  Tout supprimer
                </Button>
              )}
            </div>
            <div className="w-full space-y-2">
              {/* Uploaded files */}
              {uploadedFiles.map((file, index) => (
                <div
                  key={`uploaded-${index}`}
                  className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border bg-green-50 dark:bg-green-900/20">
                      <CheckCircleIcon className="size-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="truncate text-[13px] font-medium">
                        {file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatBytes(file.size)} • Téléchargé
                      </p>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                    onClick={() => removeUploadedFile(index)}
                    aria-label="Supprimer le fichier"
                  >
                    <XIcon className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}

              {/* Files being uploaded */}
              {files.map((file, index) => (
                <div
                  key={`uploading-${index}`}
                  className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                      {getFileIcon(file)}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="truncate text-[13px] font-medium">
                        {file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatBytes(file.size)} • {isUploading ? 'Téléchargement...' : 'En attente'}
                      </p>
                    </div>
                  </div>
                  {isUploading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  )}
                </div>
              ))}

              {totalFiles < maxFiles && !isUploading && (
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={openFileDialog}
                >
                  <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
                  Ajouter d'autres fichiers
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <FileIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">{label}</p>
            <p className="text-muted-foreground text-xs">
              {description || `Max ${maxFiles} fichier${maxFiles > 1 ? 's' : ''} • Jusqu'à ${formatBytes(maxSize)}`}
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={openFileDialog}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  Téléchargement...
                </>
              ) : (
                <>
                  <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
                  Sélectionner {maxFiles > 1 ? 'des fichiers' : 'un fichier'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}