import { createClient } from '@/lib/supabase/server'
import { SmartPingAPI } from '@/lib/smartping/api'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()
  const api = new SmartPingAPI()

  // Récupérer les dernières actualités
  const { data: latestNews } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3)

  // Récupérer les statistiques
  const [
    { count: totalPlayers },
    { count: totalNews },
    { count: totalAlbums },
  ] = await Promise.all([
    supabase.from('players').select('*', { count: 'exact', head: true }).eq('admin_notes', 'TLSTT'),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('albums').select('*', { count: 'exact', head: true }),
  ])

  // Récupérer les prochains entraînements (aujourd'hui et demain)
  const today = new Date().getDay() || 7 // Dimanche = 7
  const { data: nextTrainings } = await supabase
    .from('trainings')
    .select('*')
    .eq('is_active', true)
    .gte('day_of_week', today)
    .order('day_of_week')
    .order('start_time')
    .limit(3)

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-blue-800 to-blue-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Bienvenue au<br />
                <span className="text-yellow-300">TLSTT</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Club de Tennis de Table de <strong>Toulon La Seyne</strong>.
                Plus de <strong>70 ans</strong> de passion et <strong>200 licenciés</strong> de tous niveaux.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/club/a-propos" className="btn-secondary bg-white text-primary hover:bg-gray-100">
                  <i className="fas fa-info-circle mr-2"></i>
                  Découvrir le club
                </Link>
                <Link href="/contact" className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-all backdrop-blur-sm">
                  <i className="fas fa-envelope mr-2"></i>
                  Nous contacter
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <Image
                  src="/logo.jpeg"
                  alt="TLSTT Logo"
                  fill
                  className="object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card text-center border-l-4 border-blue-500 hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-users text-2xl text-blue-600"></i>
              </div>
              <div className="text-4xl font-bold text-primary mb-1">{totalPlayers || 200}+</div>
              <div className="text-sm text-gray-600">Licenciés</div>
            </div>

            <div className="card text-center border-l-4 border-green-500 hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-trophy text-2xl text-green-600"></i>
              </div>
              <div className="text-4xl font-bold text-primary mb-1">12</div>
              <div className="text-sm text-gray-600">Équipes</div>
            </div>

            <div className="card text-center border-l-4 border-purple-500 hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-calendar-alt text-2xl text-purple-600"></i>
              </div>
              <div className="text-4xl font-bold text-primary mb-1">70+</div>
              <div className="text-sm text-gray-600">Ans d'histoire</div>
            </div>

            <div className="card text-center border-l-4 border-yellow-500 hover:scale-105 transition-transform">
              <div className="w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <i className="fas fa-images text-2xl text-yellow-600"></i>
              </div>
              <div className="text-4xl font-bold text-primary mb-1">{totalAlbums || 0}</div>
              <div className="text-sm text-gray-600">Albums Photos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dernières actualités */}
      <section className="py-16 container-custom">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-primary">
            <i className="fas fa-newspaper mr-3"></i>
            Dernières Actualités
          </h2>
          <Link href="/actualites/club" className="text-secondary hover:underline font-semibold">
            Voir toutes les actualités →
          </Link>
        </div>

        {latestNews && latestNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.map((article: any) => (
              <Link
                key={article.id}
                href={`/actualites/${article.category}/${article.id}`}
                className="card group hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                {article.photo_url && (
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <Image
                      src={article.photo_url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
                      {article.category}
                    </span>
                    <span>•</span>
                    <span>{new Date(article.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                      {article.excerpt}
                    </p>
                  )}
                  <span className="text-secondary font-semibold text-sm flex items-center gap-1">
                    Lire la suite
                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <i className="fas fa-newspaper text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-600">Aucune actualité pour le moment</p>
          </div>
        )}
      </section>

      {/* Prochains entraînements */}
      {nextTrainings && nextTrainings.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-primary mb-8">
              <i className="fas fa-calendar-check mr-3"></i>
              Prochains Entraînements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nextTrainings.map((training: any) => {
                const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                return (
                  <div key={training.id} className="card border-l-4 border-green-500">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-table-tennis text-2xl text-green-600"></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-primary mb-1">{training.activity_name}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><i className="fas fa-calendar mr-2 text-green-600"></i>{days[training.day_of_week]}</p>
                          <p><i className="fas fa-clock mr-2 text-green-600"></i>{training.start_time.slice(0, 5)} - {training.end_time.slice(0, 5)}</p>
                          {training.level && (
                            <p><i className="fas fa-user mr-2 text-green-600"></i>{training.level}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-center mt-6">
              <Link href="/planning" className="btn-primary">
                <i className="fas fa-calendar-alt mr-2"></i>
                Voir tout le planning
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-gradient-to-br from-primary to-blue-700 text-white p-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user-plus text-3xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Nous Rejoindre</h3>
                <p className="text-blue-100 mb-6">
                  Que vous soyez débutant ou confirmé, le TLSTT vous accueille toute l'année.
                  Première séance d'essai gratuite !
                </p>
                <Link href="/contact" className="btn-secondary bg-white text-primary hover:bg-gray-100">
                  <i className="fas fa-envelope mr-2"></i>
                  S'inscrire
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-gray-800 to-gray-900 text-white p-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-envelope-open-text text-3xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Newsletter</h3>
                <p className="text-gray-100 mb-6">
                  Restez informé de toutes les actualités du club : événements, résultats, nouveautés...
                </p>
                <Link href="/newsletter" className="btn-secondary bg-white text-gray-900 hover:bg-gray-100">
                  <i className="fas fa-paper-plane mr-2"></i>
                  S'abonner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
