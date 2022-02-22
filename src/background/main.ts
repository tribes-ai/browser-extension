import { onMessage } from 'webext-bridge'
import { Tabs } from 'webextension-polyfill'
import { startTrackingActivity } from './tracking.js'

interface Session {
  url: string
  tabId: string
  startTime: number
  endTime: number
}

let whitelistedDomains: Array<string>
let trackingData: any = {}

const stopTracking = startTrackingActivity(onSessionStart, onSessionEnd)

function accumulateTime(session: Session): void {
  if (session.url && whitelistedDomains?.includes(session.url)) {
    const url = session.url
    if (trackingData[url]) trackingData[url]['endTime'] = session.endTime
    else
      trackingData[url] = {
        startTime: session.startTime,
        endTime: 0,
      }
  }
  calculateTotalTime()
}

function calculateTotalTime() {
  Object.entries(trackingData).forEach(([key, value]: [string, any]): void => {
    // trackingData[key]['totalTime'] = DateTime.fromMillis(
    //   value.endTime - value.startTime
    // )
    console.log(msToReadableTime(value.endTime - value.startTime))
  })
}

function onSessionEnd(session: Session) {
  accumulateTime(session)
}

function onSessionStart(session: Session) {
  accumulateTime(session)
}

function updateUI() {
  browser.runtime.sendMessage({ msg: 'popup', data: trackingData })
}

onMessage('updateUI', () => {
  updateUI()
})

const interval = setInterval(() => {
  sendDataToBackend()
}, 100000)

function sendDataToBackend() {
  console.log('send to backend')
}

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

browser.windows.onRemoved.addListener(() => {
  stopTracking()
  clearInterval(interval)
  trackingData = {}
})
;(async () => {
  const data = await browser.storage.local.get('whitelistedDomains')
  whitelistedDomains = data.whitelistedDomains
})()

browser.storage.onChanged.addListener((changes: any) => {
  whitelistedDomains = changes.newValue.whitelistedDomains
})

browser.windows.onFocusChanged.addListener((window: number) => {
  //   if (window === -1) {
  //     stopTracking()
  //   } else {
  //     stopTracking = startTrackingActivity(onSessionStart, onSessionEnd)
  //   }
})

function msToReadableTime(time: number): string {
  const second = 1000
  const minute = second * 60
  const hour = minute * 60

  const hours = Math.floor((time / hour) % 24)
  const minutes = Math.floor((time / minute) % 60)
  const seconds = Math.floor((time / second) % 60)

  return hours + ':' + minutes + ':' + seconds
}

browser.tabs.onActivated.addListener((activeInfo: any) => {
  console.log('type: tab', 'event: onActivated')
  console.log(activeInfo)
  console.log('------------------------------------------')
})

browser.tabs.onCreated.addListener((tab: Tabs.Tab) => {
  console.log('type: tab', 'event: onCreated')
  console.log(tab, 'tab created')
  console.log('------------------------------------------')
})

browser.windows.onCreated.addListener((window: any) => {
  console.log('type: window', 'event: onCreated')
  console.log(window, 'window created')
  console.log('------------------------------------------')
})

browser.tabs.onAttached.addListener((tabId: number, attachInfo: any) => {
  console.log('type: tab', 'event: onAttached')
  console.log(tabId, 'tab id')
  console.log(attachInfo, 'attach info')
  console.log('------------------------------------------')
})

browser.tabs.onHighlighted.addListener((highlightInfo: any) => {
  console.log('type: tab', 'event: onHighlighted')
  console.log(highlightInfo, 'tab highlighted')
  console.log('------------------------------------------')
})

browser.tabs.onUpdated.addListener(
  (tabId: number, changeInfo: any, tab: Tabs.Tab) => {
    console.log('type: tab', 'event: onUpdated')
    console.log(tabId, 'tab id')
    console.log(changeInfo, 'change info')
    console.log(tab, 'tab info')
    console.log('------------------------------------------')
  }
)

browser.tabs.onRemoved.addListener((tabId: number, removeInfo: any) => {
  console.log('type: tab', 'event: onRemoved')
  console.log(tabId, 'tab id')
  console.log(removeInfo, 'remove info')
  console.log('------------------------------------------')
})
