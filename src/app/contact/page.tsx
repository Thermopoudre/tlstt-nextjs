'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message')
      }

      setStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container-custom">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Contactez-nous
        </h1>
        <p className="text-lg text-gray-600">
          Une question ? Une demande d'information ? Nous sommes là pour vous répondre !
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de contact */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Envoyez-nous un message
            </h2>

            {status === 'success' && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <i className="fas fa-check-circle mr-2"></i>
                Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
              </div>
            )}

            {status === 'error' && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="inscription">Inscription / Adhésion</option>
                    <option value="renseignements">Renseignements généraux</option>
                    <option value="ecole">École de tennis de table</option>
                    <option value="competition">Compétition</option>
                    <option value="partenariat">Partenariat</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Votre message..."
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="space-y-6">
          {/* Adresse */}
          <div className="card">
            <h3 className="text-xl font-bold text-primary mb-4">
              <i className="fas fa-map-marker-alt mr-2"></i>
              Adresse
            </h3>
            <p className="text-gray-700 mb-4">
              Gymnase Léo Lagrange<br />
              Avenue Maréchal Juin<br />
              83000 Toulon
            </p>
            <a
              href="https://maps.google.com/?q=Gymnase+Léo+Lagrange+Toulon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:underline flex items-center gap-2"
            >
              <i className="fas fa-external-link-alt"></i>
              Voir sur Google Maps
            </a>
          </div>

          {/* Horaires */}
          <div className="card">
            <h3 className="text-xl font-bold text-primary mb-4">
              <i className="fas fa-clock mr-2"></i>
              Horaires d'ouverture
            </h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold">Lundi - Vendredi :</span>
                <span>18h - 22h</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Samedi :</span>
                <span>14h - 18h</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Dimanche :</span>
                <span className="text-red-600">Fermé</span>
              </div>
            </div>
          </div>

          {/* Contact direct */}
          <div className="card">
            <h3 className="text-xl font-bold text-primary mb-4">
              <i className="fas fa-phone mr-2"></i>
              Contact direct
            </h3>
            <div className="space-y-3">
              <a
                href="tel:+33612345678"
                className="flex items-center gap-3 text-gray-700 hover:text-secondary transition-colors"
              >
                <i className="fas fa-phone-alt w-5"></i>
                <span>06 12 34 56 78</span>
              </a>
              <a
                href="mailto:contact@tlstt.fr"
                className="flex items-center gap-3 text-gray-700 hover:text-secondary transition-colors"
              >
                <i className="fas fa-envelope w-5"></i>
                <span>contact@tlstt.fr</span>
              </a>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="card">
            <h3 className="text-xl font-bold text-primary mb-4">
              <i className="fas fa-share-alt mr-2"></i>
              Suivez-nous
            </h3>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
