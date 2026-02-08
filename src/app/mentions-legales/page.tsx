import Link from 'next/link'
import { getPageContent } from '@/lib/settings'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Légales',
  description: 'Mentions légales du site du club Toulon La Seyne Tennis de Table (TLSTT).',
  alternates: { canonical: '/mentions-legales' },
  robots: { index: true, follow: true },
}

export default async function MentionsLegalesPage() {
  const page = await getPageContent('mentions-legales')
  const content = page?.content || ''

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-[#0a0a0a] py-16 border-b border-[#222]">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-gavel mr-3 text-[#3b9fd8]"></i>
            Mentions Légales
          </h1>
          <p className="text-xl text-gray-400">
            Informations légales relatives au site TLSTT
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 prose prose-lg max-w-none prose-invert prose-headings:text-white prose-a:text-[#3b9fd8] prose-strong:text-white">
          <MarkdownRenderer content={content} />

          <div className="mt-8 flex flex-wrap gap-4 justify-center not-prose">
            <Link href="/politique-confidentialite" className="inline-block bg-[#1a1a1a] border border-[#333] text-white px-6 py-3 rounded-full font-bold hover:bg-[#222] transition-colors">
              <i className="fas fa-shield-alt mr-2"></i>
              Confidentialité
            </Link>
            <Link href="/politique-cookies" className="inline-block bg-[#1a1a1a] border border-[#333] text-white px-6 py-3 rounded-full font-bold hover:bg-[#222] transition-colors">
              <i className="fas fa-cookie-bite mr-2"></i>
              Cookies
            </Link>
            <Link href="/" className="inline-block bg-[#3b9fd8] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors">
              <i className="fas fa-arrow-left mr-2"></i>
              Accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown to HTML conversion for headings, bold, links, lists, tables
  const html = content
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-white mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#3b9fd8] hover:underline">$1</a>')
    .replace(/^- (.*$)/gm, '<li class="text-gray-300">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class="list-disc pl-6 space-y-2">${match}</ul>`)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim())
      if (cells.some(c => /^[-\s]+$/.test(c.trim()))) return ''
      const tag = 'td'
      return `<tr>${cells.map(c => `<${tag} class="border border-[#333] px-4 py-2 text-gray-300">${c.trim()}</${tag}>`).join('')}</tr>`
    })
    .replace(/\n\n/g, '</p><p class="text-gray-300">')
    .replace(/\n/g, '<br/>')

  return <div dangerouslySetInnerHTML={{ __html: `<p class="text-gray-300">${html}</p>` }} />
}
