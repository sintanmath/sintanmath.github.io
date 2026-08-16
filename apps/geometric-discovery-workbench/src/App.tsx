import { Box, ChevronLeft, ChevronRight, Focus, Orbit, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { SceneStage } from './components/three/SceneStage'
import { CompactControls } from './components/ui/CompactControls'
import { getScene, scenes, type SceneId } from './data/scenes'
import { SceneContent } from './scenes/SceneContent'
import { defaultWorkbenchState, type WorkbenchState } from './types'

function initialStateFor(sceneId: SceneId): WorkbenchState {
  const shared = { ...defaultWorkbenchState, showLabels: false }
  switch (sceneId) {
    case 'platonic-atlas': return { ...shared, showPorts: false, explode: 0 }
    case 'skeleton': return { ...shared, explode: 0.26, selectedSolid: 'dodecahedron' }
    case 'duality': return { ...shared, showPorts: false, assembly: 0, selectedSolid: 'cube' }
    case 'orthogonal-node': return { ...shared, showFaces: false, assembly: 0.72 }
    case 'cube-lattice': return { ...shared, showFaces: false, assembly: 1 }
    case 'icosa-vertex': return { ...shared, showFaces: false, showLabels: true, assembly: 1 }
    case 'icosa-assembly': return { ...shared, assembly: 0.82 }
    case 'direction-node': return { ...shared, showFaces: false, showEdges: false, assembly: 0.8 }
    case 'zometool-node': return {
      ...shared,
      showFaces: false,
      showEdges: true,
      showNodes: false,
      showGuides: false,
      showFiveFold: false,
      showThreeFold: false,
      showTwoFold: false,
      assembly: 1,
    }
  }
}

function Workbench() {
  const { sceneId: routeSceneId } = useParams()
  const navigate = useNavigate()
  const scene = getScene(routeSceneId)
  const sceneId = scene.id
  const sceneIndex = scenes.findIndex((item) => item.id === sceneId)
  const [stateByScene, setStateByScene] = useState<Record<string, WorkbenchState>>({})
  const [resetSignal, setResetSignal] = useState(0)
  const [uiHidden, setUiHidden] = useState(false)
  const state = stateByScene[sceneId] ?? initialStateFor(sceneId)

  useEffect(() => {
    if (routeSceneId !== sceneId) navigate(`/scene/${sceneId}`, { replace: true })
  }, [navigate, routeSceneId, sceneId])

  const setSceneState = useCallback(<K extends keyof WorkbenchState>(key: K, value: WorkbenchState[K]) => {
    setStateByScene((current) => ({
      ...current,
      [sceneId]: { ...(current[sceneId] ?? initialStateFor(sceneId)), [key]: value },
    }))
  }, [sceneId])

  const goToScene = useCallback((offset: number) => {
    const nextIndex = Math.min(scenes.length - 1, Math.max(0, sceneIndex + offset))
    navigate(`/scene/${scenes[nextIndex].id}`)
  }, [navigate, sceneIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.matches('input, select, textarea, button')) return
      if (event.key === 'ArrowLeft') goToScene(-1)
      if (event.key === 'ArrowRight') goToScene(1)
      if (event.key.toLowerCase() === 'r') setResetSignal((value) => value + 1)
      if (event.key.toLowerCase() === 'f') setUiHidden((value) => !value)
      if (event.key === 'Escape') setUiHidden(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goToScene])

  return (
    <main className={`minimal-workbench ${uiHidden ? 'ui-hidden' : ''}`}>
      <SceneStage
        autoRotate={state.autoRotate}
        orthographic={state.orthographic}
        resetSignal={resetSignal}
        onReset={() => setResetSignal((value) => value + 1)}
      >
        <SceneContent sceneId={sceneId} state={state} />
      </SceneStage>

      <header className="minimal-caption">
        <a className="home-link" href="/">返回主页</a>
        <span>{scene.number}</span>
        <i />
        <h1>{scene.shortTitle}</h1>
      </header>

      <div className="view-dock" role="toolbar" aria-label="视图">
        <button aria-label="复位视角" title="复位视角 · R" onClick={() => setResetSignal((value) => value + 1)}>
          <RotateCcw size={18} />
        </button>
        <button className={state.autoRotate ? 'active' : ''} aria-label="自动旋转" title="自动旋转" onClick={() => setSceneState('autoRotate', !state.autoRotate)}>
          <Orbit size={19} />
        </button>
        <button className={state.orthographic ? 'active' : ''} aria-label="正交投影" title="正交 / 透视" onClick={() => setSceneState('orthographic', !state.orthographic)}>
          <Box size={18} />
        </button>
        <button className={uiHidden ? 'active' : ''} aria-label="隐藏界面" title="隐藏界面 · F" onClick={() => setUiHidden((value) => !value)}>
          <Focus size={18} />
        </button>
      </div>

      <CompactControls scene={scene} state={state} setState={setSceneState} />

      <nav className="scene-dock" aria-label="场景">
        <button aria-label="上一个场景" onClick={() => goToScene(-1)} disabled={sceneIndex === 0}><ChevronLeft size={16} /></button>
        {scenes.map((item) => (
          <button
            key={item.id}
            className={item.id === sceneId ? 'active' : ''}
            aria-label={`${item.number} ${item.shortTitle}`}
            title={item.shortTitle}
            onClick={() => navigate(`/scene/${item.id}`)}
          >
            {item.number}
          </button>
        ))}
        <button aria-label="下一个场景" onClick={() => goToScene(1)} disabled={sceneIndex === scenes.length - 1}><ChevronRight size={16} /></button>
      </nav>

      {uiHidden && (
        <button className="ui-restore" aria-label="显示界面" title="显示界面 · F" onClick={() => setUiHidden(false)}>
          <Focus size={17} />
        </button>
      )}
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/scene/:sceneId" element={<Workbench />} />
      <Route path="*" element={<Navigate to="/scene/platonic-atlas" replace />} />
    </Routes>
  )
}
