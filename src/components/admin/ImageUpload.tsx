'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  label?: string
  className?: string
}

export default function ImageUpload({
  value,
  onChange,
  bucket = 'gallery',
  folder = 'uploads',
  label = 'Image',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { contentType: file.type })

    if (!error) {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)
      onChange(urlData.publicUrl)
    }
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleUpload(file)
  }

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          <img src={value} alt="Preview" className="w-full h-40 object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            title="Supprimer l'image"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        }`}
      >
        {uploading ? (
          <div className="text-primary">
            <i className="fas fa-spinner fa-spin text-2xl mb-1"></i>
            <p className="text-sm">Upload en cours...</p>
          </div>
        ) : (
          <>
            <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-1"></i>
            <p className="text-sm text-gray-600">Cliquez ou glissez une image ici</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Manual URL input */}
      <div className="mt-2">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <div className="flex-1 border-t border-gray-200"></div>
          <span>ou coller une URL</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>
    </div>
  )
}
