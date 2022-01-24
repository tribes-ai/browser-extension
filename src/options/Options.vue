<template>
  <main class="px-4 py-10 text-gray-700 h-full bg-gray-200">
    <div class="mx-auto max-w-[80%] text-center">
      <h1 class="text-4xl">Settings</h1>
      <div class="text-left space-y-4">
        <h4 class="text-xl">Whitelisted Domains</h4>
        <ul class="border border-black h-[10rem] max-w-[50%] px-4 py-2">
          <li
            v-for="(domain, index) in whitelistedDomains"
            :key="index"
            class="flex justify-between text-base"
          >
            <span class="">
              {{ domain }}
            </span>
            <span class="text-red-500">X</span>
          </li>
        </ul>
        <div class="flex max-w-[50%] justify-between items-center">
          <input
            v-model="addDomain"
            type="text"
            class="focus:outline-none p-2 w-[90%]"
            placeholder="Add domains to track"
            @keypress.enter="addToWhitelistedDomains"
          />
        </div>
        <span v-if="invalidDomain" class="text-red-500"> Invalid Domain </span>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue'

const addDomain = ref('')
const invalidDomain = ref(false)
const whitelistedDomains = ref<Array<string>>([])

fetchWhitelistedDomains()

async function fetchWhitelistedDomains() {
  let data = await browser.storage.local.get('whitelistedDomains')
  whitelistedDomains.value = data['whitelistedDomains']
}

async function addToWhitelistedDomains() {
  invalidDomain.value = false
  try {
    new URL(addDomain.value)
    whitelistedDomains.value.push(addDomain.value)
    addDomain.value = ''
    await browser.storage.local.set({
      whitelistedDomains: toRaw(whitelistedDomains.value),
    })
  } catch (e) {
    console.error(e)
    invalidDomain.value = true
  }
}
</script>
