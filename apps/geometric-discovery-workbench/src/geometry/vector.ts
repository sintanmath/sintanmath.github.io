export type Vec3 = readonly [number, number, number]
export type Edge = readonly [number, number]

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return add(scale(a, 1 - t), scale(b, t))
}

export function centroid(points: readonly Vec3[]): Vec3 {
  if (points.length === 0) return [0, 0, 0]
  return scale(points.reduce<Vec3>(([x, y, z], point) => (
    [x + point[0], y + point[1], z + point[2]]
  ), [0, 0, 0]), 1 / points.length)
}

export function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function scale(v: Vec3, amount: number): Vec3 {
  return [v[0] * amount, v[1] * amount, v[2] * amount]
}

export function length(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2])
}

export function distance(a: Vec3, b: Vec3): number {
  return length(subtract(a, b))
}

export function normalize(v: Vec3): Vec3 {
  const magnitude = length(v)
  if (magnitude === 0) return [0, 0, 0]
  return scale(v, 1 / magnitude)
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function angleDegrees(a: Vec3, b: Vec3): number {
  const cosine = Math.min(1, Math.max(-1, dot(normalize(a), normalize(b))))
  return (Math.acos(cosine) * 180) / Math.PI
}

export function midpoint(a: Vec3, b: Vec3): Vec3 {
  return scale(add(a, b), 0.5)
}

export function radialScale(v: Vec3, amount: number): Vec3 {
  return scale(normalize(v), amount)
}
