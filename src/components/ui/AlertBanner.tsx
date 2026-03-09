import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Alert {
  id: number
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  link_url?: string | null
  link_label?: string | null
}

const typeConfig = {
  info: {
    bg: 'bg-[#3b9fd8]/15 border-[#3b9fd8]/40',
    text: 'text-[#3b9fd8]',
    icon: 'fa-circle-info',
    bar: 'bg-[#3b9fd8]',
  },
  warning: {
    bg: 'bg-amber-500/15 border-amber-500/40',
    text: 'text-amber-400',
    icon: 'fa-triangle-exclamation',
    bar: 'bg-amber-500',
  },
  success: {
    bg: 'bg-emerald-500/15 border-emerald-500/40',
    text: 'text-emerald-400',
    icon: 'fa-circle-check',
    bar: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-500/15 border-red-500/40',
    text: 'text-red-400',
    icon: 'fa-circle-exclamation',
    bar: 'bg-red-500',
  },
}

export default async function AlertBanner() {
  let alerts: Alert[] = []

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data } = await supabase
      .from('alerts')
      .select('id, message, type, link_url, link_label')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('id', { ascending: false })
      .limit(3)

    alerts = data || []
  } catch {
    return null
  }

  if (alerts.length === 0) return null

  return (
    <div className="w-full" role="alert" aria-live="polite">
      {alerts.map((alert) => {
        const cfg = typeConfig[alert.type] || typeConfig.info
        return (
          <div
            key={alert.id}
            className={`w-full border-b ${cfg.bg} relative`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />
            <div className="container-custom py-2.5 pl-6">
              <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
                <i className={`fas ${cfg.icon} ${cfg.text} flex-shrink-0`}></i>
                <p className="text-white/90 text-center">{alert.message}</p>
                {alert.link_url && alert.link_label && (
                  <Link
                    href={alert.link_url}
                    className={`${cfg.text} font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap flex-shrink-0`}
                  >
                    {alert.link_label} <i className="fas fa-arrow-right text-xs ml-1"></i>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
