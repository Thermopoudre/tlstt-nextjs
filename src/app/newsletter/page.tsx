'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    try {
      // Vérifier si l'email existe déjà
      const { data: existing } = await supabase
        .from('newsletters')
        .select('*')
        .eq('email', email)
        .single()

      if (existing) {
        if (existing.is_subscribed) {
          setMessage({ type: 'error', text: 'Cet email est déjà inscrit à la newsletter.' })
        } else {
          // Réactiver l'abonnement
          await supabase
            .from('newsletters')
            .update({ is_subscribed: true, unsubscribed_at: null })
            .eq('email', email)

          setMessage({ type: 'success', text: 'Votre abonnement a été réactivé !' })
        }
      } else {
        // Nouvel abonnement
        const { error } = await supabase
          .from('newsletters')
          .insert([{
            email,
            first_name: firstName,
            last_name: lastName,
            is_subscribed: true
          }])

        if (error) throw error

        setMessage({ type: 'success', text: 'Merci pour votre inscription ! Vous recevrez bientôt notre newsletter.' })
        setEmail('')
        setFirstName('')
        setLastName('')
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Une erreur est survenue. Veuillez réessayer.' })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="bg-[#0a0a0a] py-16 border-b border-[#222]">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <i className="fas fa-envelope-open-text mr-3 text-[#3b9fd8]"></i>
            Newsletter TLSTT
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Restez informé des actualités du club, des événements, des résultats et bien plus encore !
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Formulaire d'inscription */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              <i className="fas fa-user-plus mr-2 text-[#3b9fd8]"></i>
              S'inscrire à la Newsletter
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#333] rounded-lg text-white placeholder-gray-600 focus:border-[#3b9fd8] focus:outline-none transition-colors"
                    placeholder="Jean"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#333] rounded-lg text-white placeholder-gray-600 focus:border-[#3b9fd8] focus:outline-none transition-colors"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Adresse email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-[#333] rounded-lg text-white placeholder-gray-600 focus:border-[#3b9fd8] focus:outline-none transition-colors"
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>

              {message && (
                <div className={`p-4 rounded-lg border ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'}`}></i>
                    <span>{message.text}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3b9fd8] text-white py-3 px-6 rounded-full font-bold hover:bg-[#2d8bc9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Inscription en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    S'inscrire
                  </>
                )}
              </button>

              <p className="text-xs text-gray-600 text-center mt-4">
                En vous inscrivant, vous acceptez de recevoir nos emails. 
                <Link href="/politique-confidentialite" className="text-[#3b9fd8] hover:underline ml-1">
                  Politique de confidentialité
                </Link>
              </p>
            </form>
          </div>

          {/* Avantages */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 border-l-4 border-l-[#3b9fd8]">
              <h3 className="text-xl font-bold text-white mb-4">
                <i className="fas fa-gift mr-2 text-[#3b9fd8]"></i>
                Ce que vous recevrez
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-300">Les dernières actualités du club</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-300">Les résultats des compétitions</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-300">Les événements à venir</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-300">Les offres exclusives</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i>
                  <span className="text-gray-300">Les photos des événements</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 border-l-4 border-l-yellow-500">
              <h3 className="text-xl font-bold text-white mb-4">
                <i className="fas fa-shield-alt mr-2 text-yellow-500"></i>
                Vos données sont protégées
              </h3>
              <p className="text-gray-400 mb-3">
                Nous respectons votre vie privée et ne partageons jamais vos informations avec des tiers.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <i className="fas fa-lock text-yellow-500"></i>
                  Données sécurisées
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-eye-slash text-yellow-500"></i>
                  Pas de spam
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-sign-out-alt text-yellow-500"></i>
                  Désabonnement facile
                </li>
              </ul>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 border-l-4 border-l-green-500">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-3xl text-green-500"></i>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white mb-1">500+</p>
                  <p className="text-sm text-gray-500">Abonnés déjà inscrits</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            <i className="fas fa-question-circle mr-2 text-[#3b9fd8]"></i>
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            <div className="pb-4 border-b border-[#333]">
              <h3 className="font-bold text-white mb-2">À quelle fréquence recevrai-je la newsletter ?</h3>
              <p className="text-gray-400">Vous recevrez notre newsletter environ 1 à 2 fois par mois, selon l'actualité du club.</p>
            </div>
            <div className="pb-4 border-b border-[#333]">
              <h3 className="font-bold text-white mb-2">Comment me désabonner ?</h3>
              <p className="text-gray-400">Chaque email contient un lien de désabonnement en bas de page. Un simple clic suffit.</p>
            </div>
            <div className="pb-4 border-b border-[#333]">
              <h3 className="font-bold text-white mb-2">Mes données sont-elles sécurisées ?</h3>
              <p className="text-gray-400">Oui, nous utilisons des protocoles de sécurité modernes et ne partageons jamais vos données.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Puis-je m'inscrire si je ne suis pas membre du club ?</h3>
              <p className="text-gray-400">Absolument ! La newsletter est ouverte à tous, membres ou sympathisants du club.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
