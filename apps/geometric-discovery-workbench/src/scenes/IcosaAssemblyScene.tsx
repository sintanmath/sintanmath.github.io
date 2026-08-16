import { Html } from '@react-three/drei'
import { PolyhedronModel } from '../components/three/PolyhedronModel'
import { platonicSolids } from '../geometry/polyhedra'
import type { WorkbenchState } from '../types'

export function IcosaAssemblyScene({ state }: { state: WorkbenchState }) {
  const solid = platonicSolids.icosahedron

  return (
    <group position={[0, 0.05, 0]} rotation={[0, -0.2, 0]}>
      <PolyhedronModel
        solid={solid}
        scale={1.9}
        showFaces={state.showFaces}
        showEdges={state.showEdges}
        showNodes={state.showNodes}
        showPorts={state.showPorts}
        assembly={state.assembly}
        explode={state.explode}
        nodeScale={state.nodeScale}
        rodScale={state.rodScale}
        faceColor="#c4d6d4"
        highlightVertex={state.showGuides ? 0 : undefined}
      />

      {state.showLabels && (
        <Html position={[0, -2.28, 0]} center distanceFactor={8}>
          <div className="formula-card compact">
            <strong>12 个节点</strong>
            <span>30 根等长杆 · 每点连接 5 根</span>
          </div>
        </Html>
      )}
    </group>
  )
}
