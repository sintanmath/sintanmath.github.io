import { useMemo } from 'react'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { zomeToolBodyVertices } from '../../geometry/zometool'
import type { Vec3 } from '../../geometry/vector'

export type PortShape = 'rectangle' | 'triangle' | 'pentagon'

export interface ShapedPort {
  direction: Vec3
  shape: PortShape
  color: string
  highlighted: boolean
  surfaceDistance: number
  tangent?: Vec3
  rotationDegrees?: number
}

export type PortScales = Record<PortShape, number>

function polygonShape(sides: number, rotation = Math.PI / 2): THREE.Shape {
  const shape = new THREE.Shape()
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (index / sides) * Math.PI * 2
    const x = Math.cos(angle)
    const y = Math.sin(angle)
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

function rectangleShape(): THREE.Shape {
  const shape = new THREE.Shape()
  shape.moveTo(-1.25, -0.58)
  shape.lineTo(1.25, -0.58)
  shape.lineTo(1.25, 0.58)
  shape.lineTo(-1.25, 0.58)
  shape.closePath()
  return shape
}

function shapeFor(type: PortShape): THREE.Shape {
  if (type === 'rectangle') return rectangleShape()
  return polygonShape(type === 'triangle' ? 3 : 5)
}

function PortFace({
  port,
  bodyRadius,
  size,
}: {
  port: ShapedPort
  bodyRadius: number
  size: number
}) {
  const transform = useMemo(() => {
    const direction = new THREE.Vector3(...port.direction).normalize()
    const rawTangent = port.tangent
      ? new THREE.Vector3(...port.tangent)
      : new THREE.Vector3(0, 1, 0)
    rawTangent.addScaledVector(direction, -rawTangent.dot(direction))
    if (rawTangent.lengthSq() < 1e-8) rawTangent.set(1, 0, 0)
    const tangent = rawTangent.normalize()
    const bitangent = new THREE.Vector3().crossVectors(direction, tangent).normalize()
    const rotation = THREE.MathUtils.degToRad(port.rotationDegrees ?? 0)
    const rotatedTangent = tangent.clone()
      .multiplyScalar(Math.cos(rotation))
      .addScaledVector(bitangent, Math.sin(rotation))
      .normalize()
    const rotatedBitangent = new THREE.Vector3()
      .crossVectors(direction, rotatedTangent)
      .normalize()
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(rotatedTangent, rotatedBitangent, direction),
    )
    const outer = new THREE.ShapeGeometry(shapeFor(port.shape))
    const cavity = new THREE.ExtrudeGeometry(shapeFor(port.shape), {
      depth: 0.072,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.08,
      bevelThickness: 0.014,
      curveSegments: 2,
    })
    return { quaternion, outer, cavity }
  }, [port.direction, port.rotationDegrees, port.shape, port.tangent])

  const surfaceDistance = port.surfaceDistance * bodyRadius
  const rimColor = port.highlighted ? port.color : '#d3cec2'

  return (
    <group quaternion={transform.quaternion}>
      <mesh
        geometry={transform.outer}
        position={[0, 0, surfaceDistance + 0.006]}
        scale={[size * 1.58, size * 1.58, 1]}
      >
        <meshPhysicalMaterial
          color={rimColor}
          roughness={0.62}
          clearcoat={0.08}
          clearcoatRoughness={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        geometry={transform.cavity}
        position={[0, 0, surfaceDistance - 0.066]}
        scale={[size, size, 1]}
        castShadow
      >
        <meshStandardMaterial color="#192225" roughness={0.94} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function ShapedPortNode({
  ports,
  radius = 1.1,
  scale = 1,
  showPorts = true,
  portScales,
}: {
  ports: ShapedPort[]
  radius?: number
  scale?: number
  showPorts?: boolean
  portScales?: Partial<PortScales>
}) {
  const bodyGeometry = useMemo(() => (
    new ConvexGeometry(zomeToolBodyVertices.map((vertex) => new THREE.Vector3(...vertex)))
  ), [])
  const bodyEdges = useMemo(() => new THREE.EdgesGeometry(bodyGeometry, 2), [bodyGeometry])

  return (
    <group scale={scale}>
      <mesh geometry={bodyGeometry} scale={radius} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#eee9dc"
          roughness={0.48}
          metalness={0}
          clearcoat={0.16}
          clearcoatRoughness={0.68}
        />
      </mesh>
      <lineSegments geometry={bodyEdges} scale={radius}>
        <lineBasicMaterial color="#7e827d" transparent opacity={0.12} />
      </lineSegments>
      {showPorts && ports.map((port, index) => (
        <PortFace
          key={`${port.shape}-${index}`}
          port={port}
          bodyRadius={radius}
          size={(
            port.shape === 'rectangle' ? 0.065 : port.shape === 'triangle' ? 0.078 : 0.09
          ) * (portScales?.[port.shape] ?? 1)}
        />
      ))}
    </group>
  )
}
