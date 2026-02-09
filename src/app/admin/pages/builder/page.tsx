'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })

interface PageBlock {
  id?: number
  page_id: number
  block_type: string
  block_data: any
  position: number
  status: string
}

interface Page {
  id: number
  slug: string
  title: string
  meta_description: string | null
}

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero / Banniere', icon: 'fa-image', color: 'bg-purple-500' },
  { type: 'text', label: 'Texte riche', icon: 'fa-paragraph', color: 'bg-blue-500' },
  { type: 'image', label: 'Image', icon: 'fa-camera', color: 'bg-green-500' },
  { type: 'cta', label: 'Bouton / CTA', icon: 'fa-hand-pointer', color: 'bg-orange-500' },
  { type: 'stats', label: 'Statistiques', icon: 'fa-chart-bar', color: 'bg-red-500' },
  { type: 'cards', label: 'Cartes', icon: 'fa-th-large', color: 'bg-teal-500' },
]

const defaultBlockData: Record<string, any> = {
  hero: { title: '', subtitle: '', backgroundUrl: '', buttonText: '', buttonLink: '' },
  text: { content: '' },
  image: { url: '', alt: '', caption: '' },
  cta: { text: '', link: '', style: 'primary' },
  stats: { items: [{ label: '', value: '' }] },
  cards: { items: [{ title: '', description: '', icon: '', link: '' }] },
}

