import browser, { Tabs } from 'webextension-polyfill'
import { DomainList, TabData, WindowData } from '~/types'
import { getParsedURL, getTabData, getWindowData } from '~/utils/Common'
import LocalStorage from '~/utils/LocalStorage'
import { postData } from '~/api/httpClient'
const storage = new LocalStorage()

let trackedDomains: DomainList = {}
const tabIds = new Set()
let token: string
let trackedEvents: { [key: string]: TabData | WindowData } = {}
let apiInterval: NodeJS.Timer

  //prettier-ignore
;(async () => {
  const data = await storage.getItem('ext-token')
  token = data['ext-token']
  apiInterval = setInterval(() => {
    // sendData(trackedEvents)
  }, 5000)
})()

async function getTrackedDomains() {
  const data = await storage.getItem('trackedDomains')
  trackedDomains = data['trackedDomains'] || {}
}

getTrackedDomains()

browser.runtime.onInstalled.addListener((): void => {
  browser.tabs.create({
    url: 'https://app.dev.tribes.ai/login-browser-extension',
  })
})

browser.storage.onChanged.addListener((changes: any) => {
  if (changes?.trackedDomains) {
    trackedDomains = changes?.trackedDomains?.newValue
  }
  if (changes?.['ext-token']) {
    token = changes?.['ext-token']?.newValue
  }
})

// * Window Events

browser.windows.onCreated.addListener(async () => {
  const data = await storage.getItem('events-data')
  trackedEvents = JSON.parse(data['events-data'])
})

browser.windows.onFocusChanged.addListener(async (windowId: number) => {
  try {
    if (windowId !== -1) {
      const window = await browser.windows.getCurrent({ populate: true })
      const data = getWindowData('Window.onFocusChanged', window)
      trackedEvents[data.eventId] = data
    }
  } catch (e) {
    console.error(e)
  }
})

// * Tab Events

browser.tabs.onCreated.addListener(async (tab: Tabs.Tab) => {
  try {
    const url = getParsedURL(tab)
    if (url) {
      tabIds.add(tab.id)
      const data = getTabData(url, 'Tab.onCreated', tab)
      trackedEvents[data.eventId] = data
    }
  } catch (e) {
    console.error(e)
  }
})

browser.tabs.onActivated.addListener(async ({ tabId }: any) => {
  try {
    const tab: Tabs.Tab = await browser.tabs.get(tabId)
    const url = getParsedURL(tab)
    if (url && trackedDomains[url]) {
      tabIds.add(tab.id)
      const data = getTabData(url, 'Tab.onActivated', tab)
      trackedEvents[data.eventId] = data
      sendData(trackedEvents)
    }
  } catch (e) {
    console.error(e)
  }
})

browser.tabs.onUpdated.addListener(
  async (tabId: number, changeInfo: unknown, tab: Tabs.Tab) => {
    try {
      if (tab.status === 'complete') {
        const url = getParsedURL(tab)
        if (url && trackedDomains[url]) {
          tabIds.add(tab.id)
          const data = getTabData(url, 'Tab.onUpdated', tab)
          trackedEvents[data.eventId] = data
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
      const url = getParsedURL(tab[0])
      if (url && trackedDomains[url]) {
        const mTabData = getTabData(url, 'Tab.onClick', tab[0])
        trackedEvents[mTabData.eventId] = mTabData
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
        version: process.env.APP_VERSION as string,
      }
      trackedEvents[data.eventId] = data
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
      version: process.env.APP_VERSION as string,
    }
    trackedEvents[data.eventId] = data
    clearInterval(apiInterval)
    storage.setItem('events-data', JSON.stringify(trackedEvents))
    trackedEvents = {}
  } catch (e) {
    console.error(e)
  }
})

async function sendData(data: { [key: string]: TabData | WindowData }) {
  if (token && Object.keys(data).length) {
    const eventsData = Object.values(data)
    await postData(eventsData)
    trackedEvents = {}
  }
}
