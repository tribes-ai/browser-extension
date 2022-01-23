export function startTrackingActivity(onSessionStart, onSessionEnd) {
  var session = { tabId: -1 }

  function endSession() {
    if (session.tabId !== -1) {
      session.endTime = Date.now()
      onSessionEnd && onSessionEnd(session)
      session = { tabId: -1 }
    }
  }

  function startSession(tab) {
    endSession()
    session = {
      tabId: tab.id,
      url: tab.url,
      startTime: Date.now(),
    }
    onSessionStart &&
      onSessionStart({
        tabId: session.tabId,
        url: session.url,
        startTime: session.startTime,
      })
  }

  function trackWindowFocus(windowId) {
    if (windowId !== -1) {
      browser.windows.getCurrent({ populate: true }).then(function (window) {
        var activeTab = window.tabs.filter(function (tab) {
          return tab.active
        })[0]
        if (activeTab && activeTab.id !== session.tabId) {
          startSession(activeTab)
        }
      })
    } else {
      endSession()
    }
  }

  function trackActiveTab(activeInfo) {
    browser.tabs.get(activeInfo.tabId).then(function (tab) {
      if (!browser.runtime.lastError && tab.id !== session.tabId) {
        startSession(tab)
      }
    })
  }

  function trackTabUpdates(tabId, changeInfo, tab) {
    if (
      tab.active &&
      changeInfo.status === 'loading' &&
      tab.url !== session.url
    ) {
      browser.windows.get(tab.windowId).then(function (window) {
        if (!browser.runtime.lastError && window.focused) {
          startSession(tab)
        }
      })
    }
  }
  function trackHighlightedTab({ tabIds }) {
    browser.tabs.get(tabIds[0]).then((tab) => {
      if (tab.id === session.id) {
        startSession(tab)
      }
    })
  }

  browser.windows.onFocusChanged.addListener(trackWindowFocus)
  browser.tabs.onUpdated.addListener(trackTabUpdates)
  browser.tabs.onActivated.addListener(trackActiveTab)
  browser.tabs.onHighlighted.addListener(trackHighlightedTab)

  return function stopTracking() {
    browser.windows.onFocusChanged.removeListener(trackWindowFocus)
    browser.tabs.onUpdated.removeListener(trackTabUpdates)
    browser.tabs.onActivated.removeListener(trackActiveTab)
  }
}
