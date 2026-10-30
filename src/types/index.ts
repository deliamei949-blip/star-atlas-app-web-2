export interface Capture {
  id: string
  starName?: string          // 自动从 firstReaction 截取，可为空
  sourceText: string         // 原始星尘（用户选中的原文）
  sourceApp?: string         // 来源坐标
  sourceUrl?: string
  myRewrite: string          // 我的第一反应
  isQuestion: boolean
  processed: boolean
  capturedAt: string
  processedAt?: string
}

export interface Star {
  id: string
  starName?: string          // 星球名字（用户命名或自动截取）
  surfaceText: string        // 星球表面 — 我的第一反应 verbatim
  originalSignal?: string    // 内核：原始信号
  myDecode?: string          // 内核：我的解码
  correctionMark?: string    // 内核：纠错标记
  resonanceFreq?: string     // 内核：共振频率（条件生成）
  decayBoundary?: string     // 内核：信号衰减边界（条件生成）
  unsolvedSignal?: string    // 内核：未解信号（认知陷阱问句 + 脉冲日志入口）
  form: StarForm
  positionX: number
  positionY: number
  positionZ: number
  captureId?: string
  hasDeduction: boolean      // 是否有推演注入
  deductionCount: number     // 推演条数
  createdAt: string
  ignitedAt?: string
}

export enum StarForm {
  StarDust = 1,   // 星辰
  Pulsar = 2,     // 脉冲星
  Constellation = 3, // 星座
}

export type RelationType = 'resonance' | 'orbit' | 'binary_repel' | 'nebula_wrap'

export const RelationTypeLabels: Record<RelationType, string> = {
  resonance: '引力共振（同构）',
  orbit: '轨道环绕（因果/前提）',
  binary_repel: '双星互斥（对比）',
  nebula_wrap: '星云包裹（包含）',
}

export const RelationTypeColors: Record<RelationType, string> = {
  resonance: '#44ddff',
  orbit: '#ff9944',
  binary_repel: '#ff4466',
  nebula_wrap: '#aa66ff',
}

export interface Connection {
  id: string
  starAId: string
  starBId: string
  relationType: RelationType
  note?: string
  createdAt: string
}

/** Connection + both star objects — for detail panel rendering */
export interface ConnectionWithStars {
  connection: Connection
  starA: Star
  starB: Star
}

export interface BlackHole {
  id: string
  question: string
  starId?: string
  positionX: number
  positionY: number
  positionZ: number
  createdAt: string
}

/** 黑洞 + AI 匹配的关联星体 */
export interface BlackHoleWithRelations {
  blackHole: BlackHole
  relatedStars: EchoResult[]
}

/** 3D 空间中的黑洞位置（存在 DB 中） */
export interface BlackHolePosition {
  positionX: number
  positionY: number
  positionZ: number
}

// ── 脉冲日志相关类型 ──

export interface Deduction {
  id: string
  starId: string
  content: string             // 推演文本
  sourceSessionId?: string    // 来源脉冲日志 session
  createdAt: string
}

export interface PulseLogSession {
  id: string
  sourceCoordinate: string    // 论文出处
  rawText: string             // 用户原始输入
  createdAt: string
}

export interface FloatingThought {
  id: string
  sessionId: string
  content: string
  createdAt: string
}

// ── 星际回声相关类型 ──

export interface EchoResult {
  starId: string
  starName?: string
  surfaceText: string
  myDecode?: string
  relevanceScore: number       // 0-1，AI 语义匹配度
  explanation: string           // AI 解释为什么相关（中文，≤30字）
}
