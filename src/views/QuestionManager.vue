<template>
    <div class="max-w-7xl mx-auto px-4 pb-6">
        <!-- Header Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div class="text-sm text-gray-400">Total Questions</div>
                <div class="text-2xl font-bold text-white">{{ store.totalQuestions }}</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div class="text-sm text-gray-400">Solved</div>
                <div class="text-2xl font-bold text-green-400">{{ store.solvedQuestions }}</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div class="text-sm text-gray-400">Progress</div>
                <div class="text-2xl font-bold text-blue-400">{{ store.progressPercent }}%</div>
                <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div class="bg-gradient-to-r from-blue-500 to-green-400 h-2 rounded-full transition-all duration-500"
                        :style="{ width: store.progressPercent + '%' }"></div>
                </div>
            </div>
        </div>

        <!-- Controls Bar -->
        <div class="flex flex-wrap items-center gap-3 mb-6">
            <div class="relative flex-1 min-w-[200px]">
                <input :value="store.searchQuery"
                    @input="store.setSearchQuery(($event.target as HTMLInputElement).value)" type="text"
                    placeholder="Search questions..."
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            <select :value="store.filterDifficulty"
                @change="store.setFilterDifficulty(($event.target as HTMLSelectElement).value)"
                class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all" class="bg-gray-800">All Difficulties</option>
                <option value="Easy" class="bg-gray-800">Easy</option>
                <option value="Medium" class="bg-gray-800">Medium</option>
                <option value="Hard" class="bg-gray-800">Hard</option>
            </select>

            <button @click="showAddTopicModal = true"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Topic
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="store.loading" class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <span class="ml-4 text-gray-300 text-lg">Loading questions...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="store.error" class="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
            <p class="text-red-300 text-lg">{{ store.error }}</p>
            <button @click="store.initialize()"
                class="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors cursor-pointer">
                Retry
            </button>
        </div>

        <!-- Topic List (sortable) -->
        <div v-else ref="topicListRef" class="space-y-4">
            <div v-for="group in store.topicGroups" :key="group.name" :data-topic="group.name"
                class="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <!-- Topic Header -->
                <div class="flex items-center justify-between px-5 py-3 bg-white/5 hover:bg-white/10 transition-colors">
                    <div class="flex items-center gap-3">
                        <!-- Topic drag handle -->
                        <div
                            class="topic-drag-handle cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="9" cy="5" r="1.5" />
                                <circle cx="15" cy="5" r="1.5" />
                                <circle cx="9" cy="12" r="1.5" />
                                <circle cx="15" cy="12" r="1.5" />
                                <circle cx="9" cy="19" r="1.5" />
                                <circle cx="15" cy="19" r="1.5" />
                            </svg>
                        </div>
                        <button class="cursor-pointer p-0 bg-transparent border-0" @click="toggleTopic(group.name)">
                            <svg class="w-5 h-5 text-gray-400 transition-transform duration-200"
                                :class="{ 'rotate-90': !collapsedTopics[group.name] }" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <h2 class="text-lg font-semibold text-white">{{ group.name }}</h2>
                        <span class="text-sm text-gray-400">
                            ({{ store.getTopicQuestionCount(group.name) }} questions)
                        </span>
                        <span v-if="store.topicStats[group.name]" class="text-xs px-2 py-0.5 rounded-full"
                            :class="progressBadgeClass(store.topicStats[group.name] ?? { total: 0, solved: 0 })">
                            {{ store.topicStats[group.name]?.solved ?? 0 }}/{{ store.topicStats[group.name]?.total ?? 0
                            }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="openAddSubTopicModal(group.name)"
                            class="text-gray-400 hover:text-blue-400 p-1 rounded transition-colors cursor-pointer"
                            title="Add Sub-topic">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button @click="openAddQuestionModal(group.name, null)"
                            class="text-gray-400 hover:text-green-400 p-1 rounded transition-colors cursor-pointer"
                            title="Add Question to Topic">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                        <button @click="openEditTopicModal(group.name)"
                            class="text-gray-400 hover:text-yellow-400 p-1 rounded transition-colors cursor-pointer"
                            title="Edit Topic">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button @click="confirmDeleteTopic(group.name)"
                            class="text-gray-400 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                            title="Delete Topic">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Topic Content (collapsible) -->
                <div v-show="!collapsedTopics[group.name]" class="px-5 py-3">
                    <!-- Sub-Topics (sortable container) -->
                    <div :ref="(el) => setSubTopicListRef(group.name, el)" class="space-y-3">
                        <div v-for="subGroup in group.subTopics" :key="subGroup.name" :data-subtopic="subGroup.name"
                            class="bg-white/5 rounded-lg overflow-hidden border border-white/5">
                            <!-- Sub-Topic Header -->
                            <div
                                class="flex items-center justify-between px-3 py-2 hover:bg-white/10 transition-colors">
                                <div class="flex items-center gap-2">
                                    <div
                                        class="subtopic-drag-handle cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <circle cx="9" cy="5" r="1.5" />
                                            <circle cx="15" cy="5" r="1.5" />
                                            <circle cx="9" cy="12" r="1.5" />
                                            <circle cx="15" cy="12" r="1.5" />
                                            <circle cx="9" cy="19" r="1.5" />
                                            <circle cx="15" cy="19" r="1.5" />
                                        </svg>
                                    </div>
                                    <button class="cursor-pointer p-0 bg-transparent border-0"
                                        @click="toggleSubTopic(group.name, subGroup.name)">
                                        <svg class="w-4 h-4 text-gray-500 transition-transform duration-200"
                                            :class="{ 'rotate-90': !collapsedSubTopics[`${group.name}::${subGroup.name}`] }"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <h3 class="text-sm font-medium text-gray-300">{{ subGroup.name }}</h3>
                                    <span class="text-xs text-gray-500">({{ subGroup.questions.length }})</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <button @click="openAddQuestionModal(group.name, subGroup.name)"
                                        class="text-gray-500 hover:text-green-400 p-1 rounded transition-colors cursor-pointer"
                                        title="Add Question">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                    <button @click="openEditSubTopicModal(group.name, subGroup.name)"
                                        class="text-gray-500 hover:text-yellow-400 p-1 rounded transition-colors cursor-pointer"
                                        title="Edit Sub-topic">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button @click="confirmDeleteSubTopic(group.name, subGroup.name)"
                                        class="text-gray-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                                        title="Delete Sub-topic">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Sub-Topic Questions (sortable container) -->
                            <div v-show="!collapsedSubTopics[`${group.name}::${subGroup.name}`]"
                                :ref="(el) => setQuestionListRef(group.name, subGroup.name, el)" class="ml-6 pb-2">
                                <QuestionRow v-for="q in subGroup.questions" :key="q._id" :question="q" :data-id="q._id"
                                    @toggle-solved="store.toggleSolved(q._id)" @edit="openEditQuestionModal(q)"
                                    @delete="confirmDeleteQuestion(q._id)" />
                                <div v-if="subGroup.questions.length === 0"
                                    class="text-center py-2 text-gray-600 text-xs">
                                    No questions. Click + to add.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Questions directly under topic (no sub-topic) — sortable container -->
                    <div v-if="group.questions.length > 0" :ref="(el) => setQuestionListRef(group.name, null, el)"
                        class="mt-3 border-t border-white/5 pt-3">
                        <div class="text-xs text-gray-500 mb-1 px-3">Uncategorized Questions</div>
                        <QuestionRow v-for="q in group.questions" :key="q._id" :question="q" :data-id="q._id"
                            @toggle-solved="store.toggleSolved(q._id)" @edit="openEditQuestionModal(q)"
                            @delete="confirmDeleteQuestion(q._id)" />
                    </div>

                    <!-- Empty state -->
                    <div v-if="group.questions.length === 0 && group.subTopics.every(st => st.questions.length === 0) && group.subTopics.length === 0"
                        class="text-center py-4 text-gray-500 text-sm">
                        No questions or sub-topics in this topic. Use the buttons above to add some.
                    </div>
                </div>
            </div>

            <!-- Empty state when no topics -->
            <div v-if="store.topicGroups.length === 0 && !store.loading" class="text-center py-16 text-gray-400">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p class="text-lg">No topics found</p>
                <p class="text-sm mt-1">Add a topic to get started</p>
            </div>
        </div>

        <!-- ═══ MODALS ═══ -->

        <!-- Add Topic Modal -->
        <ModalOverlay :show="showAddTopicModal" @close="showAddTopicModal = false">
            <h3 class="text-lg font-semibold text-white mb-4">Add New Topic</h3>
            <input v-model="newTopicName" type="text" placeholder="Topic name"
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                @keyup.enter="handleAddTopic" />
            <div class="flex justify-end gap-3">
                <button @click="showAddTopicModal = false"
                    class="px-4 py-2 text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button @click="handleAddTopic"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Add</button>
            </div>
        </ModalOverlay>

        <!-- Edit Topic Modal -->
        <ModalOverlay :show="showEditTopicModal" @close="showEditTopicModal = false">
            <h3 class="text-lg font-semibold text-white mb-4">Edit Topic</h3>
            <input v-model="editTopicName" type="text" placeholder="New topic name"
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                @keyup.enter="handleEditTopic" />
            <div class="flex justify-end gap-3">
                <button @click="showEditTopicModal = false"
                    class="px-4 py-2 text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button @click="handleEditTopic"
                    class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Save</button>
            </div>
        </ModalOverlay>

        <!-- Add Sub-Topic Modal -->
        <ModalOverlay :show="showAddSubTopicModal" @close="showAddSubTopicModal = false">
            <h3 class="text-lg font-semibold text-white mb-2">Add Sub-Topic</h3>
            <p class="text-sm text-gray-400 mb-4">Under topic: <strong class="text-gray-200">{{ modalTopicContext
            }}</strong></p>
            <input v-model="newSubTopicName" type="text" placeholder="Sub-topic name"
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                @keyup.enter="handleAddSubTopic" />
            <div class="flex justify-end gap-3">
                <button @click="showAddSubTopicModal = false"
                    class="px-4 py-2 text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button @click="handleAddSubTopic"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Add</button>
            </div>
        </ModalOverlay>

        <!-- Edit Sub-Topic Modal -->
        <ModalOverlay :show="showEditSubTopicModal" @close="showEditSubTopicModal = false">
            <h3 class="text-lg font-semibold text-white mb-4">Edit Sub-Topic</h3>
            <input v-model="editSubTopicName" type="text" placeholder="New sub-topic name"
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                @keyup.enter="handleEditSubTopic" />
            <div class="flex justify-end gap-3">
                <button @click="showEditSubTopicModal = false"
                    class="px-4 py-2 text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button @click="handleEditSubTopic"
                    class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Save</button>
            </div>
        </ModalOverlay>

        <!-- Add Question Modal -->
        <ModalOverlay :show="showAddQuestionModal" @close="showAddQuestionModal = false">
            <h3 class="text-lg font-semibold text-white mb-2">Add Question</h3>
            <p class="text-sm text-gray-400 mb-4">
                Topic: <strong class="text-gray-200">{{ questionForm.topic }}</strong>
                <span v-if="questionForm.subTopic"> → Sub-topic: <strong class="text-gray-200">{{
                    questionForm.subTopic }}</strong></span>
            </p>
            <div class="space-y-3">
                <input v-model="questionForm.title" type="text" placeholder="Question title"
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select v-model="questionForm.difficulty"
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Easy" class="bg-gray-800">Easy</option>
                    <option value="Medium" class="bg-gray-800">Medium</option>
                    <option value="Hard" class="bg-gray-800">Hard</option>
                </select>
                <input v-model="questionForm.platform" type="text" placeholder="Platform (e.g., leetcode)"
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input v-model="questionForm.problemUrl" type="text" placeholder="Problem URL"
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input v-model="questionForm.resource" type="text" placeholder="Resource / Solution URL (optional)"
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex justify-end gap-3 mt-4">
                <button @click="showAddQuestionModal = false"
                    class="px-4 py-2 text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button @click="handleAddQuestion"
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Add</button>
            </div>
        </ModalOverlay>

        <!-- Edit Question Modal -->
        <ModalOverlay :show="showEditQuestionModal" @close="showEditQuestionModal = false">
            <h3 class="text-lg font-semibold text-white mb-4">Edit Question</h3>
            <div class="space-y-3">
                <input v-model="editQuestionForm.title" type="text" placeholder="Question title"
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input v-model="editQuestionForm.resource" type="text" placeholder="Resource / Solution URL"
                    class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="flex justify-end gap-3 mt-4">
                <button @click="showEditQuestionModal = false"
                    class="px-4 py-2 text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button @click="handleEditQuestion"
                    class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Save</button>
            </div>
        </ModalOverlay>

        <!-- Delete Confirmation Modal -->
        <ModalOverlay :show="showDeleteConfirm" @close="showDeleteConfirm = false">
            <h3 class="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
            <p class="text-gray-300 mb-6">{{ deleteConfirmMessage }}</p>
            <div class="flex justify-end gap-3">
                <button @click="showDeleteConfirm = false"
                    class="px-4 py-2 text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button @click="handleConfirmDelete"
                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">Delete</button>
            </div>
        </ModalOverlay>
    </div>
</template>

<script setup lang="ts">
/**
 * QuestionManager — UI-only component.
 *
 * Responsibilities:
 *   ✅ Rendering store getters
 *   ✅ UI-local state (collapse, modals, form inputs)
 *   ✅ SortableJS wiring (DOM refs, instance lifecycle)
 *   ✅ Translating SortableJS events into intent-based store actions
 *   ✅ CSS-class mapping (progressBadgeClass)
 *
 * NOT responsible for:
 *   ❌ Derived calculations (counts, progress, stats)
 *   ❌ Array reordering logic
 *   ❌ Data filtering / search matching
 *   ❌ DOM-scraping to build new order arrays
 */
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick, type ComponentPublicInstance } from 'vue'
import Sortable from 'sortablejs'
import { useSheetStore } from '@/stores/sheet'
import type { SheetQuestion } from '@/types'
import ModalOverlay from '@/components/ModalOverlay.vue'
import QuestionRow from '@/components/QuestionRow.vue'

