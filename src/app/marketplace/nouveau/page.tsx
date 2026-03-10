'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

type ListingType = 'vente' | 'echange' | 'don'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

export default function NouvelleAnnoncePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<ListingType>('vente')
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'bon',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)

  // Vérification accès membre validé
  const isMemberValidated =
    profile?.role === 'admin' ||
    profile?.role === 'member' ||
    profile?.is_validated === true

  if (!loading && !user) {
    router.push('/marketplace')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-[#3b9fd8]"></i>
      </div>
    )
  }

  // Membre connecté mais non validé
  if (!isMemberValidated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
          <div className="container-custom">
            <Breadcrumbs
              items={[
                { label: 'Marketplace', href: '/marketplace' },
                { label: 'Nouvelle annonce' },
              ]}
              className="text-gray-500 mb-6"
            />
            <h1 className="text-3xl font-bold text-white">Nouvelle annonce</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-5 py-16">
          <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-id-badge text-4xl text-yellow-500"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Réservé aux membres du club</h2>
            <p className="text-gray-400 mb-6">
              La publication d&apos;annonces est réservée aux membres licenciés du TLSTT validés par le secrétariat.
            </p>
            <Link
              href="/espace-membre"
              className="px-8 py-3 bg-[#3b9fd8] text-white rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors inline-block"
            >
              <i className="fas fa-user mr-2"></i>
              Mon espace membre
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('')
    const files = Array.from(e.target.files || [])
    const remaining = MAX_IMAGES - imageFiles.length

    if (files.length > remaining) {
      setImageError(`Vous pouvez ajouter au maximum ${MAX_IMAGES} images au total.`)
      return
    }

    const oversized = files.filter(f => f.size > MAX_IMAGE_SIZE_BYTES)
    if (oversized.length > 0) {
      setImageError(`Chaque image doit faire moins de ${MAX_IMAGE_SIZE_MB} Mo.`)
      return
    }

    const newPreviews = files.map(f => URL.createObjectURL(f))
    setImageFiles(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...newPreviews])
    // Reset input pour permettre re-sélection des mêmes fichiers
    e.target.value = ''
  }

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx])
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return []
    setUploadingImages(true)
    const supabase = createClient()
    const urls: string[] = []

    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()
      const path = `marketplace/${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(path, file, { contentType: file.type })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(path)
      urls.push(publicUrl)
    }
    setUploadingImages(false)
    return urls
  }

  // Validation côté client
  const validate = (): string | null => {
    const title = form.title.trim()
    if (title.length < 3) return 'Le titre doit faire au moins 3 caractères.'
    if (title.length > 100) return 'Le titre ne peut pas dépasser 100 caractères.'
    const description = form.description.trim()
    if (description.length < 10) return 'La description doit faire au moins 10 caractères.'
    if (description.length > 1000) return 'La description ne peut pas dépasser 1 000 caractères.'
    if (type === 'vente') {
      const price = parseFloat(form.price)
      if (isNaN(price) || price < 0) return 'Le prix doit être un nombre positif.'
      if (price > 10000) return 'Le prix ne peut pas dépasser 10 000 €.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      const imageUrls = await uploadImages()
      const supabase = createClient()
      const { error: err } = await supabase.from('marketplace_listings').insert({
        title: form.title.trim(),
        description: form.description.trim(),
        type,
        price: type === 'vente' && form.price ? parseFloat(form.price) : null,
        condition: form.condition,
        images: imageUrls,
        status: 'active',
        user_id: user!.id,
      })
      if (err) throw err
      router.push('/marketplace')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la publication'
      setError(message)
    } finally {
      setSubmitting(false)
      setUploadingImages(false)
    }
  }

  const types: { key: ListingType; label: string; icon: string; activeClass: string; iconClass: string }[] = [
    { key: 'vente', label: 'Vente', icon: 'fa-tag', activeClass: 'border-green-500 bg-green-500/10', iconClass: 'text-green-500' },
    { key: 'echange', label: 'Échange', icon: 'fa-exchange-alt', activeClass: 'border-blue-500 bg-blue-500/10', iconClass: 'text-blue-500' },
    { key: 'don', label: 'Don', icon: 'fa-gift', activeClass: 'border-purple-500 bg-purple-500/10', iconClass: 'text-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs
            items={[
              { label: 'Marketplace', href: '/marketplace' },
              { label: 'Nouvelle annonce' },
            ]}
            className="text-gray-500 mb-6"
          />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#3b9fd8] rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-plus text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Nouvelle annonce</h1>
              <p className="text-gray-400">Proposez votre matériel à la communauté TLSTT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container-custom py-10">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* Type */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Type d&apos;annonce</h2>
              <div className="grid grid-cols-3 gap-3">
                {types.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setType(t.key)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      type === t.key ? t.activeClass : 'border-[#333] hover:border-[#555]'
                    }`}
                  >
                    <i className={`fas ${t.icon} text-2xl ${t.iconClass}`}></i>
                    <span className="font-semibold text-white text-sm">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Détails */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-white">Détails de l&apos;annonce</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Titre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#3b9fd8] transition-colors"
                  placeholder="Ex : Raquette Butterfly Timo Boll ALC"
                />
                <p className="text-gray-600 text-xs mt-1 text-right">{form.title.length}/100</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={4}
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#3b9fd8] resize-y transition-colors"
                  placeholder="Décrivez votre article, son état, les raisons de la vente..."
                />
                <p className={`text-xs mt-1 text-right ${form.description.length > 950 ? 'text-yellow-400' : 'text-gray-600'}`}>
                  {form.description.length}/1000
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">État</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#3b9fd8] transition-colors"
                >
                  <option value="neuf">Neuf (jamais utilisé)</option>
                  <option value="excellent">Très bon état</option>
                  <option value="bon">Bon état</option>
                  <option value="moyen">État moyen</option>
                </select>
              </div>

              {type === 'vente' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Prix (€) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="10000"
                    step="0.50"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#3b9fd8] transition-colors"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            {/* Upload images */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">
                Photos
                <span className="text-gray-500 font-normal text-sm ml-2">(optionnel — max {MAX_IMAGES} photos, {MAX_IMAGE_SIZE_MB} Mo chacune)</span>
              </h2>

              {/* Prévisualisations */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#333]">
                      <Image src={src} alt={`preview ${idx + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        aria-label="Supprimer cette photo"
                      >
                        <i className="fas fa-times text-white text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imageFiles.length < MAX_IMAGES && (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#333] rounded-xl py-8 cursor-pointer hover:border-[#3b9fd8]/50 transition-colors">
                  <i className="fas fa-cloud-upload-alt text-3xl text-gray-500 mb-2"></i>
                  <span className="text-gray-400 text-sm">Cliquez pour ajouter des photos</span>
                  <span className="text-gray-600 text-xs mt-1">JPG, PNG, WebP — max {MAX_IMAGE_SIZE_MB} Mo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}

              {imageError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {imageError}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/marketplace"
                className="flex-1 py-3 border border-[#333] text-gray-400 rounded-xl font-semibold hover:bg-[#1a1a1a] transition-colors text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={submitting || uploadingImages}
                className="flex-1 py-3 bg-[#3b9fd8] text-white rounded-xl font-semibold hover:bg-[#2d8bc9] transition-colors disabled:opacity-50"
              >
                {uploadingImages ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Upload images...</>
                ) : submitting ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Publication...</>
                ) : (
                  <><i className="fas fa-check mr-2"></i>Publier l&apos;annonce</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
