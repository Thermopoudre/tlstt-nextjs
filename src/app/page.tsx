import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-5">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-heading font-bold text-primary mb-6">
          🏓 Bienvenue au TLSTT
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Toulon La Seyne Tennis de Table - Rejoignez notre club passionné de tennis de table
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/contact"
            className="bg-secondary hover:bg-secondary-dark text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Nous rejoindre
          </Link>
          <Link
            href="/club"
            className="bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Découvrir le club
          </Link>
        </div>
      </section>

      {/* Sections rapides */}
      <section className="grid md:grid-cols-3 gap-8 mb-20">
        <Link href="/actualites/club" className="card hover:scale-105 transition-transform">
          <div className="text-center">
            <div className="text-4xl mb-4">📰</div>
            <h3 className="text-xl font-heading font-bold mb-2">Actualités</h3>
            <p className="text-gray-600">Toutes les news du club</p>
          </div>
        </Link>

        <Link href="/joueurs" className="card hover:scale-105 transition-transform">
          <div className="text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-heading font-bold mb-2">Joueurs</h3>
            <p className="text-gray-600">Liste et progressions</p>
          </div>
        </Link>

        <Link href="/planning" className="card hover:scale-105 transition-transform">
          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-heading font-bold mb-2">Planning</h3>
            <p className="text-gray-600">Entraînements & compétitions</p>
          </div>
        </Link>
      </section>

      {/* Info section */}
      <section className="bg-white rounded-lg shadow-lg p-10 text-center">
        <h2 className="text-3xl font-heading font-bold mb-6">Site migré vers Next.js + Supabase</h2>
        <p className="text-gray-600 mb-4">
          🚀 Le site a été entièrement reconstruit avec les technologies modernes :
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <span className="bg-gray-100 px-4 py-2 rounded-lg font-semibold">Next.js 16</span>
          <span className="bg-gray-100 px-4 py-2 rounded-lg font-semibold">TypeScript</span>
          <span className="bg-gray-100 px-4 py-2 rounded-lg font-semibold">Tailwind CSS</span>
          <span className="bg-gray-100 px-4 py-2 rounded-lg font-semibold">Supabase</span>
          <span className="bg-gray-100 px-4 py-2 rounded-lg font-semibold">Vercel</span>
        </div>
      </section>
    </div>
  )
}
