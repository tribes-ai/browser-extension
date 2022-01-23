<template>
  <main class="px-4 py-5 text-center text-gray-700">
    <ul>
      <li v-for="(i, index) in trackingData" :key="index">
        {{ i }}
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { sendMessage } from 'webext-bridge'
let trackingData = ref({ message: '', data: {} })
browser.runtime.onMessage.addListener((message: any) => {
  trackingData.value = message
  return true
})

browser.tabs.query({ active: true, currentWindow: true }).then((tab: any) => {
  sendMessage('updateUI', { url: tab[0].url }, 'background')
})
</script>
