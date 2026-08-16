import { neighborsOf, platonicSolids, type PolyhedronData } from './polyhedra'
import { add, cross, dot, normalize, scale, subtract, type Edge, type Vec3 } from './vector'

export type AssemblyNodePart = {
  kind: 'node'
  vertex: number
}

export type AssemblyRodPart = {
  kind: 'rod'
  start: number
  end: number
}

export type AssemblyPart = AssemblyNodePart | AssemblyRodPart

export interface BallStickAssembly {
  origin: number
  parts: AssemblyPart[]
}

export interface AssembledRod {
  start: number
  end: number
}

export interface AssemblyVisibility {
  nodes: Set<number>
  rods: AssembledRod[]
  visibleCount: number
  totalCount: number
  latest: AssemblyPart | null
}

function edgeKey(start: number, end: number): string {
  return start < end ? `${start}-${end}` : `${end}-${start}`
}

function rotateAroundAxis(point: Vec3, axis: Vec3, angle: number): Vec3 {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return add(
    add(scale(point, cosine), scale(cross(axis, point), sine)),
    scale(axis, dot(axis, point) * (1 - cosine)),
  )
}

function rotatePointsToAxis(points: readonly Vec3[], from: Vec3, to: Vec3): Vec3[] {
  const source = normalize(from)
  const target = normalize(to)
  const cosine = Math.min(1, Math.max(-1, dot(source, target)))

  if (cosine > 1 - 1e-10) return points.map((point) => [...point] as Vec3)
  if (cosine < -1 + 1e-10) {
    const helper: Vec3 = Math.abs(source[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
    const axis = normalize(cross(source, helper))
    return points.map((point) => rotateAroundAxis(point, axis, Math.PI))
  }

  const axis = normalize(cross(source, target))
  return points.map((point) => rotateAroundAxis(point, axis, Math.acos(cosine)))
}

export function sortNeighborsAround(solid: PolyhedronData, vertexIndex: number): number[] {
  const origin = solid.vertices[vertexIndex]
  const radial = normalize(origin)
  const neighbors = neighborsOf(solid, vertexIndex)
  if (neighbors.length <= 1) return neighbors

  const helper: Vec3 = Math.abs(radial[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const tangent = normalize(cross(helper, radial))
  const bitangent = cross(radial, tangent)

  return neighbors
    .map((index) => {
      const offset = subtract(solid.vertices[index], origin)
      const projected = subtract(offset, scale(radial, dot(offset, radial)))
      return {
        index,
        angle: Math.atan2(dot(projected, bitangent), dot(projected, tangent)),
      }
    })
    .sort((left, right) => left.angle - right.angle)
    .map((item) => item.index)
}

export function orientAssemblyVertices(
  vertices: readonly Vec3[],
  poleIndex: number,
  frontIndex: number,
): Vec3[] {
  const poleUp = rotatePointsToAxis(vertices, vertices[poleIndex], [0, 1, 0])
  const front = poleUp[frontIndex]
  const yaw = Math.atan2(front[0], front[2])
  const cosine = Math.cos(-yaw)
  const sine = Math.sin(-yaw)
  return poleUp.map(([x, y, z]) => [x * cosine - z * sine, y, x * sine + z * cosine])
}

export function ballStickAssembly(
  solid: PolyhedronData,
  origin = 0,
): BallStickAssembly {
  const neighborLists = solid.vertices.map((_, vertexIndex) => sortNeighborsAround(solid, vertexIndex))
  const knownEdges = new Set(solid.edges.map(([start, end]) => edgeKey(start, end)))
  const placed = new Set<number>([origin])
  const built = new Set<string>()
  const placementOrder = [origin]
  const parts: AssemblyPart[] = [{ kind: 'node', vertex: origin }]

  const completesTriangle = (start: number, end: number) => (
    [...placed].some((third) => {
      if (third === start || third === end) return false
      const first = edgeKey(start, third)
      const second = edgeKey(end, third)
      return built.has(first) && built.has(second) && knownEdges.has(first) && knownEdges.has(second)
    })
  )

  const addRod = (start: number, end: number) => {
    parts.push({ kind: 'rod', start, end })
    built.add(edgeKey(start, end))
  }

  while (built.size < solid.edges.length) {
    const unused = solid.edges.filter(([start, end]) => !built.has(edgeKey(start, end)))
    const closing = unused.filter(([start, end]) => placed.has(start) && placed.has(end))

    if (closing.length > 0) {
      const latest = placementOrder[placementOrder.length - 1]
      closing.sort((left, right) => {
        const triangleRank = Number(completesTriangle(right[0], right[1])) - Number(completesTriangle(left[0], left[1]))
        if (triangleRank !== 0) return triangleRank
        const nearLeft = Number(left[0] === latest || left[1] === latest)
        const nearRight = Number(right[0] === latest || right[1] === latest)
        return nearRight - nearLeft
      })
      const [start, end] = closing[0]
      const startOrder = placementOrder.indexOf(start)
      const endOrder = placementOrder.indexOf(end)
      if (startOrder <= endOrder) addRod(start, end)
      else addRod(end, start)
      continue
    }

    let extension: Edge | undefined
    for (const vertex of placementOrder) {
      const nextNeighbor = neighborLists[vertex].find((neighbor) => (
        !placed.has(neighbor) && knownEdges.has(edgeKey(vertex, neighbor))
      ))
      if (nextNeighbor !== undefined) {
        extension = [vertex, nextNeighbor]
        break
      }
    }

    if (!extension) {
      const fallback = unused.find(([start, end]) => placed.has(start) !== placed.has(end))
      if (!fallback) break
      extension = placed.has(fallback[0]) ? fallback : [fallback[1], fallback[0]]
    }

    const [start, end] = extension
    addRod(start, end)
    parts.push({ kind: 'node', vertex: end })
    placed.add(end)
    placementOrder.push(end)
  }

  return { origin, parts }
}

export function icosahedronBallStickAssembly(origin = 0): BallStickAssembly {
  return ballStickAssembly(platonicSolids.icosahedron, origin)
}

export const icosahedronAssembly = icosahedronBallStickAssembly()

export function assemblySliderMax(partCount: number): number {
  return Math.max(0, partCount - 1)
}

export function assemblySliderIndex(assembly: number, partCount: number): number {
  const maxIndex = assemblySliderMax(partCount)
  if (maxIndex <= 0) return 0
  return Math.round(Math.min(1, Math.max(0, assembly)) * maxIndex)
}

export function snapAssemblyProgress(assembly: number, partCount: number): number {
  const maxIndex = assemblySliderMax(partCount)
  if (maxIndex <= 0) return assembly > 0 ? 1 : 0
  return assemblySliderIndex(assembly, partCount) / maxIndex
}

export function visiblePartCount(partCount: number, assembly: number): number {
  if (partCount <= 0) return 0
  if (partCount === 1) return 1
  return assemblySliderIndex(assembly, partCount) + 1
}

export function assemblyVisibility(parts: readonly AssemblyPart[], assembly: number): AssemblyVisibility {
  const seed = parts[0]
  if (!seed || seed.kind !== 'node') {
    return { nodes: new Set(), rods: [], visibleCount: 0, totalCount: 0, latest: null }
  }

  const totalCount = parts.length
  const visibleCount = visiblePartCount(totalCount, assembly)
  const visibleParts = parts.slice(0, visibleCount)
  const nodes = new Set<number>()
  const rods: AssembledRod[] = []

  visibleParts.forEach((part) => {
    if (part.kind === 'node') nodes.add(part.vertex)
    else rods.push({ start: part.start, end: part.end })
  })

  return {
    nodes,
    rods,
    visibleCount,
    totalCount,
    latest: visibleParts[visibleParts.length - 1] ?? null,
  }
}
