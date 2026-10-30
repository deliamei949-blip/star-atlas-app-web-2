import { useState, useEffect, useCallback } from 'react'
import { useStarStore } from '@/stores/starStore'
import { useUIStore } from '@/stores/uiStore'

interface SettingsData {
  deepseek_api_key: string
  deepseek_base_url: string
  deepseek_model: string
  stt_api_key: string
  stt_base_url: string
  stt_model: string
  global_shortcut: string
}

interface SettingsPanelProps {
  onClose: () => void
}

const defaultSettings: SettingsData = {
  deepseek_api_key: '',
  deepseek_base_url: 'https://api.deepseek.com',
  deepseek_model: 'deepseek-chat',
  stt_api_key: '',
  stt_base_url: 'https://api.siliconflow.cn/v1',
  stt_model: 'FunAudioLLM/SenseVoiceSmall',
  global_shortcut: 'CommandOrControl+Shift+K',
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null) // field key being saved, or 'all'
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Data export/import state ──
  const [dataBusy, setDataBusy] = useState(false)
  const [dataMsg, setDataMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const loadStars = useStarStore((s) => s.loadStars)
  const loadConnections = useStarStore((s) => s.loadConnections)
  const loadBlackHoles = useUIStore((s) => s.loadBlackHoles)

  // Show/hide for password fields
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Load settings on open
  useEffect(() => {
    ;(async () => {
      try {
        const saved = await window.electronAPI.settings.getAll()
        if (saved) setSettings({ ...defaultSettings, ...saved })
      } catch {
        // use defaults
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const updateField = useCallback(
    (key: keyof SettingsData, value: string) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const saveField = useCallback(
    async (key: keyof SettingsData) => {
      setSaving(key)
      setStatusMsg(null)
      try {
        await window.electronAPI.settings.set(key, settings[key])
        setStatusMsg({ type: 'success', text: `已保存: ${FIELD_LABELS[key]}` })
        setTimeout(() => setStatusMsg(null), 2000)
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err?.message || '保存失败' })
      } finally {
        setSaving(null)
      }
    },
    [settings],
  )

  const saveAll = useCallback(async () => {
    setSaving('all')
    setStatusMsg(null)
    try {
      for (const [key, value] of Object.entries(settings)) {
        await window.electronAPI.settings.set(key, value)
      }
      setStatusMsg({ type: 'success', text: '✓ 所有设置已保存并生效' })
      setTimeout(() => setStatusMsg(null), 2500)
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || '保存失败' })
    } finally {
      setSaving(null)
    }
  }, [settings])

  const handleExport = useCallback(async () => {
    setDataBusy(true)
    setDataMsg(null)
    try {
      const result = await window.electronAPI.data.exportToFile()
      if (result.cancelled) {
        setDataMsg(null)
      } else if (result.success) {
        const c = result.counts as Record<string, number>
        setDataMsg({
          type: 'success',
          text: `已导出 ${c.stars} 颗星、${c.connections} 条连接、${c.deductions} 条推演、${c.blackHoles} 个黑洞`,
        })
      } else {
        setDataMsg({ type: 'error', text: result.error || '导出失败' })
      }
    } catch (err: any) {
      setDataMsg({ type: 'error', text: err?.message || '导出失败' })
    } finally {
      setDataBusy(false)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!window.confirm('导入将覆盖同 ID 的现有数据。确定继续？')) return

    setDataBusy(true)
    setDataMsg(null)
    try {
      const result = await window.electronAPI.data.importFromFile()
      if (result.cancelled) {
        setDataMsg(null)
      } else if (result.success) {
        const c = result.counts as Record<string, number>
        setDataMsg({
          type: 'success',
          text: `已导入 ${c.stars} 颗星、${c.connections} 条连接、${c.deductions} 条推演、${c.blackHoles} 个黑洞`,
        })
        // Reload all data in stores
        await loadStars()
        await loadConnections()
        await loadBlackHoles()
      } else {
        setDataMsg({ type: 'error', text: result.error || '导入失败' })
      }
    } catch (err: any) {
      setDataMsg({ type: 'error', text: err?.message || '导入失败' })
    } finally {
      setDataBusy(false)
    }
  }, [loadStars, loadConnections, loadBlackHoles])

  if (loading) {
    return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60">
        <div className="glass-panel w-[480px] p-8 text-center">
          <p className="text-ui-secondary text-sm">⏳ 加载设置…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60">
      <div className="glass-panel w-[540px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-star-glow">⚙️ 设置</h2>
            <p className="text-xs text-ui-secondary/50 mt-0.5">
              配置 API 密钥与快捷键
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ui-secondary/50 hover:text-ui-secondary text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ── AI 模型 ── */}
          <SectionHeader icon="🧠" title="AI 模型 · DeepSeek" />
          <FieldRow
            label="API Key"
            keyName="deepseek_api_key"
            value={settings.deepseek_api_key}
            onChange={(v) => updateField('deepseek_api_key', v)}
            onSave={() => saveField('deepseek_api_key')}
            saving={saving}
            visibleKeys={visibleKeys}
            onToggleVis={toggleVisibility}
            secret
          />
          <FieldRow
            label="Base URL"
            keyName="deepseek_base_url"
            value={settings.deepseek_base_url}
            onChange={(v) => updateField('deepseek_base_url', v)}
            onSave={() => saveField('deepseek_base_url')}
            saving={saving}
            visibleKeys={visibleKeys}
            onToggleVis={toggleVisibility}
          />
          <FieldRow
            label="Model"
            keyName="deepseek_model"
            value={settings.deepseek_model}
            onChange={(v) => updateField('deepseek_model', v)}
            onSave={() => saveField('deepseek_model')}
            saving={saving}
            visibleKeys={visibleKeys}
            onToggleVis={toggleVisibility}
          />

          {/* ── 语音识别 ── */}
          <SectionHeader icon="🎙️" title="语音识别 · STT" />
          <FieldRow
            label="API Key"
            keyName="stt_api_key"
            value={settings.stt_api_key}
            onChange={(v) => updateField('stt_api_key', v)}
            onSave={() => saveField('stt_api_key')}
            saving={saving}
            visibleKeys={visibleKeys}
            onToggleVis={toggleVisibility}
            secret
          />
          <FieldRow
            label="Base URL"
            keyName="stt_base_url"
            value={settings.stt_base_url}
            onChange={(v) => updateField('stt_base_url', v)}
            onSave={() => saveField('stt_base_url')}
            saving={saving}
            visibleKeys={visibleKeys}
            onToggleVis={toggleVisibility}
          />
          <FieldRow
            label="Model"
            keyName="stt_model"
            value={settings.stt_model}
            onChange={(v) => updateField('stt_model', v)}
            onSave={() => saveField('stt_model')}
            saving={saving}
            visibleKeys={visibleKeys}
            onToggleVis={toggleVisibility}
          />

          {/* ── 快捷键 ── */}
          <SectionHeader icon="⌨️" title="快捷键" />
          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-ui-secondary/70 mb-1 block">捕获星光 (全局)</label>
                <input
                  type="text"
                  value={settings.global_shortcut}
                  onChange={(e) => updateField('global_shortcut', e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-md px-2 py-1 text-xs text-ui-primary w-56 font-mono outline-none focus:border-white/30"
                  placeholder="CommandOrControl+Shift+K"
                />
                <p className="text-[10px] text-ui-secondary/30 mt-1">
                  例如: CommandOrControl+Shift+K, Cmd+Alt+Space
                </p>
              </div>
              <button
                onClick={() => saveField('global_shortcut')}
                disabled={saving === 'global_shortcut'}
                className="text-xs text-star-glow/70 hover:text-star-glow disabled:opacity-30 transition-colors px-2 py-1"
              >
                {saving === 'global_shortcut' ? '…' : '保存'}
              </button>
            </div>
          </div>

          {/* ── 数据管理 ── */}
          <SectionHeader icon="📦" title="数据管理" />

          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-ui-secondary/70 block">导出数据</label>
                <p className="text-[10px] text-ui-secondary/30 mt-0.5">
                  导出全部星图数据为 JSON 备份文件
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={dataBusy}
                className="text-xs text-star-glow/70 hover:text-star-glow disabled:opacity-30 transition-colors px-3 py-1 rounded-md hover:bg-star-glow/5"
              >
                {dataBusy ? '⏳' : '📤 导出'}
              </button>
            </div>

            <div className="border-t border-white/5 pt-3 flex items-center justify-between">
              <div>
                <label className="text-xs text-ui-secondary/70 block">导入数据</label>
                <p className="text-[10px] text-ui-secondary/30 mt-0.5">
                  从 JSON 备份文件导入（覆盖同 ID 记录）
                </p>
              </div>
              <button
                onClick={handleImport}
                disabled={dataBusy}
                className="text-xs text-amber-300/70 hover:text-amber-300 disabled:opacity-30 transition-colors px-3 py-1 rounded-md hover:bg-amber-400/5"
              >
                {dataBusy ? '⏳' : '📥 导入'}
              </button>
            </div>

            {dataMsg && (
              <div className={`text-xs ${dataMsg.type === 'success' ? 'text-teal-300/80' : 'text-red-400/80'} border-t border-white/5 pt-2`}>
                {dataMsg.text}
              </div>
            )}
          </div>

          {/* 说明 */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-dashed border-white/5">
            <p className="text-[10px] text-ui-secondary/40 leading-relaxed">
              💡 以上配置保存在本地数据库中，不会上传到任何服务器。API Key 修改后立即生效，无需重启应用。快捷键修改后可能需要切换到其他应用再切回来才生效。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          {statusMsg && (
            <span
              className={`text-xs ${
                statusMsg.type === 'success'
                  ? 'text-teal-300/80'
                  : 'text-red-400/80'
              }`}
            >
              {statusMsg.text}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-ui-secondary hover:text-ui-primary rounded-md hover:bg-white/5 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={saveAll}
              disabled={saving === 'all'}
              className="px-4 py-1.5 text-xs bg-star-glow/20 text-star-glow rounded-md hover:bg-star-glow/30 disabled:opacity-30 transition-all"
            >
              {saving === 'all' ? '⏳ 保存中…' : '✓ 保存全部'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-sm">{icon}</span>
      <h3 className="text-xs font-medium text-ui-primary/70 uppercase tracking-wide">
        {title}
      </h3>
    </div>
  )
}

function FieldRow({
  label,
  keyName,
  value,
  onChange,
  onSave,
  saving,
  visibleKeys,
  onToggleVis,
  secret,
}: {
  label: string
  keyName: string
  value: string
  onChange: (v: string) => void
  onSave: () => void
  saving: string | null
  visibleKeys: Set<string>
  onToggleVis: (k: string) => void
  secret?: boolean
}) {
  const isSecret = secret && !visibleKeys.has(keyName)
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-ui-secondary/60 w-20 shrink-0">{label}</label>
      <div className="flex-1 relative flex items-center">
        <input
          type={isSecret ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isSecret ? '••••••••' : ''}
          className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-ui-primary font-mono outline-none focus:border-white/25 transition-colors"
        />
        {secret && (
          <button
            onClick={() => onToggleVis(keyName)}
            className="absolute right-7 text-xs text-ui-secondary/40 hover:text-ui-secondary px-1"
            title={isSecret ? '显示' : '隐藏'}
          >
            {isSecret ? '👁' : '🙈'}
          </button>
        )}
      </div>
      <button
        onClick={onSave}
        disabled={saving === keyName || saving === 'all'}
        className="text-[10px] text-star-glow/60 hover:text-star-glow disabled:opacity-30 transition-colors w-10 text-right"
      >
        {saving === keyName ? '…' : '保存'}
      </button>
    </div>
  )
}

const FIELD_LABELS: Record<string, string> = {
  deepseek_api_key: 'DeepSeek API Key',
  deepseek_base_url: 'DeepSeek Base URL',
  deepseek_model: 'DeepSeek Model',
  stt_api_key: 'STT API Key',
  stt_base_url: 'STT Base URL',
  stt_model: 'STT Model',
  global_shortcut: '全局快捷键',
}
