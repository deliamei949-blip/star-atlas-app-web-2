import { useCallback } from 'react'
import { useStarStore } from '@/stores/starStore'
import { useUIStore } from '@/stores/uiStore'
import { StarForm } from '@/types'

interface RoamControlsProps {
  onFlyToStar: (starId: string) => void
}

export default function RoamControls({ onFlyToStar }: RoamControlsProps) {
  const stars = useStarStore((s) => s.stars)
  const {
    roamMode,
    roamFilter,
    roamTargetStarId,
    isFlying,
    setRoamMode,
    setRoamFilter,
  } = useUIStore()

  const currentStar = roamTargetStarId
    ? stars.find((s) => s.id === roamTargetStarId)
    : null

  // Filter stars based on selected filter
  const filteredStars = stars.filter((s) => {
    switch (roamFilter) {
      case 'stars':
        return s.form === StarForm.StarDust
      case 'pulsars':
        return s.form === StarForm.Pulsar
      case 'constellations':
        return s.form === StarForm.Constellation
      default:
        return true
    }
  })

  const pickRandomStar = useCallback(() => {
    if (filteredStars.length === 0) return null
    // Don't pick the same star again
    const candidates = roamTargetStarId
      ? filteredStars.filter((s) => s.id !== roamTargetStarId)
      : filteredStars
    if (candidates.length === 0) return filteredStars[Math.floor(Math.random() * filteredStars.length)]
    return candidates[Math.floor(Math.random() * candidates.length)]
  }, [filteredStars, roamTargetStarId])

  const handleStartRoam = () => {
    const star = pickRandomStar()
    if (star) {
      setRoamMode(true)
      onFlyToStar(star.id)
    }
  }

  const handleNext = () => {
    const star = pickRandomStar()
    if (star) {
      onFlyToStar(star.id)
    }
  }

  const handleEndRoam = () => {
    setRoamMode(false)
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
      <div className="glass-panel px-5 py-3 flex items-center gap-4">
        {!roamMode ? (
          <>
            {/* Idle state: start button + filter */}
            <button
              onClick={handleStartRoam}
              disabled={filteredStars.length === 0 || isFlying}
              className="text-sm font-medium text-star-glow hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              🚀 开始漫游
            </button>

            <div className="w-px h-5 bg-white/10" />

            <select
              value={roamFilter}
              onChange={(e) => setRoamFilter(e.target.value as typeof roamFilter)}
              className="bg-transparent text-xs text-ui-secondary border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-star-glow/40 cursor-pointer"
            >
              <option value="all">🌌 全部星体</option>
              <option value="stars">✨ 星辰</option>
              <option value="pulsars">💫 脉冲星</option>
              <option value="constellations">🌟 星座</option>
            </select>

            <span className="text-xs text-ui-secondary/40">
              {filteredStars.length} 颗
            </span>
          </>
        ) : (
          <>
            {/* Active roaming state */}
            <button
              onClick={handleNext}
              disabled={isFlying || filteredStars.length <= 1}
              className="text-sm font-medium text-star-glow hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isFlying ? '🌠 飞行中...' : '下一个 ➡'}
            </button>

            <div className="w-px h-5 bg-white/10" />

            <span className="text-xs text-ui-secondary/60 truncate max-w-[200px]">
              {currentStar
                ? `📍 ${currentStar.surfaceText.slice(0, 15)}${currentStar.surfaceText.length > 15 ? '...' : ''}`
                : '漫游中...'}
            </span>

            <div className="w-px h-5 bg-white/10" />

            <button
              onClick={handleEndRoam}
              className="text-xs text-ui-secondary hover:text-ui-primary transition-colors"
            >
              ✕ 结束漫游
            </button>
          </>
        )}
      </div>
    </div>
  )
}
