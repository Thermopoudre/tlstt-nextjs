interface RssItem {
  title: string
  link: string
  description: string
  pubDate: string
  sourceLabel: string
  sourceColor: string
  sourceIcon: string
}

type SourceKey = 'fftt' | 'ettu' | 'handisport_tt' | 'handisport_general'

interface Props {
  sources: SourceKey[]
  limit?: number
}

const sourceConfig: Record<SourceKey, { url: string; label: string; icon: string; color: string }> = {
  fftt: {
    url: 'https://www.fftt.com/feed/',
    label: 'FFTT',
    icon: 'fa-table-tennis-paddle-ball',
    color: '#3b9fd8',
  },
  ettu: {
    url: 'https://www.ettu.org/feed/',
    label: 'ETTU',
    icon: 'fa-globe',
    color: '#e8532a',
  },
  handisport_tt: {
    url: 'https://www.handisport.org/category/tennis-de-table/feed/',
    label: 'Handisport TT',
    icon: 'fa-table-tennis-paddle-ball',
    color: '#4c40cf',
  },
  handisport_general: {
    url: 'https://www.handisport.org/feed/',
    label: 'Handisport',
    icon: 'fa-wheelchair',
    color: '#7c3aed',
  },
}

async function fetchRssSource(key: SourceKey, limit: number): Promise<RssItem[]> {
  const config = sourceConfig[key]
  try {
    const res = await fetch(config.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TLSTT-RSS/1.0)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []

    const text = await res.text()
    const items: RssItem[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g

    for (const match of text.matchAll(itemRegex)) {
      const c = match[1]
      const get = (tag: string) => {
        return (
          c.match(new RegExp(`<${tag}><![CDATA[(.*?)]]><\/${tag}>`, 's'))?.[1] ||
          c.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`))?.[1] ||
          ''
        )
      }

      const title = get('title').trim()
      const link = (get('link') || get('guid')).trim()
      const description = (get('description') || '')
        .replace(/<[^>]+>/g, '')
        .trim()
        .substring(0, 180)
      const pubDate = get('pubDate').trim()

      if (title) {
        items.push({
          title,
          link,
          description,
          pubDate,
          sourceLabel: config.label,
          sourceColor: config.color,
          sourceIcon: config.icon,
        })
      }
      if (items.length >= limit) break
    }
    return items
  } catch {
    return []
  }
}

function formatDate(pubDate: string): string {
  if (!pubDate) return ''
  try {
    return new Date(pubDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default async function ExternalNewsWidget({ sources, limit = 9 }: Props) {
  const perSource = Math.ceil(limit / sources.length)

  const results = await Promise.all(sources.map((s) => fetchRssSource(s, perSource)))

  // Merge, sort by date, take limit
  const allItems = results
    .flat()
    .filter((item) => item.title)
    .sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return db - da
    })
    .slice(0, limit)

  if (allItems.length === 0) return null

  const sourceLabels = sources.map((s) => sourceConfig[s].label).join(', ')

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#3b9fd8] flex items-center justify-center flex-shrink-0">
          <i className="fas fa-rss text-white text-sm"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            Actualités en direct
          </h2>
          <p className="text-gray-500 text-sm">
            <i className="fas fa-satellite-dish mr-1"></i>
            Flux RSS — {sourceLabels}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allItems.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 hover:border-[#3b9fd8]/50 transition-all hover:-translate-y-0.5 group block"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                style={{
                  backgroundColor: `${item.sourceColor}18`,
                  color: item.sourceColor,
                  border: `1px solid ${item.sourceColor}30`,
                }}
              >
                <i className={`fas ${item.sourceIcon} text-[10px]`}></i>
                {item.sourceLabel}
              </span>
              <i className="fas fa-external-link-alt text-gray-600 text-xs mt-0.5 group-hover:text-[#3b9fd8] transition-colors flex-shrink-0"></i>
            </div>

            <h3 className="text-white font-semibold text-sm leading-snug mb-2 group-hover:text-[#3b9fd8] transition-colors line-clamp-3">
              {item.title}
            </h3>

            {item.description && (
              <p className="text-gray-500 text-xs line-clamp-2 mb-3">
                {item.description}
              </p>
            )}

            {item.pubDate && (
              <p className="text-gray-600 text-xs flex items-center gap-1">
                <i className="far fa-calendar"></i>
                {formatDate(item.pubDate)}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
