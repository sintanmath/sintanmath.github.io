import { distance, normalize, type Edge, type Vec3 } from './vector'

export type SolidId = 'tetrahedron' | 'cube' | 'octahedron' | 'dodecahedron' | 'icosahedron'

export interface PolyhedronData {
  id: SolidId
  name: string
  englishName: string
  vertices: Vec3[]
  edges: Edge[]
  faceCount: number
  vertexDegree: number
}

export type TriangleFace = readonly [number, number, number]

const PHI = (1 + Math.sqrt(5)) / 2
const INV_PHI = 1 / PHI

function signedPermutations(values: Vec3): Vec3[] {
  const output = new Map<string, Vec3>()
  for (const xSign of [-1, 1]) {
    for (const ySign of [-1, 1]) {
      for (const zSign of [-1, 1]) {
        const vertex: Vec3 = [
          values[0] * xSign,
          values[1] * ySign,
          values[2] * zSign,
        ]
        output.set(vertex.join(','), vertex)
      }
    }
  }
  return [...output.values()]
}

export function edgesAtMinimumDistance(vertices: Vec3[]): Edge[] {
  let minimum = Number.POSITIVE_INFINITY
  const pairs: Array<{ edge: Edge; distance: number }> = []

  for (let start = 0; start < vertices.length; start += 1) {
    for (let end = start + 1; end < vertices.length; end += 1) {
      const pairDistance = distance(vertices[start], vertices[end])
      if (pairDistance < minimum) minimum = pairDistance
      pairs.push({ edge: [start, end], distance: pairDistance })
    }
  }

  const tolerance = minimum * 1e-5
  return pairs
    .filter((pair) => Math.abs(pair.distance - minimum) <= tolerance)
    .map((pair) => pair.edge)
}

function normalized(vertices: Vec3[]): Vec3[] {
  return vertices.map(normalize)
}

const tetrahedronVertices: Vec3[] = normalized([
  [1, 1, 1],
  [-1, -1, 1],
  [-1, 1, -1],
  [1, -1, -1],
])

const cubeVertices: Vec3[] = normalized(signedPermutations([1, 1, 1]))

const octahedronVertices: Vec3[] = normalized([
  [1, 0, 0], [-1, 0, 0],
  [0, 1, 0], [0, -1, 0],
  [0, 0, 1], [0, 0, -1],
])

const dodecahedronVertices: Vec3[] = normalized([
  ...signedPermutations([1, 1, 1]),
  ...signedPermutations([0, INV_PHI, PHI]),
  ...signedPermutations([INV_PHI, PHI, 0]),
  ...signedPermutations([PHI, 0, INV_PHI]),
])

const icosahedronVertices: Vec3[] = normalized([
  [0, -1, -PHI], [0, -1, PHI], [0, 1, -PHI], [0, 1, PHI],
  [-1, -PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [1, PHI, 0],
  [-PHI, 0, -1], [PHI, 0, -1], [-PHI, 0, 1], [PHI, 0, 1],
])

function createSolid(
  id: SolidId,
  name: string,
  englishName: string,
  vertices: Vec3[],
  faceCount: number,
  vertexDegree: number,
): PolyhedronData {
  return {
    id,
    name,
    englishName,
    vertices,
    edges: edgesAtMinimumDistance(vertices),
    faceCount,
    vertexDegree,
  }
}

export const platonicSolids: Record<SolidId, PolyhedronData> = {
  tetrahedron: createSolid('tetrahedron', '正四面体', 'Tetrahedron', tetrahedronVertices, 4, 3),
  cube: createSolid('cube', '正六面体', 'Cube', cubeVertices, 6, 3),
  octahedron: createSolid('octahedron', '正八面体', 'Octahedron', octahedronVertices, 8, 4),
  dodecahedron: createSolid('dodecahedron', '正十二面体', 'Dodecahedron', dodecahedronVertices, 12, 3),
  icosahedron: createSolid('icosahedron', '正二十面体', 'Icosahedron', icosahedronVertices, 20, 5),
}

export const solidOrder: SolidId[] = [
  'tetrahedron',
  'cube',
  'octahedron',
  'dodecahedron',
  'icosahedron',
]

export function degreesFor(solid: PolyhedronData): number[] {
  const degrees = Array.from({ length: solid.vertices.length }, () => 0)
  solid.edges.forEach(([start, end]) => {
    degrees[start] += 1
    degrees[end] += 1
  })
  return degrees
}

export function neighborsOf(solid: PolyhedronData, vertexIndex: number): number[] {
  return solid.edges.flatMap(([start, end]) => {
    if (start === vertexIndex) return [end]
    if (end === vertexIndex) return [start]
    return []
  })
}

export function triangularFacesOf(solid: PolyhedronData): TriangleFace[] {
  const edgeKeys = new Set(solid.edges.map(([start, end]) => `${Math.min(start, end)}-${Math.max(start, end)}`))
  const hasEdge = (start: number, end: number) => edgeKeys.has(`${Math.min(start, end)}-${Math.max(start, end)}`)
  const faces: TriangleFace[] = []

  for (let first = 0; first < solid.vertices.length; first += 1) {
    for (let second = first + 1; second < solid.vertices.length; second += 1) {
      for (let third = second + 1; third < solid.vertices.length; third += 1) {
        if (hasEdge(first, second) && hasEdge(second, third) && hasEdge(first, third)) {
          faces.push([first, second, third])
        }
      }
    }
  }

  return faces
}
