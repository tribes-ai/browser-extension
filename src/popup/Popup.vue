<template>
  <div class="bg-white w-[40rem] p-8 space-y-8 text-accent">
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
          <th>Domain</th>
          <th>Tracked</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input
              v-model="addDomain"
              class="w-full focus-within:outline-none"
              type="text"
              placeholder="Add missing domain here"
              @keypress.enter="addToDomainsList"
            />
          </td>
          <td>
            <input type="checkbox" class="accent-primary" />
          </td>
        </tr>
        <tr v-for="(domain, index) in trackedDomains" :key="index">
          <td>{{ domain }}</td>
          <td>
            <input type="checkbox" class="accent-primary" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue'
import { getHostname } from 'tldts'
import {
  SupportIcon,
  InformationCircleIcon,
  CogIcon,
  LoginIcon,
  ExternalLinkIcon,
} from '@heroicons/vue/outline'
import LocalStorage from '~/utils/LocalStorage'

const addDomain = ref('')
const invalidDomain = ref(false)
// const whitelistedDomains = ref<Array<string>>([])
const trackedDomains = ref<string[]>([])
const storage = new LocalStorage()

async function fetchWhitelistedDomains() {
  let data = await storage.getItem('trackedDomains')
  trackedDomains.value = data['trackedDomains']
}

async function addToDomainsList() {
  console.log('called')
  invalidDomain.value = false
  try {
    const url = getHostname(addDomain.value)
    if (url) {
      trackedDomains.value.unshift(url)
      addDomain.value = ''
      await storage.setItem('trackedDomains', toRaw(trackedDomains.value))
    }
  } catch (e) {
    console.error(e)
    invalidDomain.value = true
  }
}

// async function removeDomain(domain: string) {
//   let arr = whitelistedDomains.value.filter((v) => v !== domain)
//   await storage.setItem('whitelistedDomains', arr)
//   whitelistedDomains.value = arr
// }

fetchWhitelistedDomains()

// browser.runtime.sendMessage({ message: 'popup' })

// browser.runtime.onMessage.addListener(
//   ({ message, data }: { message: string; data: any }) => {
//     if (message === 'popup') {
//       trackedDomains.value = data
//       console.log(trackedDomains.value)
//     }
//     return true
//   }
// )
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
