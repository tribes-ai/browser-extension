import { onMessage } from 'webext-bridge'
import { startTrackingActivity } from './tracking'

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
    trackingData[key]['totalTime'] = (value.endTime - value.startTime) / 1000
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

onMessage('updateUI', (data: any) => {
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

// browser.windows.onFocusChanged.addListener((window: number) => {
//   if (window === -1) {
//     stopTracking()
//   } else {
//     stopTracking = startTrackingActivity(onSessionStart, onSessionEnd)
//   }
// })
