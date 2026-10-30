import { useRef, useState, useEffect, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { StarForm, RelationTypeColors, RelationTypeLabels } from '@/types'
import type { Connection, Star } from '@/types'
import { createPulsarMaterial } from './shaders/pulsarShader'

const relationIcons: Record<string, string> = {
  resonance: '🔗',
  orbit: '🪐',
  binary_repel: '⚡',
  nebula_wrap: '🌌',
}

/** Convert a UUID/string ID to a deterministic numeric phase (0–99) for animation offset. */
function idToPhase(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 100
}

/** Pulsing light beam above the source star during connection mode. */
function ConnectionBeam({ starSize }: { starSize: number }) {
  const beamRef = useRef<THREE.Mesh>(null!)
  const beamHeight = 4.0

  useFrame((state) => {
    if (!beamRef.current) return
    const t = state.clock.getElapsedTime()
    const pulse = 0.5 + Math.sin(t * 3) * 0.3
    ;(beamRef.current.material as THREE.Material).opacity = pulse * 0.6
    beamRef.current.scale.y = 1 + Math.sin(t * 2.5) * 0.15
  })

  return (
    <mesh
      ref={beamRef}
      position={[0, beamHeight / 2 + starSize + 0.3, 0]}
    >
      <cylinderGeometry args={[0.06, 0.06, beamHeight, 16, 1, true]} />
      <meshBasicMaterial
        color="#00ffcc"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Golden echo beam tilted toward a source point during echo mode. */
function EchoBeam({ starSize, sourcePos, starPos }: {
  starSize: number
  sourcePos: [number, number, number]
  starPos: [number, number, number]
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const beamRef = useRef<THREE.Mesh>(null!)
  const beamHeight = 3.5

  // Compute quaternion to tilt the beam (default Y-up) toward the source
  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3(
      sourcePos[0] - starPos[0],
      sourcePos[1] - starPos[1],
      sourcePos[2] - starPos[2],
    ).normalize()
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir,
    )
  }, [sourcePos[0], sourcePos[1], sourcePos[2], starPos[0], starPos[1], starPos[2]])

  useFrame((state) => {
    if (!beamRef.current) return
    const t = state.clock.getElapsedTime()
    const pulse = 0.4 + Math.sin(t * 3.5) * 0.25
    ;(beamRef.current.material as THREE.Material).opacity = pulse * 0.55
    beamRef.current.scale.y = 1 + Math.sin(t * 2.8) * 0.12
  })

  return (
    <group ref={groupRef} quaternion={quaternion}>
      <mesh
        ref={beamRef}
        position={[0, beamHeight / 2 + starSize + 0.3, 0]}
      >
        <cylinderGeometry args={[0.07, 0.07, beamHeight, 16, 1, true]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

interface StarNodeProps {
  id: string
  form: StarForm
  position: [number, number, number]
  starName?: string
  surfaceText: string
  originalSignal?: string
  myDecode?: string
  correctionMark?: string
  resonanceFreq?: string
  decayBoundary?: string
  unsolvedSignal?: string
  hasDeduction?: boolean
  deductionCount?: number
  isNew?: boolean
  isConnecting?: boolean
  isConnectTarget?: boolean
  isEcho?: boolean
  echoSourcePos?: [number, number, number] | null
  starConnections?: Array<{ connection: Connection; otherStar: Star }>
  onStartConnect?: (starId: string) => void
  onConnectTarget?: (targetId: string) => void
  onViewConnection?: (connectionId: string) => void
  onDelete?: (starId: string) => void
  onPulseLog?: (starId: string) => void
  onViewDeductions?: (starId: string) => void
}

const StarNode = memo(function StarNode({
  id,
  form,
  position,
  starName,
  surfaceText,
  originalSignal,
  myDecode,
  correctionMark,
  resonanceFreq,
  decayBoundary,
  unsolvedSignal,
  hasDeduction = false,
  deductionCount = 0,
  isNew = false,
  isConnecting = false,
  isConnectTarget = false,
  isEcho = false,
  echoSourcePos = null,
  starConnections,
  onStartConnect,
  onConnectTarget,
  onViewConnection,
  onDelete,
  onPulseLog,
  onViewDeductions,
}: StarNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const [hovered, setHovered] = useState(false)
  const [selected, setSelected] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)
  const isAnimated = useRef(false)

  // Determine visual properties based on form
  const size = form === StarForm.StarDust ? 0.3 : form === StarForm.Pulsar ? 0.6 : 0.7
  const segments = form === StarForm.StarDust ? 16 : form === StarForm.Pulsar ? 24 : 32
  const color = form === StarForm.StarDust ? '#aaccff' : form === StarForm.Pulsar ? '#ffd700' : '#ffaa44'
  const emissive = form === StarForm.StarDust ? '#334466' : form === StarForm.Pulsar ? '#664400' : '#884400'
  const emissiveIntensity = form === StarForm.StarDust ? 0.3 : form === StarForm.Pulsar ? 1.5 : 2.0
  const useCustomShader = form === StarForm.Pulsar || form === StarForm.Constellation

  // Connecting mode / Echo mode visual override
  const effectiveColor = isConnecting ? '#00ffcc' : isConnectTarget ? '#44ddff' : isEcho ? '#ffaa44' : color
  const effectiveEmissive = isConnecting ? '#005544' : isConnectTarget ? '#004466' : isEcho ? '#442200' : emissive
  const effectiveEmissiveIntensity = isConnecting ? 2.5 : isConnectTarget ? 2.0 : isEcho ? 2.0 : emissiveIntensity

  // Create custom shader material for pulsars and constellations
  const shaderMaterial = useMemo(() => {
    if (!useCustomShader) return null
    return createPulsarMaterial(
      new THREE.Color(effectiveColor),
      new THREE.Color('#ffffff')
    )
  }, [useCustomShader, effectiveColor])

  // Keep ref to shader material for useFrame updates
  useEffect(() => {
    if (shaderMaterial) {
      materialRef.current = shaderMaterial
    }
  }, [shaderMaterial])

  // Track whether birth animation was ever requested (survives isNew prop changes)
  const birthRequested = useRef(isNew)
  useEffect(() => {
    if (isNew) birthRequested.current = true
  }, [isNew])

  // Birth animation: scale from 0 with elastic effect
  // Separate effect with empty deps — runs once on mount, never cleaned up
  useEffect(() => {
    if (!birthRequested.current || isAnimated.current || !meshRef.current) return

    isAnimated.current = true
    meshRef.current.scale.setScalar(0.01)

    // Delay slightly so the mesh is mounted
    setTimeout(() => {
      if (meshRef.current) {
        gsap.to(meshRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.2,
          ease: 'elastic.out(1, 0.6)',
        })
      }
    }, 100)
    // No cleanup — the setTimeout callback checks meshRef.current before running
  }, [])

  // Store initial local Y for absolute floating (avoids += drift)
  const baseYRef = useRef(0)

  // Animation
  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.getElapsedTime()
    const phase = idToPhase(id)

    // Update shader time uniform
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time
    }

    const needsPulse = form === StarForm.Pulsar || form === StarForm.Constellation || isConnecting || isEcho
    if (needsPulse) {
      // Pulsating scale — faster when connecting/echoing. Skip if birth animation just played
      if (!isNew || isAnimated.current) {
        const speed = isConnecting ? 6 : isEcho ? 5 : 3
        const amplitude = isEcho ? 0.08 : 0.05
        const pulse = 1 + Math.sin(time * speed + phase * 10) * amplitude
        // Only apply pulse on top of birth animation
        const baseScale = meshRef.current.scale.x
        if (baseScale > 0.95) {
          meshRef.current.scale.setScalar(pulse)
        }
      }
    }

    // Subtle floating motion — use absolute positioning (sin-based) to prevent drift
    const floatAmplitude = needsPulse ? 0.3 : 0.15
    meshRef.current.position.y = baseYRef.current + Math.sin(time * 0.5 + phase) * floatAmplitude
  })

  const handleClick = (e: any) => {
    e.stopPropagation()

    // Only treat as click if pointer didn't move (not a camera drag)
    if (pointerDownPos.current) {
      const dx = e.clientX - pointerDownPos.current.x
      const dy = e.clientY - pointerDownPos.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 3) return
    }

    if (isConnecting) {
      return
    }

    if (isConnectTarget && onConnectTarget) {
      onConnectTarget(id)
      return
    }

    setSelected(!selected)
    setFlipped(false)
  }

  return (
    <group position={position}>
      {/* Star sphere */}
      <mesh
        ref={meshRef}
        onPointerDown={(e) => {
          e.stopPropagation()
          pointerDownPos.current = { x: e.clientX, y: e.clientY }
        }}
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          setHovered(false)
          pointerDownPos.current = null
        }}
      >
        <sphereGeometry args={[size, segments, segments]} />
        {useCustomShader && shaderMaterial ? (
          <primitive object={shaderMaterial} attach="material" />
        ) : (
          <meshStandardMaterial
            color={effectiveColor}
            emissive={effectiveEmissive}
            emissiveIntensity={
              hovered || selected || isConnectTarget
                ? effectiveEmissiveIntensity * 1.5
                : effectiveEmissiveIntensity
            }
            roughness={0.3}
            metalness={0.1}
          />
        )}

        {/* Halo ring for pulsars and constellations */}
        {(form === StarForm.Pulsar || form === StarForm.Constellation) && (
          <mesh>
            <ringGeometry args={[size * 1.3, size * 1.5, 64]} />
            <meshBasicMaterial
              color={effectiveColor}
              transparent
              opacity={isConnecting || isConnectTarget ? 0.5 : 0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Extra highlight ring when connectable */}
        {(isConnecting || isConnectTarget) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * 1.8, 0.03, 16, 64]} />
            <meshBasicMaterial
              color={isConnecting ? '#00ffcc' : '#44ddff'}
              transparent
              opacity={0.6}
            />
          </mesh>
        )}
      </mesh>

      {/* Orbit ring for constellations */}
      {form === StarForm.Constellation && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.8, 0.02, 16, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Connection beam — vertical light pillar above source star */}
      {isConnecting && <ConnectionBeam starSize={size} />}

      {/* Echo beam — golden beam tilted toward echo source */}
      {isEcho && echoSourcePos && (
        <EchoBeam starSize={size} starPos={position} sourcePos={echoSourcePos} />
      )}

      {/* Echo highlight ring — golden pulse ring */}
      {isEcho && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <torusGeometry args={[size * 1.9, 0.04, 16, 64]} />
          <meshBasicMaterial color="#ffaa44" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Deduction glow ring — "这里有你的独立思考" */}
      {hasDeduction && (
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[size * 2.2, 0.05, 16, 64]} />
          <meshBasicMaterial color="#88ffcc" transparent opacity={0.35} />
        </mesh>
      )}

      {/* Star name label */}
      <Text
        position={[0, size + 0.8, 0]}
        fontSize={0.5}
        color={isConnecting ? '#00ffcc' : isConnectTarget ? '#44ddff' : isEcho ? '#ffaa44' : '#8899cc'}
        anchorX="center"
        anchorY="middle"
        visible={hovered || selected || isConnectTarget || isConnecting || isEcho}
      >
        {isEcho ? '≈ 回声 ≈' : isConnecting ? '🔗 连接中' : isConnectTarget ? '>>> 连接目标 <<<' : (
          <>{(starName || surfaceText).slice(0, 8)}{(starName || surfaceText).length > 8 ? '…' : ''}</>
        )}
      </Text>

      {/* Info card on click */}
      {selected && (
        <Html
          position={[0, size + 2, 0]}
          center
          distanceFactor={15}
          occlude={false}
        >
          <div
            className="glass-panel p-4 min-w-[260px] max-w-[320px] pointer-events-auto"
            style={{ perspective: '800px' }}
          >
            {/* Flip container */}
            <div
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.6s ease',
              }}
            >
              {/* Front — 星球表面 */}
              <div style={{ backfaceVisibility: 'hidden' }}>
                <h3 className="text-sm font-medium text-star-glow mb-2">
                  {starName || (form === StarForm.StarDust ? '✨ 星辰' : form === StarForm.Pulsar ? '💫 脉冲星' : '🌟 星座')}
                </h3>
                {surfaceText ? (
                  <p className="text-ui-primary/70 text-xs leading-relaxed">{surfaceText}</p>
                ) : (
                  <p className="text-ui-secondary/40 text-xs italic">暂无表面记录</p>
                )}
                {hasDeduction && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDeductions?.(id)
                    }}
                    className="text-xs text-teal-300/70 hover:text-teal-200 mt-2 pt-2 border-t border-white/5 w-full text-left transition-colors"
                  >
                    💡 推演 · {deductionCount} 条 →
                  </button>
                )}
              </div>

              {/* Back — 星球内核 */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  position: flipped ? 'relative' : 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                }}
              >
                <h3 className="text-sm font-medium text-star-glow mb-3">🔮 星球内核</h3>
                <div className="space-y-2.5 text-xs">
                  {/* 1. 原始信号 — always */}
                  <div>
                    <span className="text-ui-secondary/50">📡 原始信号 </span>
                    <p className="text-ui-primary/80 mt-0.5 leading-relaxed">{originalSignal || '无'}</p>
                  </div>
                  {/* 2. 我的解码 — always */}
                  <div>
                    <span className="text-ui-secondary/50">🔍 我的解码 </span>
                    <p className="text-ui-primary/80 mt-0.5 leading-relaxed">{myDecode || '—'}</p>
                  </div>
                  {/* 3. 纠错标记 — always, dimmed when "无" */}
                  <div>
                    <span className="text-ui-secondary/50">⚠️ 纠错标记 </span>
                    <p className={`mt-0.5 leading-relaxed ${correctionMark === '无' || !correctionMark ? 'text-ui-secondary/30 italic' : 'text-amber-300/80'}`}>
                      {correctionMark || '无'}
                    </p>
                  </div>
                  {/* 4. 共振频率 — conditional */}
                  {resonanceFreq && (
                    <div>
                      <span className="text-ui-secondary/50">🌊 共振频率 </span>
                      <p className="text-ui-primary/80 mt-0.5 leading-relaxed">{resonanceFreq}</p>
                    </div>
                  )}
                  {/* 5. 信号衰减边界 — conditional */}
                  {decayBoundary && (
                    <div>
                      <span className="text-ui-secondary/50">🚧 信号衰减边界 </span>
                      <p className="text-ui-primary/80 mt-0.5 leading-relaxed whitespace-pre-line">{decayBoundary}</p>
                    </div>
                  )}
                  {/* 6. 未解信号 — always */}
                  <div>
                    <span className="text-ui-secondary/50">❓ 未解信号 </span>
                    <p className="text-ui-primary/80 mt-0.5 leading-relaxed whitespace-pre-line italic">{unsolvedSignal || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Connections section ── */}
            {starConnections && starConnections.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-ui-secondary/50 mb-2">
                  🌐 引力连接 · {starConnections.length} 条
                </p>
                <div className="space-y-1.5">
                  {starConnections.map(({ connection: conn, otherStar }) => {
                    const icon = relationIcons[conn.relationType] || '🔗'
                    const label = RelationTypeLabels[conn.relationType] || conn.relationType
                    const color = RelationTypeColors[conn.relationType] || '#6688cc'
                    return (
                      <button
                        key={conn.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewConnection?.(conn.id)
                        }}
                        className="w-full text-left p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] transition-colors border border-white/5 flex items-center gap-2"
                      >
                        <span className="text-xs shrink-0">{icon}</span>
                        <span className="text-[10px] truncate flex-1" style={{ color }}>
                          {label}
                        </span>
                        <span className="text-[10px] text-ui-secondary/50 truncate max-w-[80px]">
                          → {otherStar.starName || otherStar.surfaceText?.slice(0, 8) || '?'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 gap-2">
              {!isConnecting && (
                <button
                  className="text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors"
                  onClick={() => {
                    setSelected(false)
                    onStartConnect?.(id)
                  }}
                >
                  🔗 连接
                </button>
              )}
              <button
                className="text-xs text-ui-secondary/60 hover:text-ui-secondary transition-colors"
                onClick={() => setFlipped(!flipped)}
              >
                {flipped ? '◀ 正面' : '背面 ▶'}
              </button>
              <button
                className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
                onClick={() => {
                  setSelected(false)
                  setFlipped(false)
                  onDelete?.(id)
                }}
                title="删除星体"
              >
                🗑
              </button>
              <button
                className="text-xs text-ui-secondary hover:text-ui-primary transition-colors"
                onClick={() => {
                  setSelected(false)
                  setFlipped(false)
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
})

StarNode.displayName = 'StarNode'

export default StarNode
