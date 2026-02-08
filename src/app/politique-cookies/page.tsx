import Link from 'next/link'
import { getPageContent } from '@/lib/settings'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Cookies | TLSTT',
  description: 'Informations sur les cookies utilisés par le site du club TLSTT',
}

export default async function PolitiqueCookiesPage() {
  const page = await getPageContent('cookies')
  const content = page?.content || ''

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-[#0a0a0a] py-16 border-b border-[#222]">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-cookie-bite mr-3 text-[#3b9fd8]"></i>
            Politique de Cookies
          </h1>
          <p className="text-xl text-gray-400">
            Informations sur les cookies utilisés par notre site
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 prose prose-lg max-w-none prose-invert prose-headings:text-white prose-a:text-[#3b9fd8] prose-strong:text-white">
          <MarkdownRenderer content={content} />

          <div className="mt-8 flex flex-wrap gap-4 justify-center not-prose">
            <Link href="/politique-confidentialite" className="inline-block bg-[#1a1a1a] border border-[#333] text-white px-6 py-3 rounded-full font-bold hover:bg-[#222] transition-colors">
              <i className="fas fa-shield-alt mr-2"></i>
              Politique de confidentialité
            </Link>
            <Link href="/" className="inline-block bg-[#3b9fd8] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors">
              <i className="fas fa-arrow-left mr-2"></i>
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  const html = content
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-white mt-6 mb-3">$1</h3>')
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
