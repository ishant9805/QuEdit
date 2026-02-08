import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sheet, SheetQuestion, TopicGroup, SubTopicGroup, CreateQuestionPayload } from '@/types'
import * as api from '@/services/api'

export const useSheetStore = defineStore('sheet', () => {
  // ─── State ───
  const sheet = ref<Sheet | null>(null)
  const questions = ref<SheetQuestion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const filterDifficulty = ref<string>('all')

  // ─── Helpers ───
  function filterQuestion(q: SheetQuestion): boolean {
    const matchesSearch =
      !searchQuery.value ||
      q.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      q.questionId.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (q.subTopic && q.subTopic.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesDifficulty =
      filterDifficulty.value === 'all' ||
      q.questionId.difficulty === filterDifficulty.value

    return matchesSearch && matchesDifficulty
  }

  // ─── Computed: build hierarchical topic → subtopic → question groups ───
  const topicGroups = computed<TopicGroup[]>(() => {
    if (!sheet.value) return []

    const topicOrder = sheet.value.config.topicOrder
    const subTopicOrder = sheet.value.config.subTopicOrder || {}

    // All questions, preserving their original array order (which is the "question order")
    const allQ = questions.value

    return topicOrder.map((topicName) => {
      // All questions for this topic, in array order
      const topicQuestions = allQ.filter((q) => q.topic === topicName)

      // Build the sub-topic list: start from declared subTopicOrder, then add any extras from questions
      const declaredSubs = subTopicOrder[topicName] || []
      const questionSubs = [...new Set(
        topicQuestions.filter((q) => q.subTopic).map((q) => q.subTopic as string),
      )]
      const allSubTopicNames = [
        ...declaredSubs,
        ...questionSubs.filter((st) => !declaredSubs.includes(st)),
      ]

      // Build sub-topic groups
      const subTopics: SubTopicGroup[] = allSubTopicNames.map((stName) => {
        const stQuestions = topicQuestions.filter((q) => q.subTopic === stName)
        const filteredStQuestions = stQuestions.filter(filterQuestion)
        return {
          name: stName,
          questions: filteredStQuestions,
          allQuestions: stQuestions, // unfiltered, for stats
          collapsed: false,
        }
      })

      // Questions directly under the topic (no sub-topic)
      const directQuestions = topicQuestions.filter((q) => !q.subTopic)
      const filteredDirectQuestions = directQuestions.filter(filterQuestion)

      return {
        name: topicName,
        subTopics,
        questions: filteredDirectQuestions,
        allQuestions: directQuestions,
        collapsed: false,
      }
    })
  })

  // ─── Stats ───
  const totalQuestions = computed(() => questions.value.length)
  const solvedQuestions = computed(
    () => questions.value.filter((q) => q.isSolved).length,
  )
  const topicStats = computed(() => {
    const stats: Record<string, { total: number; solved: number }> = {}
    questions.value.forEach((q) => {
      if (!stats[q.topic]) stats[q.topic] = { total: 0, solved: 0 }
      stats[q.topic].total++
      if (q.isSolved) stats[q.topic].solved++
    })
    return stats
  })

  // ─── Actions ───

  async function initialize() {
    loading.value = true
    error.value = null
    try {
      const data = await api.fetchSheetData()
      sheet.value = data.sheet
      questions.value = data.questions
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Topic actions
  async function addTopic(name: string) {
    try {
      sheet.value = await api.addTopic(name)
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function updateTopic(oldName: string, newName: string) {
    try {
      sheet.value = await api.updateTopic(oldName, newName)
      questions.value = api.getQuestions()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function deleteTopic(name: string) {
    try {
      sheet.value = await api.deleteTopic(name)
      questions.value = api.getQuestions()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function reorderTopics(newOrder: string[]) {
    try {
      sheet.value = await api.reorderTopics(newOrder)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  // Sub-topic actions
  async function addSubTopic(topicName: string, subTopicName: string) {
    try {
      sheet.value = await api.addSubTopic(topicName, subTopicName)
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function updateSubTopic(topicName: string, oldName: string, newName: string) {
    try {
      sheet.value = await api.updateSubTopic(topicName, oldName, newName)
      questions.value = api.getQuestions()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function deleteSubTopic(topicName: string, subTopicName: string) {
    try {
      sheet.value = await api.deleteSubTopic(topicName, subTopicName)
      questions.value = api.getQuestions()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function reorderSubTopics(topicName: string, newOrder: string[]) {
    try {
      sheet.value = await api.reorderSubTopics(topicName, newOrder)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  // Question actions
  async function addQuestion(payload: CreateQuestionPayload) {
    try {
      const newQ = await api.addQuestion(payload)
      questions.value = api.getQuestions()
      return newQ
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function updateQuestion(payload: { _id: string; title?: string; topic?: string; subTopic?: string | null; resource?: string | null }) {
    try {
      await api.updateQuestion(payload)
      questions.value = api.getQuestions()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function deleteQuestion(questionId: string) {
    try {
      await api.deleteQuestion(questionId)
      questions.value = api.getQuestions()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function toggleSolved(questionId: string) {
    try {
      await api.toggleQuestionSolved(questionId)
      questions.value = api.getQuestions()
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function reorderQuestions(topic: string, subTopic: string | null, ids: string[]) {
    try {
      await api.reorderQuestions(topic, subTopic, ids)
      questions.value = api.getQuestions()
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  return {
    // State
    sheet,
    questions,
    loading,
    error,
    searchQuery,
    filterDifficulty,
    // Computed
    topicGroups,
    totalQuestions,
    solvedQuestions,
    topicStats,
    // Actions
    initialize,
    addTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
    addSubTopic,
    updateSubTopic,
    deleteSubTopic,
    reorderSubTopics,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    toggleSolved,
    reorderQuestions,
  }
})