const store = useSheetStore()

// ═══════════════════════════════════════════════════
// ─── UI-Local State (not domain data) ───
// ═══════════════════════════════════════════════════

const collapsedTopics = ref<Record<string, boolean>>({})
const collapsedSubTopics = ref<Record<string, boolean>>({})

function toggleTopic(name: string) {
    collapsedTopics.value[name] = !collapsedTopics.value[name]
}

function toggleSubTopic(topicName: string, subTopicName: string) {
    const key = `${topicName}::${subTopicName}`
    collapsedSubTopics.value[key] = !collapsedSubTopics.value[key]
}

/** Pure UI concern: map stat data → Tailwind classes */
function progressBadgeClass(stat: { total: number; solved: number }): string {
    const pct = stat.total > 0 ? stat.solved / stat.total : 0
    if (pct === 1) return 'bg-green-500/30 text-green-300'
    if (pct >= 0.5) return 'bg-yellow-500/30 text-yellow-300'
    return 'bg-gray-500/30 text-gray-300'
}

// ═══════════════════════════════════════════════════
// ─── Modal / Form State (UI-only) ───
// ═══════════════════════════════════════════════════

// Topic modals
const showAddTopicModal = ref(false)
const newTopicName = ref('')
const showEditTopicModal = ref(false)
const editTopicName = ref('')
const editTopicOriginal = ref('')

