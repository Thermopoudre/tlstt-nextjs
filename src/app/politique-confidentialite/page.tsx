import Link from 'next/link'

export const metadata = {
  title: 'Politique de Confidentialite | TLSTT',
  description: 'Politique de confidentialite et protection des donnees personnelles du club TLSTT',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-[#0a0a0a] py-16 border-b border-[#222]">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-shield-alt mr-3 text-[#3b9fd8]"></i>
            Politique de Confidentialite
          </h1>
          <p className="text-xl text-gray-400">
            Protection de vos donnees personnelles (RGPD)
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 prose prose-lg max-w-none prose-invert">
          <p className="text-gray-500 mb-6">
            <strong className="text-white">Derniere mise a jour :</strong> Janvier 2026
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Responsable du traitement</h2>
          <p className="text-gray-300">
            Le responsable du traitement des donnees est :<br />
            <strong className="text-white">Toulon La Seyne Tennis de Table (TLSTT)</strong><br />
            Association Loi 1901<br />
            Gymnase Leo Lagrange<br />
            Avenue Marechal Juin<br />
            83000 Toulon<br />
            Email : contact@tlstt.fr
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Donnees collectees</h2>
          <p className="text-gray-300">Nous collectons les donnees suivantes :</p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li><strong className="text-white">Formulaire de contact :</strong> nom, email, telephone (optionnel), message</li>
            <li><strong className="text-white">Newsletter :</strong> nom, prenom, adresse email</li>
            <li><strong className="text-white">Adhesion au club :</strong> nom, prenom, date de naissance, adresse, coordonnees</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Finalites du traitement</h2>
          <p className="text-gray-300">Vos donnees sont utilisees pour :</p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>Repondre a vos demandes via le formulaire de contact</li>
            <li>Vous envoyer notre newsletter (si vous y etes inscrit)</li>
            <li>Gerer les adhesions et licences sportives</li>
            <li>Communiquer sur les evenements du club</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Base legale</h2>
          <p className="text-gray-300">
            Le traitement de vos donnees repose sur :<br />
            - Votre <strong className="text-white">consentement</strong> (newsletter, formulaire de contact)<br />
            - L'<strong className="text-white">execution d'un contrat</strong> (adhesion au club)<br />
            - Nos <strong className="text-white">obligations legales</strong> (gestion des licences FFTT)
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Duree de conservation</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li><strong className="text-white">Donnees de contact :</strong> 3 ans apres le dernier contact</li>
            <li><strong className="text-white">Newsletter :</strong> jusqu'au desabonnement</li>
            <li><strong className="text-white">Donnees d'adhesion :</strong> duree de l'adhesion + 5 ans (obligations legales)</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Vos droits</h2>
          <p className="text-gray-300">Conformement au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li><strong className="text-white">Droit d'acces :</strong> obtenir une copie de vos donnees</li>
            <li><strong className="text-white">Droit de rectification :</strong> corriger vos donnees</li>
            <li><strong className="text-white">Droit a l'effacement :</strong> demander la suppression de vos donnees</li>
            <li><strong className="text-white">Droit d'opposition :</strong> vous opposer au traitement</li>
            <li><strong className="text-white">Droit a la portabilite :</strong> recevoir vos donnees dans un format structure</li>
            <li><strong className="text-white">Droit de retrait du consentement :</strong> a tout moment</li>
          </ul>
          <p className="text-gray-300 mt-4">
            Pour exercer ces droits, contactez-nous : <a href="mailto:contact@tlstt.fr" className="text-[#3b9fd8] hover:underline">contact@tlstt.fr</a>
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Destinataires des donnees</h2>
          <p className="text-gray-300">
            Vos donnees peuvent etre transmises a :<br />
            - La <strong className="text-white">FFTT</strong> (Federation Francaise de Tennis de Table) pour les licences<br />
            - Notre <strong className="text-white">hebergeur</strong> (Vercel Inc.) pour le fonctionnement du site<br />
            - Notre <strong className="text-white">base de donnees</strong> (Supabase) pour le stockage securise
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Securite</h2>
          <p className="text-gray-300">
            Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees pour proteger vos donnees :
            chiffrement SSL/TLS, acces restreint, sauvegardes regulieres.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Reclamation</h2>
          <p className="text-gray-300">
            Si vous estimez que le traitement de vos donnees n'est pas conforme, vous pouvez introduire une reclamation aupres de la CNIL :<br />
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#3b9fd8] hover:underline">www.cnil.fr</a>
          </p>

          <div className="mt-8 p-6 bg-[#111] border border-[#333] rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">
              <i className="fas fa-envelope mr-2 text-[#3b9fd8]"></i>
              Contact
            </h3>
            <p className="text-gray-300">
              Pour toute question concernant cette politique :<br />
              <strong className="text-white">Email :</strong> <a href="mailto:contact@tlstt.fr" className="text-[#3b9fd8] hover:underline">contact@tlstt.fr</a>
            </p>
          </div>

          <div className="mt-8 text-center">
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
