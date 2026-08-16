import { describe, expect, it } from 'vitest'
import { createDirectionFamilies, icosahedralVertexDirections, orthogonalDirections } from './directions'
import {
  createDualMorph,
  dualSolidId,
  dualVerticesOf,
  facesOf,
  samePointSet,
} from './duality'
import {
  degreesFor,
  edgesAtMinimumDistance,
  platonicSolids,
  solidOrder,
  triangularFacesOf,
  type PolyhedronData,
  type SolidId,
} from './polyhedra'
import { angleDegrees, dot, normalize, subtract, type Vec3 } from './vector'
import {
  createZomeToolFaceFamilies,
  supportFaceEdgeTangent,
  zomeToolBodyEdges,
  zomeToolBodyVertices,
} from './zometool'

describe('Platonic solid topology', () => {
  const expected = {
    tetrahedron: { vertices: 4, edges: 6, degree: 3 },
    cube: { vertices: 8, edges: 12, degree: 3 },
    octahedron: { vertices: 6, edges: 12, degree: 4 },
    dodecahedron: { vertices: 20, edges: 30, degree: 3 },
    icosahedron: { vertices: 12, edges: 30, degree: 5 },
  } as const

  solidOrder.forEach((id) => {
    it(`builds the ${id} topology`, () => {
      const solid = platonicSolids[id]
      expect(solid.vertices).toHaveLength(expected[id].vertices)
      expect(solid.edges).toHaveLength(expected[id].edges)
      expect(degreesFor(solid)).toEqual(
        Array.from({ length: expected[id].vertices }, () => expected[id].degree),
      )
    })
  })
})

describe('Platonic duality', () => {
  const expectedFaces = {
    tetrahedron: { count: 4, sides: 3 },
    cube: { count: 6, sides: 4 },
    octahedron: { count: 8, sides: 3 },
    dodecahedron: { count: 12, sides: 5 },
    icosahedron: { count: 20, sides: 3 },
  } as const

  solidOrder.forEach((id) => {
    it(`reads ${id} faces from the spherical link`, () => {
      const faces = facesOf(platonicSolids[id])
      expect(faces).toHaveLength(expectedFaces[id].count)
      expect(faces.every((face) => face.length === expectedFaces[id].sides)).toBe(true)
    })
  })

  it('agrees with the triangle walk on the icosahedron', () => {
    const solid = platonicSolids.icosahedron
    const triangles = new Set(triangularFacesOf(solid).map((face) => [...face].sort().join('-')))
    const faces = new Set(facesOf(solid).map((face) => [...face].sort().join('-')))
    expect(faces).toEqual(triangles)
  })

  it('places cube face centers on the octahedron vertices', () => {
    expect(samePointSet(dualVerticesOf(platonicSolids.cube), platonicSolids.octahedron.vertices)).toBe(true)
    expect(samePointSet(dualVerticesOf(platonicSolids.octahedron), platonicSolids.cube.vertices)).toBe(true)
  })

  it('recovers a solid from the dual of its dual', () => {
    const fromVertices = (
      id: SolidId,
      vertices: Vec3[],
      faceCount: number,
      vertexDegree: number,
    ): PolyhedronData => ({
      id,
      name: id,
      englishName: id,
      vertices,
      edges: edgesAtMinimumDistance(vertices),
      faceCount,
      vertexDegree,
    })

    const icosa = platonicSolids.icosahedron
    const dodeca = platonicSolids.dodecahedron
    const icosaPolar = fromVertices('dodecahedron', dualVerticesOf(icosa), 12, 3)
    const dodecaPolar = fromVertices('icosahedron', dualVerticesOf(dodeca), 20, 5)

    expect(icosaPolar.edges).toHaveLength(30)
    expect(dodecaPolar.edges).toHaveLength(30)
    expect(samePointSet(dualVerticesOf(icosaPolar), icosa.vertices)).toBe(true)
    expect(samePointSet(dualVerticesOf(dodecaPolar), dodeca.vertices)).toBe(true)
  })

  it('sends the tetrahedron to the opposite tetrahedron', () => {
    const solid = platonicSolids.tetrahedron
    const dualVertices = dualVerticesOf(solid)
    expect(samePointSet(dualVertices, solid.vertices.map(([x, y, z]) => [-x, -y, -z]))).toBe(true)
  })

  it('expands a cube into the rhombicuboctahedral mid-shape', () => {
    const morph = createDualMorph(platonicSolids.cube, 0.5)
    expect(morph.vertices).toHaveLength(24)
    expect(morph.primalFaces).toHaveLength(6)
    expect(morph.dualFaces).toHaveLength(8)
    expect(morph.edgeFaces).toHaveLength(12)
    expect(morph.edges).toHaveLength(48)
    expect(morph.dual.id).toBe(dualSolidId.cube)
  })

  it('starts at the primal and ends at the dual', () => {
    const start = createDualMorph(platonicSolids.dodecahedron, 0)
    const end = createDualMorph(platonicSolids.dodecahedron, 1)
    expect(start.primalFaces).toHaveLength(12)
    expect(start.dualFaces).toHaveLength(0)
    expect(start.vertices).toHaveLength(20)
    expect(end.primalFaces).toHaveLength(0)
    expect(end.dualFaces).toHaveLength(20)
    expect(end.vertices).toHaveLength(12)
    expect(end.dual.id).toBe('icosahedron')
  })
})

