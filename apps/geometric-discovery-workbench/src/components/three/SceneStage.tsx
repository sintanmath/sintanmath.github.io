import { Grid, OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createContext, Suspense, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface StageContentsProps {
  children: ReactNode
  autoRotate: boolean
  orthographic: boolean
  resetSignal: number
}

interface SceneInteractionValue {
  setObjectInteracting: Dispatch<SetStateAction<boolean>>
  resetSignal: number
}

export const SceneInteractionContext = createContext<SceneInteractionValue>({
  setObjectInteracting: () => undefined,
  resetSignal: 0,
})

function StageContents({ children, autoRotate, orthographic, resetSignal }: StageContentsProps) {
  const controls = useRef<OrbitControlsImpl>(null)
  const [objectInteracting, setObjectInteracting] = useState(false)
  const interactionValue = useMemo(() => ({ setObjectInteracting, resetSignal }), [resetSignal])

  useEffect(() => {
    controls.current?.reset()
  }, [resetSignal, orthographic])

  return (
    <>
      {orthographic ? (
        <OrthographicCamera makeDefault position={[5.8, 4.2, 7.4]} zoom={72} near={0.01} far={100} />
      ) : (
        <PerspectiveCamera makeDefault position={[5.8, 4.2, 7.4]} fov={38} near={0.01} far={100} />
      )}
      <color attach="background" args={['#f3f0e6']} />
      <fog attach="fog" args={['#f3f0e6', 12, 25]} />
      <ambientLight intensity={1.7} />
      <hemisphereLight color="#fffdf4" groundColor="#b8c8c7" intensity={1.25} />
      <directionalLight
        position={[5, 8, 6]}
        intensity={2.4}
        color="#fff8e8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 2, -4]} intensity={0.65} color="#a8cad2" />

      <SceneInteractionContext.Provider value={interactionValue}>
        <Suspense fallback={null}>{children}</Suspense>
      </SceneInteractionContext.Provider>

      <Grid
        args={[22, 22]}
        position={[0, -2.35, 0]}
        cellSize={0.5}
        cellThickness={0.45}
        cellColor="#aebfbd"
        sectionSize={2.5}
        sectionThickness={0.75}
        sectionColor="#879e9d"
        fadeDistance={14}
        fadeStrength={1.4}
        infiniteGrid
      />
      <OrbitControls
        ref={controls}
        makeDefault
        enabled={!objectInteracting}
        enableDamping
        dampingFactor={0.07}
        minDistance={2.5}
        maxDistance={18}
        autoRotate={autoRotate}
        autoRotateSpeed={0.65}
      />
    </>
  )
}

interface SceneStageProps {
  children: ReactNode
  autoRotate?: boolean
  orthographic?: boolean
  resetSignal?: number
  onReset?: () => void
}

export function SceneStage({
  children,
  autoRotate = false,
  orthographic = false,
  resetSignal = 0,
  onReset,
}: SceneStageProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onReset?.()
      }}
    >
      <StageContents
        autoRotate={autoRotate}
        orthographic={orthographic}
        resetSignal={resetSignal}
      >
        {children}
      </StageContents>
    </Canvas>
  )
}