export default function PageBuilderPage() {
  const supabase = createClient()
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => { loadPages() }, [])

  const loadPages = async () => {
    const { data } = await supabase.from('pages').select('*').order('slug')
    if (data) setPages(data)
    setLoading(false)
  }

  const loadBlocks = async (pageId: number) => {
    const { data } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('position')
    setBlocks(data || [])
  }

  const selectPage = async (page: Page) => {
    setSelectedPage(page)
    await loadBlocks(page.id)
  }

  const addBlock = (type: string) => {
    if (!selectedPage) return
    const newBlock: PageBlock = {
      page_id: selectedPage.id,
      block_type: type,
      block_data: { ...defaultBlockData[type] },
      position: blocks.length,
      status: 'published',
    }
    setBlocks([...blocks, newBlock])
  }

  const updateBlock = (index: number, data: any) => {
    setBlocks(blocks.map((b, i) => i === index ? { ...b, block_data: { ...b.block_data, ...data } } : b))
  }

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= newBlocks.length) return
    ;[newBlocks[index], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[index]]
    newBlocks.forEach((b, i) => { b.position = i })
    setBlocks(newBlocks)
  }

  const handleSave = async () => {
    if (!selectedPage) return
    setSaving(true)
    setMessage(null)

    try {
      // Delete existing blocks
      await supabase.from('page_blocks').delete().eq('page_id', selectedPage.id)

      // Insert new blocks
      if (blocks.length > 0) {
        const toInsert = blocks.map((b, i) => ({
          page_id: selectedPage.id,
          block_type: b.block_type,
          block_data: b.block_data,
          position: i,
          status: b.status,
        }))
        const { error } = await supabase.from('page_blocks').insert(toInsert)
        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Page sauvegardee !' })
      await loadBlocks(selectedPage.id)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePage = async () => {
    const slug = prompt('Slug de la page (ex: ma-page):')
    if (!slug) return
    const title = prompt('Titre de la page:')
    if (!title) return

    const { data, error } = await supabase
      .from('pages')
      .insert({ slug, title, meta_description: '' })
      .select()
      .single()

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (data) {
      await loadPages()
      selectPage(data)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Page Builder</h1>
          <p className="text-gray-600 mt-1">Construisez vos pages avec des blocs visuels</p>
        </div>
        <button onClick={handleCreatePage} className="btn-primary flex items-center gap-2">
          <i className="fas fa-plus"></i>Nouvelle page
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Pages list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-bold text-gray-800 mb-3">
              <i className="fas fa-file-alt mr-2 text-primary"></i>Pages
            </h2>
            <div className="space-y-1">
              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => selectPage(page)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedPage?.id === page.id
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold">{page.title}</div>
                  <div className={`text-xs ${selectedPage?.id === page.id ? 'text-white/70' : 'text-gray-400'}`}>
                    /{page.slug}
                  </div>
                </button>
              ))}
              {pages.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">Aucune page</p>
              )}
            </div>
          </div>
        </div>

        {/* Main - Block editor */}
        <div className="lg:col-span-3">
          {!selectedPage ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <i className="fas fa-mouse-pointer text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-bold text-gray-600">Selectionnez une page</h3>
              <p className="text-gray-400 text-sm">Choisissez une page dans la liste ou creez-en une nouvelle</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Page header */}
              <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPage.title}</h2>
                  <p className="text-sm text-gray-400">/{selectedPage.slug} - {blocks.length} bloc(s)</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                  Sauvegarder
                </button>
              </div>

              {/* Blocks */}
              {blocks.map((block, index) => (
                <div key={index} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs ${
                      BLOCK_TYPES.find(t => t.type === block.block_type)?.color || 'bg-gray-500'
                    }`}>
                      <i className={`fas ${BLOCK_TYPES.find(t => t.type === block.block_type)?.icon || 'fa-cube'}`}></i>
                    </span>
                    <span className="text-sm font-semibold text-gray-700 flex-1">
                      {BLOCK_TYPES.find(t => t.type === block.block_type)?.label || block.block_type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><i className="fas fa-chevron-up text-xs"></i></button>
                      <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><i className="fas fa-chevron-down text-xs"></i></button>
                      <button onClick={() => removeBlock(index)} className="p-1 text-red-400 hover:text-red-600"><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </div>
                  <div className="p-4">
                    {renderBlockEditor(block, index, updateBlock)}
                  </div>
                </div>
              ))}

              {/* Add block */}
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  <i className="fas fa-plus-circle mr-2 text-primary"></i>
                  Ajouter un bloc
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BLOCK_TYPES.map(bt => (
                    <button
                      key={bt.type}
                      onClick={() => addBlock(bt.type)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm text-gray-700"
                    >
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs ${bt.color}`}>
                        <i className={`fas ${bt.icon}`}></i>
                      </span>
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function renderBlockEditor(block: PageBlock, index: number, updateBlock: (i: number, data: any) => void) {
  const data = block.block_data

  switch (block.block_type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <input type="text" value={data.title || ''} onChange={e => updateBlock(index, { title: e.target.value })}
            placeholder="Titre du hero" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input type="text" value={data.subtitle || ''} onChange={e => updateBlock(index, { subtitle: e.target.value })}
            placeholder="Sous-titre" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input type="url" value={data.backgroundUrl || ''} onChange={e => updateBlock(index, { backgroundUrl: e.target.value })}
            placeholder="URL image de fond" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={data.buttonText || ''} onChange={e => updateBlock(index, { buttonText: e.target.value })}
              placeholder="Texte du bouton" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="text" value={data.buttonLink || ''} onChange={e => updateBlock(index, { buttonLink: e.target.value })}
              placeholder="Lien du bouton" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
      )

    case 'text':
      return (
        <textarea
          value={data.content || ''}
          onChange={e => updateBlock(index, { content: e.target.value })}
          rows={6}
          placeholder="Contenu HTML ou texte..."
          className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
        />
      )

    case 'image':
      return (
        <div className="space-y-3">
          <input type="url" value={data.url || ''} onChange={e => updateBlock(index, { url: e.target.value })}
            placeholder="URL de l'image" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input type="text" value={data.alt || ''} onChange={e => updateBlock(index, { alt: e.target.value })}
            placeholder="Texte alternatif" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input type="text" value={data.caption || ''} onChange={e => updateBlock(index, { caption: e.target.value })}
            placeholder="Legende (optionnel)" className="w-full px-3 py-2 border rounded-lg text-sm" />
          {data.url && <img src={data.url} alt={data.alt} className="max-h-32 rounded-lg" />}
        </div>
      )

    case 'cta':
      return (
        <div className="space-y-3">
          <input type="text" value={data.text || ''} onChange={e => updateBlock(index, { text: e.target.value })}
            placeholder="Texte du bouton" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input type="text" value={data.link || ''} onChange={e => updateBlock(index, { link: e.target.value })}
            placeholder="Lien" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <select value={data.style || 'primary'} onChange={e => updateBlock(index, { style: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="primary">Primaire (bleu)</option>
            <option value="secondary">Secondaire (contour)</option>
            <option value="accent">Accent (violet)</option>
          </select>
        </div>
      )

    case 'stats':
      return (
        <div className="space-y-2">
          {(data.items || []).map((item: any, i: number) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={item.value || ''} onChange={e => {
                const items = [...(data.items || [])]; items[i] = { ...items[i], value: e.target.value }
                updateBlock(index, { items })
              }} placeholder="Valeur (ex: 70+)" className="w-1/3 px-3 py-2 border rounded-lg text-sm" />
              <input type="text" value={item.label || ''} onChange={e => {
                const items = [...(data.items || [])]; items[i] = { ...items[i], label: e.target.value }
                updateBlock(index, { items })
              }} placeholder="Label" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <button onClick={() => {
                const items = (data.items || []).filter((_: any, j: number) => j !== i)
                updateBlock(index, { items })
              }} className="p-2 text-red-400"><i className="fas fa-times"></i></button>
            </div>
          ))}
          <button onClick={() => updateBlock(index, { items: [...(data.items || []), { label: '', value: '' }] })}
            className="text-sm text-primary hover:underline"><i className="fas fa-plus mr-1"></i>Ajouter une stat</button>
        </div>
      )

    case 'cards':
      return (
        <div className="space-y-3">
          {(data.items || []).map((item: any, i: number) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input type="text" value={item.icon || ''} onChange={e => {
                  const items = [...(data.items || [])]; items[i] = { ...items[i], icon: e.target.value }
                  updateBlock(index, { items })
                }} placeholder="Icone (fa-xxx)" className="w-1/3 px-3 py-2 border rounded-lg text-sm" />
                <input type="text" value={item.title || ''} onChange={e => {
                  const items = [...(data.items || [])]; items[i] = { ...items[i], title: e.target.value }
                  updateBlock(index, { items })
                }} placeholder="Titre" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button onClick={() => {
                  const items = (data.items || []).filter((_: any, j: number) => j !== i)
                  updateBlock(index, { items })
                }} className="p-2 text-red-400"><i className="fas fa-times"></i></button>
              </div>
              <input type="text" value={item.description || ''} onChange={e => {
                const items = [...(data.items || [])]; items[i] = { ...items[i], description: e.target.value }
                updateBlock(index, { items })
              }} placeholder="Description" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          ))}
          <button onClick={() => updateBlock(index, { items: [...(data.items || []), { title: '', description: '', icon: '', link: '' }] })}
            className="text-sm text-primary hover:underline"><i className="fas fa-plus mr-1"></i>Ajouter une carte</button>
        </div>
      )

    default:
      return <p className="text-gray-400 text-sm">Type de bloc non supporte: {block.block_type}</p>
  }
}
