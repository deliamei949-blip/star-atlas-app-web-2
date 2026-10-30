import { useState, useEffect, useRef, useCallback } from 'react'

export default function CaptureInput() {
  const [starName, setStarName] = useState('')
  const [originalStardust, setOriginalStardust] = useState('')
  const [firstReaction, setFirstReaction] = useState('')
  const [sourceCoord, setSourceCoord] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const conceptInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus first reaction input
  useEffect(() => {
    setTimeout(() => conceptInputRef.current?.focus(), 100)
  }, [])

  // Read clipboard on mount as a convenience (fills 原始星尘)
  useEffect(() => {
    navigator.clipboard.readText().then((text) => {
      if (text && text.length < 1000) {
        setOriginalStardust(text)
      }
    }).catch(() => {
      // clipboard access may be denied
    })
  }, [])

  const handleSave = useCallback(async () => {
    // Use explicit name if provided, otherwise auto-generate from first reaction
    const conceptName = starName.trim()
    const understanding = firstReaction.trim()
    if (!conceptName || !understanding) {
      setError('请填写概念名称和你的理解')
      return
    }

    try {
      await window.electronAPI.capture.save({
        starName: conceptName,
        sourceText: originalStardust.trim(),
        sourceApp: sourceCoord.trim() || undefined,
        sourceUrl: undefined,
        myRewrite: understanding,
        isQuestion: false,
      })
      setSaved(true)
      setTimeout(() => {
        window.electronAPI.window.closeFloating()
      }, 800)
    } catch (err) {
      setError('保存失败，请重试')
    }
  }, [starName, originalStardust, firstReaction, sourceCoord])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave()
    } else if (e.key === 'Escape') {
      window.electronAPI.window.closeFloating()
    }
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-ui-primary text-lg">概念已捕获</p>
          <p className="text-ui-secondary text-sm mt-2">已进入待学习区，可以继续整理</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-5">
      {/* Star name — optional, auto-generated if empty */}
      <div className="mb-2.5">
        <label className="text-xs text-ui-secondary/60 mb-1 block">✨ 概念名称</label>
        <input
          ref={conceptInputRef}
          type="text"
          value={starName}
          onChange={(e) => {
            setStarName(e.target.value)
            setError('')
          }}
          placeholder="例如：沉没成本、反馈回路、第一人称视角"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-ui-primary text-sm outline-none placeholder:text-ui-secondary/30 focus:border-star-glow/40 transition-colors"
          maxLength={30}
        />
      </div>

      {/* First reaction — the most important field, becomes star surface */}
      <div className="mb-2.5">
        <label className="text-xs text-ui-secondary/60 mb-1 block">💭 我现在怎么理解</label>
        <textarea
          value={firstReaction}
          onChange={(e) => {
            setFirstReaction(e.target.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          placeholder="用你自己的话解释这个概念，不必写得完整……"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-ui-primary text-sm resize-none outline-none placeholder:text-ui-secondary/30 focus:border-star-glow/40 transition-colors"
          rows={2}
          maxLength={300}
        />
      </div>

      {/* Original stardust — auto-filled from clipboard, can be empty */}
      <div className="mb-2.5">
        <label className="text-xs text-ui-secondary/60 mb-1 block">📡 原文摘录（可选）</label>
        <textarea
          value={originalStardust}
          onChange={(e) => setOriginalStardust(e.target.value)}
          placeholder="让你遇到这个概念的原句……"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-ui-primary/80 text-sm resize-none outline-none placeholder:text-ui-secondary/30 focus:border-white/20 transition-colors"
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* Source coordinate — can be empty */}
      <div className="mb-2.5">
        <label className="text-xs text-ui-secondary/60 mb-1 block">📍 来源（可选）</label>
        <input
          type="text"
          value={sourceCoord}
          onChange={(e) => setSourceCoord(e.target.value)}
          placeholder="哪本书、哪篇文章、哪次对话……"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-ui-primary/70 text-sm outline-none placeholder:text-ui-secondary/30 focus:border-white/20 transition-colors"
          maxLength={200}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-white/5">
        <div className="text-xs text-ui-secondary/60">
          ⌘↵ 保存 &nbsp; Esc 取消
        </div>
        <div className="flex gap-2 items-center">
          {error && (
            <span className="text-red-400 text-xs">{error}</span>
          )}
          <button
            onClick={() => window.electronAPI.window.closeFloating()}
            className="px-3 py-1.5 text-xs text-ui-secondary hover:text-ui-primary rounded-md hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs bg-star-glow/20 text-star-glow rounded-md hover:bg-star-glow/30 transition-all"
          >
            捕获概念
          </button>
        </div>
      </div>
    </div>
  )
}
