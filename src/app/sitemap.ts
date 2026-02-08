import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/club/a-propos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/joueurs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/equipes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/competitions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/planning`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/galerie`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/boutique`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/partenaires`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/progressions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/newsletter`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/newsletters`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/politique-confidentialite`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/politique-cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // Articles publiés
  const { data: articles } = await supabase
    .from('news')
    .select('id, category, updated_at, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const articlePages: MetadataRoute.Sitemap = (articles || []).map((article) => ({
    url: `${SITE_URL}/actualites/${article.category}/${article.id}`,
    lastModified: new Date(article.updated_at || article.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Catégories d'actualités
  const categoryPages: MetadataRoute.Sitemap = ['club', 'tt', 'handi'].map(cat => ({
    url: `${SITE_URL}/actualites/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Newsletters publiées
  const { data: newsletters } = await supabase
    .from('newsletters')
    .select('id, updated_at, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const newsletterPages: MetadataRoute.Sitemap = (newsletters || []).map((nl) => ({
    url: `${SITE_URL}/newsletters/${nl.id}`,
    lastModified: new Date(nl.updated_at || nl.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // Albums photos publiés
  const { data: albums } = await supabase
    .from('albums')
    .select('id, updated_at, created_at')
    .eq('is_published', true)

  const albumPages: MetadataRoute.Sitemap = (albums || []).map((album) => ({
    url: `${SITE_URL}/galerie/${album.id}`,
    lastModified: new Date(album.updated_at || album.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // Joueurs avec licence
  const { data: players } = await supabase
    .from('players')
    .select('smartping_licence')
    .ilike('admin_notes', '%TLSTT%')
    .limit(200)

  const playerPages: MetadataRoute.Sitemap = (players || []).map((player) => ({
    url: `${SITE_URL}/joueurs/${player.smartping_licence}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...articlePages,
    ...newsletterPages,
    ...albumPages,
    ...playerPages,
  ]
}
