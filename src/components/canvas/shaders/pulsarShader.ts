import * as THREE from 'three'

export const pulsarVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosition = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDirection = normalize(-mvPosition.xyz);

    gl_Position = projectionMatrix * mvPosition;
  }
`

export const pulsarFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDirection;

  uniform vec3 uColor;
  uniform vec3 uGlowColor;
  uniform float uTime;

  void main() {
    // Fresnel effect: brighter at edges (grazing angles)
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDirection)), 3.0);

    // Time-based shimmer: subtle wave across the surface
    float shimmer = sin(vPosition.x * 5.0 + uTime * 2.0) *
                    cos(vPosition.y * 5.0 + uTime * 1.5) * 0.15 + 0.85;

    // Core color: mix base color with glow at edges
    vec3 coreColor = uColor * shimmer;
    vec3 edgeColor = uGlowColor * fresnel * 1.5;

    // Combine core and edge glow
    vec3 finalColor = mix(coreColor, edgeColor, fresnel * 0.7);

    // Pulse the overall brightness
    float pulse = 1.0 + sin(uTime * 3.0) * 0.1;
    finalColor *= pulse;

    // Alpha: mostly opaque core, slightly transparent at extreme edges
    float alpha = 0.9 + fresnel * 0.1;

    gl_FragColor = vec4(finalColor, alpha);
  }
`

export function createPulsarMaterial(color: THREE.Color, glowColor?: THREE.Color) {
  return new THREE.ShaderMaterial({
    vertexShader: pulsarVertexShader,
    fragmentShader: pulsarFragmentShader,
    uniforms: {
      uColor: { value: color },
      uGlowColor: { value: glowColor || new THREE.Color('#ffffff') },
      uTime: { value: 0 },
    },
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: true,
  })
}
