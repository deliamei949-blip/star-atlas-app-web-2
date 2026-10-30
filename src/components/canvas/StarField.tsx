import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarFieldProps {
  count?: number
  radius?: number
}

export default function StarField({ count = 2000, radius = 120 }: StarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null!)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Random sphere distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.5 + Math.random() * 0.5)

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Star colors: mostly blue-white with some warm tones
      const colorChoice = Math.random()
      if (colorChoice < 0.7) {
        // Blue-white stars
        colors[i * 3] = 0.6 + Math.random() * 0.4
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.3
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2
      } else if (colorChoice < 0.9) {
        // Warm yellow stars
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.3
        colors[i * 3 + 2] = 0.4 + Math.random() * 0.3
      } else {
        // Cool purple stars
        colors[i * 3] = 0.5 + Math.random() * 0.3
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.2
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2
      }
    }

    return { positions: pos, colors: colors }
  }, [count, radius])

  // Slow rotation
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02
      pointsRef.current.rotation.x += delta * 0.005
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={positions.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
