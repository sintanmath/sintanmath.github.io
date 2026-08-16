import {
  CircleDot,
  Eye,
  Grid3X3,
  Minus,
  Network,
  Pentagon,
  RotateCcw,
  RotateCw,
  ScanLine,
  SlidersHorizontal,
  Tag,
  Triangle,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { SceneDefinition } from '../../data/scenes'
import { dualSolidId } from '../../geometry/duality'
import { platonicSolids, solidOrder } from '../../geometry/polyhedra'
import type { StateSetter, WorkbenchState } from '../../types'

function ToolButton({
  label,
  active,
  onClick,
  children,
  className = '',
}: {
  label: string
  active: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      className={`icon-tool ${active ? 'active' : ''} ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function MiniRange({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  icon,
  percent = false,
  presets = false,
  className = '',
  formatValue,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  icon: ReactNode
  percent?: boolean
  presets?: boolean
  className?: string
  formatValue?: (value: number) => string
}) {
  return (
    <div className={`mini-range ${className}`} title={label}>
      <span className="mini-range-icon">{icon}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(event) => onChange(Number(event.currentTarget.value))}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>{formatValue ? formatValue(value) : percent ? `${Math.round(value * 100)}` : value.toFixed(2)}</output>
      {presets && (
        <span className="mini-presets">
          {[0, 0.5, 1].map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`${label} ${preset}`}
              className={Math.abs(value - preset) < 0.005 ? 'active' : ''}
              onClick={() => onChange(preset)}
            >
              {preset === 0.5 ? '½' : preset}
            </button>
          ))}
        </span>
      )}
    </div>
  )
}

function FamilyButton({
  label,
  active,
  count,
  shape,
  onClick,
}: {
  label: string
  active: boolean
  count: number
  shape: 'pentagon' | 'triangle' | 'rectangle'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`family-button family-${shape} ${active ? 'active' : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <i aria-hidden="true" />
      <small>{count}</small>
    </button>
  )
}

export function CompactControls({
  scene,
  state,
  setState,
}: {
  scene: SceneDefinition
  state: WorkbenchState
  setState: StateSetter
}) {
  const [sizesOpen, setSizesOpen] = useState(false)
  const is = (...ids: string[]) => ids.includes(scene.id)
  const hasFaces = is('platonic-atlas', 'skeleton', 'duality', 'icosa-assembly', 'zometool-node')
  const hasAssembly = is('duality', 'orthogonal-node', 'cube-lattice', 'icosa-vertex', 'icosa-assembly', 'direction-node', 'zometool-node')
  const hasExplode = is('platonic-atlas', 'skeleton', 'cube-lattice', 'icosa-assembly')
  const hasPorts = !is('platonic-atlas', 'duality')
  const hasGuides = is('orthogonal-node', 'icosa-vertex', 'icosa-assembly', 'direction-node', 'zometool-node')
  const hasFamilies = is('direction-node', 'zometool-node')
  const isZomeToolNode = scene.id === 'zometool-node'

  const resetPortCalibration = () => {
    setState('pentagonPortScale', 1)
    setState('trianglePortScale', 1)
    setState('rectanglePortScale', 1)
    setState('pentagonPortRotation', 0)
    setState('trianglePortRotation', 0)
    setState('rectanglePortRotation', 0)
  }

  return (
    <>
      <aside className="layer-dock" aria-label="结构图层">
        {hasFaces && (
          <ToolButton label="面" active={state.showFaces} onClick={() => setState('showFaces', !state.showFaces)}>
            <Triangle size={18} />
          </ToolButton>
        )}
        <ToolButton label="边或杆" active={state.showEdges} onClick={() => setState('showEdges', !state.showEdges)}>
          <Network size={18} />
        </ToolButton>
        <ToolButton label="顶点或球" active={state.showNodes} onClick={() => setState('showNodes', !state.showNodes)}>
          <CircleDot size={18} />
        </ToolButton>
        {hasPorts && (
          <ToolButton label="孔位" active={state.showPorts} onClick={() => setState('showPorts', !state.showPorts)}>
            <ScanLine size={18} />
          </ToolButton>
        )}
        {hasGuides && (
          <ToolButton label="几何导引" active={state.showGuides} onClick={() => setState('showGuides', !state.showGuides)}>
            <Grid3X3 size={18} />
          </ToolButton>
        )}
        <ToolButton label="标注" active={state.showLabels} onClick={() => setState('showLabels', !state.showLabels)}>
          <Tag size={17} />
        </ToolButton>
        <ToolButton label="构件尺寸" active={sizesOpen} onClick={() => setSizesOpen((value) => !value)}>
          <SlidersHorizontal size={18} />
        </ToolButton>
      </aside>

      {hasFamilies && (
        <div className="family-dock" aria-label="方向族">
          <FamilyButton
            label="五边形孔：12 个顶点方向"
            active={state.showFiveFold}
            count={12}
            shape="pentagon"
            onClick={() => setState('showFiveFold', !state.showFiveFold)}
          />
          <FamilyButton
            label="三角形孔：20 个面心方向"
            active={state.showThreeFold}
            count={20}
            shape="triangle"
            onClick={() => setState('showThreeFold', !state.showThreeFold)}
          />
          <FamilyButton
            label="矩形孔：30 个棱中点方向"
            active={state.showTwoFold}
            count={30}
            shape="rectangle"
            onClick={() => setState('showTwoFold', !state.showTwoFold)}
          />
        </div>
      )}

      {(scene.id === 'skeleton' || scene.id === 'duality') && (
        <select
          className={`solid-picker ${scene.id === 'duality' ? 'wide' : ''}`}
          aria-label="选择正多面体"
          value={state.selectedSolid}
          onChange={(event) => setState('selectedSolid', event.target.value as WorkbenchState['selectedSolid'])}
        >
          {solidOrder.map((id) => {
            const dualId = dualSolidId[id]
            const label = scene.id === 'duality'
              ? (id === dualId ? `${platonicSolids[id].name}（自对偶）` : `${platonicSolids[id].name} → ${platonicSolids[dualId].name}`)
              : platonicSolids[id].name
            return <option key={id} value={id}>{label}</option>
          })}
        </select>
      )}

      {(hasAssembly || hasExplode) && (
        <div className="motion-dock">
          {hasAssembly && (
            <MiniRange
              label={scene.id === 'orthogonal-node' ? '插杆深度' : scene.id === 'duality' ? '对偶变换' : '搭建进度'}
              value={state.assembly}
              onChange={(value) => setState('assembly', value)}
              icon={<Eye size={16} />}
              percent
              presets
            />
          )}
          {hasExplode && (
            <MiniRange
              label="结构展开"
              value={state.explode}
              onChange={(value) => setState('explode', value)}
              icon={<Pentagon size={16} />}
              percent
              presets
            />
          )}
        </div>
      )}

      {sizesOpen && (
        <div className={`size-popover ${isZomeToolNode ? 'port-calibration' : ''}`}>
          {isZomeToolNode && (
            <>
              <MiniRange
                label="五边形孔大小"
                value={state.pentagonPortScale}
                min={0.05}
                max={8}
                step={0.01}
                onChange={(value) => setState('pentagonPortScale', value)}
                icon={<Pentagon size={16} />}
                className="port-pentagon"
              />
              <MiniRange
                label="五边形孔转角"
                value={state.pentagonPortRotation}
                min={-180}
                max={180}
                step={1}
                onChange={(value) => setState('pentagonPortRotation', value)}
                icon={<RotateCw size={16} />}
                className="port-pentagon port-rotation"
                formatValue={(value) => `${Math.round(value)}°`}
              />
              <MiniRange
                label="三角形孔大小"
                value={state.trianglePortScale}
                min={0.05}
                max={8}
                step={0.01}
                onChange={(value) => setState('trianglePortScale', value)}
                icon={<Triangle size={16} />}
                className="port-triangle"
              />
              <MiniRange
                label="三角形孔转角"
                value={state.trianglePortRotation}
                min={-180}
                max={180}
                step={1}
                onChange={(value) => setState('trianglePortRotation', value)}
                icon={<RotateCw size={16} />}
                className="port-triangle port-rotation"
                formatValue={(value) => `${Math.round(value)}°`}
              />
              <MiniRange
                label="矩形孔大小"
                value={state.rectanglePortScale}
                min={0.05}
                max={8}
                step={0.01}
                onChange={(value) => setState('rectanglePortScale', value)}
                icon={<Minus size={18} />}
                className="port-rectangle"
              />
              <MiniRange
                label="矩形孔转角"
                value={state.rectanglePortRotation}
                min={-180}
                max={180}
                step={1}
                onChange={(value) => setState('rectanglePortRotation', value)}
                icon={<RotateCw size={16} />}
                className="port-rectangle port-rotation"
                formatValue={(value) => `${Math.round(value)}°`}
              />
              <button
                type="button"
                className="calibration-reset"
                aria-label="复位全部孔径和孔方向"
                title="复位全部孔径和孔方向"
                onClick={resetPortCalibration}
              >
                <RotateCcw size={14} />
                <span>1:1</span>
              </button>
            </>
          )}
          <MiniRange
            label="节点大小"
            value={state.nodeScale}
            min={0.65}
            max={1.55}
            onChange={(value) => setState('nodeScale', value)}
            icon={<CircleDot size={16} />}
          />
          <MiniRange
            label="杆件粗细"
            value={state.rodScale}
            min={0.6}
            max={1.8}
            onChange={(value) => setState('rodScale', value)}
            icon={<Minus size={17} />}
          />
        </div>
      )}
    </>
  )
}
