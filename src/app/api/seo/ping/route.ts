import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tlstt-nextjs.vercel.app'

/**
 * API pour notifier les moteurs de recherche d'un nouveau contenu
 * 
 * POST /api/seo/ping
 * Body: { url: string, type: 'article' | 'newsletter' | 'page' }
 * 
 * Actions:
 * 1. Ping Google avec l'URL du sitemap
 * 2. Ping Bing avec l'URL du sitemap  
 * 3. Log l'événement dans seo_pings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { url, type } = body

    if (!url) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 })
    }

    const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`
    const sitemapUrl = `${SITE_URL}/sitemap.xml`

    const results: { service: string; success: boolean; status?: number; error?: string }[] = []

    // 1. Ping Google via leur API de soumission de sitemap
    try {
      const googleResponse = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { method: 'GET', signal: AbortSignal.timeout(10000) }
      )
      results.push({
        service: 'Google',
        success: googleResponse.ok,
        status: googleResponse.status,
      })
    } catch (error: any) {
      results.push({
        service: 'Google',
        success: false,
        error: error.message,
      })
    }

    // 2. Ping Bing / IndexNow
    try {
      const bingResponse = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { method: 'GET', signal: AbortSignal.timeout(10000) }
      )
      results.push({
        service: 'Bing',
        success: bingResponse.ok,
        status: bingResponse.status,
      })
    } catch (error: any) {
      results.push({
        service: 'Bing',
        success: false,
        error: error.message,
      })
    }

    // 3. IndexNow (Bing, Yandex, etc.) si clé configurée
    const indexNowKey = process.env.INDEXNOW_KEY
    if (indexNowKey) {
      try {
        const indexNowResponse = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: new URL(SITE_URL).hostname,
            key: indexNowKey,
            keyLocation: `${SITE_URL}/${indexNowKey}.txt`,
            urlList: [fullUrl],
          }),
          signal: AbortSignal.timeout(10000),
        })
        results.push({
          service: 'IndexNow',
          success: indexNowResponse.ok || indexNowResponse.status === 202,
          status: indexNowResponse.status,
        })
      } catch (error: any) {
        results.push({
          service: 'IndexNow',
          success: false,
          error: error.message,
        })
      }
    }

    // Log l'événement
    console.log(`[SEO Ping] ${type}: ${fullUrl}`, results)

    return NextResponse.json({
      success: true,
      url: fullUrl,
      type,
      results,
      message: `Notification envoyée à ${results.filter(r => r.success).length}/${results.length} services`,
    })
  } catch (error: any) {
    console.error('[SEO Ping Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/seo/ping - Statut et info
 */
export async function GET() {
  return NextResponse.json({
    sitemap: `${SITE_URL}/sitemap.xml`,
    robots: `${SITE_URL}/robots.txt`,
    services: ['Google', 'Bing', 'IndexNow'],
    usage: 'POST /api/seo/ping avec { url: "/actualites/club/123", type: "article" }',
  })
}
