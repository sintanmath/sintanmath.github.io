import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { PolyhedronModel } from '../components/three/PolyhedronModel'
import { assemblyVisibility, icosahedronAssembly } from '../geometry/assembly'
import { platonicSolids } from '../geometry/polyhedra'
import type { WorkbenchState } from '../types'

export function IcosaAssemblyScene({ state }: { state: WorkbenchState }) {
  const solid = platonicSolids.icosahedron
  const visibility = useMemo(
    () => assemblyVisibility(icosahedronAssembly.parts, state.assembly),
    [state.assembly],
  )

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
        snapAssembly
        explode={0}
        nodeScale={state.nodeScale}
        rodScale={state.rodScale}
        faceColor="#c4d6d4"
        highlightVertex={state.showGuides ? icosahedronAssembly.origin : undefined}
      />

      {state.showLabels && (
        <Html position={[0, -2.28, 0]} center distanceFactor={8}>
          <div className="formula-card compact">
            <strong>{visibility.nodes.size} / 12 个球</strong>
            <span>{visibility.rods.length} / 30 根棍 · 每点 5 根</span>
          </div>
        </Html>
      )}
    </group>
  )
}
