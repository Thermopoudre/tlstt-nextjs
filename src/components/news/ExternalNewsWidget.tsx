interface RssItem {
  title: string
  link: string
  description: string
  pubDate: string
}

interface Props {
  source: 'fftt' | 'handisport'
  limit?: number
}

const sourceConfig = {
  fftt: {
    url: 'https://www.fftt.com/site/rss/actualites.xml',
    label: 'FFTT',
    icon: 'fa-table-tennis-paddle-ball',
    color: '#3b9fd8',
  },
  handisport: {
    url: 'https://www.handisport.org/category/tennis-de-table/feed/',
    label: 'Handisport',
    icon: 'fa-wheelchair',
    color: '#4c40cf',
  },
}

async function fetchRssItems(url: string, limit: number): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []

    const text = await res.text()
    const items: RssItem[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g

    for (const match of text.matchAll(itemRegex)) {
      const c = match[1]
      const title =
        c.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        c.match(/<title>(.*?)<\/title>/)?.[1] ||
        ''
      const link =
        c.match(/<link>(.*?)<\/link>/)?.[1] ||
        c.match(/<guid>(.*?)<\/guid>/)?.[1] ||
        ''
      const description = (
        c.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
        c.match(/<description>(.*?)<\/description>/)?.[1] ||
        ''
      )
        .replace(/<[^>]+>/g, '')
        .trim()
        .substring(0, 180)
      const pubDate = c.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

      if (title.trim()) {
        items.push({ title: title.trim(), link: link.trim(), description, pubDate: pubDate.trim() })
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

export default async function ExternalNewsWidget({ source, limit = 6 }: Props) {
  const config = sourceConfig[source]
  const items = await fetchRssItems(config.url, limit)

  if (items.length === 0) return null

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.color }}
        >
          <i className={`fas ${config.icon} text-white text-sm`}></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            Actualités {config.label}
          </h2>
          <p className="text-gray-500 text-sm">
            <i className="fas fa-rss mr-1"></i>Flux officiel en temps réel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 hover:border-[#3b9fd8]/50 transition-all hover:-translate-y-0.5 group block"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${config.color}18`,
                  color: config.color,
                  border: `1px solid ${config.color}30`,
                }}
              >
                {config.label}
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