function openEditTopicModal(name: string) {
    editTopicOriginal.value = name
    editTopicName.value = name
    showEditTopicModal.value = true
}

async function handleAddTopic() {
    if (!newTopicName.value.trim()) return
    await store.addTopic(newTopicName.value.trim())
    newTopicName.value = ''
    showAddTopicModal.value = false
}

async function handleEditTopic() {
    if (!editTopicName.value.trim()) return
    await store.updateTopic(editTopicOriginal.value, editTopicName.value.trim())
    showEditTopicModal.value = false
}

// Sub-Topic modals
const showAddSubTopicModal = ref(false)
const newSubTopicName = ref('')
const modalTopicContext = ref('')
const showEditSubTopicModal = ref(false)
const editSubTopicName = ref('')
const editSubTopicOriginal = ref('')
const editSubTopicContext = ref('')

function openAddSubTopicModal(topicName: string) {
    modalTopicContext.value = topicName
    newSubTopicName.value = ''
    showAddSubTopicModal.value = true
}

function openEditSubTopicModal(topicName: string, subTopicName: string) {
    editSubTopicContext.value = topicName
    editSubTopicOriginal.value = subTopicName
    editSubTopicName.value = subTopicName
    showEditSubTopicModal.value = true
}

async function handleAddSubTopic() {
    if (!newSubTopicName.value.trim()) return
    await store.addSubTopic(modalTopicContext.value, newSubTopicName.value.trim())
    newSubTopicName.value = ''
    showAddSubTopicModal.value = false
}

