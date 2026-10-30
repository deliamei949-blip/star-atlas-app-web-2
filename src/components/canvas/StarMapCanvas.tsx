import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import StarField from './StarField'
import NebulaCloud from './NebulaCloud'
import StarNode from './StarNode'
import GravityLine from './GravityLine'
import BlackHole from './BlackHole'
import CameraController, { type CameraControllerHandle } from './CameraController'
import ConnectionDialog from '../ui/ConnectionDialog'
import RoamControls from '../ui/RoamControls'
import SearchBar from '../ui/SearchBar'
import BlackHolePanel from '../ui/BlackHolePanel'
import CreateBlackHoleDialog from '../ui/CreateBlackHoleDialog'
import ConnectionDetailPanel from '../ui/ConnectionDetailPanel'
import DeductionPanel from '../ui/DeductionPanel'
import SettingsPanel from '../ui/SettingsPanel'
import { useStarStore } from '@/stores/starStore'
import { useUIStore } from '@/stores/uiStore'
import { generateId } from '@/utils/id'
import type { Star, Connection, RelationType, BlackHole as BlackHoleType, ConnectionWithStars } from '@/types'

// Inner component rendered inside Canvas to wire the camera ref
function SceneContent({
  cameraRef,
  onCanvasClick,
  onConnectTarget,
  echoStarIds,
  echoSourcePos,
  blackHoles,
  onBlackHoleClick,
  onConnectionClick,
  onViewDeductions,
}: {
  cameraRef: React.MutableRefObject<CameraControllerHandle | null>
  onCanvasClick: () => void
  onConnectTarget: (targetId: string) => void
  echoStarIds: string[]
  echoSourcePos: [number, number, number] | null
  blackHoles: BlackHoleType[]
  onBlackHoleClick: (id: string) => void
  onConnectionClick: (connectionId: string) => void
  onViewDeductions: (starId: string) => void
}) {
  const stars = useStarStore((s) => s.stars)
  const connections = useStarStore((s) => s.connections)
  const connectingStarId = useStarStore((s) => s.connectingStarId)
  const setConnectingStar = useStarStore((s) => s.setConnectingStar)
  const addConnection = useStarStore((s) => s.addConnection)
  const removeStar = useStarStore((s) => s.removeStar)

  const animatedStars = useRef<Set<string>>(new Set())

  // Pre-compute star→connections index (O(n+m) instead of O(n*m) per render)
  const starConnectionsMap = useMemo(() => {
    const map = new Map<string, Array<{ connection: Connection; otherStar: Star }>>()
    for (const conn of connections) {
      for (const starId of [conn.starAId, conn.starBId]) {
        const otherId = conn.starAId === starId ? conn.starBId : conn.starAId
        const otherStar = stars.find(s => s.id === otherId)
        if (!otherStar) continue
        if (!map.has(starId)) map.set(starId, [])
        map.get(starId)!.push({ connection: conn, otherStar })
      }
    }
    return map
  }, [connections, stars])

  // Handle start connecting from info card button
  const handleStartConnect = useCallback((starId: string) => {
    setConnectingStar(starId)
  }, [setConnectingStar])

  // Delete star
  const handleDeleteStar = useCallback(async (starId: string) => {
    await removeStar(starId)
  }, [removeStar])

  const sourceStar = connectingStarId ? stars.find((s) => s.id === connectingStarId) : null

  return (
    <>
      {/* Deep space colors */}
      <color attach="background" args={['#000011']} />
      <fog attach="fog" args={['#000022', 30, 150]} />

      {/* Ambient light for base visibility */}
      <ambientLight intensity={0.1} />

      {/* Background star field */}
      <StarField count={2000} radius={120} />

      {/* Nebula clouds — decorative colored particle clusters */}
      <NebulaCloud clusterCount={4} particlesPerCluster={300} radius={100} />

      {/* Gravity connections */}
      {connections.map((conn) => (
        <GravityLine
          key={conn.id}
          connectionId={conn.id}
          starAId={conn.starAId}
          starBId={conn.starBId}
          relationType={conn.relationType}
          stars={stars}
          onClick={onConnectionClick}
        />
      ))}

      {/* Connection mode source star indicator */}
      {connectingStarId && sourceStar && (
        <group>
          {/* Pulsing beacon sphere above the source star */}
          <mesh position={[sourceStar.positionX, sourceStar.positionY + 2.0, sourceStar.positionZ]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.7} />
          </mesh>
          {/* Beacon ring */}
          <mesh
            position={[sourceStar.positionX, sourceStar.positionY + 2.0, sourceStar.positionZ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.8, 0.06, 16, 32]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.5} />
          </mesh>
        </group>
      )}

      {/* Interactive star nodes */}
      {stars.map((star) => {
        const isSource = star.id === connectingStarId
        const isTarget = !!connectingStarId && !isSource
        const isNewStar = !animatedStars.current.has(star.id)
        if (isNewStar) {
          animatedStars.current.add(star.id)
        }
        const starConns = starConnectionsMap.get(star.id)

        return (
          <StarNode
            key={star.id}
            id={star.id}
            form={star.form}
            position={[star.positionX, star.positionY, star.positionZ]}
            starName={star.starName}
            surfaceText={star.surfaceText}
            originalSignal={star.originalSignal}
            myDecode={star.myDecode}
            correctionMark={star.correctionMark}
            resonanceFreq={star.resonanceFreq}
            decayBoundary={star.decayBoundary}
            unsolvedSignal={star.unsolvedSignal}
            hasDeduction={star.hasDeduction}
            deductionCount={star.deductionCount}
            isNew={isNewStar}
            isConnecting={isSource}
            isConnectTarget={isTarget}
            isEcho={echoStarIds.includes(star.id)}
            echoSourcePos={echoStarIds.includes(star.id) ? echoSourcePos : null}
            starConnections={starConns}
            onStartConnect={handleStartConnect}
            onConnectTarget={isTarget ? onConnectTarget : undefined}
            onViewConnection={onConnectionClick}
            onDelete={handleDeleteStar}
            onViewDeductions={onViewDeductions}
          />
        )
      })}

      {/* Black holes — dark swirling puzzles */}
      {blackHoles.map((bh) => (
        <BlackHole
          key={bh.id}
          id={bh.id}
          question={bh.question}
          position={[bh.positionX, bh.positionY, bh.positionZ]}
          onClick={onBlackHoleClick}
        />
      ))}

      {/* Post-processing bloom for star glow */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
          radius={0.5}
          resolutionScale={0.5}
        />
      </EffectComposer>

      {/* Camera controls */}
      <CameraController ref={cameraRef} />

      {/* Click on empty space handler */}
      <mesh
        visible={false}
        onPointerDown={onCanvasClick}
        position={[0, 0, -100]}
      >
        <planeGeometry args={[1000, 1000]} />
      </mesh>
    </>
  )
}

export default function StarMapCanvas() {
  const cameraRef = useRef<CameraControllerHandle | null>(null)
  const connectingStarId = useStarStore((s) => s.connectingStarId)
  const setConnectingStar = useStarStore((s) => s.setConnectingStar)
  const addConnection = useStarStore((s) => s.addConnection)
  const removeConnection = useStarStore((s) => s.removeConnection)
  const loadStars = useStarStore((s) => s.loadStars)
  const loadConnections = useStarStore((s) => s.loadConnections)
  const stars = useStarStore((s) => s.stars)
  const connections = useStarStore((s) => s.connections)

  // ── Deduction panel state ──
  const selectedDeductionStarId = useStarStore((s) => s.selectedDeductionStarId)
  const selectDeductionStar = useStarStore((s) => s.selectDeductionStar)

  // ── Echo state ──
  const echoStarIds = useUIStore((s) => s.echoStarIds)
  const echoSourceStarId = useUIStore((s) => s.echoSourceStarId)
  const clearEcho = useUIStore((s) => s.clearEcho)

  // ── Black hole state ──
  const blackHoles = useUIStore((s) => s.blackHoles)
  const selectedBlackHoleId = useUIStore((s) => s.selectedBlackHoleId)
  const blackHoleRelations = useUIStore((s) => s.blackHoleRelations)
  const isSearchingBlackHole = useUIStore((s) => s.isSearchingBlackHole)
  const showCreateBlackHole = useUIStore((s) => s.showCreateBlackHole)
  const loadBlackHoles = useUIStore((s) => s.loadBlackHoles)
  const selectBlackHole = useUIStore((s) => s.selectBlackHole)
  const createBlackHole = useUIStore((s) => s.createBlackHole)
  const deleteBlackHole = useUIStore((s) => s.deleteBlackHole)
  const setShowCreateBlackHole = useUIStore((s) => s.setShowCreateBlackHole)

  // ── Connection detail state ──
  const selectedConnectionId = useUIStore((s) => s.selectedConnectionId)
  const selectConnection = useUIStore((s) => s.selectConnection)

  // ── Settings panel state ──
  const [showSettings, setShowSettings] = useState(false)

  const selectedBlackHole = selectedBlackHoleId
    ? blackHoles.find((bh) => bh.id === selectedBlackHoleId) ?? null
    : null

  const [pendingConnection, setPendingConnection] = useState<{
    starA: Star
    starB: Star
  } | null>(null)

  // Compute the echo source position (where beams point toward)
  const echoSourcePos = useMemo<[number, number, number] | null>(() => {
    if (echoStarIds.length === 0) return null
    if (echoSourceStarId) {
      const src = stars.find(s => s.id === echoSourceStarId)
      if (src) return [src.positionX, src.positionY, src.positionZ]
    }
    // No explicit source — beams converge toward centroid of echo stars
    const echoStars = stars.filter(s => echoStarIds.includes(s.id))
    if (echoStars.length === 0) return null
    const avgX = echoStars.reduce((sum, s) => sum + s.positionX, 0) / echoStars.length
    const avgY = echoStars.reduce((sum, s) => sum + s.positionY, 0) / echoStars.length
    const avgZ = echoStars.reduce((sum, s) => sum + s.positionZ, 0) / echoStars.length
    return [avgX, avgY + 5, avgZ] // slightly above centroid
  }, [echoStarIds, echoSourceStarId, stars])

  // Compute ConnectionWithStars for selected connection
  const selectedConnectionData = useMemo<ConnectionWithStars | null>(() => {
    if (!selectedConnectionId) return null
    const conn = connections.find(c => c.id === selectedConnectionId)
    if (!conn) return null
    const starA = stars.find(s => s.id === conn.starAId)
    const starB = stars.find(s => s.id === conn.starBId)
    if (!starA || !starB) return null
    return { connection: conn, starA, starB }
  }, [selectedConnectionId, connections, stars])

  // Click handler for connections (from GravityLine or StarNode info card)
  const handleConnectionClick = useCallback((connectionId: string) => {
    if (connectingStarId) return // don't respond during connection mode
    selectConnection(connectionId)
  }, [connectingStarId, selectConnection])

  // Load stars, connections, and black holes from database on mount
  useEffect(() => {
    loadStars()
    loadConnections()
    loadBlackHoles()
  }, [loadStars, loadConnections, loadBlackHoles])

  // Esc key to cancel connection mode / echo mode / black hole panel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateBlackHole) {
          setShowCreateBlackHole(false)
          return
        }
        if (selectedConnectionId) {
          selectConnection(null)
          return
        }
        if (pendingConnection) {
          setPendingConnection(null)
        }
        if (connectingStarId) {
          setConnectingStar(null)
        }
        if (echoStarIds.length > 0) {
          clearEcho()
        }
        if (selectedBlackHoleId) {
          selectBlackHole(null)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [connectingStarId, setConnectingStar, pendingConnection, echoStarIds, clearEcho, selectedBlackHoleId, selectBlackHole, showCreateBlackHole, setShowCreateBlackHole, selectedConnectionId, selectConnection])

  // Click on empty space cancels connection mode / closes panels
  const handleCanvasClick = useCallback(() => {
    if (connectingStarId) {
      setConnectingStar(null)
    }
    if (selectedConnectionId) {
      selectConnection(null)
    }
  }, [connectingStarId, setConnectingStar, selectedConnectionId, selectConnection])

  // Handle target star clicked during connection mode — sets pendingConnection
  const handleConnectTarget = useCallback((targetId: string) => {
    const currentSource = useStarStore.getState().connectingStarId
    if (!currentSource || targetId === currentSource) return

    const allStars = useStarStore.getState().stars
    const sourceStar = allStars.find((s) => s.id === currentSource)
    const targetStar = allStars.find((s) => s.id === targetId)
    if (sourceStar && targetStar) {
      setPendingConnection({ starA: sourceStar, starB: targetStar })
    }
  }, [])

  // Confirm connection
  const handleConfirmConnection = useCallback(async (relationType: RelationType, note: string) => {
    if (!pendingConnection) return

    const newConnection: Connection = {
      id: generateId(),
      starAId: pendingConnection.starA.id,
      starBId: pendingConnection.starB.id,
      relationType,
      note: note || undefined,
      createdAt: new Date().toISOString(),
    }

    await addConnection(newConnection)
    setPendingConnection(null)
    setConnectingStar(null)
  }, [pendingConnection, addConnection, setConnectingStar])

  // Cancel connection dialog
  const handleCancelConnection = useCallback(() => {
    setPendingConnection(null)
    setConnectingStar(null)
  }, [setConnectingStar])

  // Fly to star for roaming
  const handleFlyToStar = useCallback((starId: string) => {
    cameraRef.current?.flyToStar(starId)
  }, [])

  // View deductions for a star
  const handleViewDeductions = useCallback((starId: string) => {
    selectDeductionStar(starId)
  }, [selectDeductionStar])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 50], fov: 60, near: 0.1, far: 500 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <SceneContent
          cameraRef={cameraRef}
          onCanvasClick={handleCanvasClick}
          onConnectTarget={handleConnectTarget}
          echoStarIds={echoStarIds}
          echoSourcePos={echoSourcePos}
          blackHoles={blackHoles}
          onBlackHoleClick={(id) => selectBlackHole(id)}
          onConnectionClick={handleConnectionClick}
          onViewDeductions={handleViewDeductions}
        />
      </Canvas>

      {/* Search bar — semantic echo search */}
      <SearchBar />

      {/* Roaming controls (outside Canvas, fixed position) */}
      <RoamControls onFlyToStar={handleFlyToStar} />

      {/* ── Black hole: floating create button ── */}
      {!showCreateBlackHole && !selectedBlackHole && (
        <button
          onClick={() => setShowCreateBlackHole(true)}
          className="fixed bottom-6 right-6 z-50 glass-panel px-4 py-2.5 flex items-center gap-2 hover:bg-purple-500/10 transition-colors group"
          title="投放黑洞谜题"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🕳️</span>
          <span className="text-xs text-purple-200/60 group-hover:text-purple-200/90 transition-colors">
            投放黑洞
          </span>
        </button>
      )}

      {/* ── Black hole panel ── */}
      {selectedBlackHole && (
        <BlackHolePanel
          blackHole={selectedBlackHole}
          relatedStars={blackHoleRelations}
          isSearching={isSearchingBlackHole}
          onFlyToStar={handleFlyToStar}
          onClose={() => selectBlackHole(null)}
          onDelete={(id) => {
            deleteBlackHole(id)
            selectBlackHole(null)
          }}
        />
      )}

      {/* ── Connection detail panel ── */}
      {selectedConnectionData && (
        <ConnectionDetailPanel
          data={selectedConnectionData}
          onFlyToStar={handleFlyToStar}
          onDelete={async (connectionId) => {
            await removeConnection(connectionId)
            selectConnection(null)
          }}
          onClose={() => selectConnection(null)}
        />
      )}

      {/* ── Create black hole dialog ── */}
      {showCreateBlackHole && (
        <CreateBlackHoleDialog
          onConfirm={async (question) => {
            setShowCreateBlackHole(false)
            const bh = await createBlackHole(question)
            if (bh) {
              selectBlackHole(bh.id)
            }
          }}
          onCancel={() => setShowCreateBlackHole(false)}
        />
      )}

      {/* Connection mode toast */}
      {connectingStarId && !pendingConnection && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="glass-panel px-5 py-2.5 flex items-center gap-3 animate-pulse">
            <span className="text-base">🔗</span>
            <span className="text-sm text-star-glow font-medium">
              点击目标星体完成连接
            </span>
            <span className="text-xs text-ui-secondary/50 border border-white/10 rounded px-1.5 py-0.5">
              Esc 取消
            </span>
          </div>
        </div>
      )}

      {/* Connection dialog — rendered outside Canvas as a DOM overlay */}
      {pendingConnection && (
        <ConnectionDialog
          starA={pendingConnection.starA}
          starB={pendingConnection.starB}
          onConfirm={handleConfirmConnection}
          onCancel={handleCancelConnection}
        />
      )}

      {/* Deduction panel — 推演内容查看 */}
      {selectedDeductionStarId && (
        <DeductionPanel
          onClose={() => selectDeductionStar(null)}
          onFlyToStar={handleFlyToStar}
        />
      )}

      {/* Settings button — top-right corner */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 z-50 glass-panel px-3 py-2 text-sm text-ui-secondary/60 hover:text-ui-primary transition-colors"
        title="设置"
      >
        ⚙️
      </button>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
