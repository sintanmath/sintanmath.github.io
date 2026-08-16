import { ChevronDown, Quote } from 'lucide-react'
import type { SceneDefinition } from '../../data/scenes'

export function StoryNotes({
  scene,
  open,
  onToggle,
}: {
  scene: SceneDefinition
  open: boolean
  onToggle: () => void
}) {
  return (
    <section className={open ? 'story-notes open' : 'story-notes'}>
      <button className="story-notes-handle" onClick={onToggle} aria-expanded={open}>
        <span><Quote size={14} />讲解手记</span>
        <ChevronDown size={17} />
      </button>
      <div className="story-notes-content">
        <div className="story-intention">
          <span>镜头意图</span>
          <p>{scene.thesis}</p>
        </div>
        <blockquote>
          <span>建议旁白</span>
          <p>“{scene.narration}”</p>
        </blockquote>
        <div className="story-action">
          <span>现场动作</span>
          <p>{scene.interaction}</p>
        </div>
      </div>
    </section>
  )
}
