import { useMemo } from 'react'
import { NodeSphere } from '../components/three/NodeSphere'
import { PolyhedronModel } from '../components/three/PolyhedronModel'
import { Rod } from '../components/three/Rod'
import { ShapedPortNode, type ShapedPort } from '../components/three/ShapedPortNode'
import { edgesAtMinimumDistance, type PolyhedronData } from '../geometry/polyhedra'
import {
  createZomeToolFaceFamilies,
  supportFaceEdgeTangent,
  zomeToolBodyVertices,
  type SupportFace,
} from '../geometry/zometool'
import { scale, subtract, type Vec3 } from '../geometry/vector'
import type { WorkbenchState } from '../types'

const FAMILY_STYLE = {
  vertex: { color: '#b6503d', shape: 'pentagon' as const },
  face: { color: '#c39a35', shape: 'triangle' as const },
  edge: { color: '#3d748c', shape: 'rectangle' as const },
}

function portFromFace(
  face: SupportFace,
  style: typeof FAMILY_STYLE[keyof typeof FAMILY_STYLE],
  highlighted: boolean,
  rotationDegrees = 0,
): ShapedPort {
  const faceCenter = scale(face.direction, face.distance)
  const firstVertex = zomeToolBodyVertices[face.vertexIndices[0]]
  return {
    direction: face.direction,
    surfaceDistance: face.distance,
    tangent: style.shape === 'rectangle'
      ? supportFaceEdgeTangent(face)
      : subtract(firstVertex, faceCenter),
    rotationDegrees,
    ...style,
    highlighted,
  }
}

export function ZomeToolNodeScene({ state }: { state: WorkbenchState }) {
  const faces = useMemo(createZomeToolFaceFamilies, [])
  const guideSolid = useMemo<PolyhedronData>(() => {
    const vertices = faces.pentagons.map((face) => face.direction)
    return {
      id: 'icosahedron',
      name: '正二十面体',
      englishName: 'Icosahedron',
      vertices,
      edges: edgesAtMinimumDistance(vertices),
      faceCount: 20,
      vertexDegree: 5,
    }
  }, [faces])
  const ports = useMemo<ShapedPort[]>(() => [
    ...faces.pentagons.map((face) => portFromFace(
      face,
      FAMILY_STYLE.vertex,
      state.showFiveFold,
      state.pentagonPortRotation,
    )),
    ...faces.triangles.map((face) => portFromFace(
      face,
      FAMILY_STYLE.face,
      state.showThreeFold,
      state.trianglePortRotation,
    )),
    ...faces.rectangles.map((face) => portFromFace(
      face,
      FAMILY_STYLE.edge,
      state.showTwoFold,
      state.rectanglePortRotation,
    )),
  ], [
    faces,
    state.pentagonPortRotation,
    state.rectanglePortRotation,
    state.showFiveFold,
    state.showThreeFold,
    state.showTwoFold,
    state.trianglePortRotation,
  ])

  const selected = useMemo(() => [
    ...(state.showFiveFold ? faces.pentagons.map(({ direction }) => ({ direction, ...FAMILY_STYLE.vertex, radius: 2.2 })) : []),
    ...(state.showThreeFold ? faces.triangles.map(({ direction }) => ({ direction, ...FAMILY_STYLE.face, radius: 2.08 })) : []),
    ...(state.showTwoFold ? faces.rectangles.map(({ direction }) => ({ direction, ...FAMILY_STYLE.edge, radius: 2.14 })) : []),
  ], [faces, state.showFiveFold, state.showThreeFold, state.showTwoFold])

  return (
    <group position={[0, 0.08, 0]} rotation={[0.05, -0.2, 0]}>
      {state.showGuides && (
        <PolyhedronModel
          solid={guideSolid}
          scale={2.2}
          showFaces={state.showFaces}
          showEdges={state.showEdges}
          showNodes={false}
          faceColor="#b7cbc9"
          edgeColor="#62787c"
          rodScale={0.3}
        />
      )}

      <ShapedPortNode
        ports={ports}
        radius={1.48}
        scale={state.nodeScale}
        showPorts={state.showPorts}
        portScales={{
          pentagon: state.pentagonPortScale,
          triangle: state.trianglePortScale,
          rectangle: state.rectanglePortScale,
        }}
      />

      {state.showGuides && selected.map(({ direction, color, shape, radius }, index) => (
        <group key={`${shape}-${index}`}>
          <Rod
            start={scale(direction, 1.5 * state.nodeScale)}
            end={scale(direction, radius)}
            radius={0.012 * state.rodScale}
            color={color}
            opacity={0.62}
            progress={state.assembly}
          />
          {state.showNodes && (
            <NodeSphere
              position={scale(direction, radius)}
              radius={shape === 'pentagon' ? 0.075 : shape === 'triangle' ? 0.062 : 0.052}
              color={color}
            />
          )}
        </group>
      ))}
    </group>
  )
}
