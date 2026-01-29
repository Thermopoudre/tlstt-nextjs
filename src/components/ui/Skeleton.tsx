'use client'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: ''
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  )
}

// Skeleton pour une carte d'actualité
export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      <Skeleton variant="rectangular" className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4 h-6" />
        <Skeleton variant="text" className="w-full h-4" />
        <Skeleton variant="text" className="w-5/6 h-4" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-20 h-3" />
        </div>
      </div>
    </div>
  )
}

// Skeleton pour une ligne de joueur
export function PlayerRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-40 h-5" />
        <Skeleton variant="text" className="w-24 h-3" />
      </div>
      <Skeleton variant="text" className="w-16 h-6" />
    </div>
  )
}

// Skeleton pour une carte d'équipe
export function TeamCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      <Skeleton variant="rectangular" className="w-full h-20" />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-12 h-8 mx-auto" />
            <Skeleton variant="text" className="w-16 h-3 mx-auto" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-12 h-8 mx-auto" />
            <Skeleton variant="text" className="w-16 h-3 mx-auto" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-12 h-8 mx-auto" />
            <Skeleton variant="text" className="w-16 h-3 mx-auto" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
          <Skeleton variant="text" className="w-32 h-4" />
          <div className="flex gap-2">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton pour les stats
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <Skeleton variant="text" className="w-20 h-3 mb-2" />
      <Skeleton variant="text" className="w-16 h-8" />
    </div>
  )
}

// Skeleton pour une grille de cartes
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton pour un tableau
export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <Skeleton variant="text" className="w-48 h-6" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <PlayerRowSkeleton key={i} />
      ))}
    </div>
  )
}
