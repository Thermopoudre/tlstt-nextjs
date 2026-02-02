import Link from 'next/link'

export const metadata = {
  title: 'Mentions Legales | TLSTT',
  description: 'Mentions legales du site du club Toulon La Seyne Tennis de Table',
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-[#0a0a0a] py-16 border-b border-[#222]">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-gavel mr-3 text-[#3b9fd8]"></i>
            Mentions Legales
          </h1>
          <p className="text-xl text-gray-400">
            Informations legales relatives au site TLSTT
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 prose prose-lg max-w-none prose-invert">

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Editeur du site</h2>
          <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
            <p className="text-gray-300 mb-0">
              <strong className="text-white">Toulon La Seyne Tennis de Table (TLSTT)</strong><br />
              Association Loi 1901<br />
              Numero SIRET : [A completer]<br />
              Numero RNA : [A completer]<br /><br />
              <strong className="text-white">Siege social :</strong><br />
              Gymnase Leo Lagrange<br />
              Avenue Marechal Juin<br />
              83000 Toulon<br /><br />
              <strong className="text-white">Contact :</strong><br />
              Email : <a href="mailto:contact@tlstt.fr" className="text-[#3b9fd8] hover:underline">contact@tlstt.fr</a><br />
              Telephone : 06 12 34 56 78
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Directeur de la publication</h2>
          <p className="text-gray-300">
            Le directeur de la publication est le President de l'association TLSTT.<br />
            <strong className="text-white">Nom :</strong> [A completer]<br />
            <strong className="text-white">Email :</strong> <a href="mailto:contact@tlstt.fr" className="text-[#3b9fd8] hover:underline">contact@tlstt.fr</a>
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Hebergement</h2>
          <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
            <p className="text-gray-300 mb-0">
              <strong className="text-white">Vercel Inc.</strong><br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789<br />
              United States<br /><br />
              Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#3b9fd8] hover:underline">vercel.com</a>
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Propriete intellectuelle</h2>
          <p className="text-gray-300">
            L'ensemble du contenu de ce site (textes, images, videos, logos, graphismes)
            est la propriete exclusive de l'association TLSTT ou de ses partenaires,
            sauf mention contraire.<br /><br />
            Toute reproduction, representation, modification, publication ou adaptation
            de tout ou partie des elements du site, quel que soit le moyen ou le procede utilise,
            est interdite sans l'autorisation ecrite prealable de TLSTT.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Credits</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li><strong className="text-white">Conception et developpement :</strong> [A completer]</li>
            <li><strong className="text-white">Photographies :</strong> Club TLSTT et ses membres</li>
            <li><strong className="text-white">Icones :</strong> Font Awesome</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Donnees personnelles</h2>
          <p className="text-gray-300">
            Pour toute information concernant le traitement de vos donnees personnelles,
            veuillez consulter notre <Link href="/politique-confidentialite" className="text-[#3b9fd8] hover:underline">Politique de Confidentialite</Link>.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Cookies</h2>
          <p className="text-gray-300">
            Pour toute information concernant l'utilisation des cookies sur ce site,
            veuillez consulter notre <Link href="/politique-cookies" className="text-[#3b9fd8] hover:underline">Politique de Cookies</Link>.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Limitation de responsabilite</h2>
          <p className="text-gray-300">
            L'association TLSTT s'efforce de fournir des informations aussi precises que possible.
            Toutefois, elle ne pourra etre tenue responsable des omissions, des inexactitudes
            et des carences dans la mise a jour, qu'elles soient de son fait ou du fait
            de tiers partenaires qui lui fournissent ces informations.<br /><br />
            Les liens hypertextes mis en place vers d'autres sites ne sauraient engager
            la responsabilite de TLSTT quant au contenu de ces sites.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Droit applicable</h2>
          <p className="text-gray-300">
            Les presentes mentions legales sont regies par le droit francais.
            En cas de litige, les tribunaux francais seront seuls competents.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/politique-confidentialite" className="inline-block bg-[#1a1a1a] border border-[#333] text-white px-6 py-3 rounded-full font-bold hover:bg-[#222] transition-colors">
              <i className="fas fa-shield-alt mr-2"></i>
              Confidentialite
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
