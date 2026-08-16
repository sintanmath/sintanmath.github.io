import { Html } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { assemblyVisibility, ballStickAssembly } from '../../geometry/assembly'
import type { PolyhedronData } from '../../geometry/polyhedra'
import { neighborsOf, triangularFacesOf } from '../../geometry/polyhedra'
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
  snapAssembly?: boolean
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
  snapAssembly = false,
}: PolyhedronModelProps) {
  const geometry = useMemo(() => (
    new ConvexGeometry(solid.vertices.map((vertex) => new THREE.Vector3(...vertex)))
  ), [solid])

  const expandedVertices = useMemo(() => solid.vertices.map((vertex) => (
    scaleVector(radialScale(vertex, 1 + explode * 0.3), scale)
  )), [solid, explode, scale])

  const visibility = useMemo(() => {
    if (!snapAssembly) return null
    return assemblyVisibility(ballStickAssembly(solid).parts, assembly)
  }, [snapAssembly, solid, assembly])

  const completedFaceGeometry = useMemo(() => {
    if (!visibility) return null
    const rodKeys = new Set(visibility.rods.map(({ start, end }) => (
      start < end ? `${start}-${end}` : `${end}-${start}`
    )))
    const faces = triangularFacesOf(solid).filter(([first, second, third]) => (
      visibility.nodes.has(first)
      && visibility.nodes.has(second)
      && visibility.nodes.has(third)
      && rodKeys.has(`${Math.min(first, second)}-${Math.max(first, second)}`)
      && rodKeys.has(`${Math.min(second, third)}-${Math.max(second, third)}`)
      && rodKeys.has(`${Math.min(first, third)}-${Math.max(first, third)}`)
    ))
    if (faces.length === 0) return null

    const positions: number[] = []
    faces.forEach(([first, second, third]) => {
      positions.push(
        ...expandedVertices[first],
        ...expandedVertices[second],
        ...expandedVertices[third],
      )
    })
    const faceGeometry = new THREE.BufferGeometry()
    faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    faceGeometry.computeVertexNormals()
    return faceGeometry
  }, [expandedVertices, solid, visibility])

  useEffect(() => () => {
    completedFaceGeometry?.dispose()
  }, [completedFaceGeometry])

  const visibleEdges = visibility
    ? visibility.rods.map(({ start, end }) => [start, end] as const)
    : solid.edges
  const visibleNodes = visibility
    ? [...visibility.nodes]
    : solid.vertices.map((_, vertexIndex) => vertexIndex)

  return (
    <group position={position}>
      {showFaces && !visibility && (
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

      {showFaces && completedFaceGeometry && (
        <mesh geometry={completedFaceGeometry} receiveShadow>
          <meshStandardMaterial
            color={faceColor}
            roughness={0.9}
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
          />
        </mesh>
      )}

      {showEdges && visibleEdges.map(([startIndex, endIndex], edgeIndex) => {
        const latestRod = visibility?.latest?.kind === 'rod'
          && (
            (visibility.latest.start === startIndex && visibility.latest.end === endIndex)
            || (visibility.latest.start === endIndex && visibility.latest.end === startIndex)
          )
        return (
          <Rod
            key={`${startIndex}-${endIndex}`}
            start={expandedVertices[startIndex]}
            end={expandedVertices[endIndex]}
            radius={0.027 * scale * rodScale * (latestRod ? 1.18 : 1)}
            color={latestRod ? '#d35d43' : edgeColor}
            progress={visibility ? 1 : Math.min(1, Math.max(0, (assembly - edgeIndex / solid.edges.length) * solid.edges.length))}
            grow={!visibility}
            endInset={0.07 * scale * nodeScale}
          />
        )
      })}

      {showNodes && visibleNodes.map((vertexIndex) => {
        if (!visibility) {
          const appearancePoint = vertexIndex / solid.vertices.length
          if (assembly < appearancePoint * 0.34) return null
        }
        const latestNode = visibility?.latest?.kind === 'node' && visibility.latest.vertex === vertexIndex
        const portDirections = showPorts
          ? neighborsOf(solid, vertexIndex).map((neighborIndex) => (
            normalize(subtract(expandedVertices[neighborIndex], expandedVertices[vertexIndex]))
          ))
          : []
        return (
          <NodeSphere
            key={vertexIndex}
            position={expandedVertices[vertexIndex]}
            radius={(latestNode || highlightVertex === vertexIndex ? 0.13 : 0.095) * scale * nodeScale}
            color={latestNode || highlightVertex === vertexIndex ? '#d35d43' : nodeColor}
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
