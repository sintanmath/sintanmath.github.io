export type SceneId =
  | 'platonic-atlas'
  | 'skeleton'
  | 'duality'
  | 'orthogonal-node'
  | 'cube-lattice'
  | 'icosa-vertex'
  | 'icosa-assembly'
  | 'direction-node'
  | 'zometool-node'

export interface SceneDefinition {
  id: SceneId
  number: string
  chapter: string
  title: string
  shortTitle: string
  thesis: string
  narration: string
  interaction: string
}

export const scenes: SceneDefinition[] = [
  {
    id: 'platonic-atlas',
    number: '01',
    chapter: '形体',
    title: '只有五种',
    shortTitle: '五种正多面体',
    thesis: '先让观众看见完整的形，再把注意力转向它们共同的语法。',
    narration: '如果每一个面都是相同的正多边形，而且每个顶点的结构完全一样，那么这样的凸多面体，只有五种。',
    interaction: '拖动观察五个模型；分别隐藏面、边或点，比较它们的结构。',
  },
  {
    id: 'skeleton',
    number: '02',
    chapter: '抽象',
    title: '把面拿掉',
    shortTitle: '点与线的骨架',
    thesis: '多面体可以被压缩成两类构件：节点与连接杆。',
    narration: '把面拿掉之后，形体并没有消失。真正决定结构的，是顶点在哪里，以及哪些顶点彼此相连。',
    interaction: '切换任意一种正多面体，调节爆炸程度，并逐层关闭面、边、节点。',
  },
  {
    id: 'duality',
    number: '03',
    chapter: '对偶',
    title: '顶点与面可以对调',
    shortTitle: '对偶变换',
    thesis: '一个正多面体的顶点，正好落在它对偶形体的面心上。',
    narration: '把每个面的中心连起来，会得到另一种正多面体。正六面体对着正八面体，正十二面体对着正二十面体；正四面体的对偶是它自己。',
    interaction: '选择一种正多面体，拖动对偶滑块：原面逐渐收缩，对偶面从顶点长出。',
  },
  {
    id: 'orthogonal-node',
    number: '04',
    chapter: '连接',
    title: '最自然的六个方向',
    shortTitle: '正交六孔节点',
    thesis: '前后、左右、上下是三条互相垂直的贯穿轴，共六个孔口。',
    narration: '最先想到的，是在球上沿三条互相垂直的轴开孔。它给出六个方向，也就是前后、左右、上下。',
    interaction: '推进插杆滑块，观察六根杆如何沿坐标轴进入节点；可显示或隐藏辅助轴。',
  },
  {
    id: 'cube-lattice',
    number: '05',
    chapter: '搭建',
    title: '正方体方格出现了',
    shortTitle: '立方网格',
    thesis: '重复六孔节点与等长杆，会自然生成三维正方形格点。',
    narration: '当所有杆长度相同，六孔节点会把空间分成三个正交方向。重复它，就得到最熟悉的立方网格。',
    interaction: '从零到一推进搭建进度；改变节点和杆的粗细，检查每个连接方向。',
  },
  {
    id: 'icosa-vertex',
    number: '06',
    chapter: '难题',
    title: '一个顶点需要五根杆',
    shortTitle: '正二十面体顶点',
    thesis: '正二十面体的每个顶点度数为 5，相邻的两根边杆夹角为 60°。',
    narration: '但正二十面体不服从横平竖直。站在它的一个顶点上，会有五条完全等价的边向外伸出。',
    interaction: '旋转节点检查五个孔位；打开角度辅助线，寻找标记出的 60°。',
  },
  {
    id: 'icosa-assembly',
    number: '07',
    chapter: '闭合',
    title: '十二个节点闭合成形',
    shortTitle: '搭建正二十面体',
    thesis: '把同一种五向局部关系复制到十二个顶点，三十根等长杆恰好闭合。',
    narration: '如果每一个球都提供这五个方向，十二个球和三十根等长杆，就会恰好闭合成一个正二十面体。',
    interaction: '拖动装配进度逐根加入边杆；打开孔位，检查每个顶点恰好连接五根杆。',
  },
  {
    id: 'direction-node',
    number: '08',
    chapter: '发现',
    title: '把更多方向收进同一个球',
    shortTitle: '多方向节点',
    thesis: '12 个五重轴方向、20 个三重轴方向与 30 个二重轴方向，共同组成 62 个孔位。',
    narration: '于是问题变了：能不能不为每一种形体重新做球，而是把一整套对称方向，预先收进同一个节点？这正是我最终遇见 ZomeTool 的地方。',
    interaction: '分别开关三类方向，观察 12、20、30 个孔位如何叠加成一个完整的方向系统。',
  },
  {
    id: 'zometool-node',
    number: '09',
    chapter: '对应',
    title: 'ZomeTool 节点',
    shortTitle: 'ZomeTool 节点',
    thesis: '真实节点用五边形、三角形和矩形孔区分正二十面体的三类对称方向。',
    narration: '五边形孔指向正二十面体的十二个顶点，三角形孔指向二十个面心，矩形孔则指向三十条棱的中点。',
    interaction: '逐类开关红、黄、蓝方向，并显示正二十面体导引框，检查每一类孔位的对应关系。',
  },
]

export function getScene(id?: string): SceneDefinition {
  return scenes.find((scene) => scene.id === id) ?? scenes[0]
}
