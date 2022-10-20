<template>
  <div class="bg-white w-[50rem] px-8 py-6 space-y-6 text-accent relative">
    <div class="flex justify-between">
      <span class="right-5 top-3 absolute"> v {{ appVersion }} </span>
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
    <hr class="h-0.75 bg-gray-100" />
    <div class="space-y-3">
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
          input-classes="border border-gray-300 flex-grow-1"
          placeholder="Enter authentication token to activate tracking"
          :readonly="extToken ? 'readonly' : null"
          :model-value="extToken"
          @update:model-value="(newValue: string) => (tempValue = newValue)"
        />
        <BaseButton :disabled="extToken ? true : false" @click="saveToken">
          Save
        </BaseButton>
        <BaseButton
          classes="bg-transparent text-accent shadow-none hover:bg-primary hover:bg-opacity-[.08]"
          @click="clearToken"
        >
          Clear
        </BaseButton>
      </div>
      <span v-if="inValidToken" class="text-red-500">
        {{ tokenError }}
      </span>
    </div>
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
    <hr class="h-0.75 bg-gray-100" />
    <h4 class="font-medium text-[1.8rem]">Event Tracking</h4>
    <div class="flex-grow overflow-y-auto">
      <table class="w-full border border-primary relative">
        <thead>
          <tr class="text-left">
            <th class="py-3">Domain</th>
            <th class="py-3">Track</th>
            <th class="py-3">Block</th>
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
            <td>
              <input type="checkbox" disabled />
            </td>
          </tr>
          <tr
            v-for="(domain, key) in getDomainsFromAllSources"
            :key="domain.url"
          >
            <td>{{ key }}</td>
            <td>
              <input
                type="checkbox"
                class="accent-primary"
                :value="domain"
                :checked="domain.isActive"
                :disabled="domain.isBlocked"
                @change="toggleDomainToStorage($event, domain)"
              />
            </td>

            <td>
              <input
                type="checkbox"
                disabled
                :value="domain"
                :checked="domain.isBlocked"
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
import type { Tabs } from 'webextension-polyfill'

import { DomainList } from '~/types'
import LocalStorage from '~/utils/LocalStorage'
import { fetchUserDomains, getParsedURL, isDomainBlocked } from '~/utils/Common'
import Logger from '~/utils/Logger'
import ApiManager from '~/api'

const graphqlURL = import.meta.env.VITE_APP_GRAPHQL_URL
const apiManager = ApiManager()

const addDomain = ref('')
const invalidDomain = ref(false)
const trackedDomains = ref<DomainList>({})
const extToken = ref('')
const tempValue = ref('')
const appVersion = ref(import.meta.env.VITE_APP_VERSION)
const inValidToken = ref(false)
const tokenError = ref('')
const storage = new LocalStorage()
const logger = new Logger()
let blockedDomains: DomainList

async function getObjectsFromStorage() {
  const token = await storage.getItem('ext-token')
  extToken.value = token['ext-token']

  const data = await storage.getItem('trackedDomains')

  return {
    ...(data['trackedDomains'] || {}),
  }
}

async function addToDomainsList() {
  invalidDomain.value = false
  try {
    const url = getHostname(addDomain.value)
    if (url) {
      await createOrUpdateUserDomain(url, 'active')
      addDomain.value = ''
    }
  } catch (e) {
    logger.error(e)
    invalidDomain.value = true
  }
}

async function toggleDomainToStorage(event: Event, { url }: { url: string }) {
  try {
    const target = event.target as HTMLInputElement
    if (target.checked) {
      await createOrUpdateUserDomain(url, 'active')
    } else if (!target.checked) {
      await createOrUpdateUserDomain(url, 'inactive')
    }
  } catch (e) {
    logger.error(e)
  }
}

function openPage() {
  const url = import.meta.env.VITE_APP_BASE_URL
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
      url = `${import.meta.env.VITE_APP_BASE_URL}/login-browser-extension`
      break
  }
  browser.tabs.create({
    url,
  })
}

function saveToken() {
  inValidToken.value = false
  tokenError.value = ''

  const tokenRegx =
    /[0-9a-fA-F]{8}[0-9a-fA-F]{4}[0-9a-fA-F]{4}[0-9a-fA-F]{4}[0-9a-fA-F]{12}/

  if (!tempValue.value) {
    tokenError.value = 'Token is required'
    inValidToken.value = true
    return
  }

  if (!tempValue.value.match(tokenRegx)) {
    tokenError.value = 'Invalid token format'
    inValidToken.value = true
    return
  }
  extToken.value = tempValue.value
  tempValue.value = ''
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

const getDomainsFromAllSources = computed(() => {
  return {
    ...trackedDomains.value,
    ...blockedDomains,
  }
})

async function getTabsInCurrentWindow() {
  const obj: DomainList = {}
  const data = await browser.tabs.query({ currentWindow: true })
  data.forEach((d: Tabs.Tab) => {
    const url = getParsedURL(d)
    if (url) {
      const isBlocked = isDomainBlocked(url, blockedDomains)
      obj[url] = { url, isActive: false, isBlocked: isBlocked }
    }
  })
  return obj
}

async function createOrUpdateUserDomain(
  url: string,
  status: string
): Promise<any> {
  try {
    const res = await apiManager(
      '',
      graphqlURL
    ).createUpdateUserWhitelistDomain({
      token: extToken.value,
      data: [
        {
          domain: url,
          status: status,
        },
      ],
    })
    if (res.data?.createUpdateUserDomainWhitelist?.items) {
      const userDomains = await fetchUserDomains(graphqlURL)
      if (userDomains) {
        trackedDomains.value = {
          ...trackedDomains.value,
          ...userDomains,
        }
        await storage.removeItem('trackedDomains')
        await storage.setItem('trackedDomains', toRaw(trackedDomains.value))
      }
      return true
    }
  } catch (e) {
    return e
  }
}

;(async () => {
  try {
    let domainsFromAllSource: DomainList

    const storedDomains = await getObjectsFromStorage()

    let currentTabs = await getTabsInCurrentWindow()

    const bData = await storage.getItem('blockedDomains')
    blockedDomains = bData['blockedDomains'] || {}

    const userDomains = await fetchUserDomains(graphqlURL)

    domainsFromAllSource = {
      ...currentTabs,
      ...storedDomains,
      ...userDomains,
    }

    trackedDomains.value = domainsFromAllSource
  } catch (e: any) {
    if (e.message === 'Invalid access/browser token') {
      extToken.value = ''
      inValidToken.value = true
      tokenError.value = e.message
    }
  }
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
