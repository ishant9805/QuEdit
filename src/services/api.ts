import type {
  SheetApiResponse,
  Sheet,
  SheetQuestion,
  CreateQuestionPayload,
  UpdateQuestionPayload,
} from '@/types'

const API_BASE = 'https://node.codolio.com/api/question-tracker/v1/sheet/public'

// ─── In-memory store (simulates a database) ───
let cachedSheet: Sheet | null = null
let cachedQuestions: SheetQuestion[] = []
let initialized = false

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

// ─── Fetch & Seed ───

export async function fetchSheetData(): Promise<{ sheet: Sheet; questions: SheetQuestion[] }> {
  if (initialized) {
    return { sheet: structuredClone(cachedSheet!), questions: structuredClone(cachedQuestions) }
  }

  try {
    const res = await fetch(`${API_BASE}/get-sheet-by-slug/striver-sde-sheet`)
    const json: SheetApiResponse = await res.json()

    if (json.status.success) {
      cachedSheet = json.data.sheet
      cachedQuestions = json.data.questions

      // Ensure subTopicOrder exists for every topic
      if (!cachedSheet.config.subTopicOrder) {
        cachedSheet.config.subTopicOrder = {}
      }
      for (const topic of cachedSheet.config.topicOrder) {
        if (!cachedSheet.config.subTopicOrder[topic]) {
          // Derive subtopic order from questions
          const subs: string[] = []
          cachedQuestions.forEach((q) => {
            if (q.topic === topic && q.subTopic && !subs.includes(q.subTopic)) {
              subs.push(q.subTopic)
            }
          })
          cachedSheet.config.subTopicOrder[topic] = subs
        }
      }

      initialized = true
      return { sheet: structuredClone(cachedSheet), questions: structuredClone(cachedQuestions) }
    }
    throw new Error(json.status.message)
  } catch (error) {
    console.error('API fetch failed, using empty dataset:', error)
    cachedSheet = createEmptySheet()
    cachedQuestions = []
    initialized = true
    return { sheet: structuredClone(cachedSheet), questions: [] }
  }
}

function createEmptySheet(): Sheet {
  return {
    _id: generateId(),
    name: 'My Question Sheet',
    description: 'A custom question sheet',
    config: {
      topicOrder: [],
      subTopicOrder: {},
      questionOrder: [],
    },
    visibility: 'public',
    followers: 0,
    tag: [],
    slug: 'my-question-sheet',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ─── Topic CRUD ───

export async function addTopic(name: string): Promise<Sheet> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  if (cachedSheet.config.topicOrder.includes(name)) {
    throw new Error(`Topic "${name}" already exists`)
  }
  cachedSheet.config.topicOrder.push(name)
  cachedSheet.config.subTopicOrder[name] = []
  cachedSheet.updatedAt = new Date().toISOString()
  return structuredClone(cachedSheet)
}

export async function updateTopic(oldName: string, newName: string): Promise<Sheet> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  const idx = cachedSheet.config.topicOrder.indexOf(oldName)
  if (idx === -1) throw new Error(`Topic "${oldName}" not found`)
  if (oldName !== newName && cachedSheet.config.topicOrder.includes(newName)) {
    throw new Error(`Topic "${newName}" already exists`)
  }

  cachedSheet.config.topicOrder[idx] = newName

  // Update all questions under that topic
  cachedQuestions.forEach((q) => {
    if (q.topic === oldName) q.topic = newName
  })

  // Update subtopic order keys
  if (cachedSheet.config.subTopicOrder[oldName]) {
    cachedSheet.config.subTopicOrder[newName] = cachedSheet.config.subTopicOrder[oldName]
    delete cachedSheet.config.subTopicOrder[oldName]
  }

  cachedSheet.updatedAt = new Date().toISOString()
  return structuredClone(cachedSheet)
}

export async function deleteTopic(name: string): Promise<Sheet> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  cachedSheet.config.topicOrder = cachedSheet.config.topicOrder.filter((t) => t !== name)
  cachedQuestions = cachedQuestions.filter((q) => q.topic !== name)
  delete cachedSheet.config.subTopicOrder[name]
  cachedSheet.updatedAt = new Date().toISOString()
  return structuredClone(cachedSheet)
}

export async function reorderTopics(newOrder: string[]): Promise<Sheet> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  cachedSheet.config.topicOrder = [...newOrder]
  cachedSheet.updatedAt = new Date().toISOString()
  return structuredClone(cachedSheet)
}

// ─── Sub-Topic CRUD ───

export async function addSubTopic(topicName: string, subTopicName: string): Promise<Sheet> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  if (!cachedSheet.config.subTopicOrder[topicName]) {
    cachedSheet.config.subTopicOrder[topicName] = []
  }
  if (cachedSheet.config.subTopicOrder[topicName].includes(subTopicName)) {
    throw new Error(`Sub-topic "${subTopicName}" already exists under "${topicName}"`)
  }
  cachedSheet.config.subTopicOrder[topicName].push(subTopicName)
  cachedSheet.updatedAt = new Date().toISOString()
  return structuredClone(cachedSheet)
}

