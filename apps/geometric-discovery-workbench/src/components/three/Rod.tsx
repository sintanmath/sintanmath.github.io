import { useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '../../geometry/vector'

interface RodProps {
  start: Vec3
  end: Vec3
  radius?: number
  color?: string
  opacity?: number
  progress?: number
  endInset?: number
}

export function Rod({
  start,
  end,
  radius = 0.035,
  color = '#28373d',
  opacity = 1,
  progress = 1,
  endInset = 0,
}: RodProps) {
  const transform = useMemo(() => {
    const startVector = new THREE.Vector3(...start)
    const targetVector = new THREE.Vector3(...end)
    const fullDirection = targetVector.clone().sub(startVector)
    const fullLength = fullDirection.length()
    const direction = fullDirection.clone().normalize()
    const safeLength = Math.max(0.001, fullLength - endInset * 2)
    const visibleLength = safeLength * Math.min(1, Math.max(0.001, progress))
    const insetStart = startVector.clone().addScaledVector(direction, endInset)
    const midpoint = insetStart.clone().addScaledVector(direction, visibleLength / 2)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction,
    )
    return { midpoint, quaternion, length: visibleLength }
  }, [start, end, endInset, progress])

  if (progress <= 0) return null

  return (
    <mesh
      position={transform.midpoint}
      quaternion={transform.quaternion}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[radius, radius, transform.length, 18]} />
      <meshStandardMaterial
        color={color}
        roughness={0.58}
        metalness={0.04}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}
