import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Vérifier l'authentification via getSession (décodage local du cookie, AUCUN appel réseau).
  // getUser() faisait un appel serveur->Supabase Auth qui echouait sous la limite de connexions
  // et faisait purger le cookie (deconnexions admin). La validation d'admin reste assuree par la
  // requete sur la table admins ci-dessous (RLS + email).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    redirect('/admin/login')
  }

  // Vérifier si l'utilisateur est admin
  const { data: adminData } = await supabase
    .from('admins')
    .select('*')
    .eq('email', user.email)
    .eq('is_active', true)
    .single()

  if (!adminData) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar admin={adminData} />
      <div className="lg:ml-64">
        <AdminHeader admin={adminData} />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
