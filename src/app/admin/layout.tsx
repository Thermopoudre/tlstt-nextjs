import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Vérifier si l'utilisateur est admin
  const { data: adminData } = await supabase
    .from('admins')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!adminData) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar admin={adminData} />
      <div className="ml-64">
        <AdminHeader admin={adminData} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
