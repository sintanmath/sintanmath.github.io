import { platonicSolids, type PolyhedronData, type SolidId } from './polyhedra'
import {
  centroid,
  cross,
  distance,
  dot,
  lerp,
  normalize,
  scale,
  subtract,
  type Vec3,
} from './vector'

export const dualSolidId: Record<SolidId, SolidId> = {
  tetrahedron: 'tetrahedron',
  cube: 'octahedron',
  octahedron: 'cube',
  dodecahedron: 'icosahedron',
  icosahedron: 'dodecahedron',
}

export interface DualMorph {
  primalFaces: Vec3[][]
  dualFaces: Vec3[][]
  edgeFaces: Vec3[][]
  edges: Array<readonly [Vec3, Vec3]>
  vertices: Vec3[]
  primal: PolyhedronData
  dual: PolyhedronData
}

function neighborLists(solid: PolyhedronData): number[][] {
  const neighbors = solid.vertices.map(() => [] as number[])
  solid.edges.forEach(([start, end]) => {
    neighbors[start].push(end)
    neighbors[end].push(start)
  })
  return neighbors
}

function sortNeighborsCcwFromOutside(
  vertex: Vec3,
  neighborIndices: number[],
  neighborPositions: Vec3[],
): number[] {
  const inward = scale(normalize(vertex), -1)
  const hint: Vec3 = Math.abs(inward[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  const xAxis = normalize(cross(inward, hint))
  const yAxis = cross(inward, xAxis)

  return neighborIndices
    .map((index, order) => {
      const offset = subtract(neighborPositions[order], vertex)
      return { index, angle: Math.atan2(dot(offset, yAxis), dot(offset, xAxis)) }
    })
    .sort((left, right) => left.angle - right.angle)
    .map((item) => item.index)
}

export function facesOf(solid: PolyhedronData): number[][] {
  const neighbors = neighborLists(solid)
  const cycles = solid.vertices.map((vertex, index) => (
    sortNeighborsCcwFromOutside(
      vertex,
      neighbors[index],
      neighbors[index].map((neighbor) => solid.vertices[neighbor]),
    )
  ))

  const used = new Set<string>()
  const faces: number[][] = []
  const directedKey = (start: number, end: number) => `${start}>${end}`

  for (let start = 0; start < solid.vertices.length; start += 1) {
    for (const first of cycles[start]) {
      if (used.has(directedKey(start, first))) continue

      const face = [start]
      let prev = start
      let curr = first
      let steps = 0
      const guard = solid.edges.length + 2

      while (curr !== start && steps < guard) {
        used.add(directedKey(prev, curr))
        face.push(curr)
        const cycle = cycles[curr]
        const incoming = cycle.indexOf(prev)
        const next = cycle[(incoming + 1) % cycle.length]
        prev = curr
        curr = next
        steps += 1
      }

      used.add(directedKey(prev, start))
      if (face.length >= 3) faces.push(face)
    }
  }

  return faces
}

export function faceCentroids(solid: PolyhedronData, faces = facesOf(solid)): Vec3[] {
  return faces.map((face) => centroid(face.map((index) => solid.vertices[index])))
}

export function dualVerticesOf(solid: PolyhedronData, faces = facesOf(solid)): Vec3[] {
  return faceCentroids(solid, faces).map(normalize)
}

function incidentFacesByVertex(solid: PolyhedronData, faces: number[][]): number[][] {
  const neighbors = neighborLists(solid)
  const cycles = solid.vertices.map((vertex, index) => (
    sortNeighborsCcwFromOutside(
      vertex,
      neighbors[index],
      neighbors[index].map((neighbor) => solid.vertices[neighbor]),
    )
  ))

  return solid.vertices.map((_, vertex) => {
    const cycle = cycles[vertex]
    return cycle.map((first, index) => {
      const second = cycle[(index + 1) % cycle.length]
      const faceIndex = faces.findIndex((face) => (
        face.includes(vertex) && face.includes(first) && face.includes(second)
      ))
      return faceIndex
    }).filter((faceIndex) => faceIndex >= 0)
  })
}

function polygonArea(points: Vec3[]): number {
  if (points.length < 3) return 0
  const origin = centroid(points)
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const first = subtract(points[index], origin)
    const second = subtract(points[(index + 1) % points.length], origin)
    area += distance([0, 0, 0], cross(first, second))
  }
  return area * 0.5
}

function isDegenerate(points: Vec3[]): boolean {
  return points.length < 3 || polygonArea(points) < 1e-6
}

function collectEdges(faces: Vec3[][]): Array<readonly [Vec3, Vec3]> {
  const edges: Array<readonly [Vec3, Vec3]> = []
  const seen = new Set<string>()
  const keyOf = (start: Vec3, end: Vec3) => {
    const left = start.map((value) => value.toFixed(5)).join(',')
    const right = end.map((value) => value.toFixed(5)).join(',')
    return left < right ? `${left}|${right}` : `${right}|${left}`
  }

  faces.forEach((face) => {
    face.forEach((start, index) => {
      const end = face[(index + 1) % face.length]
      if (distance(start, end) < 1e-6) return
      const key = keyOf(start, end)
      if (seen.has(key)) return
      seen.add(key)
      edges.push([start, end])
    })
  })

  return edges
}

function uniquePoints(points: Vec3[], epsilon = 1e-3): Vec3[] {
  const unique: Vec3[] = []
  points.forEach((point) => {
    if (unique.every((existing) => distance(existing, point) > epsilon)) {
      unique.push(point)
    }
  })
  return unique
}

export function createDualMorph(solid: PolyhedronData, amount: number): DualMorph {
  const t = Math.min(1, Math.max(0, amount))
  const faces = facesOf(solid)
  const dualVertices = dualVerticesOf(solid, faces)
  const vertexFaces = incidentFacesByVertex(solid, faces)
  const dual = platonicSolids[dualSolidId[solid.id]]

  const pointAt = (vertexIndex: number, faceIndex: number): Vec3 => (
    lerp(solid.vertices[vertexIndex], dualVertices[faceIndex], t)
  )

  const primalFaces = faces
    .map((face, faceIndex) => face.map((vertexIndex) => pointAt(vertexIndex, faceIndex)))
    .filter((face) => !isDegenerate(face))

  const dualFaces = vertexFaces
    .map((faceIndices, vertexIndex) => faceIndices.map((faceIndex) => pointAt(vertexIndex, faceIndex)))
    .filter((face) => !isDegenerate(face))

  const edgeFaces: Vec3[][] = []
  faces.forEach((face, faceIndex) => {
    face.forEach((start, index) => {
      const end = face[(index + 1) % face.length]
      if (start > end) return
      const other = faces.findIndex((candidate, candidateIndex) => (
        candidateIndex !== faceIndex && candidate.includes(start) && candidate.includes(end)
      ))
      if (other < 0) return
      const quad = [
        pointAt(start, faceIndex),
        pointAt(end, faceIndex),
        pointAt(end, other),
        pointAt(start, other),
      ]
      if (!isDegenerate(quad)) edgeFaces.push(quad)
    })
  })

  const interpolating = faces.flatMap((face, faceIndex) => (
    face.map((vertexIndex) => pointAt(vertexIndex, faceIndex))
  ))

  return {
    primalFaces,
    dualFaces,
    edgeFaces,
    edges: collectEdges([...primalFaces, ...dualFaces]),
    vertices: uniquePoints(interpolating),
    primal: solid,
    dual,
  }
}

export function samePointSet(first: Vec3[], second: Vec3[], epsilon = 1e-6): boolean {
  if (first.length !== second.length) return false
  const used = new Set<number>()
  return first.every((point) => {
    const match = second.findIndex((candidate, index) => (
      !used.has(index) && distance(normalize(point), normalize(candidate)) <= epsilon
    ))
    if (match < 0) return false
    used.add(match)
    return true
  })
}
