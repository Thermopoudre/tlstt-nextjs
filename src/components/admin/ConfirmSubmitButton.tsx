'use client'

import { ReactNode } from 'react'

// Bouton de soumission (dans un <form action={serverAction}>) avec confirmation native.
// Composant CLIENT : permet la confirmation depuis une page Server Component
// (passer un handler onClick directement dans un Server Component leve une erreur runtime).
export default function ConfirmSubmitButton({
  message = 'Confirmer ?',
  className,
  title,
  children,
}: {
  message?: string
  className?: string
  title?: string
  children: ReactNode
}) {
  return (
    <button
      type="submit"
      title={title}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) {
          e.preventDefault()
        }
      }}
    >
      {children}
    </button>
  )
}
