import { onMessage } from 'webext-bridge'
import { Tabs } from 'webextension-polyfill'
import { addToDomainList } from '~/utils/Common'

const domainsList: Set<string> = new Set()

async function updateUI() {
  await browser.runtime.sendMessage({ message: 'popup', data: domainsList })
}

onMessage('updateUI', () => {
  updateUI()
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
  // whitelistedDomains = changes.newValue.whitelistedDomains
})

setInterval(() => {
  // console.log(domainsList)
}, 2000)

// * Window Events

browser.windows.onFocusChanged.addListener(async (windowId: number) => {
  if (windowId !== -1) {
    const tabs = await browser.tabs.query({})
    tabs.forEach((tab: Tabs.Tab) => {
      addToDomainList(tab, domainsList)
    })
  }
})

// * Tab Events

browser.tabs.onCreated.addListener((tab: Tabs.Tab) => {
  addToDomainList(tab, domainsList)
})

browser.tabs.onActivated.addListener(async (activeInfo: any) => {
  const tab = await browser.tabs.get(activeInfo.tabId)
  addToDomainList(tab, domainsList)
})

browser.tabs.onHighlighted.addListener(async () => {
  const tabs = await browser.tabs.query({})
  tabs.forEach((tab: Tabs.Tab) => {
    addToDomainList(tab, domainsList)
  })
})

browser.tabs.onReplaced.addListener(
  (addedTabId: number, removedTabId: number) => {
    console.log(addedTabId, removedTabId)
  }
)

browser.tabs.onUpdated.addListener(
  (tabId: number, changeInfo: unknown, tab: Tabs.Tab) => {
    addToDomainList(tab, domainsList)
  }
)

// browser.tabs.onRemoved.addListener(async (tabId: number) => {
//   removeFromDomainList(tabId, domainsList)
// })