async function handleEditSubTopic() {
    if (!editSubTopicName.value.trim()) return
    await store.updateSubTopic(editSubTopicContext.value, editSubTopicOriginal.value, editSubTopicName.value.trim())
    showEditSubTopicModal.value = false
}

// Question modals
const showAddQuestionModal = ref(false)
const questionForm = reactive({
    topic: '',
    subTopic: null as string | null,
    title: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    platform: 'leetcode',
    problemUrl: '',
    resource: '',
})

const showEditQuestionModal = ref(false)
const editQuestionForm = reactive({
    _id: '',
    title: '',
    resource: '',
})

function openAddQuestionModal(topic: string, subTopic: string | null) {
    questionForm.topic = topic
    questionForm.subTopic = subTopic
    questionForm.title = ''
    questionForm.difficulty = 'Medium'
    questionForm.platform = 'leetcode'
    questionForm.problemUrl = ''
    questionForm.resource = ''
    showAddQuestionModal.value = true
}

function openEditQuestionModal(q: SheetQuestion) {
    editQuestionForm._id = q._id
    editQuestionForm.title = q.title
    editQuestionForm.resource = q.resource || ''
    showEditQuestionModal.value = true
}

async function handleAddQuestion() {
    if (!questionForm.title.trim()) return
    await store.addQuestion({
        topic: questionForm.topic,
        subTopic: questionForm.subTopic,
        title: questionForm.title.trim(),
        difficulty: questionForm.difficulty,
        platform: questionForm.platform || 'leetcode',
        problemUrl: questionForm.problemUrl,
        resource: questionForm.resource || null,
    })
    showAddQuestionModal.value = false
}

