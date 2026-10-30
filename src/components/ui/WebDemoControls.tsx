import { useState } from 'react'

export default function WebDemoControls() {
  const [helpOpen, setHelpOpen] = useState(false)

  const openCapture = () => {
    window.location.hash = '#/capture'
  }

  const resetDemo = () => {
    if (confirm('重置后会恢复初始演示星图，并清除当前浏览器里的演示修改。继续吗？')) {
      window.resetStarAtlasDemo?.()
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
        <div className="glass-panel px-3 py-2 flex items-center gap-2 text-[10px] text-ui-secondary/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
          WEB DEMO · 数据保存在浏览器本地
          <button
            onClick={() => setHelpOpen(true)}
            className="ml-1 text-ui-secondary/50 hover:text-star-glow transition-colors"
            title="查看操作说明"
          >
            ?
          </button>
          <button
            onClick={resetDemo}
            className="text-ui-secondary/40 hover:text-red-300 transition-colors"
            title="恢复初始演示数据"
          >
            重置
          </button>
        </div>
        <button
          onClick={openCapture}
          className="glass-panel px-4 py-2.5 flex items-center gap-2 text-star-glow hover:bg-star-glow/10 transition-colors"
        >
          <span className="text-lg leading-none">＋</span>
          <span className="text-xs font-medium">捕获概念</span>
          <span className="text-[9px] text-ui-secondary/50 border border-white/10 rounded px-1.5 py-0.5">
            ⌘ ⇧ K
          </span>
        </button>
      </div>

      {helpOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/65 backdrop-blur-sm"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="glass-panel relative w-[430px] max-w-[calc(100vw-32px)] p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setHelpOpen(false)}
              className="absolute top-3 right-4 text-ui-secondary/50 hover:text-ui-primary"
            >
              ✕
            </button>
            <p className="text-xs text-star-glow tracking-[0.16em] mb-2">STAR ATLAS · WEB DEMO</p>
            <h2 className="text-lg text-ui-primary mb-3">这不是一张静态截图</h2>
            <div className="space-y-2 text-xs text-ui-secondary leading-relaxed">
              <p>拖拽空白处旋转星图，滚轮或双指缩放，点击星体查看正反面知识卡片。</p>
              <p>左侧待学习区可以捕获、整理和删除概念；点击“连接”可建立四种知识关系。</p>
              <p>顶部搜索、底部漫游和右下角黑洞都可以直接体验。</p>
              <p className="text-ui-secondary/50">
                浏览器版使用内置演示 AI
                和数据持久化，不调用真实模型，也不会上传你的输入。
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
