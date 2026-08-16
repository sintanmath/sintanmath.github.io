# Lifelike ZomeTool Node Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Replace the abstract spherical 62-port diagram with a freely rotatable product-like ZomeTool node whose body and port layout visibly match the physical connector.

**Architecture:** Generate the 60 vertices of a rhombicosidodecahedron from exact golden-ratio coordinate families, then use its convex hull as the node body. Calculate each face plane from the 12 vertex, 20 face-center, and 30 edge-midpoint normals so every shaped socket sits on a real pentagonal, triangular, or rectangular face. Geometry correspondence remains an optional overlay rather than the default view.

**Tech Stack:** TypeScript, Three.js ConvexGeometry/ExtrudeGeometry, React Three Fiber, Vitest.

---

### Task 1: Add the physical-node geometry core

**Files:**
- Create: `src/geometry/zometool.ts`
- Modify: `src/geometry/geometry.test.ts`

**Steps:**
1. Generate the 60 golden-ratio coordinate vertices using even permutations.
2. Derive minimum-distance edges and verify 120 edges.
3. For all 62 direction normals, find the support face and verify 12 five-vertex, 20 three-vertex, and 30 four-vertex faces.
4. Run `npm test`; expect the new topology tests to pass.

### Task 2: Replace the sphere with a product body

**Files:**
- Modify: `src/components/three/ShapedPortNode.tsx`

**Steps:**
1. Replace `sphereGeometry` with a convex hull built from the 60 exact vertices.
2. Position every socket on its actual face plane rather than on a common spherical radius.
3. Render a cream ABS-like body with subtle faceting and soft specular response.
4. Change the socket geometry from flat decals to extruded dark cavities with a raised cream shoulder.

### Task 3: Make product observation the default

**Files:**
- Modify: `src/scenes/ZomeToolNodeScene.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/ui/CompactControls.tsx`

**Steps:**
1. Enlarge and isolate the physical node by default.
2. Keep all 62 physical sockets visible in their true uncolored state.
3. Use the existing family buttons only to highlight a family and show its icosahedral correspondence.
4. Keep the geometric cage disabled until the guide button is selected.

### Task 4: Verify and package

**Files:**
- Modify: `README.md`
- Update: `outputs/geometric-discovery-workbench.zip`

**Steps:**
1. Run `npm test` and `npm run build`.
2. Visually inspect the isolated node from several rotations.
3. Toggle each family and verify the product body remains recognizable.
4. Check for browser console errors and update the project archive.

