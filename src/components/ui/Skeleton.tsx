export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-3 bg-white/5 rounded w-20" />
          <div className="h-8 bg-white/5 rounded w-24" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden animate-pulse">
      <div className="h-12 bg-white/5 border-b border-[#333]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#222]">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`h-3 bg-white/5 rounded ${j === 0 ? 'w-32' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonPlayer() {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-white/5 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-white/10 rounded w-40" />
          <div className="h-3 bg-white/5 rounded w-24" />
        </div>
        <div className="h-8 w-16 bg-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="h-12 bg-white/5 rounded-lg" />
        <div className="h-12 bg-white/5 rounded-lg" />
        <div className="h-12 bg-white/5 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonArticle() {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-white/5" />
      <div className="p-6 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-white/10 rounded-full w-16" />
          <div className="h-5 bg-white/5 rounded-full w-24" />
        </div>
        <div className="h-6 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6, type = 'card' }: { count?: number; type?: 'card' | 'player' | 'article' }) {
  const Component = type === 'player' ? SkeletonPlayer : type === 'article' ? SkeletonArticle : SkeletonCard
  return (
    <div className={`grid gap-6 ${type === 'player' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {Array.from({ length: count }).map((_, i) => <Component key={i} />)}
    </div>
  )
}
