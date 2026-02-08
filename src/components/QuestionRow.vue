<template>
    <div class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
        <!-- Drag handle -->
        <div
            class="drag-handle flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="5" r="1.5" />
                <circle cx="15" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="15" cy="19" r="1.5" />
            </svg>
        </div>

        <!-- Solved checkbox -->
        <button @click="$emit('toggle-solved')" class="flex-shrink-0 cursor-pointer"
            :title="question.isSolved ? 'Mark unsolved' : 'Mark solved'">
            <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all" :class="question.isSolved
                ? 'bg-green-500 border-green-500'
                : 'border-gray-500 hover:border-green-400'">
                <svg v-if="question.isSolved" class="w-3 h-3 text-white" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
        </button>

        <!-- Title -->
        <div class="flex-1 min-w-0">
            <span class="text-sm text-gray-200" :class="{ 'line-through text-gray-500': question.isSolved }">
                {{ question.title }}
            </span>
        </div>

        <!-- Difficulty badge -->
        <span class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" :class="difficultyClass">
            {{ question.questionId.difficulty }}
        </span>

        <!-- Platform -->
        <span class="text-xs text-gray-500 flex-shrink-0 hidden sm:inline">
            {{ question.questionId.platform }}
        </span>

        <!-- Problem link -->
        <a v-if="question.questionId.problemUrl" :href="question.questionId.problemUrl" target="_blank"
            rel="noopener noreferrer" class="text-gray-500 hover:text-blue-400 flex-shrink-0 transition-colors"
            title="Open problem" @click.stop>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </a>

        <!-- Resource link -->
        <a v-if="question.resource" :href="question.resource" target="_blank" rel="noopener noreferrer"
            class="text-gray-500 hover:text-purple-400 flex-shrink-0 transition-colors" title="View resource"
            @click.stop>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </a>

        <!-- Action buttons (visible on hover) -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="$emit('edit')"
                class="text-gray-500 hover:text-yellow-400 p-0.5 rounded transition-colors cursor-pointer" title="Edit">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
            <button @click="$emit('delete')"
                class="text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer" title="Delete">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SheetQuestion } from '@/types'

const props = defineProps<{
    question: SheetQuestion
}>()

defineEmits<{
    'toggle-solved': []
    edit: []
    delete: []
}>()

const difficultyClass = computed(() => {
    switch (props.question.questionId.difficulty) {
        case 'Easy':
            return 'bg-green-500/20 text-green-300'
        case 'Medium':
            return 'bg-yellow-500/20 text-yellow-300'
        case 'Hard':
            return 'bg-red-500/20 text-red-300'
        default:
            return 'bg-gray-500/20 text-gray-300'
    }
})
</script>
