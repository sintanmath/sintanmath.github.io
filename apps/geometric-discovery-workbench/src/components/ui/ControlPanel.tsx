import { Eye, Move3d, Ruler, SlidersHorizontal } from 'lucide-react'
import type { SceneDefinition } from '../../data/scenes'
import { platonicSolids, solidOrder } from '../../geometry/polyhedra'
import type { StateSetter, WorkbenchState } from '../../types'

function Toggle({
  label,
  checked,
  onChange,
  detail,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  detail?: string
}) {
  return (
    <label className="toggle-row">
      <span>
        {label}
        {detail && <small>{detail}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggle-mark" aria-hidden="true" />
    </label>
  )
}

function RangeControl({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  display,
  presets,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  display?: string
  presets?: Array<{ label: string; accessibleLabel: string; value: number }>
}) {
  return (
    <label className="range-control">
      <span>
        {label}
        <output>{display ?? Math.round(value * 100)}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {presets && (
        <span className="range-presets">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={Math.abs(value - preset.value) < 0.005 ? 'active' : ''}
              aria-label={`${label}：${preset.accessibleLabel}`}
              onClick={() => onChange(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </span>
      )}
    </label>
  )
}

function ControlSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="control-section">
      <h3>{icon}{title}</h3>
      <div className="control-section-body">{children}</div>
    </section>
  )
}

export function ControlPanel({
  scene,
  state,
  setState,
}: {
  scene: SceneDefinition
  state: WorkbenchState
  setState: StateSetter
}) {
  const is = (...ids: string[]) => ids.includes(scene.id)
  const hasFaces = is('platonic-atlas', 'skeleton', 'icosa-assembly')
  const hasAssembly = is('orthogonal-node', 'cube-lattice', 'icosa-vertex', 'icosa-assembly', 'direction-node')
  const hasExplode = is('platonic-atlas', 'skeleton', 'cube-lattice', 'icosa-assembly')
  const hasPorts = !is('platonic-atlas')
  const hasGuides = is('orthogonal-node', 'icosa-vertex', 'icosa-assembly', 'direction-node')

  return (
    <div className="control-panel">
      <div className="inspector-title">
        <div>
          <span>SCENE {scene.number}</span>
          <h2>实验参数</h2>
        </div>
        <SlidersHorizontal size={20} strokeWidth={1.5} />
      </div>

      {scene.id === 'skeleton' && (
        <ControlSection title="研究对象" icon={<Move3d size={15} />}>
          <label className="select-control">
            <span>正多面体</span>
            <select
              value={state.selectedSolid}
              onChange={(event) => setState('selectedSolid', event.target.value as WorkbenchState['selectedSolid'])}
            >
              {solidOrder.map((id) => (
                <option key={id} value={id}>{platonicSolids[id].name}</option>
              ))}
            </select>
          </label>
        </ControlSection>
      )}

      <ControlSection title="结构图层" icon={<Eye size={15} />}>
        {hasFaces && <Toggle label="面" checked={state.showFaces} onChange={(value) => setState('showFaces', value)} />}
        <Toggle label="边 / 杆" checked={state.showEdges} onChange={(value) => setState('showEdges', value)} />
        <Toggle label="顶点 / 球" checked={state.showNodes} onChange={(value) => setState('showNodes', value)} />
        {hasPorts && <Toggle label="孔位" checked={state.showPorts} onChange={(value) => setState('showPorts', value)} />}
        {hasGuides && <Toggle label="几何辅助线" checked={state.showGuides} onChange={(value) => setState('showGuides', value)} />}
        <Toggle label="文字标注" checked={state.showLabels} onChange={(value) => setState('showLabels', value)} />
      </ControlSection>

      {scene.id === 'direction-node' && (
        <ControlSection title="方向族" icon={<Ruler size={15} />}>
          <Toggle label="五重轴方向" detail="12 孔 · 朱红" checked={state.showFiveFold} onChange={(value) => setState('showFiveFold', value)} />
          <Toggle label="三重轴方向" detail="20 孔 · 藤黄" checked={state.showThreeFold} onChange={(value) => setState('showThreeFold', value)} />
          <Toggle label="二重轴方向" detail="30 孔 · 石青" checked={state.showTwoFold} onChange={(value) => setState('showTwoFold', value)} />
        </ControlSection>
      )}

      {(hasAssembly || hasExplode) && (
        <ControlSection title="演示进度" icon={<Move3d size={15} />}>
          {hasAssembly && (
            <RangeControl
              label={scene.id === 'orthogonal-node' ? '插杆深度' : '搭建进度'}
              value={state.assembly}
              onChange={(value) => setState('assembly', value)}
              display={`${Math.round(state.assembly * 100)}%`}
              presets={[
                { label: '0', accessibleLabel: '归零', value: 0 },
                { label: '½', accessibleLabel: '一半', value: 0.5 },
                { label: '1', accessibleLabel: '完成', value: 1 },
              ]}
            />
          )}
          {hasExplode && (
            <RangeControl
              label="结构展开"
              value={state.explode}
              onChange={(value) => setState('explode', value)}
              display={`${Math.round(state.explode * 100)}%`}
              presets={[
                { label: '0', accessibleLabel: '归零', value: 0 },
                { label: '½', accessibleLabel: '一半', value: 0.5 },
                { label: '1', accessibleLabel: '完全展开', value: 1 },
              ]}
            />
          )}
        </ControlSection>
      )}

      <ControlSection title="构件尺度" icon={<Ruler size={15} />}>
        <RangeControl
          label="节点大小"
          value={state.nodeScale}
          min={0.65}
          max={1.55}
          step={0.01}
          onChange={(value) => setState('nodeScale', value)}
          display={`${state.nodeScale.toFixed(2)}×`}
        />
        <RangeControl
          label="杆件粗细"
          value={state.rodScale}
          min={0.6}
          max={1.8}
          step={0.01}
          onChange={(value) => setState('rodScale', value)}
          display={`${state.rodScale.toFixed(2)}×`}
        />
      </ControlSection>

      <p className="inspector-note">参数只改变当前镜头。切换镜头后，设置会被保留。</p>
    </div>
  )
}
