export type PromptCategory = '风景' | '人物' | '动漫' | '建筑' | '抽象' | '自定义'

export interface PromptTemplate {
  id: string
  title: string
  content: string
  category: PromptCategory
  is_builtin: boolean
  created_at: number
}

export const BUILTIN_TEMPLATES: PromptTemplate[] = [
  // 风景 (3)
  { id: 'bt-001', title: '金色草原日落', content: '金色草原，夕阳西下，光线柔和，远处山脉轮廓，暖色调，超写实摄影风格', category: '风景', is_builtin: true, created_at: 0 },
  { id: 'bt-002', title: '雪山云海', content: '巍峨雪山，云海翻涌，晨光初照，冷蓝色调，航拍视角，壮阔震撼', category: '风景', is_builtin: true, created_at: 0 },
  { id: 'bt-003', title: '热带雨林瀑布', content: '热带雨林深处，高耸瀑布倾泻而下，绿意盎然，水雾弥漫，自然光线，4K 超清', category: '风景', is_builtin: true, created_at: 0 },
  // 人物 (3)
  { id: 'bt-004', title: '古风仕女', content: '古典中国仕女，汉服飘逸，发髻精致，手持团扇，庭院背景，工笔画风格，细腻笔触', category: '人物', is_builtin: true, created_at: 0 },
  { id: 'bt-005', title: '赛博朋克少女', content: '赛博朋克风格少女，霓虹灯光，机械义肢，雨夜街头，高对比度，电影感构图', category: '人物', is_builtin: true, created_at: 0 },
  { id: 'bt-006', title: '写实人像特写', content: '真实感人像特写，自然光线，浅景深，眼神光，皮肤质感细腻，情绪饱满', category: '人物', is_builtin: true, created_at: 0 },
  // 动漫 (3)
  { id: 'bt-007', title: '吉卜力风格村庄', content: '吉卜力动画风格，宁静小村庄，绿草如茵，蓝天白云，温暖阳光，手绘质感', category: '动漫', is_builtin: true, created_at: 0 },
  { id: 'bt-008', title: '二次元战斗场景', content: '日系动漫风格，激烈战斗场景，能量爆发特效，动态线条，鲜艳色彩，高饱和度', category: '动漫', is_builtin: true, created_at: 0 },
  { id: 'bt-009', title: '像素艺术城市', content: '复古像素艺术风格，繁华城市夜景，霓虹灯闪烁，8-bit 色彩，怀旧游戏感', category: '动漫', is_builtin: true, created_at: 0 },
  // 建筑 (3)
  { id: 'bt-010', title: '未来主义建筑', content: '未来主义风格建筑，流线型外观，玻璃幕墙，悬浮结构，蓝色天空背景，建筑效果图风格', category: '建筑', is_builtin: true, created_at: 0 },
  { id: 'bt-011', title: '中式古典庭院', content: '中式古典庭院，飞檐翘角，青砖灰瓦，假山流水，竹影婆娑，水墨画意境', category: '建筑', is_builtin: true, created_at: 0 },
  { id: 'bt-012', title: '欧式教堂内景', content: '哥特式教堂内部，彩色玻璃窗，光线穿透，高耸拱顶，庄严肃穆，广角镜头', category: '建筑', is_builtin: true, created_at: 0 },
  // 抽象 (3)
  { id: 'bt-013', title: '流体艺术', content: '流体艺术，液态金属质感，色彩流动融合，紫金蓝三色，高光反射，极简背景', category: '抽象', is_builtin: true, created_at: 0 },
  { id: 'bt-014', title: '几何光影', content: '几何抽象构图，三角形与圆形交错，渐变色彩，光影层次丰富，现代设计感', category: '抽象', is_builtin: true, created_at: 0 },
  { id: 'bt-015', title: '宇宙星云', content: '深空星云，紫红色气体云团，点点繁星，哈勃望远镜风格，宏大宇宙感，超高清', category: '抽象', is_builtin: true, created_at: 0 },
]
