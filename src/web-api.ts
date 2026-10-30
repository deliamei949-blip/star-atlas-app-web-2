import type {
  BlackHole,
  Capture,
  Connection,
  Deduction,
  EchoResult,
  FloatingThought,
  PulseLogSession,
  Star,
} from '@/types'
import { StarForm } from '@/types'

type CaptureInput = {
  starName: string
  sourceText: string
  sourceApp?: string
  sourceUrl?: string
  myRewrite: string
  isQuestion?: boolean
}

type WebDatabase = {
  captures: Capture[]
  stars: Star[]
  connections: Connection[]
  blackHoles: BlackHole[]
  deductions: Deduction[]
  pulseLogSessions: PulseLogSession[]
  floatingThoughts: FloatingThought[]
  settings: Record<string, string>
}

const STORAGE_KEY = 'star-atlas-web-demo-v2'
const captureSavedTarget = new EventTarget()
const now = (offsetDays = 0) =>
  new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000).toISOString()

function createSeedData(): WebDatabase {
  const stars: Star[] = [
    {
      id: 'star-attention',
      starName: '注意力分配',
      surfaceText: '以前我总觉得专注靠硬撑，后来发现环境把选择变少时，专注会自然很多。',
      originalSignal: '注意力不是一种无限可调用的意志资源，它会被环境中的提示与干扰持续分配。',
      myDecode: '我理解，与其责怪自己不够自律，不如先设计一个不需要频繁抵抗诱惑的环境。',
      correctionMark: '这不是说意志力完全没用，而是不要把每一次分心都解释成个人品格问题。',
      resonanceFreq: '像舞台灯光：灯亮的地方更容易被看见，不等于其他东西不存在。',
      decayBoundary:
        '当任务本身需要持续抵抗外部干扰时，仅改善环境仍不充分；如果问题来自睡眠或焦虑，也不能只靠桌面整理解决。',
      unsolvedSignal: '哪些干扰值得直接消灭，哪些只需要重新安排出现的时间？',
      form: StarForm.Constellation,
      positionX: -7.5,
      positionY: 4.2,
      positionZ: 9,
      captureId: 'capture-attention',
      hasDeduction: true,
      deductionCount: 1,
      createdAt: now(9),
      ignitedAt: now(8),
    },
    {
      id: 'star-map',
      starName: '心智模型',
      surfaceText: '模型不是在复制现实，它只是帮我在复杂世界里先找到方向。',
      originalSignal: '所有模型都是对现实的简化，简化会带来可用性，也会带来盲区。',
      myDecode: '我理解，模型的价值不在于永远正确，而在于它让我知道下一步该观察什么。',
      correctionMark: '“有用”不等于“真实”。一个模型可以很好用，同时仍然遗漏关键变量。',
      resonanceFreq: '像地图与地形：地图能帮我导航，但不能替我走过真实的坡和河。',
      decayBoundary:
        '当地图的比例、用途或更新时间不匹配现场情况时，它就会误导我；复杂系统中尤其要警惕遗漏变量。',
      unsolvedSignal: '我现在最依赖的模型，最可能在哪种场景里失效？',
      form: StarForm.Constellation,
      positionX: -1.8,
      positionY: 6.5,
      positionZ: 5,
      captureId: 'capture-map',
      hasDeduction: false,
      deductionCount: 0,
      createdAt: now(7),
      ignitedAt: now(6),
    },
    {
      id: 'star-sunk-cost',
      starName: '沉没成本',
      surfaceText: '已经花了三个月，现在放弃会不会太可惜？',
      originalSignal: '沉没成本是已经发生且无法收回的投入，不应成为未来决策的主要依据。',
      myDecode: '我理解，真正要比较的是从此刻继续投入的新成本，以及它未来还能带来什么。',
      correctionMark: '“已经投入很多”不是继续的理由；“未来是否值得”才是。',
      resonanceFreq: '像一部很难看的电影：票钱已经付了，不必为了不浪费票钱再搭上一小时。',
      decayBoundary:
        '如果继续做这件事本身能产生新的独立价值，那就不是因为沉没成本继续，而是出现了新的收益判断。',
      unsolvedSignal: '如果把过去的投入全部清零，我今天还会主动开始这件事吗？',
      form: StarForm.Pulsar,
      positionX: 4.8,
      positionY: 1.4,
      positionZ: 8,
      captureId: 'capture-sunk-cost',
      hasDeduction: false,
      deductionCount: 0,
      createdAt: now(5),
      ignitedAt: now(4),
    },
    {
      id: 'star-feedback',
      starName: '反馈回路',
      surfaceText: '推荐算法不是一次猜中我喜欢什么，而是不断根据我的点击调整下一次推荐。',
      originalSignal: '系统会根据用户行为更新输出，而更新后的输出又会继续塑造下一次行为。',
      myDecode: '我理解，真正值得观察的不是单次推荐准不准，而是这个回路把我带向了哪里。',
      correctionMark: '把问题归因给“算法很聪明”不完整，用户每一次停留和划走也参与了系统更新。',
      resonanceFreq: '像回音壁：不是墙在说话，是你发出的声音被反复送回并越来越响。',
      decayBoundary:
        '如果平台没有根据行为调整内容，或者用户接触信息的渠道非常多元，回音壁效应会减弱。',
      unsolvedSignal: '我怎样知道，自己看到的世界是被算法放大的，还是本来就这么窄？',
      form: StarForm.Pulsar,
      positionX: 0.9,
      positionY: -4.8,
      positionZ: 7,
      captureId: 'capture-feedback',
      hasDeduction: true,
      deductionCount: 2,
      createdAt: now(3),
      ignitedAt: now(2),
    },
    {
      id: 'star-simplicity',
      starName: '信息压缩',
      surfaceText: '真正清楚的表达应该更短，但短不等于只说一半。',
      originalSignal: '好的解释在降低理解成本的同时，需要保留决定结论是否成立的关键条件。',
      myDecode: '我理解，简洁不是删掉复杂性，而是把复杂部分压缩成用户能继续展开的线索。',
      correctionMark: '把“简洁”理解成越短越好，会遗漏类比、前提和例外。',
      resonanceFreq: undefined,
      decayBoundary: undefined,
      unsolvedSignal: '一句话解释中，最少必须保留哪几个限定条件？',
      form: StarForm.Pulsar,
      positionX: 8.2,
      positionY: -1.8,
      positionZ: 3,
      captureId: 'capture-simplicity',
      hasDeduction: false,
      deductionCount: 0,
      createdAt: now(2),
      ignitedAt: now(1),
    },
    {
      id: 'star-delay',
      starName: '延迟满足',
      surfaceText: '每次打开手机，我都像被一个很短的奖励钩住。',
      originalSignal: '即时反馈会提高当前行为的重复概率，并让延迟回报显得更远。',
      myDecode: '',
      correctionMark: '',
      resonanceFreq: undefined,
      decayBoundary: undefined,
      unsolvedSignal: '',
      form: StarForm.StarDust,
      positionX: 5.8,
      positionY: 7.2,
      positionZ: -1,
      captureId: 'capture-delay',
      hasDeduction: false,
      deductionCount: 0,
      createdAt: now(0),
    },
    {
      id: 'star-system',
      starName: '局部最优',
      surfaceText: '每个环节都优化了，为什么整体反而更慢？',
      originalSignal: '局部指标的提升可能把成本转移给系统里的其他环节。',
      myDecode: '',
      correctionMark: '',
      resonanceFreq: undefined,
      decayBoundary: undefined,
      unsolvedSignal: '',
      form: StarForm.StarDust,
      positionX: -8.5,
      positionY: -3.2,
      positionZ: 1,
      captureId: 'capture-system',
      hasDeduction: false,
      deductionCount: 0,
      createdAt: now(0),
    },
  ]

  const captures: Capture[] = [
    {
      id: 'capture-delay',
      starName: '延迟满足',
      sourceText: '即时反馈会提高当前行为的重复概率，并让延迟回报显得更远。',
      sourceApp: '《思考，快与慢》',
      myRewrite: '每次打开手机，我都像被一个很短的奖励钩住。',
      isQuestion: false,
      processed: false,
      capturedAt: now(0),
    },
    {
      id: 'capture-system',
      starName: '局部最优',
      sourceText: '局部指标的提升可能把成本转移给系统里的其他环节。',
      sourceApp: '《系统之美》',
      myRewrite: '每个环节都优化了，为什么整体反而更慢？',
      isQuestion: true,
      processed: false,
      capturedAt: now(0),
    },
    {
      id: 'capture-attention',
      starName: '注意力分配',
      sourceText: '注意力不是一种无限可调用的意志资源，它会被环境中的提示与干扰持续分配。',
      sourceApp: '注意力研究摘记',
      myRewrite: '以前我总觉得自己不够自律，可能不是。',
      isQuestion: false,
      processed: true,
      capturedAt: now(9),
      processedAt: now(8),
    },
    {
      id: 'capture-map',
      starName: '心智模型',
      sourceText: '所有模型都是对现实的简化，简化会带来可用性，也会带来盲区。',
      sourceApp: '学习方法笔记',
      myRewrite: '模型不是在复制现实，它只是帮我在复杂世界里先找到方向。',
      isQuestion: false,
      processed: true,
      capturedAt: now(7),
      processedAt: now(6),
    },
    {
      id: 'capture-sunk-cost',
      starName: '沉没成本',
      sourceText: '沉没成本是已经发生且无法收回的投入，不应成为未来决策的主要依据。',
      sourceApp: '经济学阅读',
      myRewrite: '已经花了三个月，现在放弃会不会太可惜？',
      isQuestion: false,
      processed: true,
      capturedAt: now(5),
      processedAt: now(4),
    },
    {
      id: 'capture-feedback',
      starName: '反馈回路',
      sourceText: '系统会根据用户行为更新输出，而更新后的输出又会继续塑造下一次行为。',
      sourceApp: '注意力研究摘记',
      myRewrite: '推荐算法不是一次猜中我喜欢什么，而是不断根据我的点击调整下一次推荐。',
      isQuestion: false,
      processed: true,
      capturedAt: now(3),
      processedAt: now(2),
    },
    {
      id: 'capture-simplicity',
      starName: '信息压缩',
      sourceText: '好的解释在降低理解成本的同时，需要保留决定结论是否成立的关键条件。',
      sourceApp: '学习方法笔记',
      myRewrite: '真正清楚的表达应该更短，但短不等于只说一半。',
      isQuestion: false,
      processed: true,
      capturedAt: now(2),
      processedAt: now(1),
    },
  ]

  const connections: Connection[] = [
    {
      id: 'connection-1',
      starAId: 'star-attention',
      starBId: 'star-map',
      relationType: 'resonance',
      note: '注意力和模型都说明：可见的局部并不能代表整体的运行方式。',
      createdAt: now(5),
    },
    {
      id: 'connection-2',
      starAId: 'star-attention',
      starBId: 'star-sunk-cost',
      relationType: 'orbit',
      note: '先理解注意力会被环境分配，才能理解为什么及时止损比硬撑更重要。',
      createdAt: now(4),
    },
    {
      id: 'connection-3',
      starAId: 'star-map',
      starBId: 'star-feedback',
      relationType: 'nebula_wrap',
      note: '反馈回路是模型如何被现实持续修正的一个例子。',
      createdAt: now(2),
    },
  ]

  const blackHoles: BlackHole[] = [
    {
      id: 'blackhole-1',
      question: '信息越多，为什么有时反而越难做判断？',
      positionX: 10.5,
      positionY: 3.8,
      positionZ: -2,
      createdAt: now(1),
    },
  ]

  const deductions: Deduction[] = [
    {
      id: 'deduction-1',
      starId: 'star-attention',
      content: '如果注意力是环境分配的，那么“减少选择”可能比“增加意志力”更有效。',
      sourceSessionId: 'pulse-1',
      createdAt: now(1),
    },
    {
      id: 'deduction-2',
      starId: 'star-feedback',
      content: '推荐系统改变的不只是信息，也改变了我下一次愿意点开什么。',
      sourceSessionId: 'pulse-1',
      createdAt: now(1),
    },
  ]

  const pulseLogSessions: PulseLogSession[] = [
    {
      id: 'pulse-1',
      sourceCoordinate: '注意力研究摘记',
      rawText:
        '注意力不是意志力，环境设计可能比硬撑更重要。\n推荐系统会根据我的行为继续塑造下一次选择。\n也许问题不是信息太多，而是我没有任何暂停点。',
      createdAt: now(1),
    },
  ]

  const floatingThoughts: FloatingThought[] = [
    {
      id: 'thought-1',
      sessionId: 'pulse-1',
      content: '也许问题不是信息太多，而是我没有任何暂停点。',
      createdAt: now(1),
    },
  ]

  return {
    captures,
    stars,
    connections,
    blackHoles,
    deductions,
    pulseLogSessions,
    floatingThoughts,
    settings: {},
  }
}

