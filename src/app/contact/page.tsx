import { createClient } from '@/lib/supabase/server'
import ContactForm from './ContactForm'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact - Nous contacter',
  description: 'Contactez le club de tennis de table TLSTT. Questions, inscriptions, partenariats - nous sommes là pour vous répondre.',
  openGraph: {
    title: 'Contact TLSTT',
    description: 'Contactez le club de tennis de table de Toulon La Seyne',
  },
}

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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#0a0a0a] py-12 border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5">
          <Breadcrumbs className="text-gray-500 mb-6" />
          
          <div className="flex items-center gap-4">
            <i className="fas fa-envelope text-4xl text-[#3b9fd8]"></i>
            <div>
              <h1 className="text-3xl font-bold text-white">Contactez-nous</h1>
              <p className="text-gray-400">Une question ? Une demande d'information ? Nous sommes là pour vous répondre !</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <i className="fas fa-paper-plane text-[#3b9fd8]"></i>
                Envoyez-nous un message
              </h2>
              <ContactForm subjects={contactSettings.subjects} />
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-6">
            {/* Adresse */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-[#3b9fd8]"></i>
                Adresse
              </h3>
              <p className="text-gray-300 mb-2">Gymnase Léo Lagrange</p>
              <p className="text-gray-400 mb-2">Avenue Maréchal Juin</p>
              <p className="text-gray-400 mb-4">83500 La Seyne-sur-Mer</p>
              <a
                href="https://maps.google.com/?q=Gymnase+Léo+Lagrange+La+Seyne"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3b9fd8] hover:underline flex items-center gap-2"
              >
                <i className="fas fa-external-link-alt"></i>
                Voir sur Google Maps
              </a>
            </div>

            {/* Horaires */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-clock text-[#3b9fd8]"></i>
                Horaires d'ouverture
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Lundi - Vendredi :</span>
                  <span className="font-medium text-white">17h30 - 23h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mercredi :</span>
                  <span className="font-medium text-white">14h - 23h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Samedi :</span>
                  <span className="font-medium text-white">9h - 19h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dimanche :</span>
                  <span className="text-gray-500">Compétitions</span>
                </div>
              </div>
            </div>

            {/* Contact direct */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-phone text-[#3b9fd8]"></i>
                Contact direct
              </h3>
              <div className="space-y-3">
                <a href="mailto:contact@tlstt.fr" className="flex items-center gap-3 text-gray-400 hover:text-[#3b9fd8]">
                  <i className="fas fa-envelope w-5"></i>
                  <span>contact@tlstt.fr</span>
                </a>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-share-alt text-[#3b9fd8]"></i>
                Suivez-nous
              </h3>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/tlstt83"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#111] border border-[#333] rounded-full flex items-center justify-center text-white hover:bg-[#1877f2] hover:border-[#1877f2] transition-all hover:scale-110"
                  title="Facebook"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="https://www.instagram.com/tlstt_officiel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#111] border border-[#333] rounded-full flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045] hover:border-transparent transition-all hover:scale-110"
                  title="Instagram"
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
