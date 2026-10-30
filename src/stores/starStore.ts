import { create } from 'zustand'
import type { Star, Connection } from '@/types'
import { StarForm } from '@/types'
import { generateId } from '@/utils/id'

interface StarStore {
  stars: Star[]
  connections: Connection[]
  selectedStarId: string | null
  connectingStarId: string | null
  selectedDeductionStarId: string | null
  loading: boolean

  // Data loading
  loadStars: () => Promise<void>
  loadConnections: () => Promise<void>

  // Star actions
  setStars: (stars: Star[]) => void
  addStar: (star: Star) => void
  updateStar: (id: string, updates: Partial<Star>) => void
  removeStar: (id: string) => Promise<void>
  selectStar: (id: string | null) => void
  setConnectingStar: (id: string | null) => void
  selectDeductionStar: (id: string | null) => void

  // Ignite
  igniteCapture: (captureId: string, originalStardust: string, firstReaction: string, sourceCoordinate: string) => Promise<Star | null>

  // Pulse log
  addDeduction: (starId: string, content: string, sourceSessionId?: string) => Promise<void>

  // Connection actions
  setConnections: (connections: Connection[]) => void
  addConnection: (connection: Connection) => Promise<void>
  removeConnection: (id: string) => Promise<void>
}

export const useStarStore = create<StarStore>((set, get) => ({
  stars: [],
  connections: [],
  selectedStarId: null,
  connectingStarId: null,
  selectedDeductionStarId: null,
  loading: false,

  loadStars: async () => {
    set({ loading: true })
    try {
      const stars = await window.electronAPI.star.getAll()
      set({ stars, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  loadConnections: async () => {
    try {
      const connections = await window.electronAPI.connection.getAll()
      set({ connections })
    } catch {
      // ignore
    }
  },

  setStars: (stars) => set({ stars }),
  addStar: (star) => set((s) => ({ stars: [star, ...s.stars] })),
  updateStar: (id, updates) =>
    set((s) => ({
      stars: s.stars.map((star) =>
        star.id === id ? { ...star, ...updates } : star
      ),
    })),
  removeStar: async (id) => {
    try {
      await window.electronAPI.star.delete(id)
    } catch {
      // ignore IPC errors
    }
    set((s) => ({
      stars: s.stars.filter((star) => star.id !== id),
      connections: s.connections.filter(
        (c) => c.starAId !== id && c.starBId !== id
      ),
    }))
  },
  selectStar: (id) => set({ selectedStarId: id }),
  setConnectingStar: (id) => set({ connectingStarId: id }),
  selectDeductionStar: (id) => set({ selectedDeductionStarId: id }),

  // Ignite a StarDust into a Pulsar star
  igniteCapture: async (captureId, originalStardust, firstReaction, sourceCoordinate) => {
    try {
      // Get the capture's star name before igniting
      const captures = await window.electronAPI.capture.getAll()
      const capture = captures.find((c: any) => c.id === captureId)
      const starName = capture?.starName || firstReaction.slice(0, 15) || '未命名'

      // The browser build keeps the same state transition while using the
      // renderer-side demo data store instead of Electron's direct DB bridge.
      const existingStar = get().stars.find(
        (star) => star.captureId === captureId && star.form === StarForm.StarDust
      )

      // Call AI ignite via IPC
      const result = await window.electronAPI.ai.ignite({
        starName,
        originalStardust,
        firstReaction,
        sourceCoordinate,
      })

      if (!result.success) {
        console.error('[igniteCapture] AI ignite failed:', result.error)
        return null
      }

      const { data } = result
      console.log('[igniteCapture] AI success, data keys:', Object.keys(data))

      let starId: string
      let posX: number, posY: number, posZ: number

      if (existingStar) {
        console.log('[igniteCapture] Found existing StarDust, upgrading:', existingStar.id)
        // Upgrade existing StarDust to Pulsar — keep its position
        starId = existingStar.id
        posX = existingStar.positionX
        posY = existingStar.positionY
        posZ = existingStar.positionZ

        await window.electronAPI.star.update(starId, {
          starName,
          surfaceText: data.firstReaction || firstReaction,
          originalSignal: data.originalSignal,
          myDecode: data.myDecode,
          correctionMark: data.correctionMark,
          resonanceFreq: data.resonanceFreq || undefined,
          decayBoundary: data.decayBoundary || undefined,
          unsolvedSignal: data.unsolvedSignal,
          form: StarForm.Pulsar,
          ignitedAt: new Date().toISOString(),
        })
        console.log('[igniteCapture] StarDust upgraded to Pulsar, starId:', starId)
      } else {
        console.log('[igniteCapture] No existing StarDust, inserting new Pulsar')
        // Fallback: no existing StarDust — insert new star
        starId = generateId()
        posX = (Math.random() - 0.5) * 30
        posY = (Math.random() - 0.5) * 20
        posZ = (Math.random() - 0.5) * 25 + 10

        await window.electronAPI.star.create({
          id: starId,
          starName,
          surfaceText: data.firstReaction || firstReaction,
          originalSignal: data.originalSignal,
          myDecode: data.myDecode,
          correctionMark: data.correctionMark,
          resonanceFreq: data.resonanceFreq || undefined,
          decayBoundary: data.decayBoundary || undefined,
          unsolvedSignal: data.unsolvedSignal,
          form: StarForm.Pulsar,
          positionX: posX,
          positionY: posY,
          positionZ: posZ,
          captureId,
          hasDeduction: false,
          deductionCount: 0,
        })
        console.log('[igniteCapture] New Pulsar inserted, starId:', starId, 'pos:', posX, posY, posZ)
      }

      // Update capture: mark processed
      await window.electronAPI.capture.markProcessed(captureId)

      // Create Star object (for store)
      const ignitedStar: Star = {
        id: starId,
        starName,
        surfaceText: data.firstReaction || firstReaction,
        originalSignal: data.originalSignal,
        myDecode: data.myDecode,
        correctionMark: data.correctionMark,
        resonanceFreq: data.resonanceFreq || undefined,
        decayBoundary: data.decayBoundary || undefined,
        unsolvedSignal: data.unsolvedSignal,
        form: StarForm.Pulsar,
        positionX: posX,
        positionY: posY,
        positionZ: posZ,
        captureId,
        hasDeduction: false,
        deductionCount: 0,
        createdAt: new Date().toISOString(),
        ignitedAt: new Date().toISOString(),
      }

      // Update store: replace the StarDust with the Pulsar, or add if not found
      set((s) => {
        const existing = s.stars.find((st) => st.id === starId)
        if (existing) {
          return { stars: s.stars.map((st) => st.id === starId ? ignitedStar : st) }
        }
        return { stars: [ignitedStar, ...s.stars] }
      })
      return ignitedStar
    } catch (err) {
      console.error('Ignite error:', err)
      return null
    }
  },

  // Add a deduction to a star (from pulse log distribution)
  addDeduction: async (starId, content, sourceSessionId) => {
    try {
      await window.electronAPI.deduction.create({
        starId,
        content,
        sourceSessionId,
      })
      // Update local state
      set((s) => ({
        stars: s.stars.map((st) =>
          st.id === starId
            ? { ...st, hasDeduction: true, deductionCount: st.deductionCount + 1 }
            : st
        ),
      }))
    } catch (err) {
      console.error('addDeduction error:', err)
    }
  },

  setConnections: (connections) => set({ connections }),
  addConnection: async (connection) => {
    // Persist to database
    try {
      await window.electronAPI.connection.create({
        starAId: connection.starAId,
        starBId: connection.starBId,
        relationType: connection.relationType,
        note: connection.note,
      })
    } catch {
      // ignore IPC errors
    }

    set((s) => ({ connections: [...s.connections, connection] }))
    const { starAId, starBId } = connection
    const { connections, stars } = get()
    for (const starId of [starAId, starBId]) {
      const star = stars.find((s) => s.id === starId)
      if (star && star.form === StarForm.Pulsar) {
        const connCount = connections.filter(
          (c) => c.starAId === starId || c.starBId === starId
        ).length
        if (connCount >= 2) {
          // Persist form upgrade to database
          try {
            await window.electronAPI.star.update(starId, { form: StarForm.Constellation })
          } catch {
            // ignore
          }
          set((s) => ({
            stars: s.stars.map((st) =>
              st.id === starId ? { ...st, form: StarForm.Constellation } : st
            ),
          }))
        }
      }
    }
  },
  removeConnection: async (id) => {
    try {
      await window.electronAPI.connection.delete(id)
    } catch {
      // ignore
    }
    set((s) => ({
      connections: s.connections.filter((c) => c.id !== id),
    }))
  },
}))
