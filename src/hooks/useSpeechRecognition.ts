import { useState, useRef, useCallback, useEffect } from 'react'

interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  onFinalResult?: (text: string) => void
  onInterimResult?: (text: string) => void
  onError?: (error: string) => void
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  interimText: string
  start: () => void
  stop: () => void
  toggle: () => void
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(new Error('读取音频数据失败'))
    reader.readAsDataURL(blob)
  })
}

/** Interval between sending accumulated audio for transcription (ms) */
const FLUSH_INTERVAL = 3000
/** Max retries for failed API calls */
const MAX_RETRIES = 2

export function useSpeechRecognition({
  lang = 'zh-CN',
  continuous = true, // eslint-disable-line @typescript-eslint/no-unused-vars
  onFinalResult,
  onInterimResult,
  onError,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [interimText, setInterimText] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const listeningRef = useRef(false)
  const startingRef = useRef(false)
  const stoppedRef = useRef(false)

  // Audio accumulation — all chunks since recording began
  const allChunksRef = useRef<Blob[]>([])
  // Timer that periodically sends audio for transcription
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Guard against concurrent flush calls
  const flushingRef = useRef(false)
  // Last transcript from the API — used to diff out new text
  const lastApiTextRef = useRef('')
  // Accumulated display text
  const displayTextRef = useRef('')
  const mimeTypeRef = useRef('audio/webm')

  const onFinalRef = useRef(onFinalResult)
  const onInterimRef = useRef(onInterimResult)
  const onErrorRef = useRef(onError)

  // Keep callbacks in sync
  useEffect(() => {
    onFinalRef.current = onFinalResult
    onInterimRef.current = onInterimResult
    onErrorRef.current = onError
  }, [onFinalResult, onInterimResult, onError])

  // Check MediaRecorder support
  useEffect(() => {
    const supported = typeof MediaRecorder !== 'undefined'
    console.log('[Voice] MediaRecorder supported:', supported)
    setIsSupported(supported)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current)
      flushTimerRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    clearFlushTimer()
    startingRef.current = false
    listeningRef.current = false
    stoppedRef.current = true
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch { /* */ }
    }
    mediaRecorderRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    allChunksRef.current = []
    setIsListening(false)
  }, [clearFlushTimer])

  /**
   * Send accumulated audio to STT API with retry logic.
   * Returns the full transcription of all audio so far, or null on failure.
   */
  const transcribeAccumulated = useCallback(async (): Promise<string | null> => {
    if (allChunksRef.current.length === 0) return null

    const fullBlob = new Blob(allChunksRef.current, { type: mimeTypeRef.current })
    if (fullBlob.size < 500) return null

    const audioBase64 = await blobToBase64(fullBlob)

    let lastError: string | undefined

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        console.log(`[Voice] Flush retry ${attempt}/${MAX_RETRIES}…`)
        await new Promise((r) => setTimeout(r, 2000 * attempt))
      }

      try {
        const result = await window.electronAPI.stt.transcribe({
          audioBase64,
          mimeType: mimeTypeRef.current,
        })

        if (result.success && result.text) {
          return result.text.trim()
        }
        // 500 — server error, worth retrying
        if (result.error?.includes('500')) {
          lastError = result.error
          continue
        }
        console.error('[Voice] API error:', result.error)
        return null
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('500') || msg.includes('fetch') || msg.includes('network')) {
          lastError = msg
          continue
        }
        console.error('[Voice] API exception:', msg)
        return null
      }
    }

    console.error('[Voice] All retries exhausted:', lastError)
    return null
  }, [])

  /**
   * Flush: send ALL accumulated audio to API, diff the result to extract
   * newly spoken text, and update the real-time display.
   */
  const flush = useCallback(async () => {
    if (flushingRef.current || stoppedRef.current) return
    flushingRef.current = true

    try {
      const fullText = await transcribeAccumulated()
      if (!fullText) return

      console.log('[Voice] Flush result:', fullText.slice(0, 80))

      // Diff: extract only the new portion
      const prev = lastApiTextRef.current
      if (prev && fullText.startsWith(prev)) {
        const newPart = fullText.slice(prev.length).trim()
        if (newPart) {
          displayTextRef.current += (displayTextRef.current ? ' ' : '') + newPart
        }
      } else if (fullText !== prev) {
        // Diverged — replace entirely (e.g. API corrected earlier text)
        displayTextRef.current = fullText
      }
      lastApiTextRef.current = fullText

      if (listeningRef.current && displayTextRef.current) {
        setInterimText('🔴 ' + displayTextRef.current)
        onInterimRef.current?.(displayTextRef.current)
      }
    } catch {
      // Silently ignore flush failures — we'll try again next interval
    } finally {
      flushingRef.current = false
    }
  }, [transcribeAccumulated])

  const start = useCallback(() => {
    if (listeningRef.current || startingRef.current) {
      console.log('[Voice] start() skipped — already listening/starting')
      return
    }

    startingRef.current = true
    stoppedRef.current = false
    allChunksRef.current = []
    lastApiTextRef.current = ''
    displayTextRef.current = ''
    console.log('[Voice] start() — requesting microphone…')

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!startingRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        // Pick best supported mime type
        const preferredTypes = [
          'audio/webm; codecs=opus',
          'audio/webm',
          'audio/ogg; codecs=opus',
          'audio/mp4',
        ]
        let mimeType = ''
        for (const t of preferredTypes) {
          if (MediaRecorder.isTypeSupported(t)) {
            mimeType = t
            break
          }
        }
        mimeTypeRef.current = mimeType || 'audio/webm'
        console.log('[Voice] Using mimeType:', mimeTypeRef.current)

        let recorder: MediaRecorder
        try {
          recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        } catch (e) {
          recorder = new MediaRecorder(stream)
        }

        recorder.ondataavailable = (e) => {
          // Collect ALL audio data — we always send the full recording
          if (e.data.size > 0 && !stoppedRef.current) {
            allChunksRef.current.push(e.data)
          }
        }

        recorder.onstart = () => {
          console.log('[Voice] MediaRecorder started (accumulate mode)')
          startingRef.current = false
          listeningRef.current = true
          setIsListening(true)
          setInterimText('🔴 正在录音…')

          // Start periodic flush timer
          flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL)
        }

        recorder.onstop = async () => {
          console.log('[Voice] MediaRecorder stopped, total chunks:', allChunksRef.current.length)
          clearFlushTimer()
          listeningRef.current = false
          setIsListening(false)

          // Clean up mic
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
          }
          mediaRecorderRef.current = null

          // Final flush — wait for any in-flight flush to complete
          while (flushingRef.current) {
            await new Promise((r) => setTimeout(r, 200))
          }

          setInterimText('⏳ 识别中…')

          // One last transcription of everything
          const finalText = await transcribeAccumulated()

          if (finalText) {
            console.log('[Voice] Final text:', finalText.slice(0, 100))
            onFinalRef.current?.(finalText)
          } else {
            onErrorRef.current?.('未检测到语音，请重试')
          }

          setInterimText('')
          allChunksRef.current = []
          lastApiTextRef.current = ''
          displayTextRef.current = ''
        }

        recorder.onerror = (e) => {
          console.error('[Voice] MediaRecorder error:', e)
          clearFlushTimer()
          startingRef.current = false
          listeningRef.current = false
          stoppedRef.current = true
          setIsListening(false)
          setInterimText('')
          cleanup()
          onErrorRef.current?.('录音失败，请重试')
        }

        mediaRecorderRef.current = recorder
        // Small timeslice so we collect data frequently for the full-blob merge
        recorder.start(1000)
      })
      .catch((err) => {
        console.error('[Voice] getUserMedia error:', err.name, err.message)
        startingRef.current = false
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          onErrorRef.current?.('麦克风权限被拒绝，请在系统偏好设置 > 安全性与隐私 > 麦克风 中允许')
        } else if (err.name === 'NotFoundError') {
          onErrorRef.current?.('未检测到麦克风设备')
        } else {
          onErrorRef.current?.(`无法访问麦克风: ${err.message}`)
        }
      })
  }, [cleanup, flush, clearFlushTimer, transcribeAccumulated])

  const stop = useCallback(() => {
    console.log('[Voice] stop()')
    stoppedRef.current = true
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.requestData() } catch { /* */ }
      mediaRecorderRef.current.stop()
    } else if (listeningRef.current) {
      cleanup()
    }
  }, [cleanup])

  const toggle = useCallback(() => {
    console.log('[Voice] toggle — listeningRef:', listeningRef.current)
    if (listeningRef.current) {
      stop()
    } else {
      start()
    }
  }, [start, stop])

  return {
    isListening,
    isSupported,
    interimText,
    start,
    stop,
    toggle,
  }
}
