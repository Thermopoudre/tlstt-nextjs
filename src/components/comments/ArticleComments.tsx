'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: number
  content: string
  created_at: string
  user_id: string
  profiles: {
    first_name: string
    last_name: string
  }
}

export default function ArticleComments({ articleId }: { articleId: number }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [articleId])

  const loadComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, profiles(first_name, last_name)')
      .eq('article_id', articleId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (data) setComments(data as any)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.from('comments').insert({
      article_id: articleId,
      user_id: user.id,
      content: newComment.trim(),
      status: 'approved', // auto-approve for validated members
    })

    if (!error) {
      setNewComment('')
      await loadComments()
    }
    setSubmitting(false)
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const d = new Date(date)
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'A l\'instant'
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  return (
    <div className="mt-12 border-t border-[#222] pt-8">
      <h3 className="text-2xl font-bold text-white mb-6">
        <i className="fas fa-comments mr-2 text-[#3b9fd8]"></i>
        Commentaires ({comments.length})
      </h3>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-[#3b9fd8] flex items-center justify-center text-white font-bold flex-shrink-0">
              {(profile?.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={3}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-[#3b9fd8] focus:outline-none resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="bg-[#3b9fd8] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#2d8bc9] disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <><i className="fas fa-spinner fa-spin mr-1"></i>Envoi...</>
                  ) : (
                    <><i className="fas fa-paper-plane mr-1"></i>Publier</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
          <p className="text-gray-400">
            <i className="fas fa-lock mr-2"></i>
            Connectez-vous pour commenter cet article.
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-3 bg-white/5 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          <i className="fas fa-comment-slash text-2xl mb-2 block opacity-30"></i>
          Aucun commentaire. Soyez le premier !
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3b9fd8]/20 flex items-center justify-center text-[#3b9fd8] font-bold flex-shrink-0 text-sm">
                {(comment.profiles?.first_name?.[0] || '?').toUpperCase()}
                {(comment.profiles?.last_name?.[0] || '').toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">
                    {comment.profiles?.first_name} {comment.profiles?.last_name}
                  </span>
                  <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
