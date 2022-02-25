<template>
  <div class="bg-white w-[40rem] p-8 space-y-8 text-accent">
    <img
      src="https://cdn.dev.tribes.ai/public/dashboard/images/logo/logo-tribes-ai.png"
      class="max-w-[40%] object-contain -ml-[1.25rem]"
    />
    <ul class="space-y-4 flex flex-col justify-start">
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
      <tbody class="max-h-[10rem] overflow-y-auto">
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
          <td class="pl-1">
            <input type="checkbox" class="accent-primary" checked />
          </td>
        </tr>
        <tr v-for="(domain, key) in trackedDomains" :key="domain">
          <td>{{ key }}</td>
          <td>
            <input
              type="checkbox"
              class="accent-primary"
              :value="domain"
              :checked="isDomainStored(domain)"
              @change="toggleDomainToStorage"
            />
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
import { DomainList } from '~/types'
import LocalStorage from '~/utils/LocalStorage'

const addDomain = ref('')
const invalidDomain = ref(false)
const trackedDomains = ref<DomainList>({})
const storedDomains = ref<DomainList>({})
const storage = new LocalStorage()

async function getDomainsFromStorage() {
  const data = await storage.getItem('trackedDomains')
  storedDomains.value = data['trackedDomains'] || {}
}

async function addToDomainsList() {
  invalidDomain.value = false
  try {
    const url = getHostname(addDomain.value)
    if (url) {
      trackedDomains.value[url] = url
      storedDomains.value[url] = url
      await storage.setItem('trackedDomains', toRaw(storedDomains.value))
      addDomain.value = ''
    }
  } catch (e) {
    console.error(e)
    invalidDomain.value = true
  }
}

async function toggleDomainToStorage(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.checked && !storedDomains.value[target.value]) {
    storedDomains.value[target.value] = target.value
  } else if (!target.checked && storedDomains.value[target.value]) {
    delete storedDomains.value[target.value]
  }
  await storage.setItem('trackedDomains', toRaw(storedDomains.value))
}

function isDomainStored(domain: string): boolean {
  return Object.prototype.hasOwnProperty.call(storedDomains.value, domain)
}

getDomainsFromStorage()

browser.runtime.sendMessage({ message: 'popupData' })

browser.runtime.onMessage.addListener(
  ({ message, data }: { message: string; data: any }) => {
    if (message === 'popup') {
      trackedDomains.value = { ...toRaw(storedDomains.value), ...data }
    }
    return true
  }
)
</script>

<style scoped>
ul li {
  @apply flex gap-x-4 items-center;
}

tr th,
td {
  @apply border border-primary p-2 pl-4;
}

th {
  @apply bg-primary-light;
}
</style>
