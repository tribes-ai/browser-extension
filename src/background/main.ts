import { Tabs } from 'webextension-polyfill'
import { DomainList, TabData, WindowData } from '~/types'
import { getParsedURL, getTabData, getWindowData } from '~/utils/Common'
import LocalStorage from '~/utils/LocalStorage'
import httpClient from '~/api/httpClient'
const storage = new LocalStorage()

const domainsList: DomainList = {}
let trackedDomains: DomainList = {}
const tabIds = new Set()
let token: string

//prettier-ignore
(async () => {
  const data = await storage.getItem('ext-token')
  token = data['ext-token']
})()

async function getTrackedDomains() {
  const data = await storage.getItem('trackedDomains')
  trackedDomains = data['trackedDomains'] || {}
}

getTrackedDomains()

async function updateUI() {
  await browser.runtime.sendMessage({
    message: 'popup',
    data: domainsList,
  })
}

browser.runtime.onMessage.addListener(({ message }: { message: string }) => {
  if (message === 'popupData') {
    updateUI()
  }
})

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

browser.runtime.onInstalled.addListener((): void => {
  browser.tabs.create({
    url: 'https://app.dev.tribes.ai/login-browser-extension',
  })
})

browser.storage.onChanged.addListener((changes: any) => {
  if (changes?.trackedDomains) {
    trackedDomains = changes?.trackedDomains?.newValue
    console.log(trackedDomains)
  }
  if (changes?.['ext-token']) {
    token = changes?.['ext-token']?.newValue
  }
})

// * Window Events

browser.windows.onFocusChanged.addListener(async (windowId: number) => {
  try {
    if (windowId !== -1) {
      const window = await browser.windows.getCurrent({ populate: true })
      const data = getWindowData('Window.onFocusChanged', window)
      sendData(data)
    }
  } catch (e) {
    console.error(e)
  }
})

// * Tab Events

browser.tabs.onCreated.addListener(async (tab: Tabs.Tab) => {
  try {
    const url = getParsedURL(tab, domainsList)
    if (url) {
      domainsList[url] = url
      tabIds.add(tab.id)
      const data = getTabData(url, 'Tab.onCreated', tab)
      sendData(data)
    }
  } catch (e) {
    console.error(e)
  }
})

browser.tabs.onActivated.addListener(async ({ tabId }: any) => {
  try {
    const tab: Tabs.Tab = await browser.tabs.get(tabId)
    const url = getParsedURL(tab, domainsList)
    if (url && trackedDomains[url]) {
      domainsList[url] = url
      tabIds.add(tab.id)
      const data = getTabData(url, 'Tab.onActivated', tab)
      sendData(data)
    }
  } catch (e) {
    console.log(e)
  }
})

browser.tabs.onUpdated.addListener(
  async (tabId: number, changeInfo: unknown, tab: Tabs.Tab) => {
    try {
      if (tab.status === 'complete') {
        const url = getParsedURL(tab, domainsList)
        if (url && trackedDomains[url]) {
          domainsList[url] = url
          tabIds.add(tab.id)
          const data = getTabData(url, 'Tab.onUpdated', tab)
          sendData(data)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }
)

browser.runtime.onMessage.addListener(
  async ({ message, data }: { message: string; data: any }) => {
    if (message === 'user-events') {
      // if (data) {
      const tab = await browser.tabs.query({
        currentWindow: true,
        active: true,
      })
      const url = getParsedURL(tab[0], domainsList)
      if (url && trackedDomains[url]) {
        const mTabData = getTabData(url, 'Tab.onClick', tab[0])
        sendData(mTabData)
        // const clickData = JSON.parse(data)
        // if (mTabData) {
        //   mTabData.domData = clickData
        // }
      }
    }
    // }
  }
)

browser.tabs.onRemoved.addListener(async (tabId: number, removeInfo: any) => {
  try {
    if (!removeInfo.isWindowClosing && tabIds.has(tabId)) {
      const datetime = new Date().toISOString()
      const eventId = `${token}|${tabId}|${datetime}`
      const timezoneUtcOffset = new Date().getTimezoneOffset()
      const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
      const data: TabData = {
        userId: token,
        eventId,
        datetime,
        timezoneUtcOffset,
        timezoneId,
        eventType: 'Tab.onRemoved',
        metaData: {
          created_at: new Date(),
          created_by: 'test',
        },
        data: { id: tabId },
        domData: [],
        version: import.meta.env.VITE_APP_VERSION as string,
      }
      sendData(data)
      tabIds.delete(tabId)
    }
  } catch (e) {
    console.error(e)
  }
})

browser.windows.onRemoved.addListener(async (windowId: number) => {
  try {
    const datetime = new Date().toISOString()
    const eventId = `${token}|${windowId}|${datetime}`
    const timezoneUtcOffset = new Date().getTimezoneOffset()
    const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
    const data: WindowData = {
      userId: token,
      eventId,
      eventType: 'Window.onRemoved',
      timezoneUtcOffset,
      timezoneId,
      datetime: new Date().toISOString(),
      data: { id: windowId },
      metaData: {
        created_at: new Date(),
        created_by: 'test',
      },
      version: import.meta.env.VITE_APP_VERSION as string,
    }
    sendData(data)
  } catch (e) {
    console.error(e)
  }
})

async function sendData(data: TabData | WindowData) {
  if (token) {
    await httpClient.post('/', data)
  }
}
