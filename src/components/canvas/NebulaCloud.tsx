import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface NebulaCloudProps {
  clusterCount?: number
  particlesPerCluster?: number
  radius?: number
}

interface Cluster {
  center: THREE.Vector3
  color: THREE.Color
  rotationSpeed: number
  rotationAxis: THREE.Vector3
  spread: number
}

export default function NebulaCloud({
  clusterCount = 4,
  particlesPerCluster = 300,
  radius = 100,
}: NebulaCloudProps) {
  const groupRef = useRef<THREE.Group>(null!)

  const clusters: Cluster[] = useMemo(() => {
    const nebulaColors = [
      new THREE.Color('#4422aa'), // deep purple
      new THREE.Color('#2244aa'), // deep blue
      new THREE.Color('#882255'), // deep magenta
      new THREE.Color('#115566'), // deep teal
      new THREE.Color('#553388'), // violet
    ]

    return Array.from({ length: clusterCount }, (_, i) => ({
      center: new THREE.Vector3(
        (Math.random() - 0.5) * radius * 1.5,
        (Math.random() - 0.5) * radius * 0.8,
        (Math.random() - 0.5) * radius * 1.2
      ),
      color: nebulaColors[i % nebulaColors.length],
      rotationSpeed: 0.005 + Math.random() * 0.02,
      rotationAxis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(),
      spread: 8 + Math.random() * 18,
    }))
  }, [clusterCount, radius])

  // Generate all particle positions
  const allGeometries = useMemo(() => {
    return clusters.map((cluster) => {
      const positions = new Float32Array(particlesPerCluster * 3)
      for (let i = 0; i < particlesPerCluster; i++) {
        // Gaussian-like distribution around cluster center
        const x = cluster.center.x + (Math.random() - 0.5) * cluster.spread * 2
        const y = cluster.center.y + (Math.random() - 0.5) * cluster.spread * 2
        const z = cluster.center.z + (Math.random() - 0.5) * cluster.spread * 2
        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z
      }
      return positions
    })
  }, [clusters, particlesPerCluster])

  // Slow rotation
  useFrame((state) => {
    if (!groupRef.current) return
    const delta = state.clock.getDelta()
    // Rotate entire group very slowly
    groupRef.current.rotation.y += delta * 0.01
    groupRef.current.rotation.x += delta * 0.003
  })

  return (
    <group ref={groupRef}>
      {clusters.map((cluster, i) => (
        <points key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particlesPerCluster}
              array={allGeometries[i]}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={cluster.color}
            size={0.25}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ))}
    </group>
  )
}
