// Bandeau "page en cours de finalisation" affiche en haut des pages dont les
// donnees live dependent de l'ouverture des acces FFTT (equipes, competitions).
export default function EnConstructionBanner() {
  return (
    <div className="bg-[#0a0a0a] pt-8">
      <div className="container-custom">
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 md:p-8 flex flex-col sm:flex-row items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-screwdriver-wrench text-2xl text-amber-400"></i>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-amber-300 mb-2">
              Page en cours de finalisation
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Les classements, résultats et statistiques <strong className="text-white">en direct</strong> de
              cette page seront activés très prochainement. Nous attendons l&apos;ouverture des accès aux
              <strong className="text-white"> données officielles en temps réel</strong> par la Fédération
              Française de Tennis de Table (FFTT). Merci de votre patience — revenez très vite&nbsp;!
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 mt-4 text-amber-300 hover:text-amber-200 font-semibold transition-colors"
            >
              <i className="fas fa-arrow-left"></i> Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
