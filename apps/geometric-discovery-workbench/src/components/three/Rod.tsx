import { useEffect, useMemo, useState } from 'react'
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
  grow?: boolean
  interactive?: boolean
  onSelect?: () => void
}

export function Rod({
  start,
  end,
  radius = 0.035,
  color = '#28373d',
  opacity = 1,
  progress = 1,
  endInset = 0,
  grow = true,
  interactive = false,
  onSelect,
}: RodProps) {
  const [hovered, setHovered] = useState(false)
  const lengthProgress = grow ? progress : (progress > 0 ? 1 : 0)
  const visualRadius = hovered && interactive ? radius * 1.28 : radius

  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])
  const transform = useMemo(() => {
    const startVector = new THREE.Vector3(...start)
    const targetVector = new THREE.Vector3(...end)
    const fullDirection = targetVector.clone().sub(startVector)
    const fullLength = fullDirection.length()
    const direction = fullDirection.clone().normalize()
    const safeLength = Math.max(0.001, fullLength - endInset * 2)
    const visibleLength = safeLength * Math.min(1, Math.max(0.001, lengthProgress))
    const insetStart = startVector.clone().addScaledVector(direction, endInset)
    const midpoint = insetStart.clone().addScaledVector(direction, visibleLength / 2)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction,
    )
    return { midpoint, quaternion, length: visibleLength }
  }, [start, end, endInset, lengthProgress])

  if (lengthProgress <= 0) return null

  return (
    <group
      position={transform.midpoint}
      quaternion={transform.quaternion}
      onPointerOver={interactive ? (event) => {
        event.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      } : undefined}
      onPointerOut={interactive ? () => {
        setHovered(false)
        document.body.style.cursor = ''
      } : undefined}
      onPointerDown={interactive ? (event) => event.stopPropagation() : undefined}
      onClick={interactive && onSelect ? (event) => {
        event.stopPropagation()
        onSelect()
      } : undefined}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[visualRadius, visualRadius, transform.length, 18]} />
        <meshStandardMaterial
          color={hovered && interactive ? '#f4efe2' : color}
          roughness={0.58}
          metalness={0.04}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {interactive && (
        <mesh>
          <cylinderGeometry args={[radius * 2.4, radius * 2.4, transform.length, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
