import { Html, Line } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { NodeSphere } from '../components/three/NodeSphere'
import { Rod } from '../components/three/Rod'
import { icosahedralVertexDirections } from '../geometry/directions'
import { angleDegrees, scale, type Vec3 } from '../geometry/vector'
import type { WorkbenchState } from '../types'

function findSixtyDegreePair(directions: Vec3[]): [Vec3, Vec3] {
  let best: [Vec3, Vec3] = [directions[0], directions[1]]
  let bestDifference = Number.POSITIVE_INFINITY
  directions.forEach((first, index) => {
    directions.slice(index + 1).forEach((second) => {
      const difference = Math.abs(angleDegrees(first, second) - 60)
      if (difference < bestDifference) {
        best = [first, second]
        bestDifference = difference
      }
    })
  })
  return best
}

function createAngleArc(first: Vec3, second: Vec3): Vec3[] {
  const a = new THREE.Vector3(...first).normalize()
  const b = new THREE.Vector3(...second).normalize()
  return Array.from({ length: 25 }, (_, index) => {
    const point = a.clone().lerp(b, index / 24).normalize().multiplyScalar(1.14)
    return point.toArray() as Vec3
  })
}

export function IcosaVertexScene({ state }: { state: WorkbenchState }) {
  const directions = useMemo(() => icosahedralVertexDirections(), [])
  const anglePair = useMemo(() => findSixtyDegreePair(directions), [directions])
  const angleArc = useMemo(() => createAngleArc(...anglePair), [anglePair])
  const labelPosition = angleArc[Math.floor(angleArc.length / 2)]

  return (
    <group position={[0, 0.1, 0]} rotation={[0.1, -0.35, -0.3]}>
      <NodeSphere
        radius={0.7 * state.nodeScale}
        portDirections={state.showPorts ? directions : []}
        portRadius={0.085}
      />

      {state.showEdges && directions.map((direction, index) => (
        <Rod
          key={index}
          start={scale(direction, 0.62)}
          end={scale(direction, 2.6)}
          radius={0.085 * state.rodScale}
          color={anglePair.includes(direction) ? '#b8513d' : '#3c6671'}
          progress={state.assembly}
        />
      ))}

      {state.showGuides && (
        <>
          <Line points={angleArc} color="#b8513d" lineWidth={2.5} />
          <Line points={[[0, 0, 0], scale(anglePair[0], 1.2)]} color="#b8513d" opacity={0.38} transparent lineWidth={1} />
          <Line points={[[0, 0, 0], scale(anglePair[1], 1.2)]} color="#b8513d" opacity={0.38} transparent lineWidth={1} />
        </>
      )}

      {state.showLabels && state.showGuides && (
        <Html position={labelPosition} center distanceFactor={7}>
          <span className="angle-tag">60°</span>
        </Html>
      )}
    </group>
  )
}
