import { sendMessage, onMessage } from 'webext-bridge'
import { Tabs } from 'webextension-polyfill'
import { startTrackingActivity } from './tracking'

interface Session {
  url: string
  tabId: string
  startTime: number
  endTime: number
}

// let startTime = 0
const trackingData: any = {}
let sessionStartTime = 0

function accumulateTime(session: Session) {
  if (session.url) {
    const url = session.url ? new URL(session.url).hostname : session.url
    if (trackingData[url])
      trackingData[url] += (session.endTime - session.startTime) / 1000
    else trackingData[url] = (session.endTime - session.startTime) / 1000
  }
  console.log(trackingData)
  return trackingData
}

function onSessionEnd(session: Session) {
  accumulateTime(session)
}

function onExtensionOpenListener(url: string) {
  accumulateTime({
    url,
    tabId: '',
    startTime: sessionStartTime,
    endTime: Date.now(),
  })
}

function onSessionStart(session: Session) {
  sessionStartTime = session.startTime
}

function updateUI() {
  browser.runtime.sendMessage({ msg: 'popup', data: trackingData })
}

startTrackingActivity(onSessionStart, onSessionEnd)
onMessage('updateUI', (data: any) => {
  onExtensionOpenListener(data.data.url)
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

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  } catch {
    return
  }

  // eslint-disable-next-line no-console
  // console.log('previous tab', tab)
  sendMessage(
    'tab-prev',
    { title: tab.title },
    { context: 'content-script', tabId }
  )
})

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.title,
    }
  } catch {
    return {
      title: undefined,
    }
  }
})
