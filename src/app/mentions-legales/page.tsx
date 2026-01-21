import Link from 'next/link'

export const metadata = {
  title: 'Mentions Legales | TLSTT',
  description: 'Mentions legales du site du club Toulon La Seyne Tennis de Table',
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-[#0f3057] py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-gavel mr-3 text-[#5bc0de]"></i>
            Mentions Legales
          </h1>
          <p className="text-xl text-white/80">
            Informations legales relatives au site TLSTT
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="card prose prose-lg max-w-none">

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">1. Editeur du site</h2>
          <div className="bg-[#e8f4f8] p-6 rounded-lg">
            <p className="text-gray-700 mb-0">
              <strong>Toulon La Seyne Tennis de Table (TLSTT)</strong><br />
              Association Loi 1901<br />
              Numero SIRET : [A completer]<br />
              Numero RNA : [A completer]<br /><br />
              <strong>Siege social :</strong><br />
              Gymnase Leo Lagrange<br />
              Avenue Marechal Juin<br />
              83000 Toulon<br /><br />
              <strong>Contact :</strong><br />
              Email : <a href="mailto:contact@tlstt.fr" className="text-[#5bc0de] hover:underline">contact@tlstt.fr</a><br />
              Telephone : 06 12 34 56 78
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">2. Directeur de la publication</h2>
          <p className="text-gray-700">
            Le directeur de la publication est le President de l'association TLSTT.<br />
            <strong>Nom :</strong> [A completer]<br />
            <strong>Email :</strong> <a href="mailto:contact@tlstt.fr" className="text-[#5bc0de] hover:underline">contact@tlstt.fr</a>
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">3. Hebergement</h2>
          <div className="bg-[#e8f4f8] p-6 rounded-lg">
            <p className="text-gray-700 mb-0">
              <strong>Vercel Inc.</strong><br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789<br />
              United States<br /><br />
              Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#5bc0de] hover:underline">vercel.com</a>
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">4. Propriete intellectuelle</h2>
          <p className="text-gray-700">
            L'ensemble du contenu de ce site (textes, images, videos, logos, graphismes)
            est la propriete exclusive de l'association TLSTT ou de ses partenaires,
            sauf mention contraire.<br /><br />
            Toute reproduction, representation, modification, publication ou adaptation
            de tout ou partie des elements du site, quel que soit le moyen ou le procede utilise,
            est interdite sans l'autorisation ecrite prealable de TLSTT.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">5. Credits</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Conception et developpement :</strong> [A completer]</li>
            <li><strong>Photographies :</strong> Club TLSTT et ses membres</li>
            <li><strong>Icones :</strong> Font Awesome</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">6. Donnees personnelles</h2>
          <p className="text-gray-700">
            Pour toute information concernant le traitement de vos donnees personnelles,
            veuillez consulter notre <Link href="/politique-confidentialite" className="text-[#5bc0de] hover:underline">Politique de Confidentialite</Link>.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">7. Cookies</h2>
          <p className="text-gray-700">
            Pour toute information concernant l'utilisation des cookies sur ce site,
            veuillez consulter notre <Link href="/politique-cookies" className="text-[#5bc0de] hover:underline">Politique de Cookies</Link>.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">8. Limitation de responsabilite</h2>
          <p className="text-gray-700">
            L'association TLSTT s'efforce de fournir des informations aussi precises que possible.
            Toutefois, elle ne pourra etre tenue responsable des omissions, des inexactitudes
            et des carences dans la mise a jour, qu'elles soient de son fait ou du fait
            de tiers partenaires qui lui fournissent ces informations.<br /><br />
            Les liens hypertextes mis en place vers d'autres sites ne sauraient engager
            la responsabilite de TLSTT quant au contenu de ces sites.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">9. Droit applicable</h2>
          <p className="text-gray-700">
            Les presentes mentions legales sont regies par le droit francais.
            En cas de litige, les tribunaux francais seront seuls competents.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/politique-confidentialite" className="inline-block bg-[#0f3057] text-white px-6 py-3 rounded-full font-bold hover:bg-[#1a5a8a] transition-colors">
              <i className="fas fa-shield-alt mr-2"></i>
              Confidentialite
            </Link>
            <Link href="/politique-cookies" className="inline-block bg-[#0f3057] text-white px-6 py-3 rounded-full font-bold hover:bg-[#1a5a8a] transition-colors">
              <i className="fas fa-cookie-bite mr-2"></i>
              Cookies
            </Link>
            <Link href="/" className="inline-block bg-[#5bc0de] text-white px-6 py-3 rounded-full font-bold hover:bg-[#4ab0ce] transition-colors">
              <i className="fas fa-arrow-left mr-2"></i>
              Accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
