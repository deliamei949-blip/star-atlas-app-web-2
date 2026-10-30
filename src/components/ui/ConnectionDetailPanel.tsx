import { useState } from 'react'
import { RelationTypeLabels, RelationTypeColors, StarForm } from '@/types'
import type { ConnectionWithStars } from '@/types'

interface ConnectionDetailPanelProps {
  data: ConnectionWithStars
  onFlyToStar: (starId: string) => void
  onDelete: (connectionId: string) => void
  onClose: () => void
}

const relationIcons: Record<string, string> = {
  resonance: '🔗',
  orbit: '🪐',
  binary_repel: '⚡',
  nebula_wrap: '🌌',
}

const relationDescriptions: Record<string, string> = {
  resonance: '两个知识之间存在相同的底层结构或模式',
  orbit: '一个知识是另一个知识的前提或因果推导',
  binary_repel: '两个知识形成对比或看似矛盾的观点',
  nebula_wrap: '一个知识包含或概括了另一个知识',
}

const formIcons: Record<number, string> = {
  [StarForm.StarDust]: '✨',
  [StarForm.Pulsar]: '💫',
  [StarForm.Constellation]: '🌟',
}

function StarPreview({ name, text, form }: { name?: string; text: string; form: number }) {
  const displayName = name || text.slice(0, 12)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-4 h-4 rounded-full"
        style={{
          backgroundColor: form === StarForm.Constellation ? '#ffaa44' : form === StarForm.Pulsar ? '#ffd700' : '#aaccff',
          boxShadow: `0 0 10px ${form === StarForm.Constellation ? '#ffaa44' : form === StarForm.Pulsar ? '#ffd700' : '#aaccff'}`,
        }}
      />
      <span className="text-xs font-medium text-ui-primary max-w-[100px] truncate text-center">
        {formIcons[form]} {displayName}
      </span>
      <p className="text-[10px] text-ui-secondary/50 max-w-[110px] truncate text-center leading-relaxed">
        {text.slice(0, 30)}
      </p>
    </div>
  )
}

export default function ConnectionDetailPanel({
  data,
  onFlyToStar,
  onDelete,
  onClose,
}: ConnectionDetailPanelProps) {
  const { connection, starA, starB } = data
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const relColor = RelationTypeColors[connection.relationType] || '#6688cc'
  const relIcon = relationIcons[connection.relationType] || '🔗'
  const relLabel = RelationTypeLabels[connection.relationType] || connection.relationType
  const relDesc = relationDescriptions[connection.relationType] || ''

  const createdDate = connection.createdAt
    ? new Date(connection.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '未知'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-panel w-[420px] max-h-[85vh] overflow-y-auto p-6 animate-in">
        {/* Header */}
        <h2 className="text-lg font-medium text-star-glow text-center mb-1">
          🌟 引力连接详情
        </h2>

        {/* Two stars side by side with relation in the middle */}
        <div className="flex items-start justify-center gap-3 my-5">
          <StarPreview
            name={starA.starName}
            text={starA.surfaceText}
            form={starA.form}
          />

          <div className="flex flex-col items-center pt-3 shrink-0">
            <span className="text-lg">{relIcon}</span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 whitespace-nowrap"
              style={{ color: relColor, backgroundColor: `${relColor}18` }}
            >
              {relLabel.slice(0, 4)}
            </span>
          </div>

          <StarPreview
            name={starB.starName}
            text={starB.surfaceText}
            form={starB.form}
          />
        </div>

        {/* Relation type detail */}
        <div
          className="rounded-xl p-4 mb-4 border"
          style={{ borderColor: `${relColor}30`, backgroundColor: `${relColor}08` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{relIcon}</span>
            <span className="text-sm font-medium" style={{ color: relColor }}>
              {relLabel}
            </span>
          </div>
          <p className="text-xs text-ui-secondary/60 ml-7">{relDesc}</p>
        </div>

        {/* Note */}
        <div className="mb-4">
          <p className="text-xs text-ui-secondary/50 uppercase tracking-wider mb-1.5">
            📝 连接备注
          </p>
          {connection.note ? (
            <p className="text-sm text-ui-primary/80 bg-black/20 rounded-lg p-3 leading-relaxed">
              {connection.note}
            </p>
          ) : (
            <p className="text-xs text-ui-secondary/30 italic bg-black/20 rounded-lg p-3">
              创建时未留下备注...
            </p>
          )}
        </div>

        {/* Created date */}
        <p className="text-[10px] text-ui-secondary/30 text-right mb-5">
          📅 创建于 {createdDate}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => onFlyToStar(starA.id)}
              className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 text-ui-secondary hover:text-ui-primary border border-white/10 hover:border-white/20 transition-colors"
            >
              🚀 飞向 {starA.starName?.slice(0, 6) || '星体A'}
            </button>
            <button
              onClick={() => onFlyToStar(starB.id)}
              className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 text-ui-secondary hover:text-ui-primary border border-white/10 hover:border-white/20 transition-colors"
            >
              🚀 飞向 {starB.starName?.slice(0, 6) || '星体B'}
            </button>
          </div>

          <div className="flex gap-2">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 py-2 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
              >
                🗑 断开连接
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onDelete(connection.id)
                    onClose()
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  确认断开
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-lg text-xs text-ui-secondary/60 hover:text-ui-primary border border-white/10 hover:border-white/20 transition-colors"
                >
                  取消
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-xs text-ui-secondary/60 hover:text-ui-primary border border-white/10 hover:border-white/20 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
