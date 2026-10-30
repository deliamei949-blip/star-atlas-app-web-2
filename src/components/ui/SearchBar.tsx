import { useState, useEffect, useRef, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import type { EchoResult } from '@/types'

interface SearchResultItem {
  starId: string
  starName?: string
  surfaceText: string
  myDecode?: string
  relevanceScore: number
  explanation: string
  positionX: number
  positionY: number
  positionZ: number
}

export default function SearchBar() {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const {
    echoResults,
    echoStarIds,
    isSearching,
    setEchoResults,
    clearEcho,
    setSearching,
    requestFlyToStar,
  } = useUIStore()

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!inputValue.trim()) {
      clearEcho()
      setIsOpen(false)
      setError(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const query = inputValue.trim()
      if (!query) return

      setSearching(true)
      setError(null)

      try {
        console.log('[SearchBar] Calling ai:searchSimilar with query:', query)
        const result = await window.electronAPI.ai.searchSimilar({ query })
        console.log('[SearchBar] Result:', JSON.stringify(result))

        if (result.success && result.data) {
          const data = result.data as SearchResultItem[]
          const starIds = data.map(d => d.starId)
          const echoResults: EchoResult[] = data.map(d => ({
            starId: d.starId,
            starName: d.starName,
            surfaceText: d.surfaceText,
            myDecode: d.myDecode,
            relevanceScore: d.relevanceScore,
            explanation: d.explanation,
          }))
          setEchoResults(starIds, null, echoResults)
          setIsOpen(true)
        } else {
          const errMsg = result.error || '搜索失败（无错误信息）'
          console.error('[SearchBar] Search failed:', errMsg)
          setError(errMsg)
          clearEcho()
          setIsOpen(true)
        }
      } catch (err: any) {
        console.error('[SearchBar] Exception:', err)
        setError(err.message || '搜索请求异常')
        clearEcho()
        setIsOpen(true)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Esc key: clear search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInputValue('')
        clearEcho()
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clearEcho])

  const handleClear = useCallback(() => {
    setInputValue('')
    clearEcho()
    setIsOpen(false)
    setError(null)
    inputRef.current?.focus()
  }, [clearEcho])

  const handleSelect = useCallback((starId: string) => {
    requestFlyToStar(starId)
    setIsOpen(false)
  }, [requestFlyToStar])

  const hasResults = echoResults.length > 0
  const hasQuery = inputValue.trim().length > 0 && !isSearching

  return (
    <div
      ref={containerRef}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
      style={{ width: 420 }}
    >
      {/* Search input */}
      <div className="glass-panel px-4 py-2.5 flex items-center gap-3">
        <span className="text-sm text-ui-secondary/60 shrink-0">
          {isSearching ? '⏳' : '🔭'}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (hasQuery) setIsOpen(true)
          }}
          placeholder="搜索知识星图（语义匹配）…"
          className="flex-1 bg-transparent border-none outline-none text-sm text-ui-primary placeholder:text-ui-secondary/30"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="text-ui-secondary/40 hover:text-ui-secondary text-sm shrink-0 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="mt-2 glass-panel overflow-hidden max-h-[360px] overflow-y-auto">
          {/* Loading */}
          {isSearching && (
            <div className="px-4 py-6 text-center">
              <span className="text-sm text-ui-secondary/60 animate-pulse">
                正在搜索语义相似的星球…
              </span>
            </div>
          )}

          {/* Error */}
          {error && !isSearching && (
            <div className="px-4 py-6 text-center">
              <span className="text-sm text-red-400/70">{error}</span>
            </div>
          )}

          {/* No results */}
          {!isSearching && !error && hasQuery && !hasResults && (
            <div className="px-4 py-6 text-center">
              <span className="text-sm text-ui-secondary/50">
                未找到语义相关的星球
              </span>
            </div>
          )}

          {/* Results */}
          {!isSearching && hasResults && (
            <div className="py-1">
              {echoResults.map((result) => (
                <button
                  key={result.starId}
                  onClick={() => handleSelect(result.starId)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-star-glow truncate max-w-[260px]">
                      {result.starName || result.surfaceText.slice(0, 20)}
                    </span>
                    <span className="text-xs text-amber-400/80 shrink-0 ml-2">
                      {Math.round(result.relevanceScore * 100)}% 匹配
                    </span>
                  </div>
                  <p className="text-xs text-ui-secondary/60 leading-relaxed">
                    {result.explanation}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
