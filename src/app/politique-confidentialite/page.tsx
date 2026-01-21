import Link from 'next/link'

export const metadata = {
  title: 'Politique de Confidentialite | TLSTT',
  description: 'Politique de confidentialite et protection des donnees personnelles du club TLSTT',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-[#0f3057] py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-shield-alt mr-3 text-[#5bc0de]"></i>
            Politique de Confidentialite
          </h1>
          <p className="text-xl text-white/80">
            Protection de vos donnees personnelles (RGPD)
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="card prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Derniere mise a jour :</strong> Janvier 2026
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">1. Responsable du traitement</h2>
          <p className="text-gray-700">
            Le responsable du traitement des donnees est :<br />
            <strong>Toulon La Seyne Tennis de Table (TLSTT)</strong><br />
            Association Loi 1901<br />
            Gymnase Leo Lagrange<br />
            Avenue Marechal Juin<br />
            83000 Toulon<br />
            Email : contact@tlstt.fr
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">2. Donnees collectees</h2>
          <p className="text-gray-700">Nous collectons les donnees suivantes :</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Formulaire de contact :</strong> nom, email, telephone (optionnel), message</li>
            <li><strong>Newsletter :</strong> nom, prenom, adresse email</li>
            <li><strong>Adhesion au club :</strong> nom, prenom, date de naissance, adresse, coordonnees</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">3. Finalites du traitement</h2>
          <p className="text-gray-700">Vos donnees sont utilisees pour :</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Repondre a vos demandes via le formulaire de contact</li>
            <li>Vous envoyer notre newsletter (si vous y etes inscrit)</li>
            <li>Gerer les adhesions et licences sportives</li>
            <li>Communiquer sur les evenements du club</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">4. Base legale</h2>
          <p className="text-gray-700">
            Le traitement de vos donnees repose sur :<br />
            - Votre <strong>consentement</strong> (newsletter, formulaire de contact)<br />
            - L'<strong>execution d'un contrat</strong> (adhesion au club)<br />
            - Nos <strong>obligations legales</strong> (gestion des licences FFTT)
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">5. Duree de conservation</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Donnees de contact :</strong> 3 ans apres le dernier contact</li>
            <li><strong>Newsletter :</strong> jusqu'au desabonnement</li>
            <li><strong>Donnees d'adhesion :</strong> duree de l'adhesion + 5 ans (obligations legales)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">6. Vos droits</h2>
          <p className="text-gray-700">Conformement au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Droit d'acces :</strong> obtenir une copie de vos donnees</li>
            <li><strong>Droit de rectification :</strong> corriger vos donnees</li>
            <li><strong>Droit a l'effacement :</strong> demander la suppression de vos donnees</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement</li>
            <li><strong>Droit a la portabilite :</strong> recevoir vos donnees dans un format structure</li>
            <li><strong>Droit de retrait du consentement :</strong> a tout moment</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Pour exercer ces droits, contactez-nous : <a href="mailto:contact@tlstt.fr" className="text-[#5bc0de] hover:underline">contact@tlstt.fr</a>
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">7. Destinataires des donnees</h2>
          <p className="text-gray-700">
            Vos donnees peuvent etre transmises a :<br />
            - La <strong>FFTT</strong> (Federation Francaise de Tennis de Table) pour les licences<br />
            - Notre <strong>hebergeur</strong> (Vercel Inc.) pour le fonctionnement du site<br />
            - Notre <strong>base de donnees</strong> (Supabase) pour le stockage securise
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">8. Securite</h2>
          <p className="text-gray-700">
            Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees pour proteger vos donnees :
            chiffrement SSL/TLS, acces restreint, sauvegardes regulieres.
          </p>

          <h2 className="text-2xl font-bold text-[#0f3057] mt-8 mb-4">9. Reclamation</h2>
          <p className="text-gray-700">
            Si vous estimez que le traitement de vos donnees n'est pas conforme, vous pouvez introduire une reclamation aupres de la CNIL :<br />
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#5bc0de] hover:underline">www.cnil.fr</a>
          </p>

          <div className="mt-8 p-6 bg-[#e8f4f8] rounded-lg">
            <h3 className="text-xl font-bold text-[#0f3057] mb-3">
              <i className="fas fa-envelope mr-2 text-[#5bc0de]"></i>
              Contact
            </h3>
            <p className="text-gray-700">
              Pour toute question concernant cette politique :<br />
              <strong>Email :</strong> <a href="mailto:contact@tlstt.fr" className="text-[#5bc0de] hover:underline">contact@tlstt.fr</a>
            </p>
          </div>

          <div className="mt-8 text-center">
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
