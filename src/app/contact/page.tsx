import { createClient } from '@/lib/supabase/server'
import ContactForm from './ContactForm'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export default async function ContactPage() {
  const supabase = await createClient()

  // Récupérer les settings contact
  const { data: settings } = await supabase
    .from('site_settings')
    .select('settings')
    .eq('page', 'contact')
    .single()

  const contactSettings = settings?.settings as any || {
    subjects: ['Question générale', 'Inscription', 'Partenariat', 'Autre']
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0f3057] py-12">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-400 mb-6" />
          
          <div className="flex items-center gap-4">
            <i className="fas fa-envelope text-4xl text-[#5bc0de]"></i>
            <div>
              <h1 className="text-3xl font-bold text-white">Contactez-nous</h1>
              <p className="text-gray-300">Une question ? Une demande d'information ? Nous sommes là pour vous répondre !</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#0f3057] mb-6 flex items-center gap-2">
                <i className="fas fa-paper-plane text-[#5bc0de]"></i>
                Envoyez-nous un message
              </h2>
              <ContactForm subjects={contactSettings.subjects} />
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-6">
            {/* Adresse */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#0f3057] mb-4 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-[#5bc0de]"></i>
                Adresse
              </h3>
              <p className="text-gray-600 mb-2">Gymnase Léo Lagrange</p>
              <p className="text-gray-600 mb-2">Avenue Maréchal Juin</p>
              <p className="text-gray-600 mb-4">83000 Toulon</p>
              <a
                href="https://maps.google.com/?q=Gymnase+Léo+Lagrange+Toulon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5bc0de] hover:underline flex items-center gap-2"
              >
                <i className="fas fa-external-link-alt"></i>
                Voir sur Google Maps
              </a>
            </div>

            {/* Horaires */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#0f3057] mb-4 flex items-center gap-2">
                <i className="fas fa-clock text-[#5bc0de]"></i>
                Horaires d'ouverture
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lundi - Vendredi :</span>
                  <span className="font-medium">18h - 22h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Samedi :</span>
                  <span className="font-medium">14h - 18h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimanche :</span>
                  <span className="text-red-500">Fermé</span>
                </div>
              </div>
            </div>

            {/* Contact direct */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#0f3057] mb-4 flex items-center gap-2">
                <i className="fas fa-phone text-[#5bc0de]"></i>
                Contact direct
              </h3>
              <div className="space-y-3">
                <a href="tel:+33612345678" className="flex items-center gap-3 text-gray-600 hover:text-[#5bc0de]">
                  <i className="fas fa-phone w-5"></i>
                  <span>06 12 34 56 78</span>
                </a>
                <a href="mailto:contact@tlstt.fr" className="flex items-center gap-3 text-gray-600 hover:text-[#5bc0de]">
                  <i className="fas fa-envelope w-5"></i>
                  <span>contact@tlstt.fr</span>
                </a>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#0f3057] mb-4 flex items-center gap-2">
                <i className="fas fa-share-alt text-[#5bc0de]"></i>
                Suivez-nous
              </h3>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/tlstt83"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#1877f2] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="https://www.instagram.com/tlstt_officiel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
