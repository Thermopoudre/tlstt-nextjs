'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EditAlbumPageProps {
  params: Promise<{ id: string }>
}

export default function EditAlbumPage({ params }: EditAlbumPageProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [albumId, setAlbumId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_type: 'competition' as 'competition' | 'entrainement' | 'evenement' | 'autre',
    is_published: false,
  })

  const [photos, setPhotos] = useState<any[]>([])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => {
      setAlbumId(id)
      loadAlbum(id)
      loadPhotos(id)
    })
  }, [])

  const loadAlbum = async (id: string) => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setFormData({
        title: data.title,
        description: data.description || '',
        event_date: data.event_date.split('T')[0],
        event_type: data.event_type,
        is_published: data.is_published,
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const loadPhotos = async (id: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', id)
      .order('position')
    
    if (data) setPhotos(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!albumId) return

    setSaving(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('albums')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', albumId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Album mis à jour !' })
      
      setTimeout(() => {
        router.push('/admin/galerie')
      }, 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleAddPhotoByUrl = async () => {
    if (!newPhotoUrl || !albumId) return

    setUploadingPhoto(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('photos')
        .insert([{
          album_id: parseInt(albumId),
          image_url: newPhotoUrl,
          position: photos.length,
        }])

      if (error) throw error

      setNewPhotoUrl('')
      await loadPhotos(albumId)
      setMessage({ type: 'success', text: 'Photo ajoutée !' })
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur ajout photo' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !albumId) return

    setUploadingPhoto(true)
    const supabase = createClient()
    let uploaded = 0

    try {
      for (const file of Array.from(files)) {
        uploaded++
        setUploadProgress(`Upload ${uploaded}/${files.length} : ${file.name}`)

        // Generate unique filename
        const ext = file.name.split('.').pop()
        const fileName = `album-${albumId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(fileName, file, { contentType: file.type })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(fileName)

        // Insert photo record
        await supabase.from('photos').insert([{
          album_id: parseInt(albumId),
          image_url: urlData.publicUrl,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          position: photos.length + uploaded - 1,
        }])
      }

      await loadPhotos(albumId)
      setMessage({ type: 'success', text: `${files.length} photo(s) uploadée(s) !` })
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload' })
    } finally {
      setUploadingPhoto(false)
      setUploadProgress('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Supprimer cette photo ?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)

    if (!error && albumId) {
      await loadPhotos(albumId)
      setMessage({ type: 'success', text: 'Photo supprimée' })
    }
  }

  const handleDelete = async () => {
    if (!albumId || !confirm('Supprimer cet album et toutes ses photos ?')) return

    setDeleting(true)
    const supabase = createClient()

    try {
      // Delete photos from storage
      const { data: storageFiles } = await supabase.storage
        .from('gallery')
        .list(`album-${albumId}`)

      if (storageFiles && storageFiles.length > 0) {
        const paths = storageFiles.map(f => `album-${albumId}/${f.name}`)
        await supabase.storage.from('gallery').remove(paths)
      }

      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId)

      if (error) throw error
      router.push('/admin/galerie')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier l&apos;album</h1>
          <p className="text-gray-600 mt-1">Gérez votre album et ses photos</p>
        </div>
        <Link href="/admin/galerie" className="text-gray-600 hover:text-gray-900">
          <i className="fas fa-times text-2xl"></i>
        </Link>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire album */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="competition">Compétition</option>
                <option value="entrainement">Entraînement</option>
                <option value="evenement">Événement</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-5 h-5 text-primary rounded"
                />
                <span className="text-sm font-medium text-gray-700">Publier l&apos;album</span>
              </label>
            </div>

            <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700"
              >
                <i className="fas fa-trash mr-2"></i>
                Supprimer
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-light"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>

        {/* Gestion photos */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              <i className="fas fa-images mr-2"></i>
              Photos ({photos.length})
            </h2>

            {/* Upload fichier */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-upload mr-1"></i>
                Uploader des photos
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-600">Cliquez ou glissez-déposez vos images ici</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP - Max 5MB par fichier</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {uploadingPhoto && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin text-primary"></i>
                  <span className="text-sm text-blue-700">{uploadProgress || 'Upload en cours...'}</span>
                </div>
              </div>
            )}

            {/* Ou par URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ou ajouter par URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleAddPhotoByUrl}
                  disabled={uploadingPhoto || !newPhotoUrl}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-light disabled:opacity-50"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.image_url}
                  alt={photo.caption || ''}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
                {photo.caption && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
