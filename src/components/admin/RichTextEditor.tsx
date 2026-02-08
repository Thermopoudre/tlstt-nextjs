'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  storageBucket?: string // for image upload
  storageFolder?: string
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Commencez à écrire...',
  storageBucket = 'gallery',
  storageFolder = 'articles',
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] focus:outline-none p-4',
      },
    },
  })

  if (!editor) return null

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `${storageFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(fileName, file, { contentType: file.type })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(fileName)

      editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addLink = () => {
    const url = window.prompt('Entrez l\'URL du lien :')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const ToolButton = ({
    onClick,
    active,
    icon,
    title,
    disabled,
  }: {
    onClick: () => void
    active?: boolean
    icon: string
    title: string
    disabled?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <i className={`fas fa-${icon}`}></i>
    </button>
  )

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Format group */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
          <ToolButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            icon="bold"
            title="Gras (Ctrl+B)"
          />
          <ToolButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            icon="italic"
            title="Italique (Ctrl+I)"
          />
          <ToolButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            icon="underline"
            title="Souligné (Ctrl+U)"
          />
          <ToolButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            icon="strikethrough"
            title="Barré"
          />
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
          <ToolButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            icon="heading"
            title="Titre principal"
          />
          <ToolButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            icon="h"
            title="Sous-titre"
          />
          <ToolButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive('paragraph')}
            icon="paragraph"
            title="Paragraphe"
          />
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
          <ToolButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            icon="list-ul"
            title="Liste à puces"
          />
          <ToolButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            icon="list-ol"
            title="Liste numérotée"
          />
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
          <ToolButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            icon="align-left"
            title="Aligner à gauche"
          />
          <ToolButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            icon="align-center"
            title="Centrer"
          />
          <ToolButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            icon="align-right"
            title="Aligner à droite"
          />
        </div>

        {/* Insert */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
          <ToolButton onClick={addLink} active={editor.isActive('link')} icon="link" title="Ajouter un lien" />
          {editor.isActive('link') && (
            <ToolButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              icon="unlink"
              title="Supprimer le lien"
            />
          )}
          <ToolButton
            onClick={() => fileInputRef.current?.click()}
            icon="image"
            title="Insérer une image"
            disabled={uploading}
          />
        </div>

        {/* Block */}
        <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
          <ToolButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            icon="quote-left"
            title="Citation"
          />
          <ToolButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            icon="minus"
            title="Ligne horizontale"
          />
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 pl-2">
          <ToolButton
            onClick={() => editor.chain().focus().undo().run()}
            icon="undo"
            title="Annuler (Ctrl+Z)"
            disabled={!editor.can().undo()}
          />
          <ToolButton
            onClick={() => editor.chain().focus().redo().run()}
            icon="redo"
            title="Rétablir (Ctrl+Y)"
            disabled={!editor.can().redo()}
          />
        </div>
      </div>

      {/* Upload indicator */}
      {uploading && (
        <div className="bg-blue-50 px-4 py-2 flex items-center gap-2 text-sm text-blue-700">
          <i className="fas fa-spinner fa-spin"></i>
          Upload de l&apos;image en cours...
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Footer info */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
        <span>
          <i className="fas fa-info-circle mr-1"></i>
          Astuce : Ctrl+B pour le gras, Ctrl+I pour l&apos;italique
        </span>
        <span>{editor.storage.characterCount?.characters?.() || 0} caractères</span>
      </div>
    </div>
  )
}
