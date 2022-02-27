import { Tabs } from 'webextension-polyfill'
import { DomainList } from '~/types'
import { getParsedURL, getTabData, getWindowData } from '~/utils/Common'

const domainsList: DomainList = {}
let trackedDomains: DomainList = {}

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
      if (url) {
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

browser.tabs.onActivated.addListener(async (activeInfo: any) => {
  const tab = await browser.tabs.get(activeInfo.tabId)
  const url = getParsedURL(tab, domainsList)
  if (url) {
    domainsList[url] = url
    console.log(getTabData(url, 'Tab.onActivated', tab))
  }
})

browser.tabs.onHighlighted.addListener(async () => {
  const tabs = await browser.tabs.query({})
  tabs.forEach((tab: Tabs.Tab) => {
    const url = getParsedURL(tab, domainsList)
    if (url) {
      domainsList[url] = url
      console.log(getTabData(url, 'Tab.onHighlighted', tab))
    }
  })
})

browser.tabs.onUpdated.addListener(
  (tabId: number, changeInfo: unknown, tab: Tabs.Tab) => {
    const url = getParsedURL(tab, domainsList)
    if (url) {
      domainsList[url] = url
      console.log(getTabData(url, 'Tab.onUpdated', tab))
    }
  }
)

// browser.tabs.onRemoved.addListener(async (tabId: number) => {
//   removeFromDomainList(tabId, domainsList)
// })
