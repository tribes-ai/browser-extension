import { onMessage } from 'webext-bridge'
import { startTrackingActivity } from './tracking'
interface Session {
  url: string
  tabId: string
  startTime: number
  endTime: number
}

// let startTime = 0
let trackingData: any = {}

const stopTracking = startTrackingActivity(onSessionStart, onSessionEnd)

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

function onSessionStart(session: Session) {
  accumulateTime(session)
}

function updateUI() {
  browser.runtime.sendMessage({ msg: 'popup', data: trackingData })
}

onMessage('updateUI', (data: any) => {
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

browser.windows.onRemoved.addListener(() => {
  stopTracking()
  trackingData = {}
})