export async function updateSubTopic(
  topicName: string,
  oldName: string,
  newName: string,
): Promise<Sheet> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  const subs = cachedSheet.config.subTopicOrder[topicName]
  if (!subs) throw new Error(`Topic "${topicName}" has no sub-topics`)
  const idx = subs.indexOf(oldName)
  if (idx === -1) throw new Error(`Sub-topic "${oldName}" not found`)

  subs[idx] = newName
  cachedQuestions.forEach((q) => {
    if (q.topic === topicName && q.subTopic === oldName) q.subTopic = newName
  })
  cachedSheet.updatedAt = new Date().toISOString()
  return structuredClone(cachedSheet)
}

export async function deleteSubTopic(topicName: string, subTopicName: string): Promise<Sheet> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  if (cachedSheet.config.subTopicOrder[topicName]) {
    cachedSheet.config.subTopicOrder[topicName] = cachedSheet.config.subTopicOrder[
      topicName
    ].filter((s) => s !== subTopicName)
  }
  // Remove questions under this sub-topic
  cachedQuestions = cachedQuestions.filter(
    (q) => !(q.topic === topicName && q.subTopic === subTopicName),
  )
  cachedSheet.updatedAt = new Date().toISOString()
  return structuredClone(cachedSheet)
}

export async function reorderSubTopics(topicName: string, newOrder: string[]): Promise<Sheet> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  cachedSheet.config.subTopicOrder[topicName] = [...newOrder]
  cachedSheet.updatedAt = new Date().toISOString()
  return structuredClone(cachedSheet)
}

// ─── Question CRUD ───

export async function addQuestion(payload: CreateQuestionPayload): Promise<SheetQuestion> {
  if (!cachedSheet) throw new Error('Sheet not initialized')

  const newQuestion: SheetQuestion = {
    _id: generateId(),
    sheetId: cachedSheet._id,
    questionId: {
      _id: generateId(),
      id: generateId(),
      platform: payload.platform,
      slug: payload.title.toLowerCase().replace(/\s+/g, '-'),
      name: payload.title,
      difficulty: payload.difficulty,
      problemUrl: payload.problemUrl,
      topics: [payload.topic],
      description: '',
    },
    topic: payload.topic,
    title: payload.title,
    subTopic: payload.subTopic,
    resource: payload.resource,
    isPublic: true,
    isSolved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  cachedQuestions.push(newQuestion)
  return structuredClone(newQuestion)
}

export async function updateQuestion(payload: UpdateQuestionPayload): Promise<SheetQuestion> {
  const idx = cachedQuestions.findIndex((q) => q._id === payload._id)
  if (idx === -1) throw new Error(`Question "${payload._id}" not found`)

  const question = cachedQuestions[idx]
  if (payload.title !== undefined) {
    question.title = payload.title
    question.questionId.name = payload.title
  }
  if (payload.topic !== undefined) question.topic = payload.topic
  if (payload.subTopic !== undefined) question.subTopic = payload.subTopic
  if (payload.resource !== undefined) question.resource = payload.resource
  question.updatedAt = new Date().toISOString()

  return structuredClone(question)
}

export async function deleteQuestion(questionId: string): Promise<void> {
  if (!cachedSheet) throw new Error('Sheet not initialized')
  cachedQuestions = cachedQuestions.filter((q) => q._id !== questionId)
}

export async function reorderQuestions(
  topic: string,
  subTopic: string | null,
  questionIds: string[],
): Promise<void> {
  // Build a lookup of matching questions by id
  const matchFn = (q: SheetQuestion) =>
    q.topic === topic && (subTopic === null ? !q.subTopic : q.subTopic === subTopic)

  // Separate matching from non-matching questions
  const nonMatching = cachedQuestions.filter((q) => !matchFn(q))
  const reordered = questionIds
    .map((id) => cachedQuestions.find((q) => q._id === id))
    .filter(Boolean) as SheetQuestion[]

  // Rebuild: insert reordered questions at the position of the first original match
  const firstMatchIdx = cachedQuestions.findIndex(matchFn)
  if (firstMatchIdx === -1) {
    cachedQuestions = [...nonMatching, ...reordered]
  } else {
    // Find the insert position in the nonMatching array
    let insertAt = 0
    let origIdx = 0
    for (const q of cachedQuestions) {
      if (!matchFn(q)) {
        if (origIdx >= firstMatchIdx) break
        insertAt++
      }
      origIdx++
    }
    nonMatching.splice(insertAt, 0, ...reordered)
    cachedQuestions = nonMatching
  }
}

export async function toggleQuestionSolved(questionId: string): Promise<SheetQuestion> {
  const question = cachedQuestions.find((q) => q._id === questionId)
  if (!question) throw new Error(`Question "${questionId}" not found`)
  question.isSolved = !question.isSolved
  question.updatedAt = new Date().toISOString()
  return structuredClone(question)
}

// ─── Getters ───

export function getQuestions(): SheetQuestion[] {
  return structuredClone(cachedQuestions)
}

export function getSheet(): Sheet | null {
  return cachedSheet ? structuredClone(cachedSheet) : null
}
