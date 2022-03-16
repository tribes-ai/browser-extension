import { Tabs } from 'webextension-polyfill'
import { DomainList } from '~/types'
import { getParsedURL, getTabData, getWindowData } from '~/utils/Common'
import LocalStorage from '~/utils/LocalStorage'
const storage = new LocalStorage()

const domainsList: DomainList = {}
let trackedDomains: DomainList = {}

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
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

browser.storage.onChanged.addListener((changes: any) => {
  trackedDomains = changes.trackedDomains.newValue
})

// * Window Events

browser.windows.onFocusChanged.addListener(async (windowId: number) => {
  if (windowId !== -1) {
    const window = await browser.windows.getCurrent({ populate: true })
    const tabs = await browser.tabs.query({})
    tabs.forEach((tab: Tabs.Tab) => {
      const url = getParsedURL(tab, domainsList)
      if (url && trackedDomains[url]) {
        domainsList[url] = url
        console.log(getWindowData(url, 'Window.onFocusChanged', window, tabs))
      }
    })
  }
})

// * Tab Events

browser.tabs.onCreated.addListener((tab: Tabs.Tab) => {
  const url = getParsedURL(tab, domainsList)
  if (url) {
    domainsList[url] = url
    console.log(getTabData(url, 'Tab.onCreated', tab))
  }
})

browser.tabs.onActivated.addListener(async ({ tabId }: any) => {
  const tab = await browser.tabs.get(tabId)
  const url = getParsedURL(tab, domainsList)
  if (url && trackedDomains[url]) {
    domainsList[url] = url
    console.log(getTabData(url, 'Tab.onActivated', tab))
  }
})

browser.tabs.onUpdated.addListener(
  (tabId: number, changeInfo: unknown, tab: Tabs.Tab) => {
    if (tab.status === 'complete') {
      const url = getParsedURL(tab, domainsList)
      if (url && trackedDomains[url]) {
        domainsList[url] = url
        console.log(getTabData(url, 'Tab.onUpdated', tab))
      }
    }
  }
)

browser.runtime.onMessage.addListener(
  async ({ message, data }: { message: string; data: any }) => {
    // if (data) {
    const tab = await browser.tabs.query({
      currentWindow: true,
      active: true,
    })
    const url = getParsedURL(tab[0], domainsList)
    if (url) {
      const mTabData = getTabData(url, 'User Event', tab[0])
      // const clickData = JSON.parse(data)
      // if (mTabData) {
      //   mTabData.domData = clickData
      // }
      console.log(mTabData)
    }
    // }
  }
)

browser.tabs.onRemoved.addListener(async (tabId: number) => {
  console.log(tabId)
})
