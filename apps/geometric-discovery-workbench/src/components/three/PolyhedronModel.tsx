import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import type { PolyhedronData } from '../../geometry/polyhedra'
import { neighborsOf } from '../../geometry/polyhedra'
import { radialScale, scale as scaleVector, subtract, normalize, type Vec3 } from '../../geometry/vector'
import { NodeSphere } from './NodeSphere'
import { Rod } from './Rod'

interface PolyhedronModelProps {
  solid: PolyhedronData
  position?: Vec3
  scale?: number
  showFaces?: boolean
  showEdges?: boolean
  showNodes?: boolean
  showPorts?: boolean
  showLabel?: boolean
  explode?: number
  assembly?: number
  nodeScale?: number
  rodScale?: number
  faceColor?: string
  edgeColor?: string
  nodeColor?: string
  highlightVertex?: number
}

export function PolyhedronModel({
  solid,
  position = [0, 0, 0],
  scale = 1,
  showFaces = true,
  showEdges = true,
  showNodes = true,
  showPorts = false,
  showLabel = false,
  explode = 0,
  assembly = 1,
  nodeScale = 1,
  rodScale = 1,
  faceColor = '#c7dce0',
  edgeColor = '#34474d',
  nodeColor = '#eee9da',
  highlightVertex,
}: PolyhedronModelProps) {
  const geometry = useMemo(() => (
    new ConvexGeometry(solid.vertices.map((vertex) => new THREE.Vector3(...vertex)))
  ), [solid])

  const expandedVertices = useMemo(() => solid.vertices.map((vertex) => (
    scaleVector(radialScale(vertex, 1 + explode * 0.3), scale)
  )), [solid, explode, scale])

  return (
    <group position={position}>
      {showFaces && (
        <mesh geometry={geometry} scale={scale * (1 + explode * 0.08)} receiveShadow castShadow>
          <meshStandardMaterial
            color={faceColor}
            roughness={0.9}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
          />
        </mesh>
      )}

      {showEdges && solid.edges.map(([startIndex, endIndex], edgeIndex) => {
        const edgeStart = edgeIndex / solid.edges.length
        const localProgress = Math.min(1, Math.max(0, (assembly - edgeStart) * solid.edges.length))
        return (
          <Rod
            key={`${startIndex}-${endIndex}`}
            start={expandedVertices[startIndex]}
            end={expandedVertices[endIndex]}
            radius={0.027 * scale * rodScale}
            color={edgeColor}
            progress={localProgress}
            endInset={0.07 * scale * nodeScale}
          />
        )
      })}

      {showNodes && solid.vertices.map((_, vertexIndex) => {
        const appearancePoint = vertexIndex / solid.vertices.length
        if (assembly < appearancePoint * 0.34) return null
        const portDirections = showPorts
          ? neighborsOf(solid, vertexIndex).map((neighborIndex) => (
            normalize(subtract(expandedVertices[neighborIndex], expandedVertices[vertexIndex]))
          ))
          : []
        return (
          <NodeSphere
            key={vertexIndex}
            position={expandedVertices[vertexIndex]}
            radius={(highlightVertex === vertexIndex ? 0.13 : 0.095) * scale * nodeScale}
            color={highlightVertex === vertexIndex ? '#d35d43' : nodeColor}
            portDirections={portDirections}
          />
        )
      })}

      {showLabel && (
        <Html position={[0, -1.42 * scale, 0]} center distanceFactor={8}>
          <div className="model-label">
            <span>{solid.name}</span>
            <small>V {solid.vertices.length} · E {solid.edges.length} · F {solid.faceCount}</small>
          </div>
        </Html>
      )}
    </group>
  )
}
