<template>
    <div id="app" class="grid-container">
        <div class="header">
            <h1>Gemini Nano Prompt API Tester</h1>
            <p>A simple interface to test the built-in Chrome AI Prompt API.</p>
        </div>

        <ChatContainer class="left" />
        <ChatContainer class="right" />
    </div>
</template>

<script setup lang="ts">
import ChatContainer from "@/ChatContainer.vue";
</script>

<style scoped>
.grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.header {
    grid-column: 2 / 3; /* Spans from column line 1 to 3 (both columns) */
    /* OR use this shorthand: */
    /* grid-column: 1 / -1; */ /* Spans from first to last column */
    /* OR: */
    /* grid-column: span 2; */ /* Spans 2 columns */
}
</style>
