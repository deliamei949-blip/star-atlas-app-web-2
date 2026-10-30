import { useState, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useStarStore } from '@/stores/starStore'
import type { EchoResult, BlackHole } from '@/types'

interface Props {
  blackHole: BlackHole
  relatedStars: EchoResult[]
  isSearching: boolean
  onFlyToStar: (starId: string) => void
  onClose: () => void
  onDelete: (id: string) => void
}

export default function BlackHolePanel({
  blackHole,
  relatedStars,
  isSearching,
  onFlyToStar,
  onClose,
  onDelete,
}: Props) {
  const stars = useStarStore((s) => s.stars)

  // Get position info for related stars
  const relatedWithPos = relatedStars.map((r) => {
    const star = stars.find((s) => s.id === r.starId)
    return {
      ...r,
      form: star?.form,
    }
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="glass-panel p-6 w-[420px] max-h-[520px] overflow-y-auto pointer-events-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕳️</span>
            <div>
              <h2 className="text-sm font-medium text-purple-200/90">黑洞谜题</h2>
              <p className="text-xs text-ui-secondary/50 mt-0.5">
                {new Date(blackHole.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ui-secondary/40 hover:text-ui-secondary text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Question */}
        <div className="bg-white/[0.03] rounded-lg p-4 mb-4 border border-purple-500/10">
          <p className="text-sm text-purple-100/80 leading-relaxed italic">
            "{blackHole.question}"
          </p>
        </div>

        {/* Related stars */}
        <div>
          <h3 className="text-xs font-medium text-ui-secondary/60 mb-3 flex items-center gap-2">
            <span>🌌</span>
            可能相关的知识星体
            {isSearching && (
              <span className="text-purple-300/60 animate-pulse">搜索中…</span>
            )}
          </h3>

          {isSearching && relatedStars.length === 0 && (
            <div className="py-8 text-center">
              <span className="text-sm text-ui-secondary/50 animate-pulse">
                AI 正在搜索相关星体…
              </span>
            </div>
          )}

          {!isSearching && relatedStars.length === 0 && (
            <div className="py-6 text-center">
              <span className="text-xs text-ui-secondary/40">
                暂无关联星体 — 试着捕获更多知识后再来
              </span>
            </div>
          )}

          {relatedStars.length > 0 && (
            <div className="space-y-2">
              {relatedWithPos.map((r) => (
                <button
                  key={r.starId}
                  onClick={() => onFlyToStar(r.starId)}
                  className="w-full text-left p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] transition-colors border border-white/5 hover:border-purple-500/20 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-star-glow group-hover:text-purple-200 transition-colors truncate max-w-[240px]">
                      {r.starName || r.surfaceText.slice(0, 20)}
                    </span>
                    <span className="text-xs text-amber-400/70 shrink-0 ml-2">
                      {Math.round(r.relevanceScore * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-ui-secondary/50 leading-relaxed">
                    {r.explanation}
                  </p>
                  {r.form !== undefined && (
                    <span className="inline-block mt-1.5 text-[10px] text-ui-secondary/30">
                      {r.form === 1 ? '✨ 星辰' : r.form === 2 ? '💫 脉冲星' : '🌟 星座'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
          <button
            onClick={() => {
              if (confirm('确定要吸收这个黑洞吗？（删除）')) {
                onDelete(blackHole.id)
                onClose()
              }
            }}
            className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
          >
            🗑 吸收黑洞
          </button>
          <span className="text-[10px] text-ui-secondary/30">
            新知识可能解答这个谜题
          </span>
        </div>
      </div>
    </div>
  )
}
