// ─── Core Domain Types ───

export interface QuestionDetails {
  _id: string
  id: string | number
  platform: string
  slug: string
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Basic'
  problemUrl: string
  topics: string[]
  description?: string
  companyTags?: string[]
  verified?: boolean
}

export interface SheetQuestion {
  _id: string
  sheetId: string
  questionId: QuestionDetails
  topic: string
  title: string
  subTopic: string | null
  resource: string | null
  isPublic: boolean
  isSolved: boolean
  createdAt: string
  updatedAt: string
}

export interface SheetConfig {
  topicOrder: string[]
  subTopicOrder: Record<string, string[]>
  questionOrder: string[]
}

export interface Sheet {
  _id: string
  name: string
  description: string
  config: SheetConfig
  visibility: string
  followers: number
  tag: string[]
  slug: string
  banner?: string
  createdAt: string
  updatedAt: string
}

export interface SheetApiResponse {
  status: {
    code: number
    success: boolean
    message: string
    error: string | null
  }
  data: {
    sheet: Sheet
    questions: SheetQuestion[]
  }
}

// ─── Derived View Types (used in the UI) ───

export interface TopicGroup {
  name: string
  subTopics: SubTopicGroup[]
  questions: SheetQuestion[] // filtered questions without a subtopic
  allQuestions: SheetQuestion[] // unfiltered questions without a subtopic (for stats)
  collapsed: boolean
}

export interface SubTopicGroup {
  name: string
  questions: SheetQuestion[] // filtered questions
  allQuestions: SheetQuestion[] // unfiltered questions (for stats)
  collapsed: boolean
}

// ─── CRUD Payload Types ───

export interface CreateTopicPayload {
  name: string
}

export interface UpdateTopicPayload {
  oldName: string
  newName: string
}

export interface CreateSubTopicPayload {
  topicName: string
  subTopicName: string
}

export interface UpdateSubTopicPayload {
  topicName: string
  oldName: string
  newName: string
}

export interface CreateQuestionPayload {
  topic: string
  subTopic: string | null
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Basic'
  platform: string
  problemUrl: string
  resource: string | null
}

export interface UpdateQuestionPayload {
  _id: string
  title?: string
  topic?: string
  subTopic?: string | null
  resource?: string | null
}
