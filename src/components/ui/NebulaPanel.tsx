import { useEffect, useState } from 'react'
import { useCaptureStore } from '@/stores/captureStore'
import { useStarStore } from '@/stores/starStore'
import { useUIStore } from '@/stores/uiStore'
import PulseLogPanel from './PulseLogPanel'
import { StarForm } from '@/types'

type PanelTab = 'nebula' | 'stars' | 'pulse'

export default function NebulaPanel() {
  const { captures, loading, loadCaptures, removeCapture } = useCaptureStore()
  const { stars, igniteCapture, loadStars, removeStar } = useStarStore()
  const { nebulaPanelOpen, toggleNebulaPanel, requestFlyToStar } = useUIStore()
  const [igniting, setIgniting] = useState<string | null>(null)
  const [igniteError, setIgniteError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PanelTab>('nebula')
  const [activePulseSource, setActivePulseSource] = useState<string | null>(null)
  const [pulseSources, setPulseSources] = useState<Array<{ source_app: string; star_count: number }>>([])

  // ── 来源归类管理 ──
  const [expandedSource, setExpandedSource] = useState<string | null>(null)
  const [sourceCaptures, setSourceCaptures] = useState<any[]>([])
  const [loadingCaptures, setLoadingCaptures] = useState(false)
  const [addPickerSource, setAddPickerSource] = useState<string | null>(null)
  const [addSearchQuery, setAddSearchQuery] = useState('')

  useEffect(() => {
    loadCaptures()
  }, [loadCaptures])

  // Listen for new captures saved from floating window
  useEffect(() => {
    const unsubscribe = window.electronAPI.capture.onSaved(() => {
      loadCaptures()
      loadStars()
    })
    return unsubscribe
  }, [loadCaptures, loadStars])

  useEffect(() => {
    if (nebulaPanelOpen) {
      loadStars()
    }
  }, [nebulaPanelOpen, loadStars])

  const unprocessed = captures.filter((c) => !c.processed)

  const handleToggleSource = async (sourceApp: string) => {
    if (expandedSource === sourceApp) {
      setExpandedSource(null)
      setSourceCaptures([])
      return
    }
    setExpandedSource(sourceApp)
    setLoadingCaptures(true)
    try {
      const rows = await window.electronAPI.capture.getBySource(sourceApp)
      setSourceCaptures(rows || [])
    } catch {
      setSourceCaptures([])
    } finally {
      setLoadingCaptures(false)
    }
  }

  const handleRemoveFromSource = async (captureId: string) => {
    await window.electronAPI.capture.updateSource(captureId, '')
    // Refresh
    setSourceCaptures(prev => prev.filter(c => c.id !== captureId))
    // Refresh source counts
    window.electronAPI.pulse.getSourceCoords().then(setPulseSources).catch(() => {})
  }

  const handleAddToSource = async (captureId: string, targetSource: string) => {
    await window.electronAPI.capture.updateSource(captureId, targetSource)
    setAddPickerSource(null)
    setAddSearchQuery('')
    // Refresh expanded source list
    if (expandedSource === targetSource) {
      handleToggleSource(targetSource)
      // Re-expand after a tick
      setTimeout(() => handleToggleSource(targetSource), 100)
    }
    // Refresh source counts
    window.electronAPI.pulse.getSourceCoords().then(setPulseSources).catch(() => {})
  }

  // Stars eligible for adding to a source (those NOT already in it)
  const eligibleStars = stars.filter(s => {
    if (!s.captureId) return false
    return !sourceCaptures.some(sc => sc.star_id === s.id)
  })

  const filteredEligibleStars = addSearchQuery.trim()
    ? eligibleStars.filter(s =>
        (s.starName || s.surfaceText || '').toLowerCase().includes(addSearchQuery.toLowerCase())
      )
    : eligibleStars

  const formLabel = (form: number) => {
    if (form === StarForm.StarDust) return '✨ 星辰'
    if (form === StarForm.Pulsar) return '💫 脉冲星'
    if (form === StarForm.Constellation) return '🌟 星座'
    return '⭐ 星体'
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleNebulaPanel}
        className="fixed left-4 top-4 z-50 glass-panel px-3 py-2 text-xs text-ui-secondary hover:text-ui-primary transition-colors"
      >
        {nebulaPanelOpen ? '◁ 收起星云带' : '▷ 星云带'}
        {unprocessed.length > 0 && (
          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-star-glow/20 text-star-glow text-xs">
            {unprocessed.length}
          </span>
        )}
      </button>

      {/* Nebula panel */}
      {nebulaPanelOpen && (
        <div className="fixed left-0 top-0 h-full w-80 z-40 glass-panel rounded-none rounded-r-2xl flex flex-col border-l-0">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab('nebula')}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                activeTab === 'nebula'
                  ? 'text-star-glow border-b border-star-glow/60'
                  : 'text-ui-secondary/50 hover:text-ui-secondary'
              }`}
            >
              🌌 星云带
              {unprocessed.length > 0 && (
                <span className="ml-1 text-star-glow/70">({unprocessed.length})</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stars')}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                activeTab === 'stars'
                  ? 'text-star-glow border-b border-star-glow/60'
                  : 'text-ui-secondary/50 hover:text-ui-secondary'
              }`}
            >
              ⭐ 星图
              <span className="ml-1 text-ui-secondary/40">({stars.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('pulse')
                // Load pulse sources
                window.electronAPI.pulse.getSourceCoords().then(setPulseSources).catch(() => {})
              }}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                activeTab === 'pulse'
                  ? 'text-star-glow border-b border-star-glow/60'
                  : 'text-ui-secondary/50 hover:text-ui-secondary'
              }`}
            >
              📡 脉冲日志
            </button>
          </div>

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5">
            {activeTab === 'nebula' ? (
              <p className="text-xs text-ui-secondary">
                等待点燃 · {unprocessed.length} 条星光
              </p>
            ) : activeTab === 'stars' ? (
              <p className="text-xs text-ui-secondary">
                已点燃 · {stars.length} 颗星体
              </p>
            ) : (
              <p className="text-xs text-ui-secondary">
                按来源分组 · {pulseSources.length} 个论文源
              </p>
            )}
            {igniteError && (
              <p className="text-xs text-red-400 mt-2 bg-red-400/10 px-2 py-1 rounded">
                {igniteError}
              </p>
            )}
          </div>

          {/* ── List: 星云带 Tab ── */}
          {activeTab === 'nebula' && (
            <div className="flex-1 overflow-y-auto p-2">
              {loading && (
                <div className="text-center text-ui-secondary py-8 text-sm">
                  扫描星云中...
                </div>
              )}

              {!loading && captures.length === 0 && (
                <div className="text-center text-ui-secondary py-12">
                  <p className="text-3xl mb-3">✨</p>
                  <p className="text-sm">星云带静待第一缕光</p>
                  <p className="text-xs mt-2 opacity-60">
                    Cmd+Shift+K 捕获你的第一个想法
                  </p>
                </div>
              )}

              {!loading &&
                captures.map((capture) => (
                  <div
                    key={capture.id}
                    className={`mb-2 p-3 rounded-xl transition-all ${
                      capture.processed
                        ? 'bg-white/[0.02] opacity-50'
                        : 'bg-white/[0.05] hover:bg-white/[0.08]'
                    }`}
                  >
                    {/* Star name — primary display */}
                    <p className="text-sm text-star-glow font-medium leading-relaxed">
                      ✨ {capture.starName || capture.myRewrite?.slice(0, 15) || '未命名'}
                    </p>
                    {/* First reaction — subtitle */}
                    {capture.myRewrite && (
                      <p className="text-xs text-ui-primary/70 mt-1 leading-relaxed line-clamp-2">
                        💭 {capture.myRewrite}
                      </p>
                    )}
                    {/* Original stardust snippet */}
                    {capture.sourceText && (
                      <p className="text-xs text-ui-secondary/50 mt-1 truncate">
                        📡 {capture.sourceText.slice(0, 50)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-ui-secondary/40">
                        {capture.sourceApp ? `📍 ${capture.sourceApp} · ` : ''}{formatTime(capture.capturedAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        {!capture.processed && (
                          <button
                            onClick={async () => {
                              setIgniting(capture.id)
                              setIgniteError(null)
                              try {
                                const result = await igniteCapture(
                                  capture.id,
                                  capture.sourceText,
                                  capture.myRewrite,
                                  capture.sourceApp || ''
                                )
                                setIgniting(null)
                                if (result) {
                                  loadCaptures()
                                  loadStars()
                                } else {
                                  setIgniteError('点燃失败 — 请确认 .env 中已配置 DEEPSEEK_API_KEY')
                                }
                              } catch (err: any) {
                                setIgniting(null)
                                setIgniteError(err?.message || '点燃失败，请重试')
                              }
                            }}
                            disabled={igniting === capture.id}
                            className="text-xs text-star-glow/60 hover:text-star-glow transition-colors disabled:opacity-30"
                          >
                            {igniting === capture.id ? '⏳ 点燃中...' : '点燃'}
                          </button>
                        )}
                        {capture.processed && (
                          <span className="text-xs text-ui-secondary/30">
                            ✓ 已点燃
                          </span>
                        )}
                        <button
                          onClick={async () => {
                            await removeCapture(capture.id)
                            loadStars() // refresh star list since associated star is also deleted
                          }}
                          className="text-xs text-red-400/40 hover:text-red-400 transition-colors"
                          title="删除捕获（同时删除关联星体）"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── List: 星图 Tab ── */}
          {activeTab === 'stars' && (
            <div className="flex-1 overflow-y-auto p-2">
              {stars.length === 0 && (
                <div className="text-center text-ui-secondary py-12">
                  <p className="text-3xl mb-3">🌟</p>
                  <p className="text-sm">还没有点燃的星体</p>
                  <p className="text-xs mt-2 opacity-60">
                    回到星云带点燃你的第一条星光
                  </p>
                </div>
              )}

              {stars.map((star) => (
                <div
                  key={star.id}
                  className="mb-2 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ui-secondary/50">
                      {formLabel(star.form)}
                    </span>
                  </div>
                  <p className="text-sm text-star-glow font-medium mt-1 leading-relaxed">
                    {star.starName || star.surfaceText?.slice(0, 15) || '未命名星体'}
                  </p>
                  {star.unsolvedSignal && (
                    <p className="text-xs text-ui-primary/60 mt-0.5 line-clamp-2">
                      {star.unsolvedSignal}
                    </p>
                  )}
                  {star.myDecode && (
                    <p className="text-xs text-ui-secondary/50 mt-0.5 line-clamp-2">
                      {star.myDecode}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-ui-secondary/30">
                      {star.createdAt ? formatTime(star.createdAt) : ''}
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm(`确定要删除 "${star.surfaceText || '这颗星体'}" 吗？`)) {
                          await removeStar(star.id)
                          loadCaptures() // refresh capture list too
                        }
                      }}
                      className="text-xs text-red-400/40 hover:text-red-400 transition-colors"
                      title="删除星体"
                    >
                      🗑 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── List: 脉冲日志 Tab ── */}
          {activeTab === 'pulse' && (
            <div className="flex-1 overflow-y-auto p-2">
              {pulseSources.length === 0 && (
                <div className="text-center text-ui-secondary py-12">
                  <p className="text-3xl mb-3">📡</p>
                  <p className="text-sm">还没有来源分组</p>
                  <p className="text-xs mt-2 opacity-60">
                    捕获星光时填写「来源坐标」后出现
                  </p>
                </div>
              )}
              {pulseSources.map((src) => (
                <div
                  key={src.source_app}
                  className="mb-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] transition-all overflow-hidden"
                >
                  {/* Source header — click to expand */}
                  <button
                    onClick={() => handleToggleSource(src.source_app)}
                    className="w-full p-3 text-left flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-star-glow font-medium truncate">
                        📄 {src.source_app}
                      </p>
                      <p className="text-xs text-ui-secondary/50 mt-0.5">
                        已点燃 {src.star_count} 颗脉冲星
                      </p>
                    </div>
                    <span className="text-xs text-ui-secondary/40 ml-2 shrink-0">
                      {expandedSource === src.source_app ? '▾' : '▸'}
                    </span>
                  </button>

                  {/* Expanded: show stars + actions */}
                  {expandedSource === src.source_app && (
                    <div className="border-t border-white/5 px-3 pb-2">
                      {/* Add star button */}
                      <div className="pt-2 pb-1">
                        {addPickerSource === src.source_app ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={addSearchQuery}
                                onChange={e => setAddSearchQuery(e.target.value)}
                                placeholder="搜索星体名称…"
                                className="flex-1 bg-white/10 border border-white/10 rounded-md px-2 py-1 text-xs text-ui-primary outline-none focus:border-white/30"
                                autoFocus
                              />
                              <button
                                onClick={() => { setAddPickerSource(null); setAddSearchQuery('') }}
                                className="text-xs text-ui-secondary/50 hover:text-ui-secondary px-1"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-0.5">
                              {filteredEligibleStars.length === 0 ? (
                                <p className="text-xs text-ui-secondary/40 py-2 text-center">
                                  {addSearchQuery ? '无匹配星体' : '没有可归入的星体'}
                                </p>
                              ) : (
                                filteredEligibleStars.slice(0, 20).map(star => (
                                  <button
                                    key={star.id}
                                    onClick={() => handleAddToSource(star.captureId!, src.source_app)}
                                    className="w-full text-left px-2 py-1 rounded hover:bg-white/10 transition-colors flex items-center justify-between"
                                  >
                                    <span className="text-xs text-ui-primary/80 truncate">
                                      {star.starName || star.surfaceText?.slice(0, 20) || '未命名'}
                                    </span>
                                    <span className="text-[10px] text-ui-secondary/40 ml-1 shrink-0">
                                      {formLabel(star.form)}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddPickerSource(src.source_app)}
                            className="text-xs text-cyan-400/60 hover:text-cyan-300 transition-colors"
                          >
                            ➕ 归入星体
                          </button>
                        )}
                      </div>

                      {/* Star list */}
                      {loadingCaptures ? (
                        <p className="text-xs text-ui-secondary/50 text-center py-3">⏳ 加载中…</p>
                      ) : sourceCaptures.length === 0 ? (
                        <p className="text-xs text-ui-secondary/40 text-center py-3">暂无星体</p>
                      ) : (
                        <div className="space-y-1">
                          {sourceCaptures.map((cap: any) => (
                            <div
                              key={cap.id}
                              className="flex items-center justify-between py-1.5 px-1 rounded hover:bg-white/[0.04]"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-ui-primary/80 truncate">
                                  {cap.star_name || cap.star_surface_text?.slice(0, 20) || '未命名星体'}
                                </p>
                                {cap.star_surface_text && cap.star_name && (
                                  <p className="text-[10px] text-ui-secondary/40 truncate">
                                    {cap.star_surface_text.slice(0, 30)}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveFromSource(cap.id)}
                                className="text-xs text-red-400/40 hover:text-red-400 transition-colors ml-2 shrink-0"
                                title="从此来源移除"
                              >
                                ✕ 移出
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Open pulse log button (always visible) */}
                  <div className="px-3 pb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActivePulseSource(src.source_app)
                      }}
                      className="text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors"
                    >
                      📡 写脉冲日志 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PulseLogPanel modal */}
      {activePulseSource && (
        <PulseLogPanel
          sourceCoord={activePulseSource}
          onClose={() => setActivePulseSource(null)}
          onFlyToStar={(starId) => requestFlyToStar(starId)}
          onViewDeductions={(starId) => useStarStore.getState().selectDeductionStar(starId)}
        />
      )}
    </>
  )
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString('zh-CN')
  } catch {
    return ''
  }
}
