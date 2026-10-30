import { useState } from 'react'
import type { Star, RelationType } from '@/types'
import { RelationTypeLabels, RelationTypeColors } from '@/types'

interface ConnectionDialogProps {
  starA: Star
  starB: Star
  onConfirm: (relationType: RelationType, note: string) => void
  onCancel: () => void
}

const relationIcons: Record<RelationType, string> = {
  resonance: '🔗',
  orbit: '🪐',
  binary_repel: '⚡',
  nebula_wrap: '🌌',
}

const relationDescriptions: Record<RelationType, string> = {
  resonance: '两个知识之间存在相同的底层结构或模式',
  orbit: '一个知识是另一个知识的前提或因果推导',
  binary_repel: '两个知识形成对比或看似矛盾的观点',
  nebula_wrap: '一个知识包含或概括了另一个知识',
}

export default function ConnectionDialog({
  starA,
  starB,
  onConfirm,
  onCancel,
}: ConnectionDialogProps) {
  const [selectedType, setSelectedType] = useState<RelationType>('resonance')
  const [note, setNote] = useState('')

  const relationTypes: RelationType[] = ['resonance', 'orbit', 'binary_repel', 'nebula_wrap']

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-[420px] max-h-[80vh] overflow-y-auto p-6 animate-in">
        {/* Header */}
        <h2 className="text-lg font-medium text-star-glow text-glow text-center mb-1">
          🌟 建立引力连接
        </h2>

        {/* Star preview */}
        <div className="flex items-center justify-center gap-4 my-4">
          <div className="flex-1 text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: '#ffd700', boxShadow: '0 0 8px #ffd700' }}
            />
            <p className="text-xs text-ui-secondary truncate max-w-[130px] mx-auto">
              {starA.surfaceText.slice(0, 20)}
            </p>
          </div>
          <span className="text-ui-secondary/40 text-lg">⟷</span>
          <div className="flex-1 text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: '#44ddff', boxShadow: '0 0 8px #44ddff' }}
            />
            <p className="text-xs text-ui-secondary truncate max-w-[130px] mx-auto">
              {starB.surfaceText.slice(0, 20)}
            </p>
          </div>
        </div>

        {/* Relation type selection */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-ui-secondary/60 uppercase tracking-wider">
            选择关系类型
          </p>
          {relationTypes.map((type) => {
            const isSelected = selectedType === type
            const color = RelationTypeColors[type]
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="w-full text-left p-3 rounded-xl transition-all border"
                style={{
                  borderColor: isSelected ? color : 'rgba(136,153,204,0.1)',
                  backgroundColor: isSelected ? `${color}15` : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{relationIcons[type]}</span>
                  <div className="flex-1">
                    <span
                      className="text-sm font-medium"
                      style={{ color: isSelected ? color : '#8899cc' }}
                    >
                      {RelationTypeLabels[type]}
                    </span>
                    <p className="text-xs text-ui-secondary/50 mt-0.5">
                      {relationDescriptions[type]}
                    </p>
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full transition-transform"
                    style={{
                      backgroundColor: color,
                      transform: isSelected ? 'scale(1.2)' : 'scale(0.8)',
                      opacity: isSelected ? 1 : 0.4,
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Optional note */}
        <div className="mb-5">
          <label className="text-xs text-ui-secondary/60 uppercase tracking-wider mb-1 block">
            备注（可选）
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="记下这条连接的缘由..."
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-ui-primary placeholder:text-ui-secondary/30 focus:outline-none focus:border-star-glow/40 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm text-ui-secondary hover:text-ui-primary border border-white/10 hover:border-white/20 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(selectedType, note)}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-star-glow/20 text-star-glow border border-star-glow/30 hover:bg-star-glow/30 transition-colors"
          >
            ✨ 确认连接
          </button>
        </div>
      </div>
    </div>
  )
}
