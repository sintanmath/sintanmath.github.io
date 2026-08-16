import { NodeSphere } from '../components/three/NodeSphere'
import { Rod } from '../components/three/Rod'
import { orthogonalDirections } from '../geometry/directions'
import type { Edge, Vec3 } from '../geometry/vector'
import type { WorkbenchState } from '../types'

function createLattice() {
  const vertices: Vec3[] = []
  const indexByCoordinate = new Map<string, number>()

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        indexByCoordinate.set(`${x},${y},${z}`, vertices.length)
        vertices.push([x, y, z])
      }
    }
  }

  const edges: Edge[] = []
  vertices.forEach(([x, y, z], index) => {
    ;[[x + 1, y, z], [x, y + 1, z], [x, y, z + 1]].forEach((coordinate) => {
      const neighbor = indexByCoordinate.get(coordinate.join(','))
      if (neighbor !== undefined) edges.push([index, neighbor])
    })
  })

  return { vertices, edges }
}

const lattice = createLattice()

export function CubeAssemblyScene({ state }: { state: WorkbenchState }) {
  const spacing = 1.48 * (1 + state.explode * 0.35)
  const points = lattice.vertices.map(([x, y, z]) => [x * spacing, y * spacing, z * spacing] as Vec3)

  return (
    <group position={[0, 0.05, 0]} rotation={[0, Math.PI / 8, 0]}>
      {state.showEdges && lattice.edges.map(([start, end], edgeIndex) => {
        const phase = edgeIndex / lattice.edges.length
        const localProgress = Math.min(1, Math.max(0, (state.assembly - phase * 0.72) / 0.28))
        return (
          <Rod
            key={`${start}-${end}`}
            start={points[start]}
            end={points[end]}
            radius={0.043 * state.rodScale}
            color="#405c64"
            progress={localProgress}
            endInset={0.085 * state.nodeScale}
          />
        )
      })}

      {state.showNodes && points.map((point, index) => {
        const phase = index / points.length
        if (state.assembly < phase * 0.28) return null
        return (
          <NodeSphere
            key={index}
            position={point}
            radius={0.12 * state.nodeScale}
            portDirections={state.showPorts ? orthogonalDirections : []}
            portRadius={0.014}
          />
        )
      })}
    </group>
  )
}
