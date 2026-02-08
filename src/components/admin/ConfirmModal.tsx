'use client'

interface ConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirmation',
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'fa-exclamation-triangle',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      btnBg: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'fa-exclamation-circle',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      btnBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'fa-info-circle',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      btnBg: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const style = variantStyles[variant]

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95">
          <div className="p-6 text-center">
            <div className={`w-16 h-16 ${style.iconBg} rounded-full mx-auto mb-4 flex items-center justify-center`}>
              <i className={`fas ${style.icon} text-2xl ${style.iconColor}`}></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{message}</p>
          </div>
          <div className="flex gap-3 p-4 border-t border-gray-100">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-base"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-3 ${style.btnBg} text-white rounded-xl font-semibold transition-colors text-base disabled:opacity-50`}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>...</>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
