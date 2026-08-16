import { add, distance, scale, type Vec3 } from './vector'

export interface PlacedNode {
  id: number
  parentId: number | null
  direction: Vec3 | null
}

export interface VisibleStrut {
  direction: Vec3
  color: string
  family: string
  index: number
}

export interface BuildRod {
  key: string
  start: Vec3
  end: Vec3
  fromId: number
  direction: Vec3
  color: string
  occupied: boolean
}

export const ORIGIN_NODE: PlacedNode = { id: 0, parentId: null, direction: null }

const POSITION_EPSILON = 0.05

export function positionsOf(nodes: readonly PlacedNode[], strutLength: number): Vec3[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const cache = new Map<number, Vec3>()

  const positionOf = (id: number): Vec3 => {
    const cached = cache.get(id)
    if (cached) return cached
    const node = byId.get(id)
    if (!node || node.parentId === null || node.direction === null) {
      const origin: Vec3 = [0, 0, 0]
      cache.set(id, origin)
      return origin
    }
    const point = add(positionOf(node.parentId), scale(node.direction, strutLength))
    cache.set(id, point)
    return point
  }

  return nodes.map((node) => positionOf(node.id))
}

export function findNodeAt(positions: readonly Vec3[], point: Vec3, strutLength: number): number | null {
  const epsilon = Math.max(1e-4, strutLength * POSITION_EPSILON)
  const index = positions.findIndex((candidate) => distance(candidate, point) < epsilon)
  return index === -1 ? null : index
}

export function spawnNode(
  nodes: readonly PlacedNode[],
  fromId: number,
  direction: Vec3,
  strutLength: number,
): PlacedNode[] {
  if (strutLength < 1e-4 || nodes.length >= 80) return [...nodes]
  const positions = positionsOf(nodes, strutLength)
  const fromIndex = nodes.findIndex((node) => node.id === fromId)
  if (fromIndex < 0) return [...nodes]
  const end = add(positions[fromIndex], scale(direction, strutLength))
  if (findNodeAt(positions, end, strutLength) !== null) return [...nodes]
  const nextId = nodes.reduce((max, node) => Math.max(max, node.id), 0) + 1
  return [...nodes, { id: nextId, parentId: fromId, direction }]
}

export function listBuildRods(
  nodes: readonly PlacedNode[],
  positions: readonly Vec3[],
  struts: readonly VisibleStrut[],
  strutLength: number,
): BuildRod[] {
  if (strutLength < 1e-4) return []
  const rods: BuildRod[] = []
  const seenOccupied = new Set<string>()
  const idOf = (index: number) => nodes[index].id

  nodes.forEach((node, index) => {
    const start = positions[index]
    struts.forEach((strut) => {
      const end = add(start, scale(strut.direction, strutLength))
      const hit = findNodeAt(positions, end, strutLength)
      if (hit !== null && idOf(hit) !== node.id) {
        const low = Math.min(node.id, idOf(hit))
        const high = Math.max(node.id, idOf(hit))
        const key = `edge-${low}-${high}`
        if (seenOccupied.has(key)) return
        seenOccupied.add(key)
        rods.push({
          key,
          start,
          end: positions[hit],
          fromId: node.id,
          direction: strut.direction,
          color: strut.color,
          occupied: true,
        })
        return
      }
      if (hit !== null) return
      rods.push({
        key: `free-${node.id}-${strut.family}-${strut.index}`,
        start,
        end,
        fromId: node.id,
        direction: strut.direction,
        color: strut.color,
        occupied: false,
      })
    })
  })

  return rods
}

export function countChildrenFromOrigin(
  nodes: readonly PlacedNode[],
  family: readonly Vec3[],
): number {
  return nodes.filter((node) => {
    if (node.parentId !== 0 || node.direction === null) return false
    const grown = node.direction
    return family.some((direction) => distance(direction, grown) < 1e-5)
  }).length
}
