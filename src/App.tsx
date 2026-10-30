import { useState, useEffect } from 'react'
import StarMapCanvas from './components/canvas/StarMapCanvas'
import CaptureInput from './components/ui/CaptureInput'
import NebulaPanel from './components/ui/NebulaPanel'
import WebDemoControls from './components/ui/WebDemoControls'

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash)

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        window.location.hash = '#/capture'
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  // Floating capture window route
  if (route === '#/capture') {
    return (
      <div
        className="w-full h-full text-ui-primary flex items-center justify-center p-4"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(40,67,120,.32), transparent 42%), #000011',
        }}
      >
        <div className="w-[500px] max-w-full h-[560px] max-h-[calc(100vh-32px)] glass-panel rounded-2xl overflow-hidden">
          <CaptureInput />
        </div>
      </div>
    )
  }

  // Main app - 3D star map with nebula panel overlay
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <StarMapCanvas />

      {/* Nebula panel overlay */}
      <NebulaPanel />

      {/* Browser-only capture and demo controls */}
      <WebDemoControls />
    </div>
  )
}
