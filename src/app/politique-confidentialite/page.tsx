import Link from 'next/link'
import { getPageContent } from '@/lib/settings'
import { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | TLSTT',
  description: 'Politique de confidentialité et protection des données personnelles du club TLSTT.',
  alternates: { canonical: '/politique-confidentialite' },
  openGraph: {
    title: 'Politique de Confidentialité - TLSTT',
    description: 'Protection de vos données personnelles (RGPD) — club TLSTT.',
    url: '/politique-confidentialite',
  },
}

export default async function PolitiqueConfidentialitePage() {
  const page = await getPageContent('confidentialite')
  const content = page?.content || ''

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="container-custom">
          <Breadcrumbs className="text-gray-500 mb-6" />
          <div className="text-center">
            <div className="w-16 h-16 bg-[#3b9fd8] rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-shield-alt text-3xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Politique de <span className="text-[#3b9fd8]">Confidentialité</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Protection de vos données personnelles (RGPD)
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 prose prose-lg max-w-none prose-invert prose-headings:text-white prose-a:text-[#3b9fd8] prose-strong:text-white">
          <MarkdownRenderer content={content} />

          <div className="mt-8 text-center not-prose">
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
    .replace(/\n\n/g, '</p><p class="text-gray-300">')
    .replace(/\n/g, '<br/>')

  return <div dangerouslySetInnerHTML={{ __html: `<p class="text-gray-300">${html}</p>` }} />
}
