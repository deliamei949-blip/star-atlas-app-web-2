import { create } from 'zustand'
import type { Capture } from '@/types'

interface CaptureStore {
  captures: Capture[]
  loading: boolean

  loadCaptures: () => Promise<void>
  addCapture: (capture: Capture) => void
  markProcessed: (id: string) => Promise<void>
  removeCapture: (id: string) => Promise<void>
}

export const useCaptureStore = create<CaptureStore>((set, get) => ({
  captures: [],
  loading: false,

  loadCaptures: async () => {
    set({ loading: true })
    try {
      const captures = await window.electronAPI.capture.getAll()
      set({ captures, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addCapture: (capture) => {
    set((s) => ({ captures: [capture, ...s.captures] }))
  },

  markProcessed: async (id) => {
    try {
      await window.electronAPI.capture.markProcessed(id)
      set((s) => ({
        captures: s.captures.map((c) =>
          c.id === id ? { ...c, processed: true } : c
        ),
      }))
    } catch {
      // ignore
    }
  },

  removeCapture: async (id) => {
    try {
      await window.electronAPI.capture.delete(id)
    } catch {
      // ignore
    }
    set((s) => ({
      captures: s.captures.filter((c) => c.id !== id),
    }))
  },
}))
