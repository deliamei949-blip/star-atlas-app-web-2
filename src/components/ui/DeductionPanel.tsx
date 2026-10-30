import { useState, useEffect, useCallback } from 'react'
import { useStarStore } from '@/stores/starStore'
import type { Deduction } from '@/types'

interface DeductionPanelProps {
  onClose: () => void
  onFlyToStar?: (starId: string) => void
  /** If provided, load deductions for this star (overrides store selection) */
  starId?: string
}

export default function DeductionPanel({ onClose, onFlyToStar, starId: propStarId }: DeductionPanelProps) {
  const { stars, selectedDeductionStarId, selectDeductionStar } = useStarStore()
  const starId = propStarId || selectedDeductionStarId

  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [loading, setLoading] = useState(true)

  const star = stars.find((s) => s.id === starId)

  const loadDeductions = useCallback(async () => {
    if (!starId) return
    setLoading(true)
    try {
      const rows = await window.electronAPI.deduction.getForStar(starId)
      setDeductions(rows || [])
    } catch {
      setDeductions([])
    } finally {
      setLoading(false)
    }
  }, [starId])

  useEffect(() => {
    loadDeductions()
  }, [loadDeductions])

  const handleClose = () => {
    if (!propStarId) {
      selectDeductionStar(null)
    }
    onClose()
  }

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  if (!starId) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60">
      <div className="glass-panel w-[480px] max-h-[70vh] flex flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-teal-300/90">
              💡 推演 · {star?.starName || star?.surfaceText?.slice(0, 12) || '脉冲星'}
            </h2>
            <p className="text-xs text-ui-secondary/50 mt-0.5">
              {deductions.length} 条独立思考
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-ui-secondary/50 hover:text-ui-secondary text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-xs text-ui-secondary/50 text-center py-8">⏳ 加载推演记录…</p>
          ) : deductions.length === 0 ? (
            <p className="text-xs text-ui-secondary/50 text-center py-8">
              暂无推演记录
            </p>
          ) : (
            <div className="space-y-3">
              {deductions.map((ded, idx) => (
                <div
                  key={ded.id}
                  className="p-3 rounded-lg bg-white/[0.04] border border-white/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-ui-secondary/40">
                      推演 #{deductions.length - idx}
                    </span>
                    <span className="text-[10px] text-ui-secondary/30">
                      {formatDate(ded.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-ui-primary/80 leading-relaxed whitespace-pre-line">
                    {ded.content}
                  </p>
                  {ded.sourceSessionId && (
                    <p className="text-[10px] text-ui-secondary/30 mt-2 pt-2 border-t border-white/5">
                      📡 来自脉冲日志会话
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-xs text-ui-secondary hover:text-ui-primary rounded-md hover:bg-white/5 transition-colors"
          >
            关闭
          </button>
          {star && onFlyToStar && (
            <button
              onClick={() => {
                onFlyToStar(star.id)
                handleClose()
              }}
              className="px-3 py-1.5 text-xs text-cyan-400/70 hover:text-cyan-300 rounded-md hover:bg-white/5 transition-colors"
            >
              🚀 飞向这颗星
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
