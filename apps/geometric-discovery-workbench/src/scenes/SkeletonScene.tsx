import { Html } from '@react-three/drei'
import { PolyhedronModel } from '../components/three/PolyhedronModel'
import { platonicSolids } from '../geometry/polyhedra'
import type { WorkbenchState } from '../types'

export function SkeletonScene({ state }: { state: WorkbenchState }) {
  const solid = platonicSolids[state.selectedSolid]

  return (
    <group position={[0, 0.1, 0]}>
      <PolyhedronModel
        solid={solid}
        scale={1.75}
        showFaces={state.showFaces}
        showEdges={state.showEdges}
        showNodes={state.showNodes}
        showPorts={state.showPorts}
        explode={state.explode}
        nodeScale={state.nodeScale}
        rodScale={state.rodScale}
        faceColor="#b7d2d0"
      />
      {state.showLabels && (
        <Html position={[0, -2.0, 0]} center distanceFactor={8}>
          <div className="formula-card">
            <strong>{solid.name}</strong>
            <span>V − E + F = {solid.vertices.length} − {solid.edges.length} + {solid.faceCount} = 2</span>
          </div>
        </Html>
      )}
    </group>
  )
}
