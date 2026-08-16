import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { NodeSphere } from '../components/three/NodeSphere'
import { Rod } from '../components/three/Rod'
import { createDirectionFamilies } from '../geometry/directions'
import { scale, type Vec3 } from '../geometry/vector'
import type { WorkbenchState } from '../types'

interface VisibleDirection {
  direction: Vec3
  color: string
  family: string
}

export function DirectionNodeScene({ state }: { state: WorkbenchState }) {
  const families = useMemo(createDirectionFamilies, [])
  const visibleDirections = useMemo(() => {
    const output: VisibleDirection[] = []
    if (state.showFiveFold) {
      output.push(...families.fiveFold.map((direction) => ({ direction, color: '#b84e3a', family: '5' })))
    }
    if (state.showThreeFold) {
      output.push(...families.threeFold.map((direction) => ({ direction, color: '#b18a31', family: '3' })))
    }
    if (state.showTwoFold) {
      output.push(...families.twoFold.map((direction) => ({ direction, color: '#3e7187', family: '2' })))
    }
    return output
  }, [families, state.showFiveFold, state.showThreeFold, state.showTwoFold])

  return (
    <group position={[0, 0.15, 0]}>
      <NodeSphere
        radius={1.25 * state.nodeScale}
        color="#e8e2d2"
        portDirections={state.showPorts ? visibleDirections.map((item) => item.direction) : []}
        portColors={visibleDirections.map((item) => item.color)}
        portRadius={0.045}
      />

      {state.showGuides && visibleDirections.map(({ direction, color, family }, index) => (
        <Rod
          key={`${family}-${index}`}
          start={scale(direction, 1.28 * state.nodeScale)}
          end={scale(direction, 1.28 * state.nodeScale + 0.72)}
          radius={0.018 * state.rodScale}
          color={color}
          opacity={0.78}
          progress={state.assembly}
        />
      ))}

      {state.showLabels && (
        <Html position={[0, -1.82, 0]} center distanceFactor={8}>
          <div className="formula-card compact direction-total">
            <strong>{visibleDirections.length} 个可见孔位</strong>
            <span>12 + 20 + 30 = 62</span>
          </div>
        </Html>
      )}
    </group>
  )
}
