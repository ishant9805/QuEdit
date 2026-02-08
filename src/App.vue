<script setup lang="ts">
import QuestionManager from '@/views/QuestionManager.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <div class="rounded-lg p-6 mx-2 mb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-center">
      <h1 class="text-4xl mb-2 font-bold">Question Management System</h1>
      <p>Organize, manage, and track your question bank with hierarchical topics</p>
    </div>
    <QuestionManager />
  </div>
</template>
