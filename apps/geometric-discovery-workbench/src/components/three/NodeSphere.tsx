import { useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '../../geometry/vector'

interface PortHoleProps {
  direction: Vec3
  sphereRadius: number
  radius: number
  color?: string
}

function PortHole({ direction, sphereRadius, radius, color = '#2f3739' }: PortHoleProps) {
  const transform = useMemo(() => {
    const vector = new THREE.Vector3(...direction).normalize()
    return {
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        vector,
      ),
    }
  }, [direction, sphereRadius])

  return (
    <group quaternion={transform.quaternion}>
      <mesh position={[0, sphereRadius * 1.002, 0]}>
        <cylinderGeometry args={[radius * 1.38, radius * 1.52, sphereRadius * 0.045, 24]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, sphereRadius * 1.028, 0]}>
        <cylinderGeometry args={[radius * 0.86, radius * 0.7, sphereRadius * 0.03, 20]} />
        <meshStandardMaterial color="#273437" roughness={0.96} />
      </mesh>
    </group>
  )
}

interface NodeSphereProps {
  position?: Vec3
  radius?: number
  color?: string
  portDirections?: Vec3[]
  portRadius?: number
  portColors?: string[]
  opacity?: number
}

export function NodeSphere({
  position = [0, 0, 0],
  radius = 0.12,
  color = '#eee9da',
  portDirections = [],
  portRadius,
  portColors,
  opacity = 1,
}: NodeSphereProps) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.87}
          metalness={0}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {portDirections.map((direction, index) => (
        <PortHole
          key={`${direction.join('-')}-${index}`}
          direction={direction}
          sphereRadius={radius}
          radius={portRadius ?? radius * 0.12}
          color={portColors?.[index]}
        />
      ))}
    </group>
  )
}
