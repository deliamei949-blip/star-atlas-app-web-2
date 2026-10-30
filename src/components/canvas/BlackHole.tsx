import { useRef, useMemo, useState, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// ── 吸积盘粒子环 ──
function AccretionDisk({ radius, color }: { radius: number; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null!)
  const particlesRef = useRef<THREE.Points>(null!)

  // Ring geometry for the main accretion disk
  const ringGeo = useMemo(() => {
    return new THREE.RingGeometry(radius * 1.6, radius * 3.2, 128)
  }, [radius])

  // Orbiting particles
  const particleCount = 400
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = radius * (1.8 + Math.random() * 1.6)
      // Slightly random vertical offset
      const y = (Math.random() - 0.5) * 0.3
      positions[i * 3] = Math.cos(angle) * dist
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * dist
    }
    return positions
  }, [radius, particleCount])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Rotate the main ring
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.003
      // Subtle wobble
      ringRef.current.rotation.x = Math.PI / 2.2 + Math.sin(t * 0.3) * 0.05
    }

    // Orbit particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.008
      // Vertical oscillation
      particlesRef.current.rotation.x = Math.PI / 2.2 + Math.sin(t * 0.5) * 0.08
    }
  })

  return (
    <group>
      {/* Main accretion disk ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <primitive object={ringGeo} attach="geometry" />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner bright ring */}
      <mesh rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[radius * 1.1, radius * 1.3, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbiting particles */}
      <points ref={particlesRef} rotation={[Math.PI / 2.2, 0, 0]}>
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
          size={0.08}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ── 事件视界光晕 ──
function EventHorizonGlow({ radius }: { radius: number }) {
  const glowRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const t = clock.getElapsedTime()
      const pulse = 1 + Math.sin(t * 1.5) * 0.08
      glowRef.current.scale.setScalar(pulse)
      ;(glowRef.current.material as THREE.Material).opacity = 0.15 + Math.sin(t * 2) * 0.05
    }
  })

  return (
    <mesh ref={glowRef}>
      <sphereGeometry args={[radius * 1.4, 32, 32]} />
      <meshBasicMaterial
        color="#440088"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── 引力透镜环（爱因斯坦环）──
function EinsteinRing({ radius }: { radius: number }) {
  const ringRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = clock.getElapsedTime()
      ringRef.current.rotation.z += 0.002
      ringRef.current.scale.setScalar(1 + Math.sin(t * 0.7) * 0.03)
    }
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius * 1.8, 0.04, 32, 128]} />
      <meshBasicMaterial
        color="#6644aa"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── 主组件 ──

interface BlackHoleProps {
  id: string
  question: string
  position: [number, number, number]
  relatedStarCount?: number
  onClick?: (id: string) => void
}

const BlackHole = memo(function BlackHole({
  id,
  question,
  position,
  relatedStarCount = 0,
  onClick,
}: BlackHoleProps) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null!)
  const coreRef = useRef<THREE.Mesh>(null!)
  const coreRadius = 0.8

  // Slow overall rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
    // Subtle breathing of the core (use R3F clock, not Date.now)
    if (coreRef.current) {
      const s = 1 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.02
      coreRef.current.scale.setScalar(s)
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick?.(id)
  }

  return (
    <group ref={groupRef} position={position}>
      {/* Event horizon glow */}
      <EventHorizonGlow radius={coreRadius} />

      {/* Einstein ring */}
      <EinsteinRing radius={coreRadius} />

      {/* Accretion disk + particles */}
      <AccretionDisk radius={coreRadius} color={hovered ? '#6644cc' : '#440088'} />

      {/* Dark core */}
      <mesh
        ref={coreRef}
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[coreRadius, 64, 64]} />
        <meshBasicMaterial color="#0a0011" />
      </mesh>

      {/* Subtle purple point light */}
      <pointLight
        color="#440088"
        intensity={0.6}
        distance={6}
        decay={2}
      />

      {/* Purple ambient glow sphere (slightly larger) */}
      <mesh>
        <sphereGeometry args={[coreRadius * 2.5, 32, 32]} />
        <meshBasicMaterial
          color="#220044"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Question label */}
      <Html
        position={[0, coreRadius + 1.8, 0]}
        center
        distanceFactor={15}
        occlude={false}
      >
        <div
          className={`glass-panel px-3 py-1.5 cursor-pointer transition-all duration-300 ${
            hovered ? 'scale-105' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(id)
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🕳️</span>
            <span className="text-xs text-purple-200/80 max-w-[200px] truncate">
              {question.slice(0, 30)}{question.length > 30 ? '…' : ''}
            </span>
          </div>
          {relatedStarCount > 0 && (
            <p className="text-xs text-purple-300/50 mt-1 text-center">
              {relatedStarCount} 颗关联星体
            </p>
          )}
        </div>
      </Html>

      {/* Hover state — brighter glow */}
      {hovered && (
        <mesh>
          <sphereGeometry args={[coreRadius * 1.15, 32, 32]} />
          <meshBasicMaterial
            color="#553388"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
})

BlackHole.displayName = 'BlackHole'

export default BlackHole
