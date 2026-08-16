import type { SolidId } from './geometry/polyhedra'

export interface WorkbenchState {
  showFaces: boolean
  showEdges: boolean
  showNodes: boolean
  showLabels: boolean
  showPorts: boolean
  showGuides: boolean
  autoRotate: boolean
  orthographic: boolean
  assembly: number
  explode: number
  nodeScale: number
  rodScale: number
  pentagonPortScale: number
  trianglePortScale: number
  rectanglePortScale: number
  pentagonPortRotation: number
  trianglePortRotation: number
  rectanglePortRotation: number
  selectedSolid: SolidId
  showFiveFold: boolean
  showThreeFold: boolean
  showTwoFold: boolean
}

export const defaultWorkbenchState: WorkbenchState = {
  showFaces: true,
  showEdges: true,
  showNodes: true,
  showLabels: false,
  showPorts: true,
  showGuides: true,
  autoRotate: false,
  orthographic: false,
  assembly: 1,
  explode: 0,
  nodeScale: 1,
  rodScale: 1,
  pentagonPortScale: 1,
  trianglePortScale: 1,
  rectanglePortScale: 1,
  pentagonPortRotation: 0,
  trianglePortRotation: 0,
  rectanglePortRotation: 0,
  selectedSolid: 'icosahedron',
  showFiveFold: true,
  showThreeFold: true,
  showTwoFold: true,
}

export type StateSetter = <K extends keyof WorkbenchState>(
  key: K,
  value: WorkbenchState[K],
) => void
