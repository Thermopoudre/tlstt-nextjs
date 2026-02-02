import Link from 'next/link'

export const metadata = {
  title: 'Politique de Cookies | TLSTT',
  description: 'Informations sur les cookies utilises par le site du club TLSTT',
}

export default function PolitiqueCookiesPage() {
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
            Informations sur les cookies utilises par notre site
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 prose prose-lg max-w-none prose-invert">
          <p className="text-gray-500 mb-6">
            <strong className="text-white">Derniere mise a jour :</strong> Janvier 2026
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Qu'est-ce qu'un cookie ?</h2>
          <p className="text-gray-300">
            Un cookie est un petit fichier texte stocke sur votre appareil (ordinateur, tablette, smartphone)
            lors de votre visite sur un site web. Les cookies permettent au site de memoriser vos preferences
            et d'ameliorer votre experience de navigation.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Types de cookies utilises</h2>
          
          <h3 className="text-xl font-bold text-white mt-6 mb-3">2.1 Cookies strictement necessaires</h3>
          <p className="text-gray-300">
            Ces cookies sont essentiels au fonctionnement du site. Ils ne peuvent pas etre desactives.
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-[#333]">
              <thead>
                <tr className="bg-[#111]">
                  <th className="border border-[#333] px-4 py-2 text-left text-white">Cookie</th>
                  <th className="border border-[#333] px-4 py-2 text-left text-white">Finalite</th>
                  <th className="border border-[#333] px-4 py-2 text-left text-white">Duree</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#333] px-4 py-2 text-gray-300">supabase-auth-token</td>
                  <td className="border border-[#333] px-4 py-2 text-gray-300">Authentification admin</td>
                  <td className="border border-[#333] px-4 py-2 text-gray-300">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold text-white mt-6 mb-3">2.2 Cookies de performance</h3>
          <p className="text-gray-300">
            Ces cookies nous aident a comprendre comment les visiteurs interagissent avec notre site
            en collectant des informations de maniere anonyme.
          </p>
          <p className="text-gray-300">
            <strong className="text-white">Note :</strong> Actuellement, nous n'utilisons pas de cookies de performance ou d'analyse (pas de Google Analytics).
          </p>

          <h3 className="text-xl font-bold text-white mt-6 mb-3">2.3 Cookies de fonctionnalite</h3>
          <p className="text-gray-300">
            Ces cookies permettent de memoriser vos choix (comme vos preferences de langue)
            pour vous offrir une experience personnalisee.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Cookies tiers</h2>
          <p className="text-gray-300">
            Notre site peut integrer des contenus provenant de services tiers :
          </p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li><strong className="text-white">Vercel :</strong> hebergement du site (cookies techniques)</li>
            <li><strong className="text-white">Google Maps :</strong> carte de localisation (si activee)</li>
            <li><strong className="text-white">Reseaux sociaux :</strong> boutons de partage (si presents)</li>
          </ul>
          <p className="text-gray-300 mt-4">
            Ces services tiers peuvent deposer leurs propres cookies.
            Consultez leurs politiques de confidentialite respectives.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Gerer vos cookies</h2>
          <p className="text-gray-300">
            Vous pouvez controler et/ou supprimer les cookies comme vous le souhaitez.
            Vous pouvez supprimer tous les cookies deja stockes sur votre appareil
            et configurer la plupart des navigateurs pour qu'ils les bloquent.
          </p>
          
          <div className="bg-[#111] border border-[#333] p-6 rounded-lg my-6">
            <h3 className="text-lg font-bold text-white mb-3">Comment gerer les cookies dans votre navigateur :</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong className="text-white">Chrome :</strong> Parametres &gt; Confidentialite et securite &gt; Cookies</li>
              <li><strong className="text-white">Firefox :</strong> Options &gt; Vie privee et securite &gt; Cookies</li>
              <li><strong className="text-white">Safari :</strong> Preferences &gt; Confidentialite</li>
              <li><strong className="text-white">Edge :</strong> Parametres &gt; Confidentialite &gt; Cookies</li>
            </ul>
          </div>

          <p className="text-gray-300">
            <strong className="text-white">Attention :</strong> Si vous desactivez les cookies, certaines fonctionnalites
            du site peuvent ne plus fonctionner correctement.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Mise a jour</h2>
          <p className="text-gray-300">
            Cette politique de cookies peut etre mise a jour. Nous vous invitons
            a la consulter regulierement. La date de derniere mise a jour est indiquee en haut de page.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Contact</h2>
          <p className="text-gray-300">
            Pour toute question concernant notre utilisation des cookies :
          </p>
          <div className="mt-4 p-6 bg-[#111] border border-[#333] rounded-lg">
            <p className="text-gray-300">
              <strong className="text-white">Email :</strong> <a href="mailto:contact@tlstt.fr" className="text-[#3b9fd8] hover:underline">contact@tlstt.fr</a><br />
              <strong className="text-white">Telephone :</strong> 06 12 34 56 78
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/politique-confidentialite" className="inline-block bg-[#1a1a1a] border border-[#333] text-white px-6 py-3 rounded-full font-bold hover:bg-[#222] transition-colors">
              <i className="fas fa-shield-alt mr-2"></i>
              Politique de confidentialite
            </Link>
            <Link href="/" className="inline-block bg-[#3b9fd8] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors">
              <i className="fas fa-arrow-left mr-2"></i>
              Retour a l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
