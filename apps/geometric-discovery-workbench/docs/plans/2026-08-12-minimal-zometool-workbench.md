# Minimal ZomeTool Workbench Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Turn the existing narrated interface into a low-text free manipulation workbench, add per-solid rotation, and add an accurate ZomeTool-node correspondence scene.

**Architecture:** Keep the existing geometry and scene components, but replace the three-column shell with a full-screen canvas and compact floating controls. Add an object-interaction context so a dragged solid temporarily disables camera orbit. Build the ZomeTool node from 12 pentagonal, 20 triangular, and 30 rectangular shaped ports mapped to icosahedral vertices, face centers, and edge midpoints.

**Tech Stack:** React 19, TypeScript, React Three Fiber, Drei, Three.js, Vitest, CSS.

---

### Task 1: Add geometry correspondence tests

**Files:**
- Modify: `src/geometry/polyhedra.ts`
- Modify: `src/geometry/directions.ts`
- Modify: `src/geometry/geometry.test.ts`

**Steps:**
1. Add a pure helper that finds triangular faces as three mutually adjacent vertices.
2. Test that the icosahedron has 20 faces and 30 unique edge midpoints.
3. Test the mapping: 12 vertex directions, 20 face-center directions, 30 edge-midpoint directions.
4. Run `npm test`; expect all tests to pass.

### Task 2: Make atlas solids independently rotatable

**Files:**
- Create: `src/components/three/IndependentRotator.tsx`
- Modify: `src/components/three/SceneStage.tsx`
- Modify: `src/scenes/PlatonicAtlasScene.tsx`

**Steps:**
1. Add a shared interaction context controlling whether camera orbit is enabled.
2. Implement pointer-captured local X/Y rotation with reset support.
3. Wrap each atlas solid at its own local origin.
4. Verify dragging one solid changes that solid without moving its four neighbors.

### Task 3: Build the real ZomeTool node scene

**Files:**
- Create: `src/components/three/ShapedPortNode.tsx`
- Create: `src/scenes/ZomeToolNodeScene.tsx`
- Modify: `src/data/scenes.ts`
- Modify: `src/scenes/SceneContent.tsx`
- Modify: `src/App.tsx`

**Steps:**
1. Render rectangular, triangular, and pentagonal recessed port faces on a white sphere.
2. Add an icosahedral guide shell and correspondence rays.
3. Map red pentagons to 12 vertices, yellow triangles to 20 face centers, and blue rectangles to 30 edge midpoints.
4. Add an eighth route and family filters.

### Task 4: Replace the narrated UI with a minimal workbench

**Files:**
- Create: `src/components/ui/CompactControls.tsx`
- Rewrite: `src/App.tsx`
- Rewrite: `src/styles.css`

**Steps:**
1. Remove the persistent navigation rail, inspector rail, and story-notes component from the rendered app.
2. Add a numeric scene dock, view toolbar, layer icon dock, and compact sliders.
3. Keep all controls accessible through `aria-label` and tooltips while minimizing visible text.
4. Verify all eight routes remain directly addressable.

### Task 5: Update separate script and verify

**Files:**
- Modify: `outputs/几何发现演示台-分镜脚本.md`
- Modify: `README.md`

**Steps:**
1. Add the real-node reveal as a separate final script shot.
2. Document the minimal controls and eight routes.
3. Run `npm test` and `npm run build`.
4. Visually inspect atlas independent rotation, ZomeTool correspondence filters, and the text-minimized layout.

