<template>
  <div class="bg-white w-[40rem] p-8 space-y-8 text-accent relative">
    <span class="right-5 top-3 absolute"> v {{ appVersion }} </span>
    <img
      src="https://cdn.dev.tribes.ai/public/dashboard/images/logo/logo-tribes-ai.png"
      class="max-w-[40%] object-contain -ml-[1.25rem]"
    />
    <hr class="h-0.75 bg-gray-light" />
    <div class="flex items-center gap-x-2">
      <span class="font-medium">Status:</span>
      <span
        :class="[
          extToken ? 'bg-brand-green' : 'bg-brand-red',
          `w-5 h-5 bg-green rounded-full`,
        ]"
      />
      <p>
        {{ getLoginText }}
      </p>
    </div>
    <hr class="h-0.75 bg-gray-light" />
    <ul class="space-y-4 flex flex-col justify-start">
      <li @click.prevent="openPage">
        <LoginIcon class="w-8 h-8 text-primary" />
        <a>{{ extToken ? 'Log Out' : 'Log In' }}</a>
        <ExternalLinkIcon class="w-8 h-8 text-primary" />
      </li>
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
    </ul>
    <hr class="h-0.75 bg-gray-light" />
    <h4 class="font-medium text-[1.8rem]">Event Tracking</h4>
    <div class="flex flex-col max-h-[30vh]">
      <div class="flex-grow overflow-y-auto">
        <table class="w-full border border-primary relative">
          <thead>
            <tr class="text-left">
              <th class="sticky top-0 py-3">Domain</th>
              <th class="sticky top-0 py-3">Tracked</th>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRaw, computed } from 'vue'
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
const extToken = ref('')
const appVersion = ref(import.meta.env.VITE_APP_VERSION)
const storage = new LocalStorage()

async function getDomainsFromStorage() {
  const data = await storage.getItem('trackedDomains')
  storedDomains.value = data['trackedDomains'] || {}
  const token = await storage.getItem('ext-token')
  extToken.value = token['ext-token']
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

function openPage() {
  const url = import.meta.env.VITE_APP_BASE_URL_DEV
  browser.tabs.create({
    url: `${url}/login-browser-extension`,
  })
}

const getLoginText = computed(() => {
  return extToken.value
    ? 'Logged in, tracking active!'
    : 'Logged out, tracking NOT active!'
})

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
