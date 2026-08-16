import { Html, Line } from '@react-three/drei'
import { NodeSphere } from '../components/three/NodeSphere'
import { Rod } from '../components/three/Rod'
import { orthogonalDirections } from '../geometry/directions'
import { add, scale, type Vec3 } from '../geometry/vector'
import type { WorkbenchState } from '../types'

const axisColors = ['#be563f', '#be563f', '#b28b35', '#b28b35', '#3d7189', '#3d7189']
const axisNames = ['+X', '−X', '+Y', '−Y', '+Z', '−Z']

export function OrthogonalNodeScene({ state }: { state: WorkbenchState }) {
  const innerDistance = 1.85 - state.assembly * 1.48

  return (
    <group position={[0, 0.1, 0]}>
      {state.showGuides && (
        <>
          <Line points={[[-2.7, 0, 0], [2.7, 0, 0]]} color="#be563f" opacity={0.32} transparent lineWidth={1} dashed dashSize={0.12} gapSize={0.08} />
          <Line points={[[0, -2.7, 0], [0, 2.7, 0]]} color="#a78030" opacity={0.32} transparent lineWidth={1} dashed dashSize={0.12} gapSize={0.08} />
          <Line points={[[0, 0, -2.7], [0, 0, 2.7]]} color="#3d7189" opacity={0.32} transparent lineWidth={1} dashed dashSize={0.12} gapSize={0.08} />
        </>
      )}

      <NodeSphere
        radius={0.68 * state.nodeScale}
        portDirections={state.showPorts ? orthogonalDirections : []}
        portColors={axisColors}
        portRadius={0.085}
      />

      {state.showEdges && orthogonalDirections.map((direction, index) => {
        const start = scale(direction, innerDistance) as Vec3
        const end = add(start, scale(direction, 1.4))
        return (
          <Rod
            key={axisNames[index]}
            start={start}
            end={end}
            radius={0.095 * state.rodScale}
            color={axisColors[index]}
          />
        )
      })}

      {state.showLabels && orthogonalDirections.map((direction, index) => (
        <Html key={axisNames[index]} position={scale(direction, 2.45)} center distanceFactor={7}>
          <span className="axis-tag" style={{ '--axis-color': axisColors[index] } as React.CSSProperties}>
            {axisNames[index]}
          </span>
        </Html>
      ))}
    </group>
  )
}
