import { create } from 'zustand'
import type { EchoResult, BlackHole } from '@/types'

interface UIStore {
  nebulaPanelOpen: boolean
  roamMode: boolean
  roamFilter: 'all' | 'stars' | 'pulsars' | 'constellations'
  roamTargetStarId: string | null
  isFlying: boolean
  searchQuery: string
  requestFlyToStarId: string | null

  // ── 星际回声 ──
  echoStarIds: string[]
  echoSourceStarId: string | null
  echoResults: EchoResult[]
  isSearching: boolean

  // ── 黑洞谜题 ──
  blackHoles: BlackHole[]
  selectedBlackHoleId: string | null
  blackHoleRelations: EchoResult[]
  isSearchingBlackHole: boolean
  showCreateBlackHole: boolean

  // ── 连接查看 ──
  selectedConnectionId: string | null

  toggleNebulaPanel: () => void
  setRoamMode: (active: boolean) => void
  setRoamFilter: (filter: UIStore['roamFilter']) => void
  setRoamTarget: (starId: string | null) => void
  setFlying: (flying: boolean) => void
  setSearchQuery: (query: string) => void
  requestFlyToStar: (starId: string) => void
  clearFlyToRequest: () => void

  // ── 星际回声 actions ──
  setEchoResults: (starIds: string[], sourceStarId: string | null, results: EchoResult[]) => void
  clearEcho: () => void
  setSearching: (searching: boolean) => void

  // ── 连接查看 actions ──
  selectConnection: (id: string | null) => void

  // ── 黑洞 actions ──
  loadBlackHoles: () => Promise<void>
  createBlackHole: (question: string) => Promise<BlackHole | null>
  deleteBlackHole: (id: string) => Promise<void>
  selectBlackHole: (id: string | null) => void
  searchBlackHoleRelations: (question: string, blackHoleId: string) => Promise<void>
  setShowCreateBlackHole: (show: boolean) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  nebulaPanelOpen: true,
  roamMode: false,
  roamFilter: 'all',
  roamTargetStarId: null,
  isFlying: false,
  searchQuery: '',
  requestFlyToStarId: null,

  echoStarIds: [],
  echoSourceStarId: null,
  echoResults: [],
  isSearching: false,

  blackHoles: [],
  selectedBlackHoleId: null,
  blackHoleRelations: [],
  isSearchingBlackHole: false,
  showCreateBlackHole: false,

  selectedConnectionId: null,

  toggleNebulaPanel: () =>
    set((s) => ({ nebulaPanelOpen: !s.nebulaPanelOpen })),
  setRoamMode: (active) => set({ roamMode: active }),
  setRoamFilter: (filter) => set({ roamFilter: filter }),
  setRoamTarget: (starId) => set({ roamTargetStarId: starId }),
  setFlying: (flying) => set({ isFlying: flying }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  requestFlyToStar: (starId) => set({ requestFlyToStarId: starId }),
  clearFlyToRequest: () => set({ requestFlyToStarId: null }),

  setEchoResults: (starIds, sourceStarId, results) =>
    set({ echoStarIds: starIds, echoSourceStarId: sourceStarId, echoResults: results }),
  clearEcho: () =>
    set({ echoStarIds: [], echoSourceStarId: null, echoResults: [], isSearching: false }),
  setSearching: (searching) => set({ isSearching: searching }),

  // ── 黑洞 actions ──
  loadBlackHoles: async () => {
    try {
      const blackHoles = await window.electronAPI.blackhole.getAll()
      console.log('[loadBlackHoles] Loaded:', blackHoles.length, 'black holes')
      set({ blackHoles: blackHoles as BlackHole[] })
    } catch (err) {
      console.error('[loadBlackHoles] Failed:', err)
    }
  },

  createBlackHole: async (question: string) => {
    try {
      const result = await window.electronAPI.blackhole.create({ question })
      const newBlackHole: BlackHole = {
        id: result.id,
        question: result.question || question,
        starId: result.starId || undefined,
        positionX: result.positionX ?? 0,
        positionY: result.positionY ?? 0,
        positionZ: result.positionZ ?? 0,
        createdAt: result.createdAt || new Date().toISOString(),
      }
      set((s) => ({ blackHoles: [newBlackHole, ...s.blackHoles] }))
      // Auto-search for related stars
      get().searchBlackHoleRelations(question, result.id)
      return newBlackHole
    } catch (err) {
      console.error('[createBlackHole] Failed:', err)
      return null
    }
  },

  deleteBlackHole: async (id: string) => {
    try {
      const result = await window.electronAPI.blackhole.delete(id)
      console.log('[deleteBlackHole] Delete result:', result)
    } catch (err) {
      console.error('[deleteBlackHole] IPC failed:', err)
    }
    set((s) => ({
      blackHoles: s.blackHoles.filter((bh) => bh.id !== id),
      selectedBlackHoleId: s.selectedBlackHoleId === id ? null : s.selectedBlackHoleId,
      blackHoleRelations: s.selectedBlackHoleId === id ? [] : s.blackHoleRelations,
    }))
  },

  selectBlackHole: (id: string | null) => {
    set({ selectedBlackHoleId: id })
    if (id) {
      const bh = get().blackHoles.find((b) => b.id === id)
      if (bh && get().blackHoleRelations.length === 0) {
        get().searchBlackHoleRelations(bh.question, id)
      }
    }
  },

  searchBlackHoleRelations: async (question: string, blackHoleId: string) => {
    set({ isSearchingBlackHole: true })
    try {
      const result = await window.electronAPI.blackhole.searchRelated({ question, blackHoleId })
      if (result.success && result.data) {
        set({ blackHoleRelations: result.data as EchoResult[] })
      } else {
        set({ blackHoleRelations: [] })
      }
    } catch {
      set({ blackHoleRelations: [] })
    } finally {
      set({ isSearchingBlackHole: false })
    }
  },

  setShowCreateBlackHole: (show: boolean) =>
    set({ showCreateBlackHole: show }),

  // ── 连接查看 ──
  selectConnection: (id: string | null) =>
    set({ selectedConnectionId: id }),
}))
