import { useMemo, useRef, useState, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Star, RelationType } from '@/types'
import { RelationTypeColors } from '@/types'

interface GravityLineProps {
  starAId: string
  starBId: string
  relationType: RelationType
  stars: Star[]
  connectionId?: string
  onClick?: (connectionId: string) => void
}

// Flow speed by relation type
const flowSpeeds: Record<RelationType, number> = {
  resonance: 0.15,
  orbit: 0.08,
  binary_repel: 0.04,
  nebula_wrap: 0.06,
}

const GravityLine = memo(function GravityLine({
  starAId,
  starBId,
  relationType,
  stars,
  connectionId,
  onClick,
}: GravityLineProps) {
  const flowRef = useRef<THREE.Group>(null!)
  const flowParticlesRef = useRef<THREE.Points>(null!)
  const [hovered, setHovered] = useState(false)
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)

  const starA = stars.find((s) => s.id === starAId)
  const starB = stars.find((s) => s.id === starBId)

  const curve = useMemo(() => {
    if (!starA || !starB) return null

    const start = new THREE.Vector3(starA.positionX, starA.positionY, starA.positionZ)
    const end = new THREE.Vector3(starB.positionX, starB.positionY, starB.positionZ)

    // Create a slight arc for visual appeal
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5)
    mid.y += start.distanceTo(end) * 0.3

    return new THREE.QuadraticBezierCurve3(start, mid, end)
  }, [starA, starB])

  // Midpoint of the curve — where the clickable collision sphere lives
  const midPoint = useMemo(() => {
    if (!curve) return null
    return curve.getPoint(0.5)
  }, [curve])

  // Flow particles: 4-6 particles along the curve
  const particleCount = 5
  const particlePositions = useMemo(() => new Float32Array(particleCount * 3), [particleCount])

  // Animate flow particles
  useFrame((state) => {
    if (!curve || !flowParticlesRef.current) return

    const time = state.clock.getElapsedTime()
    const speed = flowSpeeds[relationType] || 0.1
    const posArray = flowParticlesRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      // Each particle at a different phase along the curve, advancing over time
      const t = ((time * speed + i / particleCount) % 1.0 + 1.0) % 1.0
      const pt = curve.getPoint(t)
      posArray[i * 3] = pt.x
      posArray[i * 3 + 1] = pt.y
      posArray[i * 3 + 2] = pt.z
    }

    flowParticlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (!curve) return null

  const color = RelationTypeColors[relationType] || '#6688cc'

  // Memoize line geometry arrays so GPU buffers don't rebuild every render
  const { linePositions, glowPositions } = useMemo(() => {
    const pts = curve.getPoints(48)
    const lp = new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]))
    // Glow line is same geometry, just different material — reuse array
    return { linePositions: lp, glowPositions: lp }
  }, [curve])

  // Hover boost: brighter & slightly thicker look
  const lineOpacity = hovered ? 0.55 : 0.35
  const particleSize = hovered ? 0.2 : 0.12

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    pointerDownPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleClick = (e: any) => {
    e.stopPropagation()

    // Only treat as click if pointer didn't move (not a camera drag)
    if (pointerDownPos.current) {
      const dx = e.clientX - pointerDownPos.current.x
      const dy = e.clientY - pointerDownPos.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 3) return
    }

    if (connectionId && onClick) {
      onClick(connectionId)
    }
  }

  return (
    <group ref={flowRef}>
      {/* Single line (merged glow + core into one with balanced opacity) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={48}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={lineOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </line>

      {/* Flow particles along the line */}
      <points ref={flowParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={particleSize}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.9}
        />
      </points>

      {/* Hover highlight ring at midpoint — visual cue that line is clickable */}
      {hovered && midPoint && (
        <mesh position={[midPoint.x, midPoint.y, midPoint.z]}>
          <torusGeometry args={[0.45, 0.04, 16, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Invisible clickable sphere at the curve midpoint */}
      {connectionId && onClick && midPoint && (
        <mesh
          position={[midPoint.x, midPoint.y, midPoint.z]}
          visible={false}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          onPointerEnter={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            setHovered(false)
            pointerDownPos.current = null
            document.body.style.cursor = 'default'
          }}
        >
          <sphereGeometry args={[0.7, 8, 8]} />
          <meshBasicMaterial />
        </mesh>
      )}
    </group>
  )
})

GravityLine.displayName = 'GravityLine'

export default GravityLine
