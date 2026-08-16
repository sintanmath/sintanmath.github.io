import type { SceneId } from '../data/scenes'
import type { WorkbenchState } from '../types'
import { CubeAssemblyScene } from './CubeAssemblyScene'
import { DualityScene } from './DualityScene'
import { DirectionNodeScene } from './DirectionNodeScene'
import { IcosaAssemblyScene } from './IcosaAssemblyScene'
import { IcosaVertexScene } from './IcosaVertexScene'
import { OrthogonalNodeScene } from './OrthogonalNodeScene'
import { PlatonicAtlasScene } from './PlatonicAtlasScene'
import { SkeletonScene } from './SkeletonScene'
import { ZomeToolNodeScene } from './ZomeToolNodeScene'

export function SceneContent({ sceneId, state }: { sceneId: SceneId; state: WorkbenchState }) {
  switch (sceneId) {
    case 'platonic-atlas': return <PlatonicAtlasScene state={state} />
    case 'skeleton': return <SkeletonScene state={state} />
    case 'duality': return <DualityScene state={state} />
    case 'orthogonal-node': return <OrthogonalNodeScene state={state} />
    case 'cube-lattice': return <CubeAssemblyScene state={state} />
    case 'icosa-vertex': return <IcosaVertexScene state={state} />
    case 'icosa-assembly': return <IcosaAssemblyScene state={state} />
    case 'direction-node': return <DirectionNodeScene state={state} />
    case 'zometool-node': return <ZomeToolNodeScene state={state} />
  }
}
