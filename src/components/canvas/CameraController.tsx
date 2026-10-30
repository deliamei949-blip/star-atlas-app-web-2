import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStarStore } from '@/stores/starStore'
import { useUIStore } from '@/stores/uiStore'

export interface CameraControllerHandle {
  flyToStar: (starId: string) => void
}

/** Exponential smoothing factor per frame (at 60fps). Lower = smoother & slower. */
const LERP_FACTOR = 0.06

/** Distance threshold to consider the flight complete. */
const ARRIVE_THRESHOLD = 0.15

const CameraController = forwardRef<CameraControllerHandle>((_, ref) => {
  const controlsRef = useRef<any>(null!)
  const camera = useThree((s) => s.camera)

  // Flight state — stored in refs to avoid React re-render overhead during animation
  const flightTarget = useRef<{
    cameraEnd: THREE.Vector3
    targetEnd: THREE.Vector3
    starId: string
  } | null>(null)

  const isConnecting = useStarStore((s) => s.connectingStarId !== null)
  const isFlying = useUIStore((s) => s.isFlying)
  const setFlying = useUIStore((s) => s.setFlying)
  const setRoamTarget = useUIStore((s) => s.setRoamTarget)
  const requestFlyToStarId = useUIStore((s) => s.requestFlyToStarId)
  const clearFlyToRequest = useUIStore((s) => s.clearFlyToRequest)

  // ── Smooth flight animation via useFrame ──
  // Runs inside R3F's render loop, in sync with OrbitControls — no GSAP conflict.
  useFrame(() => {
    const ft = flightTarget.current
    if (!ft) return

    const ctrl = controlsRef.current
    if (!ctrl) return

    // Smoothly interpolate camera position toward destination
    camera.position.lerp(ft.cameraEnd, LERP_FACTOR)

    // Smoothly interpolate orbit target toward star center
    ctrl.target.lerp(ft.targetEnd, LERP_FACTOR)

    // Keep OrbitControls internal state in sync with our changes
    ctrl.update()

    // Check arrival: both camera and target are close enough to destination
    const camDist = camera.position.distanceTo(ft.cameraEnd)
    const tgtDist = ctrl.target.distanceTo(ft.targetEnd)

    if (camDist < ARRIVE_THRESHOLD && tgtDist < ARRIVE_THRESHOLD) {
      // Snap to exact final position
      camera.position.copy(ft.cameraEnd)
      ctrl.target.copy(ft.targetEnd)
      ctrl.update()

      // Flight complete
      flightTarget.current = null
      setFlying(false)
      setRoamTarget(ft.starId)
    }
  })

  // ── Imperative flyToStar ──
  const flyToStar = useCallback(
    (starId: string) => {
      const stars = useStarStore.getState().stars
      const star = stars.find((s) => s.id === starId)
      if (!star || !controlsRef.current) return

      setFlying(true)

      const targetEnd = new THREE.Vector3(star.positionX, star.positionY, star.positionZ)
      const cameraEnd = new THREE.Vector3(
        targetEnd.x + 5,
        targetEnd.y + 3,
        targetEnd.z + 10,
      )

      // Set flight target — useFrame picks it up next frame
      flightTarget.current = { cameraEnd, targetEnd, starId }
    },
    [setFlying, setRoamTarget],
  )

  // Expose flyToStar to parent via ref
  useImperativeHandle(ref, () => ({ flyToStar }), [flyToStar])

  // Listen for fly-to requests from other components
  useEffect(() => {
    if (requestFlyToStarId) {
      flyToStar(requestFlyToStarId)
      setTimeout(() => clearFlyToRequest(), 200)
    }
  }, [requestFlyToStarId, flyToStar, clearFlyToRequest])

  // ── OrbitControls: disable input during connection mode or flight ──
  useEffect(() => {
    if (!controlsRef.current) return
    controlsRef.current.enabled = !isConnecting && !isFlying
  }, [isConnecting, isFlying])

  // NOTE: `enabled` and `target` are managed imperatively — not passed as props —
  // to prevent R3F's reconciler from overwriting them during flight animation.
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={8}
      maxDistance={200}
      maxPolarAngle={Math.PI * 0.8}
      rotateSpeed={0.5}
      zoomSpeed={1.2}
      panSpeed={0.5}
    />
  )
})

CameraController.displayName = 'CameraController'
export default CameraController
