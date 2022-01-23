<template>
  <ul class="flex justify-between">
    <li>Today</li>
    <li>All-time</li>
    <li>By days</li>
    <li @click="openSettingsPage">Settings</li>
  </ul>
</template>
<script setup lang="ts">
function openSettingsPage() {
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage()
  } else {
    window.open(browser.runtime.getURL('./extension/dist/options/index.html'))
  }
}
</script>
