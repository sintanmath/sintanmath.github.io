import { Html } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { NodeSphere } from '../components/three/NodeSphere'
import { Rod } from '../components/three/Rod'
import {
  listBuildRods,
  ORIGIN_NODE,
  positionsOf,
  spawnNode,
  countChildrenFromOrigin,
  type PlacedNode,
} from '../geometry/directionBuild'
import { createDirectionFamilies } from '../geometry/directions'
import type { WorkbenchState } from '../types'

const MAX_STRUT = 2.35
const NODE_COLOR = '#e8e2d2'

export function DirectionNodeScene({ state }: { state: WorkbenchState }) {
  const families = useMemo(createDirectionFamilies, [])
  const [nodes, setNodes] = useState<PlacedNode[]>([ORIGIN_NODE])
  const nodeRadius = 0.62 * state.nodeScale
  const strutLength = MAX_STRUT * state.assembly

  const visibleStruts = useMemo(() => {
    const output = []
    if (state.showFiveFold) {
      output.push(...families.fiveFold.map((direction, index) => ({
        direction, color: '#b84e3a', family: '5', index,
      })))
    }
    if (state.showThreeFold) {
      output.push(...families.threeFold.map((direction, index) => ({
        direction, color: '#b18a31', family: '3', index,
      })))
    }
    if (state.showTwoFold) {
      output.push(...families.twoFold.map((direction, index) => ({
        direction, color: '#3e7187', family: '2', index,
      })))
    }
    return output
  }, [families, state.showFiveFold, state.showThreeFold, state.showTwoFold])

  const positions = useMemo(() => positionsOf(nodes, strutLength), [nodes, strutLength])
  const rods = useMemo(
    () => listBuildRods(nodes, positions, visibleStruts, strutLength),
    [nodes, positions, visibleStruts, strutLength],
  )
  const showRods = state.showGuides || state.showEdges
  const icosaCount = countChildrenFromOrigin(nodes, families.fiveFold)
  const dodecaCount = countChildrenFromOrigin(nodes, families.threeFold)

  let status = '点击一根杆，在终点放上同样的球'
  if (icosaCount === 12 && dodecaCount === 20) status = '正二十面体与正十二面体的顶点都已放上'
  else if (icosaCount === 12) status = '正二十面体的 12 个顶点已放上'
  else if (dodecaCount === 20) status = '正十二面体的 20 个顶点已放上'

  return (
    <group position={[0, 0.12, 0]}>
      {state.showNodes && nodes.map((node, index) => (
        <NodeSphere
          key={node.id}
          position={positions[index]}
          radius={nodeRadius}
          color={NODE_COLOR}
          portDirections={state.showPorts ? visibleStruts.map((item) => item.direction) : []}
          portColors={visibleStruts.map((item) => item.color)}
          portRadius={0.024}
        />
      ))}

      {showRods && rods.map((rod) => (
        <Rod
          key={rod.key}
          start={rod.start}
          end={rod.end}
          radius={(rod.occupied ? 0.028 : 0.02) * state.rodScale}
          color={rod.color}
          opacity={rod.occupied ? 0.96 : 0.78}
          endInset={nodeRadius}
          grow={false}
          progress={1}
          interactive={!rod.occupied}
          onSelect={() => setNodes((current) => spawnNode(current, rod.fromId, rod.direction, strutLength))}
        />
      ))}

      {state.showLabels && (
        <Html position={[0, -2.15, 0]} center distanceFactor={8}>
          <div className="formula-card compact interactive">
            <strong>{nodes.length} 个球 · {visibleStruts.length} 个孔</strong>
            <span>{status}</span>
            {nodes.length > 1 && (
              <button type="button" onClick={() => setNodes([ORIGIN_NODE])}>
                只留中心球
              </button>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
