import { Html } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { NodeSphere } from '../components/three/NodeSphere'
import { Rod } from '../components/three/Rod'
import { createDualMorph } from '../geometry/duality'
import { platonicSolids } from '../geometry/polyhedra'
import { centroid, type Vec3 } from '../geometry/vector'
import type { WorkbenchState } from '../types'

const SCALE = 1.75
const PRIMAL_COLOR = '#c5d8d5'
const DUAL_COLOR = '#d8c2b7'
const EDGE_FACE_COLOR = '#e4ddd0'

function scalePoints(points: Vec3[], amount: number): Vec3[] {
  return points.map(([x, y, z]) => [x * amount, y * amount, z * amount] as const)
}

function PolygonFace({
  points,
  color,
  opacity,
}: {
  points: Vec3[]
  color: string
  opacity: number
}) {
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const origin = centroid(points)
    const positions: number[] = []
    points.forEach((start, index) => {
      const end = points[(index + 1) % points.length]
      positions.push(...origin, ...start, ...end)
    })
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
  }, [points])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={1}
      />
    </mesh>
  )
}

export function DualityScene({ state }: { state: WorkbenchState }) {
  const solid = platonicSolids[state.selectedSolid]
  const morph = useMemo(
    () => createDualMorph(solid, state.assembly),
    [solid, state.assembly],
  )

  const primalFaces = useMemo(
    () => morph.primalFaces.map((face) => scalePoints(face, SCALE)),
    [morph],
  )
  const dualFaces = useMemo(
    () => morph.dualFaces.map((face) => scalePoints(face, SCALE)),
    [morph],
  )
  const edgeFaces = useMemo(
    () => morph.edgeFaces.map((face) => scalePoints(face, SCALE)),
    [morph],
  )
  const edges = useMemo(
    () => morph.edges.map(([start, end]) => [
      [start[0] * SCALE, start[1] * SCALE, start[2] * SCALE] as Vec3,
      [end[0] * SCALE, end[1] * SCALE, end[2] * SCALE] as Vec3,
    ] as const),
    [morph],
  )
  const vertices = useMemo(
    () => scalePoints(morph.vertices, SCALE),
    [morph],
  )

  return (
    <group position={[0, 0.1, 0]}>
      {state.showFaces && primalFaces.map((face, index) => (
        <PolygonFace key={`primal-${index}`} points={face} color={PRIMAL_COLOR} opacity={0.3} />
      ))}
      {state.showFaces && dualFaces.map((face, index) => (
        <PolygonFace key={`dual-${index}`} points={face} color={DUAL_COLOR} opacity={0.3} />
      ))}
      {state.showFaces && edgeFaces.map((face, index) => (
        <PolygonFace key={`edge-${index}`} points={face} color={EDGE_FACE_COLOR} opacity={0.14} />
      ))}

      {state.showEdges && edges.map(([start, end], index) => (
        <Rod
          key={`edge-${index}`}
          start={start}
          end={end}
          radius={0.027 * SCALE * state.rodScale}
          color="#34474d"
          endInset={0.055 * SCALE * state.nodeScale}
        />
      ))}

      {state.showNodes && vertices.map((position, index) => (
        <NodeSphere
          key={`node-${index}`}
          position={position}
          radius={0.09 * SCALE * state.nodeScale}
          color="#eee9da"
        />
      ))}

      {state.showLabels && (
        <Html position={[0, -2.05, 0]} center distanceFactor={8}>
          <div className="formula-card">
            <strong>
              {morph.primal.name}
              {morph.primal.id === morph.dual.id ? '（自对偶）' : ` → ${morph.dual.name}`}
            </strong>
            <span>
              V {morph.primal.vertices.length} · F {morph.primal.faceCount}
              {'  ↔  '}
              V {morph.dual.vertices.length} · F {morph.dual.faceCount}
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}