describe('connector directions', () => {
  it('uses six paired orthogonal ports', () => {
    expect(orthogonalDirections).toHaveLength(6)
    orthogonalDirections.forEach((direction) => {
      expect(orthogonalDirections.some((candidate) => dot(direction, candidate) === -1)).toBe(true)
    })
  })

  it('finds five incident directions at an icosahedron vertex', () => {
    const directions = icosahedralVertexDirections()
    expect(directions).toHaveLength(5)
    const angles = directions.flatMap((first, index) => (
      directions.slice(index + 1).map((second) => angleDegrees(first, second))
    ))
    expect(Math.min(...angles)).toBeCloseTo(60, 5)
  })

  it('builds the 62-direction family used by the final node', () => {
    const families = createDirectionFamilies()
    expect(families.fiveFold).toHaveLength(12)
    expect(families.threeFold).toHaveLength(20)
    expect(families.twoFold).toHaveLength(30)
    expect(
      families.fiveFold.length + families.threeFold.length + families.twoFold.length,
    ).toBe(62)
  })

  it('maps ZomeTool direction families to the icosahedron', () => {
    const solid = platonicSolids.icosahedron
    const faces = triangularFacesOf(solid)
    const families = createDirectionFamilies()

    expect(faces).toHaveLength(20)
    expect(families.fiveFold).toHaveLength(solid.vertices.length)
    expect(families.threeFold).toHaveLength(faces.length)
    expect(families.twoFold).toHaveLength(solid.edges.length)
  })
})

describe('physical ZomeTool node body', () => {
  it('builds the rhombicosidodecahedral shell', () => {
    expect(zomeToolBodyVertices).toHaveLength(60)
    expect(zomeToolBodyEdges).toHaveLength(120)
  })

  it('places each socket family on the matching polygon face', () => {
    const faces = createZomeToolFaceFamilies()
    expect(faces.pentagons).toHaveLength(12)
    expect(faces.triangles).toHaveLength(20)
    expect(faces.rectangles).toHaveLength(30)
    expect(faces.pentagons.every((face) => face.vertexIndices.length === 5)).toBe(true)
    expect(faces.triangles.every((face) => face.vertexIndices.length === 3)).toBe(true)
    expect(faces.rectangles.every((face) => face.vertexIndices.length === 4)).toBe(true)
  })

  it('orients every rectangular socket along a real face edge', () => {
    const { rectangles } = createZomeToolFaceFamilies()

    rectangles.forEach((face) => {
      const tangent = supportFaceEdgeTangent(face)
      expect(Math.abs(dot(tangent, face.direction))).toBeLessThan(1e-8)

      const faceVertices = new Set(face.vertexIndices)
      const isParallelToBoundary = zomeToolBodyEdges
        .filter(([start, end]) => faceVertices.has(start) && faceVertices.has(end))
        .some(([start, end]) => {
          const edgeDirection = normalize(subtract(
            zomeToolBodyVertices[end],
            zomeToolBodyVertices[start],
          ))
          return Math.abs(dot(tangent, edgeDirection)) > 1 - 1e-8
        })

      expect(isParallelToBoundary).toBe(true)
    })
  })
})
