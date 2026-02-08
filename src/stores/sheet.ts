import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sheet, SheetQuestion, TopicGroup, SubTopicGroup, CreateQuestionPayload } from '@/types'
import * as api from '@/services/api'

export const useSheetStore = defineStore('sheet', () => {
  // ═══════════════════════════════════════════════════
  // ─── Canonical State (single source of truth) ───
  // ═══════════════════════════════════════════════════
  const sheet = ref<Sheet | null>(null)
  const questions = ref<SheetQuestion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Filter State (UI-driven, but owned by store for getter access) ───
  const searchQuery = ref('')
  const filterDifficulty = ref<string>('all')

  // ═══════════════════════════════════════════════════
  // ─── Private Helpers ───
  // ═══════════════════════════════════════════════════

  function matchesFilters(q: SheetQuestion): boolean {
    const query = searchQuery.value.toLowerCase()
    const matchesSearch =
      !query ||
      q.title.toLowerCase().includes(query) ||
      q.questionId.name.toLowerCase().includes(query) ||
      q.topic.toLowerCase().includes(query) ||
      (q.subTopic?.toLowerCase().includes(query) ?? false)

    const matchesDifficulty =
      filterDifficulty.value === 'all' ||
      q.questionId.difficulty === filterDifficulty.value

    return matchesSearch && matchesDifficulty
  }

  /** Sync local state from the API layer after any mutation */
  function syncFromApi() {
    sheet.value = api.getSheet()
    questions.value = api.getQuestions()
  }

  /** Generic array reorder: move item at oldIndex to newIndex */
  function reorderArray<T>(arr: T[], oldIndex: number, newIndex: number): T[] {
    const result = [...arr]
    const [item] = result.splice(oldIndex, 1)
    result.splice(newIndex, 0, item)
    return result
  }

  // ═══════════════════════════════════════════════════
  // ─── Getters (derived data, framework-agnostic) ───
  // ═══════════════════════════════════════════════════

  /** Hierarchical view: Topic → SubTopic → Questions, with filters applied */
  const topicGroups = computed<TopicGroup[]>(() => {
    if (!sheet.value) return []

    const topicOrder = sheet.value.config.topicOrder
    const subTopicOrder = sheet.value.config.subTopicOrder || {}
    const allQ = questions.value

    return topicOrder.map((topicName) => {
      const topicQuestions = allQ.filter((q) => q.topic === topicName)

      // Build sub-topic list: declared order first, then any extras from questions
      const declaredSubs = subTopicOrder[topicName] || []
      const questionSubs = [...new Set(
        topicQuestions.filter((q) => q.subTopic).map((q) => q.subTopic as string),
      )]
      const allSubTopicNames = [
        ...declaredSubs,
        ...questionSubs.filter((st) => !declaredSubs.includes(st)),
      ]

      const subTopics: SubTopicGroup[] = allSubTopicNames.map((stName) => ({
        name: stName,
        questions: topicQuestions.filter((q) => q.subTopic === stName).filter(matchesFilters),
      }))

      return {
        name: topicName,
        subTopics,
        questions: topicQuestions.filter((q) => !q.subTopic).filter(matchesFilters),
      }
    })
  })

  const totalQuestions = computed(() => questions.value.length)

  const solvedQuestions = computed(
    () => questions.value.filter((q) => q.isSolved).length,
  )

  /** Progress as 0-100 integer, ready for display */
  const progressPercent = computed(() =>
    totalQuestions.value > 0
      ? Math.round((solvedQuestions.value / totalQuestions.value) * 100)
      : 0,
  )

  /** Per-topic stats { total, solved } keyed by topic name */
  const topicStats = computed(() => {
    const stats: Record<string, { total: number; solved: number }> = {}
    for (const q of questions.value) {
      if (!stats[q.topic]) stats[q.topic] = { total: 0, solved: 0 }
      stats[q.topic].total++
      if (q.isSolved) stats[q.topic].solved++
    }
    return stats
  })

  /** Count of all questions (filtered) under a topic, including sub-topics */
  function getTopicQuestionCount(topicName: string): number {
    const group = topicGroups.value.find((g) => g.name === topicName)
    if (!group) return 0
    return group.questions.length + group.subTopics.reduce((sum, st) => sum + st.questions.length, 0)
  }

  // ═══════════════════════════════════════════════════
  // ─── Actions (intent-based mutations) ───
  // ═══════════════════════════════════════════════════

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

  // ─── Topic CRUD ───

  async function addTopic(name: string) {
    try {
      await api.addTopic(name)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function updateTopic(oldName: string, newName: string) {
    try {
      await api.updateTopic(oldName, newName)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function deleteTopic(name: string) {
    try {
      await api.deleteTopic(name)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  /**
   * Intent-based topic reorder: "move the topic at oldIndex to newIndex"
   * The store computes the new order — the component never builds arrays.
   */
  async function moveTopic(oldIndex: number, newIndex: number) {
    if (!sheet.value || oldIndex === newIndex) return
    const newOrder = reorderArray(sheet.value.config.topicOrder, oldIndex, newIndex)
    try {
      await api.reorderTopics(newOrder)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  // ─── Sub-Topic CRUD ───

  async function addSubTopic(topicName: string, subTopicName: string) {
    try {
      await api.addSubTopic(topicName, subTopicName)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function updateSubTopic(topicName: string, oldName: string, newName: string) {
    try {
      await api.updateSubTopic(topicName, oldName, newName)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function deleteSubTopic(topicName: string, subTopicName: string) {
    try {
      await api.deleteSubTopic(topicName, subTopicName)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  /**
   * Intent-based sub-topic reorder within a topic.
   */
  async function moveSubTopic(topicName: string, oldIndex: number, newIndex: number) {
    if (!sheet.value || oldIndex === newIndex) return
    const subs = sheet.value.config.subTopicOrder[topicName] || []
    const newOrder = reorderArray(subs, oldIndex, newIndex)
    try {
      await api.reorderSubTopics(topicName, newOrder)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  // ─── Question CRUD ───

  async function addQuestion(payload: CreateQuestionPayload) {
    try {
      await api.addQuestion(payload)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function updateQuestion(payload: { _id: string; title?: string; topic?: string; subTopic?: string | null; resource?: string | null }) {
    try {
      await api.updateQuestion(payload)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function deleteQuestion(questionId: string) {
    try {
      await api.deleteQuestion(questionId)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function toggleSolved(questionId: string) {
    try {
      await api.toggleQuestionSolved(questionId)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  /**
   * Intent-based question reorder within a specific topic + subTopic scope.
   * Component passes oldIndex/newIndex from SortableJS — store resolves the IDs.
   */
  async function moveQuestion(topicName: string, subTopic: string | null, oldIndex: number, newIndex: number) {
    if (oldIndex === newIndex) return

    // Find the matching question IDs from the current canonical order
    const scoped = questions.value.filter(
      (q) => q.topic === topicName && (subTopic === null ? !q.subTopic : q.subTopic === subTopic),
    )
    const reordered = reorderArray(scoped, oldIndex, newIndex)
    const newIdOrder = reordered.map((q) => q._id)

    try {
      await api.reorderQuestions(topicName, subTopic, newIdOrder)
      syncFromApi()
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  // ─── Filter Actions (thin setters for testability) ───

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setFilterDifficulty(difficulty: string) {
    filterDifficulty.value = difficulty
  }

  return {
    // State (readonly from component perspective — mutate via actions only)
    sheet,
    questions,
    loading,
    error,
    searchQuery,
    filterDifficulty,

    // Getters
    topicGroups,
    totalQuestions,
    solvedQuestions,
    progressPercent,
    topicStats,
    getTopicQuestionCount,

    // Actions — CRUD
    initialize,
    addTopic,
    updateTopic,
    deleteTopic,
    addSubTopic,
    updateSubTopic,
    deleteSubTopic,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    toggleSolved,

    // Actions — Intent-based reorder
    moveTopic,
    moveSubTopic,
    moveQuestion,

    // Actions — Filters
    setSearchQuery,
    setFilterDifficulty,
  }
})
