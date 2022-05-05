import browser, { Tabs } from 'webextension-polyfill'
import { DomainList, TabData, WindowData } from '~/types'
import { getParsedURL, getTabData, getWindowData } from '~/utils/Common'
import LocalStorage from '~/utils/LocalStorage'
import { postData } from '~/api/httpClient'
import Logger from '~/utils/Logger'
import statusRed from '~/assets/img/status-red.png'
import statusBlue from '~/assets/img/status-blue.png'
const storage = new LocalStorage()
const logger = new Logger()

let trackedDomains: DomainList = {}
const tabIds = new Set()
let token: string
let trackedEvents: { [key: string]: TabData | WindowData } = {}
let apiInterval: NodeJS.Timer

  //prettier-ignore
;(async () => {
  const data = await storage.getItem('ext-token')
  token = data['ext-token']
  changeIcon(token)
  apiInterval = setInterval(() => {
    sendData(trackedEvents)
  }, 120000)
})()

async function getTrackedDomains() {
  const data = await storage.getItem('trackedDomains')
  trackedDomains = data['trackedDomains'] || {}
}

getTrackedDomains()

browser.runtime.onInstalled.addListener((): void => {
  browser.tabs.create({
    url: `${process.env.VITE_APP_BASE_URL}/login-browser-extension`,
  })
})

browser.storage.onChanged.addListener((changes: any) => {
  if (changes?.trackedDomains) {
    trackedDomains = changes?.trackedDomains?.newValue
  }
  if (changes?.['ext-token']) {
    token = changes?.['ext-token']?.newValue
    changeIcon(token)
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
      if (data) {
        trackedEvents[data.eventId] = data
      }
    }
  } catch (e) {
    logger.error(e)
  }
})

// * Tab Events

browser.tabs.onCreated.addListener(async (tab: Tabs.Tab) => {
  try {
    const url = getParsedURL(tab)
    if (url && tab.highlighted) {
      tabIds.add(tab.id)
      const data = getTabData(url, 'Tab.onCreated', tab)
      if (data) {
        trackedEvents[data.eventId] = data
      }
    }
  } catch (e) {
    logger.error(e)
  }
})

browser.tabs.onActivated.addListener(async ({ tabId }: any) => {
  try {
    const tab: Tabs.Tab = await browser.tabs.get(tabId)
    const url = getParsedURL(tab)
    if (url && trackedDomains[url] && tab.highlighted) {
      tabIds.add(tab.id)
      const data = getTabData(url, 'Tab.onActivated', tab)
      if (data) {
        trackedEvents[data.eventId] = data
      }
    }
  } catch (e) {
    logger.error(e)
  }
})

browser.tabs.onUpdated.addListener(
  async (tabId: number, changeInfo: unknown, tab: Tabs.Tab) => {
    try {
      if (tab.status === 'complete' && tab.highlighted) {
        const url = getParsedURL(tab)
        if (url && trackedDomains[url]) {
          tabIds.add(tab.id)
          const data = getTabData(url, 'Tab.onUpdated', tab)
          if (data) {
            trackedEvents[data.eventId] = data
          }
        }
      }
    } catch (e) {
      logger.error(e)
    }
  }
)

browser.runtime.onMessage.addListener(
  async ({ message, data }: { message: string; data: any }) => {
    if (message === 'user-events') {
      // if (data) {
      const tab = await browser.tabs.query({
        currentWindow: true,
        highlighted: true,
      })
      const url = getParsedURL(tab[0])
      if (url && trackedDomains[url]) {
        const mTabData = getTabData(url, 'Tab.onClick', tab[0])
        if (mTabData) {
          trackedEvents[mTabData.eventId] = mTabData
        }
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
      const timezoneUtcOffset = -new Date().getTimezoneOffset()
      const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
      const data: TabData = {
        userId: token,
        eventId,
        datetime,
        timezoneUtcOffset,
        timezoneId,
        eventType: 'Tab.onRemoved',
        data: { id: tabId },
        domData: [],
        version: process.env.VITE_APP_VERSION as string,
      }
      trackedEvents[data.eventId] = data
      tabIds.delete(tabId)
    }
  } catch (e) {
    logger.error(e)
  }
})

browser.windows.onRemoved.addListener(async (windowId: number) => {
  try {
    const datetime = new Date().toISOString()
    const eventId = `${token}|${windowId}|${datetime}`
    const timezoneUtcOffset = -new Date().getTimezoneOffset()
    const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
    const data: WindowData = {
      userId: token,
      eventId,
      eventType: 'Window.onRemoved',
      timezoneUtcOffset,
      timezoneId,
      datetime: new Date().toISOString(),
      data: { id: windowId },
      version: process.env.VITE_APP_VERSION as string,
    }
    trackedEvents[data.eventId] = data
    clearInterval(apiInterval)
    storage.setItem('events-data', JSON.stringify(trackedEvents))
    trackedEvents = {}
  } catch (e) {
    logger.error(e)
  }
})

async function sendData(data: { [key: string]: TabData | WindowData }) {
  try {
    if (token && Object.keys(data).length) {
      const eventsData = Object.values(data)
      await postData(eventsData, token)
      trackedEvents = {}
    }
  } catch (e: unknown) {
    logger.error(e)
  }
}

function changeIcon(token: string): void {
  const icon = token ? statusBlue : statusRed
  browser.action.setIcon({ path: icon })
}
