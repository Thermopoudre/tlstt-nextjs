import ContactForm from './ContactForm'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { getGlobalSettings, getContactSettings } from '@/lib/settings'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact - Nous Contacter',
  description: 'Contactez le club de tennis de table TLSTT Toulon La Seyne-sur-Mer. Questions, inscriptions, partenariats. Formulaire de contact et coordonnées.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact TLSTT',
    description: 'Contactez le club de tennis de table TLSTT à Toulon La Seyne-sur-Mer.',
    url: '/contact',
  },
  keywords: ['contact', 'TLSTT', 'tennis de table', 'inscription', 'Toulon', 'La Seyne-sur-Mer', 'formulaire'],
}

export default async function ContactPage() {
  const global = await getGlobalSettings()
  const contact = await getContactSettings()

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
              <p className="text-gray-400">Une question ? Une demande d&apos;information ? Nous sommes là pour vous répondre !</p>
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
              <ContactForm subjects={contact.subjects} />
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
              <p className="text-gray-300 mb-2">{global.address}</p>
              <p className="text-gray-400 mb-4">{global.postal_code} {global.city}</p>
              {global.maps_url && (
                <a
                  href={global.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3b9fd8] hover:underline flex items-center gap-2"
                >
                  <i className="fas fa-external-link-alt"></i>
                  Voir sur Google Maps
                </a>
              )}
            </div>

            {/* Horaires */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-clock text-[#3b9fd8]"></i>
                Horaires d&apos;ouverture
              </h3>
              <div className="space-y-2">
                {contact.opening_hours && Object.entries(contact.opening_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{day.replace(/_/g, ' - ')} :</span>
                    <span className="font-medium text-white">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact direct */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-phone text-[#3b9fd8]"></i>
                Contact direct
              </h3>
              <div className="space-y-3">
                <a href={`mailto:${global.contact_email}`} className="flex items-center gap-3 text-gray-400 hover:text-[#3b9fd8]">
                  <i className="fas fa-envelope w-5"></i>
                  <span>{global.contact_email}</span>
                </a>
                {global.contact_phone && (
                  <a href={`tel:${global.contact_phone}`} className="flex items-center gap-3 text-gray-400 hover:text-[#3b9fd8]">
                    <i className="fas fa-phone w-5"></i>
                    <span>{global.contact_phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#3b9fd8] transition-colors">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-share-alt text-[#3b9fd8]"></i>
                Suivez-nous
              </h3>
              <div className="flex gap-3">
                {global.facebook_url && (
                  <a
                    href={global.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#111] border border-[#333] rounded-full flex items-center justify-center text-white hover:bg-[#1877f2] hover:border-[#1877f2] transition-all hover:scale-110"
                    title="Facebook"
                  >
                    <i className="fab fa-facebook-f"></i>
                  </a>
                )}
                {global.instagram_url && (
                  <a
                    href={global.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#111] border border-[#333] rounded-full flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045] hover:border-transparent transition-all hover:scale-110"
                    title="Instagram"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
