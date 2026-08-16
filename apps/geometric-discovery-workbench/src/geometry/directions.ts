import { neighborsOf, platonicSolids, triangularFacesOf } from './polyhedra'
import { add, midpoint, normalize, subtract, type Vec3 } from './vector'

export const orthogonalDirections: Vec3[] = [
  [1, 0, 0], [-1, 0, 0],
  [0, 1, 0], [0, -1, 0],
  [0, 0, 1], [0, 0, -1],
]

export function icosahedralVertexDirections(vertexIndex = 0): Vec3[] {
  const solid = platonicSolids.icosahedron
  const origin = solid.vertices[vertexIndex]
  return neighborsOf(solid, vertexIndex).map((neighborIndex) => (
    normalize(subtract(solid.vertices[neighborIndex], origin))
  ))
}

export interface DirectionFamilies {
  fiveFold: Vec3[]
  threeFold: Vec3[]
  twoFold: Vec3[]
}

export function createDirectionFamilies(): DirectionFamilies {
  const icosahedron = platonicSolids.icosahedron
  const faces = triangularFacesOf(icosahedron)

  return {
    fiveFold: icosahedron.vertices.map(normalize),
    threeFold: faces.map(([first, second, third]) => (
      normalize(add(add(icosahedron.vertices[first], icosahedron.vertices[second]), icosahedron.vertices[third]))
    )),
    twoFold: icosahedron.edges.map(([start, end]) => (
      normalize(midpoint(icosahedron.vertices[start], icosahedron.vertices[end]))
    )),
  }
}
