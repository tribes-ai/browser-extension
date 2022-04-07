<template>
  <div class="bg-white w-[50rem] p-8 space-y-8 text-accent relative">
    <div class="flex justify-between">
      <!-- <span class="right-5 top-3 absolute"> v {{ appVersion }} </span> -->
      <img
        src="https://cdn.dev.tribes.ai/public/dashboard/images/logo/logo-tribes-ai.png"
        class="max-w-[25%] object-contain -ml-[1.25rem]"
      />
      <ul class="inline-flex gap-x-12">
        <li class="hover:cursor-pointer" @click="openLinkPage('about')">
          <InformationCircleIcon class="w-8 h-8 text-primary" />
          <a> About</a>
          <ExternalLinkIcon class="w-8 h-8 text-primary" />
        </li>
        <li class="hover:cursor-pointer" @click="openLinkPage('support')">
          <SupportIcon class="w-8 h-8 text-primary" />
          <a>Support</a>
          <ExternalLinkIcon class="w-8 h-8 text-primary" />
        </li>
      </ul>
    </div>
    <hr class="h-0.75 bg-gray-light" />
    <div class="space-y-4">
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
      <div class="flex gap-x-4 items-center">
        <BaseInput
          input-classes="border border-accent flex-grow-1"
          placeholder="Enter authentication token to activate tracking"
          :readonly="extToken ? readonly : false"
          :model-value="extToken"
          @update:model-value="(newValue) => (tempValue = newValue)"
        />
        <BaseButton @click="saveToken"> Save </BaseButton>
        <BaseButton
          classes="bg-transparent text-accent shadow-none hover:bg-primary hover:bg-opacity-[.08]"
          @click="clearToken"
        >
          Clear
        </BaseButton>
      </div>
    </div>
    <hr class="h-0.75 bg-gray-light" />
    <ul class="space-y-4 flex flex-col justify-start">
      <li
        v-if="!extToken"
        class="hover:cursor-pointer"
        @click.prevent="openPage"
      >
        <LoginIcon class="w-8 h-8 text-primary" />
        <a>Log-in to get authentication token</a>
        <ExternalLinkIcon class="w-8 h-8 text-primary" />
      </li>

      <li class="hover:cursor-pointer" @click="openLinkPage('settings')">
        <CogIcon class="w-8 h-8 text-primary" />
        <a>Settings</a>
        <ExternalLinkIcon class="w-8 h-8 text-primary" />
      </li>
    </ul>
    <hr class="h-0.75 bg-gray-light" />
    <h4 class="font-medium text-[1.8rem]">Event Tracking</h4>
    <div class="flex-grow overflow-y-auto">
      <table class="w-full border border-primary relative">
        <thead>
          <tr class="text-left">
            <th class="py-3">Domain</th>
            <th class="py-3">Tracked</th>
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
import { getParsedURL } from '~/utils/Common'
import type { Tabs } from 'webextension-polyfill'

const addDomain = ref('')
const invalidDomain = ref(false)
const trackedDomains = ref<DomainList>({})
const storedDomains = ref<DomainList>({})
const extToken = ref('')
const tempValue = ref('')
// const appVersion = ref(import.meta.env.VITE_APP_VERSION)
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

function openLinkPage(link: string) {
  let url = ''
  switch (link) {
    case 'about':
      url = 'https://www.tribes.ai/ '
      break
    case 'support':
      url = 'https://www.tribes.ai/support'
      break
    case 'settings':
      url = 'https://app.dev.tribes.ai/login-browser-extension'
      break
  }
  browser.tabs.create({
    url,
  })
}

function saveToken() {
  extToken.value = tempValue.value
  storage.setItem('ext-token', extToken.value)
}

function clearToken() {
  storage.removeItem('ext-token')
  extToken.value = ''
}

const getLoginText = computed(() => {
  return extToken.value
    ? 'Tracking active!'
    : 'Tracking NOT active, please add token'
})

;(async () => {
  getDomainsFromStorage()
  const data = await browser.tabs.query({ currentWindow: true })
  const obj: DomainList = {}
  data.forEach((d: Tabs.Tab) => {
    const url = getParsedURL(d)
    if (url) {
      obj[url] = url
    }
  })
  trackedDomains.value = { ...toRaw(storedDomains.value), ...obj }
})()
</script>

<style scoped>
ul li {
  @apply flex gap-x-2 items-center;
}

tr th,
td {
  @apply border border-primary p-2 pl-4;
}

th {
  @apply bg-primary-light;
}
</style>
