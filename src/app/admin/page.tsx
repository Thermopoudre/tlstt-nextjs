import { redirect } from 'next/navigation'

// Redirect /admin to /admin/login or the protected dashboard
export default function AdminRedirectPage() {
  redirect('/admin/login')
}
