import { platonicSolids, solidOrder } from '../geometry/polyhedra'
import type { WorkbenchState } from '../types'
import { PolyhedronModel } from '../components/three/PolyhedronModel'
import { IndependentRotator } from '../components/three/IndependentRotator'

const positions: Array<readonly [number, number, number]> = [
  [-3.35, 0.55, 0],
  [-1.7, -0.25, 0.15],
  [0, 0.55, 0],
  [1.7, -0.25, 0.15],
  [3.35, 0.55, 0],
]

const colors = ['#d9cbb5', '#c5d8d5', '#d8c2b7', '#c6d2df', '#dfcfaa']

export function PlatonicAtlasScene({ state }: { state: WorkbenchState }) {
  return (
    <group position={[0, 0.25, 0]}>
      {solidOrder.map((id, index) => (
        <IndependentRotator
          key={id}
          position={positions[index]}
          rotation={[0.18 * (index % 2), 0.24 * index, 0]}
        >
          <PolyhedronModel
            solid={platonicSolids[id]}
            scale={id === 'dodecahedron' || id === 'icosahedron' ? 0.78 : 0.72}
            showFaces={state.showFaces}
            showEdges={state.showEdges}
            showNodes={state.showNodes}
            showLabel={state.showLabels}
            explode={state.explode}
            nodeScale={state.nodeScale}
            rodScale={state.rodScale}
            faceColor={colors[index]}
          />
        </IndependentRotator>
      ))}
    </group>
  )
}
