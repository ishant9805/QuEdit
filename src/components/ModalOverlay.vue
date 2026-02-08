<template>
    <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-200 ease-out"
            leave-active-class="transition-opacity duration-200 ease-in" enter-from-class="opacity-0"
            leave-to-class="opacity-0">
            <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('close')">
                <div class="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
                <div class="relative bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                    <button @click="$emit('close')"
                        class="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors cursor-pointer">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
defineProps<{
    show: boolean
}>()

defineEmits<{
    close: []
}>()
</script>
