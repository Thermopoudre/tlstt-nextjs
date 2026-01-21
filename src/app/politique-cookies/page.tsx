import Link from 'next/link'

export const metadata = {
  title: 'Politique de Cookies | TLSTT',
  description: 'Informations sur les cookies utilises par le site du club TLSTT',
}

export default function PolitiqueCookiesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-[#0f3057] py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-cookie-bite mr-3 text-[#5bc0de]"></i>
            Politique de Cookies
          </h1>
          <p className="text-xl text-white/80">
            Informations sur les cookies utilises par notre site
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="card prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Derniere mise a jour :</strong> Janvier 2026
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">1. Qu'est-ce qu'un cookie ?</h2>
          <p className="text-gray-700">
            Un cookie est un petit fichier texte stocke sur votre appareil (ordinateur, tablette, smartphone)
            lors de votre visite sur un site web. Les cookies permettent au site de memoriser vos preferences
            et d'ameliorer votre experience de navigation.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">2. Types de cookies utilises</h2>
          
          <h3 className="text-xl font-bold text-[#0f3057] mt-6 mb-3">2.1 Cookies strictement necessaires</h3>
          <p className="text-gray-700">
            Ces cookies sont essentiels au fonctionnement du site. Ils ne peuvent pas etre desactives.
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-[#e8f4f8]">
                  <th className="border border-gray-300 px-4 py-2 text-left text-[#0f3057]">Cookie</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-[#0f3057]">Finalite</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-[#0f3057]">Duree</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">supabase-auth-token</td>
                  <td className="border border-gray-300 px-4 py-2">Authentification admin</td>
                  <td className="border border-gray-300 px-4 py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold text-[#0f3057] mt-6 mb-3">2.2 Cookies de performance</h3>
          <p className="text-gray-700">
            Ces cookies nous aident a comprendre comment les visiteurs interagissent avec notre site
            en collectant des informations de maniere anonyme.
          </p>
          <p className="text-gray-700">
            <strong>Note :</strong> Actuellement, nous n'utilisons pas de cookies de performance ou d'analyse (pas de Google Analytics).
          </p>

          <h3 className="text-xl font-bold text-[#0f3057] mt-6 mb-3">2.3 Cookies de fonctionnalite</h3>
          <p className="text-gray-700">
            Ces cookies permettent de memoriser vos choix (comme vos preferences de langue)
            pour vous offrir une experience personnalisee.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">3. Cookies tiers</h2>
          <p className="text-gray-700">
            Notre site peut integrer des contenus provenant de services tiers :
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Vercel :</strong> hebergement du site (cookies techniques)</li>
            <li><strong>Google Maps :</strong> carte de localisation (si activee)</li>
            <li><strong>Reseaux sociaux :</strong> boutons de partage (si presents)</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Ces services tiers peuvent deposer leurs propres cookies.
            Consultez leurs politiques de confidentialite respectives.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">4. Gerer vos cookies</h2>
          <p className="text-gray-700">
            Vous pouvez controler et/ou supprimer les cookies comme vous le souhaitez.
            Vous pouvez supprimer tous les cookies deja stockes sur votre appareil
            et configurer la plupart des navigateurs pour qu'ils les bloquent.
          </p>
          
          <div className="bg-[#e8f4f8] p-6 rounded-lg my-6">
            <h3 className="text-lg font-bold text-[#0f3057] mb-3">Comment gerer les cookies dans votre navigateur :</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Chrome :</strong> Parametres &gt; Confidentialite et securite &gt; Cookies</li>
              <li><strong>Firefox :</strong> Options &gt; Vie privee et securite &gt; Cookies</li>
              <li><strong>Safari :</strong> Preferences &gt; Confidentialite</li>
              <li><strong>Edge :</strong> Parametres &gt; Confidentialite &gt; Cookies</li>
            </ul>
          </div>

          <p className="text-gray-700">
            <strong>Attention :</strong> Si vous desactivez les cookies, certaines fonctionnalites
            du site peuvent ne plus fonctionner correctement.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">5. Mise a jour</h2>
          <p className="text-gray-700">
            Cette politique de cookies peut etre mise a jour. Nous vous invitons
            a la consulter regulierement. La date de derniere mise a jour est indiquee en haut de page.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">6. Contact</h2>
          <p className="text-gray-700">
            Pour toute question concernant notre utilisation des cookies :
          </p>
          <div className="mt-4 p-6 bg-[#e8f4f8] rounded-lg">
            <p className="text-gray-700">
              <strong>Email :</strong> <a href="mailto:contact@tlstt.fr" className="text-[#5bc0de] hover:underline">contact@tlstt.fr</a><br />
              <strong>Telephone :</strong> 06 12 34 56 78
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/politique-confidentialite" className="inline-block bg-[#0f3057] text-white px-6 py-3 rounded-full font-bold hover:bg-[#1a5a8a] transition-colors">
              <i className="fas fa-shield-alt mr-2"></i>
              Politique de confidentialite
            </Link>
            <Link href="/" className="inline-block bg-[#5bc0de] text-white px-6 py-3 rounded-full font-bold hover:bg-[#4ab0ce] transition-colors">
              <i className="fas fa-arrow-left mr-2"></i>
              Retour a l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