async function handleEditQuestion() {
    if (!editQuestionForm.title.trim()) return
    await store.updateQuestion({
        _id: editQuestionForm._id,
        title: editQuestionForm.title.trim(),
        resource: editQuestionForm.resource || null,
    })
    showEditQuestionModal.value = false
}

// Delete confirmation
const showDeleteConfirm = ref(false)
const deleteConfirmMessage = ref('')
let pendingDeleteAction: (() => Promise<void>) | null = null

function confirmDeleteTopic(name: string) {
    deleteConfirmMessage.value = `Are you sure you want to delete topic "${name}" and all its questions?`
    pendingDeleteAction = () => store.deleteTopic(name)
    showDeleteConfirm.value = true
}

function confirmDeleteSubTopic(topicName: string, subTopicName: string) {
    deleteConfirmMessage.value = `Are you sure you want to delete sub-topic "${subTopicName}" and all its questions?`
    pendingDeleteAction = () => store.deleteSubTopic(topicName, subTopicName)
    showDeleteConfirm.value = true
}

function confirmDeleteQuestion(questionId: string) {
    deleteConfirmMessage.value = 'Are you sure you want to delete this question?'
    pendingDeleteAction = () => store.deleteQuestion(questionId)
    showDeleteConfirm.value = true
}

async function handleConfirmDelete() {
    if (pendingDeleteAction) {
        await pendingDeleteAction()
        pendingDeleteAction = null
    }
    showDeleteConfirm.value = false
}

