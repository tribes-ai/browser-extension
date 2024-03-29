import browser, { Tabs, Alarms } from 'webextension-polyfill'
import { DomainList, TabData, WindowData } from '~/types'
import { fetchUserDomains, getParsedURL, getTabData } from '~/utils/Common'
import LocalStorage from '~/utils/LocalStorage'
import ApiManager from '~/api'
import Logger from '~/utils/Logger'
import statusRed from '~/assets/img/status-red.png'
import statusBlue from '~/assets/img/status-blue.png'
import { isEmpty } from 'lodash-es'

const storage = new LocalStorage()
const logger = new Logger()
let trackedDomains: DomainList = {}
const apiService = ApiManager()
const tabIds = new Set()
const graphqlAPIURL = process.env.VITE_APP_GRAPHQL_URL as string
let trackedEvents: { [key: string]: TabData | WindowData } = {}
let blockedDomains: DomainList
let token: string

//prettier-ignore
try {
  ;(async () => {
    createSendEventsAlarm()
    createFetchDomainsAlarm()
    getTrackedDomains()
    const data = await storage.getItem('ext-token')
    token = data['ext-token']
    changeIcon(token)
    browser.alarms.onAlarm.addListener(async (alarm: Alarms.Alarm) => {
      if (alarm.name === 'send-events') {
        sendData(trackedEvents)
      }
      if (alarm.name === 'fetch-blocked-domains' && token) {
        getBlockedDomains()
      }
      if(alarm.name === 'fetch-user-domains' && token){
        fetchUserDomains(graphqlAPIURL)
      }
    })
  })()  

  browser.runtime.onInstalled.addListener((): void => {
    browser.tabs.create({
      url: `${process.env.VITE_APP_BASE_URL}/login-browser-extension`,
    })
    getBlockedDomains()
    fetchUserDomains(graphqlAPIURL)
  })

  browser.storage.onChanged.addListener((changes: any) => {
    if (changes?.trackedDomains) {
      trackedDomains = changes?.trackedDomains?.newValue
     
    }
    if (changes?.['ext-token']) {
      token = changes?.['ext-token']?.newValue
      changeIcon(token)
      getBlockedDomains()
      fetchUserDomains(graphqlAPIURL)
    }
  })

  // * Window Events

  browser.windows.onCreated.addListener(async () => {
    const data = await storage.getItem('events-data')
    trackedEvents = JSON.parse(data['events-data'])
  })

  /*
   * * commented/removed as part of https://tribes-ai.atlassian.net/browse/TRI-3393?focusedCommentId=40847
   */
  // browser.windows.onFocusChanged.addListener(async (windowId: number) => {
  //   try {
  //     if (windowId !== -1) {
  //       const window = await browser.windows.getCurrent({ populate: true })
  //       const isTrackedURL = window.tabs?.some(
  //         (tab: Tabs.Tab) =>
  //           trackedDomains[getHostname(tab.url as string) as string]
  //       )
  //       const data = getWindowData('Window.onFocusChanged', window)
  //       if (data && isTrackedURL) {
  //         trackedEvents[data.eventId] = data
  //       }
  //     }
  //   } catch (e) {
  //     logger.error(e)
  //   }
  // })

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
      if (
        url &&
        tab.highlighted &&
        tab.active &&
        trackedDomains[url]?.isActive &&
        !trackedDomains[url]?.isBlocked
      ) {
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
        if (tab.status === 'complete' && tab.highlighted && tab.active) {
          const url = getParsedURL(tab)
          if (
            url &&
            trackedDomains[url]?.isActive &&
            !trackedDomains[url]?.isBlocked
          ) {
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
          active: true,
        })
        const url = getParsedURL(tab[0])
        if (
          url &&
          trackedDomains[url]?.isActive &&
          !trackedDomains[url]?.isBlocked
        ) {
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

  /*
   * * commented/removed as part of https://tribes-ai.atlassian.net/browse/TRI-3393?focusedCommentId=40847
   */
  browser.windows.onRemoved.addListener(async (windowId: number) => {
    try {
  //     const datetime = new Date().toISOString()
  //     const eventId = `${token}|${windowId}|${datetime}`
  //     const timezoneUtcOffset = -new Date().getTimezoneOffset()
  //     const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
  //     const data: WindowData = {
  //       'userId': token,
  //       eventId,
  //       eventType: 'Window.onRemoved',
  //       timezoneUtcOffset,
  //       timezoneId,
  //       datetime: new Date().toISOString(),
  //       data: { id: windowId },
  //       version: process.env.VITE_APP_VERSION as string,
  //     }
  //     trackedEvents[data.eventId] = data
      storage.setItem('events-data', JSON.stringify(trackedEvents))
      trackedEvents = {}
  //     await browser.alarms.clearAll()
    } catch (e) {
      logger.error(e)
    }
  })
} catch (e) {
  console.error(e)
}

async function getTrackedDomains() {
  const data = await storage.getItem('trackedDomains')
  trackedDomains = data['trackedDomains'] || {}
  const bData = await storage.getItem('blockedDomains')
  blockedDomains = bData['blockedDomains'] || {}
}

async function sendData(data: { [key: string]: TabData | WindowData }) {
  try {
    if (token && !isEmpty(data)) {
      const tData = await storage.getItem('trackedEvents')
      const sEvents = tData['trackedEvents'] || {}
      const newData = { ...data, ...sEvents }
      const eventsData = Object.values(newData)
      const res: any = await apiService(token).saveEvents(eventsData)
      if (res?.errors[0]?.message === 'Invalid access/browser token') {
        token = ''
        await storage.removeItem('ext-token')
        return
      }
      trackedEvents = {}
      await storage.removeItem('trackedEvents')
    }
  } catch (e: unknown) {
    await storage.setItem('trackedEvents', data)
    logger.error(e)
  }
}

function changeIcon(token: string): void {
  const icon = token ? statusBlue : statusRed
  browser.action.setIcon({ path: icon })
}

function createSendEventsAlarm(): void {
  browser.alarms.get('send-events').then((a) => {
    if (!a) {
      browser.alarms.create('send-events', { periodInMinutes: 1.0 })
    }
  })
}

function createFetchDomainsAlarm(): void {
  browser.alarms.get('fetch-blocked-domains').then((a) => {
    if (!a) {
      browser.alarms.create('fetch-blocked-domains', { periodInMinutes: 1220 })
    }
  })
  browser.alarms.get('fetch-user-domains').then((a) => {
    if (!a) {
      browser.alarms.create('fetch-user-domains', { periodInMinutes: 60 })
    }
  })
}

async function getBlockedDomains(): Promise<void> {
  try {
    if (token) {
      const res = await apiService('', graphqlAPIURL).fetchBlockedDomains({
        token,
      })
      if (res?.errors[0]?.message === 'Invalid access/browser token') {
        token = ''
        await storage.removeItem('ext-token')
        return
      }
      blockedDomains = res.data?.blockedDomains?.items?.reduce(
        (prev: any, curr: string) => {
          const pattern = curr.includes('*')
            ? '(^.+\\.)?(' + curr.split('.')[1] + '+\\.)+[\\w-]+$'
            : curr
          return {
            ...prev,
            [curr]: {
              url: getParsedURL(curr),
              isBlocked: true,
              isActive: false,
              pattern,
            },
          }
        },
        {}
      )
      await storage.setItem('blockedDomains', blockedDomains)
    }
  } catch (e) {
    console.error(e)
    logger.error(e)
  }
}
