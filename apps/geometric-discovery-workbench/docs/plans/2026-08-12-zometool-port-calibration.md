# ZomeTool Port Calibration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Correct the rectangular socket roll angle and let the user continuously calibrate the three socket families independently.

**Architecture:** Derive the rectangular socket's in-plane tangent from a real boundary edge of its support face, rather than the center-to-vertex diagonal, while preserving the radial orientation of the regular polygon sockets. Store three dimensionless calibration factors and a rectangular roll angle in `WorkbenchState`, pass them into the physical node renderer, and expose them only on the ZomeTool scene through the existing compact size popover.

**Tech Stack:** React 19, TypeScript, Three.js / React Three Fiber, Vitest, CSS.

---

### Task 1: Correct support-face orientation

**Files:**
- Modify: `src/geometry/zometool.ts`
- Modify: `src/scenes/ZomeToolNodeScene.tsx`
- Test: `src/geometry/geometry.test.ts`

**Steps:**

1. Add a helper that finds a deterministic boundary edge belonging to a support face.
2. Return the normalized edge vector as the socket tangent.
3. Test that every tangent is perpendicular to its face normal and parallel to a shell edge.
4. Run `npm test`; expect all geometry tests to pass.

### Task 2: Add independent socket calibration

**Files:**
- Modify: `src/types.ts`
- Modify: `src/components/three/ShapedPortNode.tsx`
- Modify: `src/scenes/ZomeToolNodeScene.tsx`

**Steps:**

1. Add pentagon, triangle, and rectangle socket scale factors with defaults of `1`.
2. Pass the three factors to `ShapedPortNode` and multiply only the corresponding socket opening.
3. Keep body scale and strut scale independent from socket scale.
4. Run TypeScript build; expect no type errors.

### Task 3: Expose compact calibration controls

**Files:**
- Modify: `src/components/ui/CompactControls.tsx`
- Modify: `src/styles.css`

**Steps:**

1. In scene 08, replace the generic body/strut sliders inside “构件尺寸” with three shape-icon sliders.
2. Use a continuous `0.35–2.2` range and add a reset button that restores all three factors to `1` and the rectangle roll angle to `0°`.
3. Keep the control compact, low-text, keyboard accessible, and visually consistent with the paper-manuscript interface.

### Task 4: Visual regression and packaging

**Files:**
- Update: `outputs/geometric-discovery-workbench.zip`

**Steps:**

1. Reload `/scene/zometool-node` and verify rectangular sockets are edge-aligned.
2. Move all three sliders and verify each affects only its own socket family.
3. Check browser warnings/errors, run `npm test`, and run `npm run build`.
4. Rebuild and integrity-check the downloadable ZIP archive.
