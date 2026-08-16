# Geometric Discovery Workbench Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Build a light mathematical-manuscript web app with independently addressable, freely controllable 3D scenes for explaining the discovery of ball-and-strut geometry systems.

**Architecture:** A Vite React TypeScript app owns routing and UI state. React Three Fiber renders reusable nodes, rods, polyhedra, port holes, annotations, and scene-specific assemblies. Pure geometry utilities generate and validate topology independently from rendering.

**Tech Stack:** React 19, TypeScript, Vite, Three.js, React Three Fiber, Drei, React Router, Vitest, CSS.

---

### Task 1: Scaffold and geometry core

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/geometry/vector.ts`, `src/geometry/polyhedra.ts`, `src/geometry/directions.ts`
- Test: `src/geometry/geometry.test.ts`

**Steps:**
1. Add project configuration and dependencies.
2. Write topology tests for vertex, edge, degree, and direction counts.
3. Implement explicit coordinate sets and distance-derived edges.
4. Run `npm test` and expect all geometry tests to pass.

### Task 2: Build reusable 3D primitives

**Files:**
- Create: `src/components/three/Rod.tsx`
- Create: `src/components/three/NodeSphere.tsx`
- Create: `src/components/three/PolyhedronModel.tsx`
- Create: `src/components/three/SceneStage.tsx`

**Steps:**
1. Implement cylinders aligned between two arbitrary 3D points.
2. Implement a matte node sphere with visually recessed port rings.
3. Implement face, edge, and vertex layers with independent visibility.
4. Add lights, shadows, grid, orbit controls, and camera reset.

### Task 3: Implement the scene collection

**Files:**
- Create: `src/scenes/PlatonicAtlasScene.tsx`
- Create: `src/scenes/SkeletonScene.tsx`
- Create: `src/scenes/OrthogonalNodeScene.tsx`
- Create: `src/scenes/CubeAssemblyScene.tsx`
- Create: `src/scenes/IcosaVertexScene.tsx`
- Create: `src/scenes/IcosaAssemblyScene.tsx`
- Create: `src/scenes/DirectionNodeScene.tsx`
- Create: `src/data/scenes.ts`

**Steps:**
1. Create the five-solid atlas with shared layer controls.
2. Create a selectable solid abstraction scene.
3. Create a six-port orthogonal node and cube assembly slider.
4. Create the five-port icosahedral node with angle annotations.
5. Create the icosahedron assembly slider.
6. Create the 62-direction finale with family filters.

### Task 4: Build the manuscript interface

**Files:**
- Create: `src/App.tsx`, `src/main.tsx`, `src/styles.css`
- Create: `src/components/ui/SceneNavigation.tsx`
- Create: `src/components/ui/ControlPanel.tsx`
- Create: `src/components/ui/StoryNotes.tsx`

**Steps:**
1. Add `/scene/:sceneId` routing and previous/next keyboard navigation.
2. Build the paper-grid shell, scene index, toolbar, and contextual inspector.
3. Add collapsible navigation/notes and a focus-mode toggle.
4. Add responsive rules for desktop presentation and smaller windows.

### Task 5: Verify and refine

**Files:**
- Modify: scene and style files as visual review requires.
- Create: `README.md`

**Steps:**
1. Run `npm test` and `npm run build`; expect both to pass.
2. Start the local server and inspect every scene route.
3. Exercise rotation, zoom, reset, sliders, toggles, and keyboard navigation.
4. Fix visual or interaction defects and repeat build/test.
5. Document start commands, controls, routes, and geometric conventions.