// ═══════════════════════════════════════════════════
// ─── SortableJS Wiring (UI plumbing only) ───
//
// The component's ONLY drag-and-drop responsibility is:
//   1. Managing DOM refs and Sortable instances
//   2. Translating SortableJS `onEnd(evt)` into
//      store.moveTopic(oldIndex, newIndex)
//      store.moveSubTopic(topic, oldIndex, newIndex)
//      store.moveQuestion(topic, subTopic, oldIndex, newIndex)
//
// It never reads DOM children to build arrays.
// It never computes the new order — the store does that.
// ═══════════════════════════════════════════════════

const topicListRef = ref<HTMLElement | null>(null)
const subTopicListRefs = ref<Record<string, HTMLElement>>({})
const questionListRefs = ref<Record<string, HTMLElement>>({})

let topicSortableInstance: Sortable | null = null
const subTopicSortableInstances: Record<string, Sortable> = {}
const questionSortableInstances: Record<string, Sortable> = {}

function setSubTopicListRef(topicName: string, el: Element | ComponentPublicInstance | null) {
    if (el instanceof HTMLElement) {
        subTopicListRefs.value[topicName] = el
    } else {
        delete subTopicListRefs.value[topicName]
    }
}

function setQuestionListRef(topicName: string, subTopicName: string | null, el: Element | ComponentPublicInstance | null) {
    const key = `${topicName}::${subTopicName ?? '__root__'}`
    if (el instanceof HTMLElement) {
        questionListRefs.value[key] = el
    } else {
        delete questionListRefs.value[key]
    }
}

function destroyAllSortables() {
    if (topicSortableInstance) {
        topicSortableInstance.destroy()
        topicSortableInstance = null
    }
    for (const key of Object.keys(subTopicSortableInstances)) {
        subTopicSortableInstances[key]?.destroy()
        delete subTopicSortableInstances[key]
    }
    for (const key of Object.keys(questionSortableInstances)) {
        questionSortableInstances[key]?.destroy()
        delete questionSortableInstances[key]
    }
}

function initSortables() {
    destroyAllSortables()

    // 1. Topics — intent: moveTopic(oldIndex, newIndex)
    if (topicListRef.value) {
        topicSortableInstance = Sortable.create(topicListRef.value, {
            animation: 200,
            handle: '.topic-drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
                    store.moveTopic(evt.oldIndex, evt.newIndex)
                }
            },
        })
    }

    // 2. Sub-topics — intent: moveSubTopic(topic, oldIndex, newIndex)
    for (const [topicName, el] of Object.entries(subTopicListRefs.value)) {
        if (!el) continue
        subTopicSortableInstances[topicName] = Sortable.create(el, {
            animation: 200,
            handle: '.subtopic-drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
                    store.moveSubTopic(topicName, evt.oldIndex, evt.newIndex)
                }
            },
        })
    }

    // 3. Questions — intent: moveQuestion(topic, subTopic, oldIndex, newIndex)
    for (const [key, el] of Object.entries(questionListRefs.value)) {
        if (!el) continue
        const [topicName, subTopicPart] = key.split('::')
        const subTopic = subTopicPart === '__root__' ? null : subTopicPart

        questionSortableInstances[key] = Sortable.create(el, {
            animation: 200,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
                    store.moveQuestion(topicName, subTopic, evt.oldIndex, evt.newIndex)
                }
            },
        })
    }
}

// Re-init sortables when the data-driven DOM changes
watch(
    () => store.topicGroups,
    () => nextTick(initSortables),
    { deep: true },
)

// ─── Lifecycle ───
onMounted(async () => {
    await store.initialize()
    await nextTick()
    initSortables()
})

onBeforeUnmount(() => {
    destroyAllSortables()
})
</script>
