import { type ThreeEvent } from '@react-three/fiber'
import { useContext, useEffect, useRef, type ReactNode } from 'react'
import type * as THREE from 'three'
import type { Vec3 } from '../../geometry/vector'
import { SceneInteractionContext } from './SceneStage'

interface DragState {
  pointerId: number
  x: number
  y: number
}

interface PointerCaptureTarget {
  setPointerCapture(pointerId: number): void
  releasePointerCapture(pointerId: number): void
}

export function IndependentRotator({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  children: ReactNode
  position?: Vec3
  rotation?: Vec3
}) {
  const group = useRef<THREE.Group>(null)
  const drag = useRef<DragState | null>(null)
  const { setObjectInteracting, resetSignal } = useContext(SceneInteractionContext)

  useEffect(() => {
    if (group.current) group.current.rotation.set(...rotation)
  }, [resetSignal, rotation])

  const finishDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return
    event.stopPropagation()
    const target = event.target as unknown as PointerCaptureTarget
    target.releasePointerCapture?.(drag.current.pointerId)
    drag.current = null
    setObjectInteracting(false)
  }

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerDown={(event) => {
        event.stopPropagation()
        const target = event.target as unknown as PointerCaptureTarget
        target.setPointerCapture?.(event.pointerId)
        drag.current = {
          pointerId: event.pointerId,
          x: event.nativeEvent.clientX,
          y: event.nativeEvent.clientY,
        }
        setObjectInteracting(true)
      }}
      onPointerMove={(event) => {
        if (!drag.current || !group.current) return
        event.stopPropagation()
        const nextX = event.nativeEvent.clientX
        const nextY = event.nativeEvent.clientY
        group.current.rotation.y += (nextX - drag.current.x) * 0.012
        group.current.rotation.x += (nextY - drag.current.y) * 0.012
        drag.current.x = nextX
        drag.current.y = nextY
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {children}
    </group>
  )
}
