<template>
  <div class="bg-white w-[25rem] py-4 px-8 space-y-8 text-accent">
    <img
      src="https://cdn.dev.tribes.ai/public/dashboard/images/logo/logo-tribes-ai.png"
      class="max-w-[40%] object-contain"
    />
    <ul class="space-y-4">
      <li>
        <InformationCircleIcon class="w-8 h-8 text-primary" />
        <a> About</a>
        <ExternalLinkIcon class="w-8 h-8 text-primary" />
      </li>
      <li>
        <SupportIcon class="w-8 h-8 text-primary" />
        <a>Support</a>
        <ExternalLinkIcon class="w-8 h-8 text-primary" />
      </li>
      <li>
        <CogIcon class="w-8 h-8 text-primary" />
        <a>Settings</a>
        <ExternalLinkIcon class="w-8 h-8 text-primary" />
      </li>
      <li>
        <LoginIcon class="w-8 h-8 text-primary" />
        <a>Login</a>
        <ExternalLinkIcon class="w-8 h-8 text-primary" />
      </li>
    </ul>
    <hr class="h-0.75 bg-primary" />
    <h4 class="font-medium text-[1.8rem]">Event Tracking</h4>
    <table class="w-full border-collapse border border-primary">
      <thead>
        <tr class="text-left">
          <th>Sub-Domain</th>
          <th>Tracked</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>app.tribes.ai</td>
          <td>
            <input type="checkbox" class="accent-primary" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// import { ref, toRaw } from 'vue'
// import { sendMessage } from 'webext-bridge'
// import LocalStorage from '~/utils/LocalStorage'
import {
  SupportIcon,
  InformationCircleIcon,
  CogIcon,
  LoginIcon,
  ExternalLinkIcon,
} from '@heroicons/vue/outline'

// const addDomain = ref('')
// const invalidDomain = ref(false)
// const whitelistedDomains = ref<Array<string>>([])
// const trackingData = ref({ message: '', data: {} })
// const storage = new LocalStorage()

// async function fetchWhitelistedDomains() {
//   let data = await storage.getItem('whitelistedDomains')
//   whitelistedDomains.value = data['whitelistedDomains']
// }

// async function addToWhitelistedDomains() {
//   invalidDomain.value = false
//   try {
//     new URL(addDomain.value)
//     whitelistedDomains.value.push(addDomain.value)
//     addDomain.value = ''
//     await storage.setItem('whitelistedDomains', toRaw(whitelistedDomains.value))
//   } catch (e) {
//     console.error(e)
//     invalidDomain.value = true
//   }
// }

// async function removeDomain(domain: string) {
//   let arr = whitelistedDomains.value.filter((v) => v !== domain)
//   await storage.setItem('whitelistedDomains', arr)
//   whitelistedDomains.value = arr
// }

// fetchWhitelistedDomains()

// browser.runtime.onMessage.addListener((message: any) => {
//   trackingData.value = message
//   return true
// })

// browser.tabs.query({ active: true, currentWindow: true }).then((tab: any) => {
//   sendMessage('updateUI', { url: tab[0].url }, 'background')
// })
</script>

<style scoped>
ul li {
  @apply flex gap-x-4 items-center;
}

tr th,
td {
  @apply border border-primary p-2;
}

th {
  @apply bg-primary-light;
}
</style>
