import { useState, useRef, useEffect } from 'react'

interface Props {
  onConfirm: (question: string) => void
  onCancel: () => void
}

export default function CreateBlackHoleDialog({ onConfirm, onCancel }: Props) {
  const [question, setQuestion] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleConfirm = () => {
    const trimmed = question.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 pointer-events-auto">
      <div className="glass-panel p-6 w-[400px] animate-in fade-in zoom-in duration-200">
        <h2 className="text-sm font-medium text-purple-200/90 mb-4 flex items-center gap-2">
          <span>🕳️</span>
          投放黑洞谜题
        </h2>

        <p className="text-xs text-ui-secondary/50 mb-3">
          放入一个你无法回答的问题。AI 会自动搜索知识星图中可能相关的星体，围绕黑洞排列。
        </p>

        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleConfirm()
            }
            if (e.key === 'Escape') {
              onCancel()
            }
          }}
          placeholder="例如：量子纠缠为什么不能用来超光速通信？"
          rows={3}
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-ui-primary placeholder:text-ui-secondary/20 outline-none focus:border-purple-500/40 resize-none transition-colors mb-4"
        />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-xs text-ui-secondary/50 hover:text-ui-secondary transition-colors px-3 py-1.5"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!question.trim()}
            className="text-xs px-4 py-1.5 rounded-lg bg-purple-600/40 text-purple-100 hover:bg-purple-600/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-purple-500/30"
          >
            投放黑洞
          </button>
        </div>
      </div>
    </div>
  )
}
