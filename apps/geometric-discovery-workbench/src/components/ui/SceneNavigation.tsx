import { ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { scenes, type SceneId } from '../../data/scenes'

export function SceneNavigation({ activeScene }: { activeScene: SceneId }) {
  return (
    <nav className="scene-navigation" aria-label="演示镜头">
      <div className="nav-intro">
        <span className="folio">FIELD NOTES · 01</span>
        <p>从规则形体出发，寻找一种足够自由的连接语言。</p>
      </div>

      <ol className="scene-list">
        {scenes.map((scene) => (
          <li key={scene.id}>
            <NavLink
              to={`/scene/${scene.id}`}
              className={scene.id === activeScene ? 'scene-link active' : 'scene-link'}
            >
              <span className="scene-number">{scene.number}</span>
              <span className="scene-link-copy">
                <small>{scene.chapter}</small>
                <strong>{scene.shortTitle}</strong>
              </span>
              <ChevronRight size={15} strokeWidth={1.5} />
            </NavLink>
          </li>
        ))}
      </ol>

      <div className="nav-footnote">
        <span>操作</span>
        <p>拖动旋转 · 滚轮缩放<br />双击或 R 复位视角</p>
      </div>
    </nav>
  )
}