function loadDatabase(): WebDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedData()
    const parsed = JSON.parse(raw) as Partial<WebDatabase>
    return {
      ...createSeedData(),
      ...parsed,
      captures: Array.isArray(parsed.captures) ? parsed.captures : [],
      stars: Array.isArray(parsed.stars) ? parsed.stars : [],
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
      blackHoles: Array.isArray(parsed.blackHoles) ? parsed.blackHoles : [],
      deductions: Array.isArray(parsed.deductions) ? parsed.deductions : [],
      pulseLogSessions: Array.isArray(parsed.pulseLogSessions) ? parsed.pulseLogSessions : [],
      floatingThoughts: Array.isArray(parsed.floatingThoughts) ? parsed.floatingThoughts : [],
      settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {},
    }
  } catch {
    return createSeedData()
  }
}

let database = loadDatabase()

function saveDatabase() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
  } catch {
    // The demo still works for the current tab when storage is unavailable.
  }
}

function createId(prefix: string) {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${id}`
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function bigrams(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/[\s，。、“”‘’：；！？,.;:!?()[\]{}]/g, '')
  const tokens = new Set<string>()
  for (let index = 0; index < normalized.length - 1; index += 1) {
    tokens.add(normalized.slice(index, index + 2))
  }
  normalized
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .forEach((word) => tokens.add(word))
  return tokens
}

const genericTokens = new Set(['什么', '为什', '怎么', '可以', '一个', '这个', '那个', '就是', '不是', '如何', '是否'])

const searchConcepts: Record<string, { terms: string[]; label: string }> = {
  'star-attention': {
    terms: ['注意', '专注', '分心', '自律', '信息', '判断', '环境'],
    label: '注意力如何被环境与信息分配',
  },
  'star-feedback': {
    terms: ['信息', '推荐', '算法', '反馈', '回路', '回声', '判断'],
    label: '反馈如何放大或塑造判断',
  },
  'star-map': {
    terms: ['模型', '地图', '理解', '解释', '知识', '盲区'],
    label: '模型如何帮助理解又会遗漏现实',
  },
  'star-sunk-cost': {
    terms: ['成本', '投入', '放弃', '决定', '选择', '未来'],
    label: '过去投入如何影响未来决策',
  },
  'star-simplicity': {
    terms: ['简洁', '表达', '解释', '边界', '前提', '条件'],
    label: '简洁表达与关键边界的取舍',
  },
  'star-delay': {
    terms: ['奖励', '手机', '延迟', '长期', '即时'],
    label: '即时奖励如何影响长期注意力',
  },
  'star-system': {
    terms: ['系统', '局部', '整体', '优化', '转移'],
    label: '局部优化如何影响整体系统',
  },
}

function findRelatedStars(query: string, limit = 4): EchoResult[] {
  const queryTokens = new Set(Array.from(bigrams(query)).filter((token) => !genericTokens.has(token)))
  const ranked = database.stars
    .map((star) => {
      const text = [
        star.starName,
        star.surfaceText,
        star.originalSignal,
        star.myDecode,
        star.correctionMark,
      ]
        .filter(Boolean)
        .join(' ')
      const starTokens = new Set(
        Array.from(bigrams(text)).filter((token) => !genericTokens.has(token)),
      )
      const overlap = Array.from(queryTokens).filter((token) => starTokens.has(token)).length
      const concept = searchConcepts[star.id]
      const directConceptHits = concept?.terms.filter((term) => query.includes(term)) || []
      const baseline =
        star.form === StarForm.Constellation ? 0.3 : star.form === StarForm.Pulsar ? 0.27 : 0.22
      const score = Math.min(0.96, baseline + overlap * 0.075 + directConceptHits.length * 0.19)
      const explanation =
        directConceptHits.length > 0
          ? `都涉及${concept?.label || '相近的理解机制'}`
          : overlap > 0
            ? `与查询共享“${Array.from(queryTokens).find((token) => starTokens.has(token)) || '核心概念'}”等语义线索`
            : '与查询分享了相近的理解与判断问题'
      return {
        starId: star.id,
        starName: star.starName,
        surfaceText: star.surfaceText,
        myDecode: star.myDecode,
        relevanceScore: score,
        explanation,
      }
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .filter((result) => result.relevanceScore >= 0.4)
    .slice(0, limit)
  return ranked
}

function buildIgnitedCard(input: {
  originalStardust: string
  firstReaction: string
}) {
  const corpus = `${input.originalStardust} ${input.firstReaction}`
  const isAttention = /注意|专注|信息|手机|算法/.test(corpus)
  const isDecision = /成本|选择|决定|放弃|投入/.test(corpus)
  const analogy = isAttention
    ? '像剧场里的追光：被照亮的地方更容易被注意，但灯光并不是意志力。'
    : isDecision
      ? '像一张已经买下的电影票：票钱收不回来，所以是否继续看只取决于接下来还值不值得。'
      : '像地图和地形：地图帮助定位，但地图永远不是现场本身。'
  const boundaries = isAttention
    ? ['当环境无法调整时，只做环境设计仍然不够；', '当分心来自睡眠、焦虑或身体状态时，不能只归因于界面设计。']
    : isDecision
      ? ['如果继续投入能带来新的独立收益，判断依据就不再只是沉没成本；', '当过去投入会产生未来义务或承诺成本时，也要把它视为新的约束。']
      : ['当模型遗漏了决定结果的关键变量时，它会失效；', '当环境变化快到模型来不及更新时，旧解释也会误导。']

  return {
    firstReaction: input.firstReaction,
    originalSignal: input.originalStardust || '用户暂未填写原文',
    myDecode: `我理解，这条内容真正想保留的区别是：不要把“看起来相关”直接等同于“已经理解”。`,
    correctionMark: isAttention
      ? '不要把每一次分心都解释成个人意志薄弱；环境提示也在持续分配注意力。'
      : isDecision
        ? '“已经投入很多”不是继续的充分理由；需要单独判断未来还能获得什么。'
        : '目前没有明显事实错误，但需要说明这条结论成立的前提。',
    resonanceFreq: analogy,
    decayBoundary: boundaries.join('\n'),
    unsolvedSignal: '如果去掉最显眼的那个因素，这个结论还成立吗？',
  }
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const webAPI = {
  db: {
    query: async () => [],
    run: async () => ({ success: true }),
    get: async () => null,
    all: async () => [],
  },

  ai: {
    ignite: async (input: { originalStardust: string; firstReaction: string }) => {
      await wait(720)
      return { success: true, data: buildIgnitedCard(input) }
    },
    searchSimilar: async ({ query }: { query: string }) => {
      await wait(420)
      return { success: true, data: findRelatedStars(query) }
    },
  },

  star: {
    create: async (data: Record<string, unknown>) => {
      const id = String(data.id || createId('star'))
      const star: Star = {
        id,
        starName: data.starName as string | undefined,
        surfaceText: String(data.surfaceText || ''),
        originalSignal: data.originalSignal as string | undefined,
        myDecode: data.myDecode as string | undefined,
        correctionMark: data.correctionMark as string | undefined,
        resonanceFreq: data.resonanceFreq as string | undefined,
        decayBoundary: data.decayBoundary as string | undefined,
        unsolvedSignal: data.unsolvedSignal as string | undefined,
        form: Number(data.form || StarForm.Pulsar) as StarForm,
        positionX: Number(data.positionX || 0),
        positionY: Number(data.positionY || 0),
        positionZ: Number(data.positionZ || 0),
        captureId: data.captureId as string | undefined,
        hasDeduction: Boolean(data.hasDeduction),
        deductionCount: Number(data.deductionCount || 0),
        createdAt: new Date().toISOString(),
        ignitedAt: new Date().toISOString(),
      }
      database.stars.unshift(star)
      saveDatabase()
      return { id }
    },
    getAll: async () => [...database.stars].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getById: async (id: string) => database.stars.find((star) => star.id === id) || null,
    update: async (id: string, updates: Record<string, unknown>) => {
      database.stars = database.stars.map((star) =>
        star.id === id ? ({ ...star, ...updates } as Star) : star,
      )
      saveDatabase()
      return { success: true }
    },
    delete: async (id: string) => {
      const captureId = database.stars.find((star) => star.id === id)?.captureId
      database.stars = database.stars.filter((star) => star.id !== id)
      database.captures = database.captures.filter((capture) => capture.id !== captureId)
      database.connections = database.connections.filter(
        (connection) => connection.starAId !== id && connection.starBId !== id,
      )
      database.deductions = database.deductions.filter((deduction) => deduction.starId !== id)
      saveDatabase()
      return { success: true }
    },
  },

  connection: {
    create: async (data: {
      starAId: string
      starBId: string
      relationType: Connection['relationType']
      note?: string
    }) => {
      const id = createId('connection')
      database.connections.push({
        id,
        starAId: data.starAId,
        starBId: data.starBId,
        relationType: data.relationType,
        note: data.note,
        createdAt: new Date().toISOString(),
      })
      saveDatabase()
      return { id }
    },
    getAll: async () => [...database.connections],
    getForStar: async (starId: string) =>
      database.connections.filter(
        (connection) => connection.starAId === starId || connection.starBId === starId,
      ),
    delete: async (id: string) => {
      database.connections = database.connections.filter((connection) => connection.id !== id)
      saveDatabase()
      return { success: true }
    },
  },

  capture: {
    save: async (data: CaptureInput) => {
      const captureId = createId('capture')
      const starId = createId('star')
      const createdAt = new Date().toISOString()
      const starName = data.starName || data.myRewrite.slice(0, 15) || '未命名星光'
      const capture: Capture = {
        id: captureId,
        starName,
        sourceText: data.sourceText,
        sourceApp: data.sourceApp,
        sourceUrl: data.sourceUrl,
        myRewrite: data.myRewrite,
        isQuestion: Boolean(data.isQuestion),
        processed: false,
        capturedAt: createdAt,
      }
      database.captures.unshift(capture)
      database.stars.unshift({
        id: starId,
        starName,
        surfaceText: data.myRewrite || data.sourceText,
        originalSignal: data.sourceText,
        form: StarForm.StarDust,
        positionX: (Math.random() - 0.5) * 30,
        positionY: (Math.random() - 0.5) * 20,
        positionZ: (Math.random() - 0.5) * 25 + 10,
        captureId,
        hasDeduction: false,
        deductionCount: 0,
        createdAt,
      })
      saveDatabase()
      captureSavedTarget.dispatchEvent(new Event('capture:saved'))
      return { id: captureId, starId }
    },
    getAll: async () => [...database.captures].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    markProcessed: async (id: string) => {
      database.captures = database.captures.map((capture) =>
        capture.id === id
          ? { ...capture, processed: true, processedAt: new Date().toISOString() }
          : capture,
      )
      saveDatabase()
      return { success: true }
    },
    delete: async (id: string) => {
      database.captures = database.captures.filter((capture) => capture.id !== id)
      const relatedStarIds = database.stars
        .filter((star) => star.captureId === id)
        .map((star) => star.id)
      database.stars = database.stars.filter((star) => star.captureId !== id)
      database.connections = database.connections.filter(
        (connection) =>
          !relatedStarIds.includes(connection.starAId) && !relatedStarIds.includes(connection.starBId),
      )
      saveDatabase()
      return { success: true }
    },
    getBySource: async (sourceApp: string) =>
      database.captures
        .filter((capture) => capture.sourceApp === sourceApp)
        .map((capture) => {
          const star = database.stars.find((item) => item.captureId === capture.id)
          return {
            ...capture,
            star_id: star?.id,
            star_name: star?.starName,
            star_surface_text: star?.surfaceText,
            star_form: star?.form,
          }
        }),
    updateSource: async (captureId: string, sourceApp: string) => {
      database.captures = database.captures.map((capture) =>
        capture.id === captureId ? { ...capture, sourceApp: sourceApp || undefined } : capture,
      )
      saveDatabase()
      return { success: true }
    },
    onSaved: (callback: () => void) => {
      captureSavedTarget.addEventListener('capture:saved', callback)
      return () => captureSavedTarget.removeEventListener('capture:saved', callback)
    },
  },

  pulse: {
    getSourceCoords: async () => {
      const counts = new Map<string, number>()
      database.captures.forEach((capture) => {
        if (capture.sourceApp) counts.set(capture.sourceApp, (counts.get(capture.sourceApp) || 0) + 1)
      })
      return Array.from(counts, ([source_app, star_count]) => ({ source_app, star_count })).sort(
        (a, b) => b.star_count - a.star_count,
      )
    },
    create: async (data: { sourceCoord: string; rawText: string }) => {
      const id = createId('pulse')
      database.pulseLogSessions.unshift({
        id,
        sourceCoordinate: data.sourceCoord,
        rawText: data.rawText,
        createdAt: new Date().toISOString(),
      })
      saveDatabase()
      return { id }
    },
    updateDraft: async (id: string, rawText: string) => {
      database.pulseLogSessions = database.pulseLogSessions.map((session) =>
        session.id === id ? { ...session, rawText } : session,
      )
      saveDatabase()
      return { success: true }
    },
    getBySource: async (sourceCoord: string) =>
      database.pulseLogSessions.filter((session) => session.sourceCoordinate === sourceCoord),
    parseAndDistribute: async (data: {
      sessionId: string
      rawText: string
      sourceCoord: string
    }) => {
      await wait(620)
      const sessionId = data.sessionId || createId('pulse')
      const existing = database.pulseLogSessions.find((session) => session.id === sessionId)
      if (existing) {
        existing.rawText = data.rawText
        existing.createdAt = new Date().toISOString()
      } else {
        database.pulseLogSessions.unshift({
          id: sessionId,
          sourceCoordinate: data.sourceCoord,
          rawText: data.rawText,
          createdAt: new Date().toISOString(),
        })
      }

      const paragraphs = data.rawText
        .split(/\n+|(?<=[。！？])/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
      const matched: Array<{ starId: string; starName: string; paragraph: string }> = []
      const unmatched: Array<{ paragraph: string }> = []

      paragraphs.forEach((paragraph) => {
        const candidate = findRelatedStars(paragraph, 1)[0]
        if (candidate && candidate.relevanceScore >= 0.5) {
          const star = database.stars.find((item) => item.id === candidate.starId)
          database.deductions.unshift({
            id: createId('deduction'),
            starId: candidate.starId,
            content: paragraph,
            sourceSessionId: sessionId,
            createdAt: new Date().toISOString(),
          })
          if (star) {
            star.hasDeduction = true
            star.deductionCount += 1
          }
          matched.push({
            starId: candidate.starId,
            starName: candidate.starName || star?.surfaceText.slice(0, 15) || '脉冲星',
            paragraph,
          })
        } else {
          database.floatingThoughts.unshift({
            id: createId('thought'),
            sessionId,
            content: paragraph,
            createdAt: new Date().toISOString(),
          })
          unmatched.push({ paragraph })
        }
      })
      saveDatabase()
      return { success: true, data: { sessionId, matched, unmatched } }
    },
  },

  deduction: {
    create: async (data: { starId: string; content: string; sourceSessionId?: string }) => {
      const id = createId('deduction')
      database.deductions.unshift({
        id,
        starId: data.starId,
        content: data.content,
        sourceSessionId: data.sourceSessionId,
        createdAt: new Date().toISOString(),
      })
      saveDatabase()
      return { id }
    },
    getForStar: async (starId: string) =>
      database.deductions
        .filter((deduction) => deduction.starId === starId)
        .map((deduction) => ({
          id: deduction.id,
          star_id: deduction.starId,
          content: deduction.content,
          source_session_id: deduction.sourceSessionId,
          created_at: deduction.createdAt,
        })),
  },

  floatingThought: {
    getAll: async () => [...database.floatingThoughts],
    delete: async (id: string) => {
      database.floatingThoughts = database.floatingThoughts.filter((thought) => thought.id !== id)
      saveDatabase()
      return { success: true }
    },
  },

  blackhole: {
    create: async (data: { question: string; starId?: string }) => {
      const blackHole: BlackHole = {
        id: createId('blackhole'),
        question: data.question,
        starId: data.starId,
        positionX: (Math.random() - 0.5) * 40,
        positionY: (Math.random() - 0.5) * 30,
        positionZ: (Math.random() - 0.5) * 35 + 15,
        createdAt: new Date().toISOString(),
      }
      database.blackHoles.unshift(blackHole)
      saveDatabase()
      return {
        ...blackHole,
        positionX: blackHole.positionX,
        positionY: blackHole.positionY,
        positionZ: blackHole.positionZ,
      }
    },
    getAll: async () => [...database.blackHoles],
    delete: async (id: string) => {
      database.blackHoles = database.blackHoles.filter((blackHole) => blackHole.id !== id)
      saveDatabase()
      return { success: true }
    },
    searchRelated: async ({ question }: { question: string; blackHoleId: string }) => {
      await wait(460)
      return { success: true, data: findRelatedStars(question, 3) }
    },
  },

  stt: {
    transcribe: async () => ({
      success: false,
      error: '浏览器 Demo 暂不连接语音转写服务',
    }),
  },

  window: {
    closeFloating: async () => {
      window.location.hash = '#/'
    },
    focusMain: async () => {
      window.focus()
    },
  },

  settings: {
    getAll: async () => ({ ...database.settings }),
    get: async (key: string) => database.settings[key] || '',
    set: async (key: string, value: string) => {
      database.settings[key] = value
      saveDatabase()
      return { success: true }
    },
  },

  data: {
    exportToFile: async () => {
      downloadJson(`star-atlas-demo-${new Date().toISOString().slice(0, 10)}.json`, {
        version: 'web-demo-1.0',
        exportedAt: new Date().toISOString(),
        appName: 'star-atlas-web-demo',
        data: database,
      })
      return {
        success: true,
        counts: {
          stars: database.stars.length,
          connections: database.connections.length,
          deductions: database.deductions.length,
          blackHoles: database.blackHoles.length,
        },
      }
    },
    importFromFile: async () => {
      return {
        success: false,
        error: '浏览器 Demo 暂不支持文件导入，可继续使用当前本地演示数据。',
      }
    },
  },
}

declare global {
  interface Window {
    electronAPI: any
    resetStarAtlasDemo?: () => void
  }
}

window.electronAPI = webAPI as any
window.resetStarAtlasDemo = () => {
  database = createSeedData()
  saveDatabase()
  window.location.hash = '#/'
  window.location.reload()
}
