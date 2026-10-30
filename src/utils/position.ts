/**
 * Generate random 3D position on a spherical shell
 * New stars spawn at a random point on a sphere of given radius
 */
export function randomSpherePosition(radius: number = 30): {
  x: number
  y: number
  z: number
} {
  // Uniform distribution on sphere surface using Marsaglia's method
  let u: number, v: number, s: number
  do {
    u = Math.random() * 2 - 1
    v = Math.random() * 2 - 1
    s = u * u + v * v
  } while (s >= 1)

  const factor = 2 * Math.sqrt(1 - s)
  return {
    x: u * factor * radius,
    y: v * factor * radius,
    z: Math.sqrt(Math.max(0, 1 - s * factor * factor / (4 * radius * radius))) * radius * (Math.random() > 0.5 ? 1 : -1),
  }
}

/**
 * Simpler random position using spherical coordinates
 */
export function randomSpherePositionSimple(radius: number = 30): {
  x: number
  y: number
  z: number
} {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = radius * (0.7 + Math.random() * 0.6) // slight variation in radius

  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
  }
}
