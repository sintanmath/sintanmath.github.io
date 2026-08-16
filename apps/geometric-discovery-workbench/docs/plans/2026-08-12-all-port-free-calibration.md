# All Port Families Free Calibration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give pentagonal, triangular, and rectangular ZomeTool sockets independent size and in-plane rotation controls with a much wider size range.

**Architecture:** Extend `WorkbenchState` with pentagon and triangle roll angles, then pass each family angle into the existing `ShapedPort` transform. Reuse the current compact range component to expose six color-coded sliders, increase all size ranges from `0.35–2.2` to `0.05–8`, and expand the reset action to restore all six values.

**Tech Stack:** React 19, TypeScript, Three.js / React Three Fiber, Vitest, CSS.

---

### Task 1: Add rotation state for every socket family

**Files:**
- Modify: `src/types.ts`
- Modify: `src/scenes/ZomeToolNodeScene.tsx`

**Steps:**

1. Add `pentagonPortRotation` and `trianglePortRotation` with defaults of `0`.
2. Pass the matching rotation to every pentagonal, triangular, and rectangular `ShapedPort`.
3. Remove the rectangle-only rotation condition inside `portFromFace`.
4. Run `npm run build`; expect TypeScript compilation to pass.

### Task 2: Expand the calibration controls

**Files:**
- Modify: `src/components/ui/CompactControls.tsx`
- Modify: `src/styles.css`

**Steps:**

1. Increase all three size sliders to `0.05–8` with `0.01` steps.
2. Add independent `-180°–180°` rotation sliders for pentagonal and triangular sockets.
3. Color each rotation slider to match its family.
4. Update the reset button to restore all sizes to `1` and all rotations to `0°`.
5. Keep the taller popover within the viewport at desktop and narrow widths.

### Task 3: Regression test and package

**Files:**
- Modify: `README.md`
- Update: `outputs/geometric-discovery-workbench.zip`

**Steps:**

1. Reload `/scene/zometool-node` and verify all six sliders are visible and independently update.
2. Set every size above the old maximum and rotate every family; verify the model responds live.
3. Reset all values and check the browser console.
4. Run `npm test` and `npm run build`.
5. Rebuild and integrity-check the downloadable ZIP archive.
