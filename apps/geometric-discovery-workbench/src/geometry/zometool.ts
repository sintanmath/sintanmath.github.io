import { edgesAtMinimumDistance } from './polyhedra'
import { dot, normalize, subtract, type Edge, type Vec3 } from './vector'

const PHI = (1 + Math.sqrt(5)) / 2

function coordinateKey(vertex: Vec3): string {
  return vertex.map((value) => Math.abs(value) < 1e-10 ? '0' : value.toFixed(10)).join(',')
}

function signedEvenPermutations(values: Vec3): Vec3[] {
  const output = new Map<string, Vec3>()
  const cyclicPermutations: Vec3[] = [
    [values[0], values[1], values[2]],
    [values[2], values[0], values[1]],
    [values[1], values[2], values[0]],
  ]

  cyclicPermutations.forEach((permutation) => {
    for (const xSign of [-1, 1]) {
      for (const ySign of [-1, 1]) {
        for (const zSign of [-1, 1]) {
          const vertex: Vec3 = [
            permutation[0] * xSign,
            permutation[1] * ySign,
            permutation[2] * zSign,
          ]
          output.set(coordinateKey(vertex), vertex)
        }
      }
    }
  })

  return [...output.values()]
}

const rawVertices: Vec3[] = [
  ...signedEvenPermutations([1, 1, PHI ** 3]),
  ...signedEvenPermutations([PHI ** 2, PHI, 2 * PHI]),
  ...signedEvenPermutations([2 + PHI, 0, PHI ** 2]),
]

export const zomeToolBodyVertices: Vec3[] = rawVertices.map(normalize)
export const zomeToolBodyEdges: Edge[] = edgesAtMinimumDistance(zomeToolBodyVertices)

export interface SupportFace {
  direction: Vec3
  distance: number
  vertexIndices: number[]
}

export function supportFaceEdgeTangent(face: SupportFace): Vec3 {
  const faceVertices = new Set(face.vertexIndices)
  const boundaryEdge = zomeToolBodyEdges.find(([start, end]) => (
    faceVertices.has(start) && faceVertices.has(end)
  ))

  if (!boundaryEdge) {
    throw new Error('Support face has no boundary edge.')
  }

  return normalize(subtract(
    zomeToolBodyVertices[boundaryEdge[1]],
    zomeToolBodyVertices[boundaryEdge[0]],
  ))
}

function cross(first: Vec3, second: Vec3): Vec3 {
  return [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0],
  ]
}

function discoverSupportFaces(tolerance = 1e-5): SupportFace[] {
  const faces = new Map<string, SupportFace>()

  for (let first = 0; first < zomeToolBodyVertices.length; first += 1) {
    for (let second = first + 1; second < zomeToolBodyVertices.length; second += 1) {
      for (let third = second + 1; third < zomeToolBodyVertices.length; third += 1) {
        const origin = zomeToolBodyVertices[first]
        let direction = normalize(cross(
          subtract(zomeToolBodyVertices[second], origin),
          subtract(zomeToolBodyVertices[third], origin),
        ))
        if (direction[0] === 0 && direction[1] === 0 && direction[2] === 0) continue

        let projections = zomeToolBodyVertices.map((vertex) => dot(vertex, direction))
        let planeDistance = projections[first]
        const maximum = Math.max(...projections)
        const minimum = Math.min(...projections)
        const isMaximumSupport = Math.abs(maximum - planeDistance) <= tolerance
        const isMinimumSupport = Math.abs(minimum - planeDistance) <= tolerance
        if (!isMaximumSupport && !isMinimumSupport) continue

        if (isMinimumSupport) {
          direction = [-direction[0], -direction[1], -direction[2]]
          projections = projections.map((value) => -value)
          planeDistance = -planeDistance
        }

        const vertexIndices = projections.flatMap((projection, index) => (
          Math.abs(projection - planeDistance) <= tolerance ? [index] : []
        ))
        if (vertexIndices.length < 3) continue
        const key = vertexIndices.join('-')
        faces.set(key, { direction, distance: planeDistance, vertexIndices })
      }
    }
  }

  return [...faces.values()]
}

export interface ZomeToolFaceFamilies {
  pentagons: SupportFace[]
  triangles: SupportFace[]
  rectangles: SupportFace[]
}

const discoveredFaces = discoverSupportFaces()

export function createZomeToolFaceFamilies(): ZomeToolFaceFamilies {
  return {
    pentagons: discoveredFaces.filter((face) => face.vertexIndices.length === 5),
    triangles: discoveredFaces.filter((face) => face.vertexIndices.length === 3),
    rectangles: discoveredFaces.filter((face) => face.vertexIndices.length === 4),
  }
}
