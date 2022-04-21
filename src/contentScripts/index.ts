import LocalStorage from '~/utils/LocalStorage'
const storage = new LocalStorage()
const enableUserEvents = false

const tokenExtractionDomains = [
  'localhost',
  'app.dev.tribes.ai',
  'app.sta.tribes.ai',
  'app.tribes.ai',
]

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
;(() => {
  console.info('[vitesse-webext] Hello world from content script tribes.ai')
  // communication example: send previous tab title from background page

  extractToken()

  if (enableUserEvents) {
    listenToAllEvents()
  }
})()

browser.storage.onChanged.addListener((changes: any) => {
  console.log(changes)
  if (changes?.['ext-token']) {
    extractToken()
  }
})

function listenToAllEvents(): void {
  Object.keys(window).forEach((key) => {
    if (/^on/.test(key)) {
      const event = key.slice(2)
      window.addEventListener(event, async () => {
        switch (key) {
          case 'onclick': {
            await browser.runtime.sendMessage({
              message: 'user-events',
            })
            break
          }
          default:
            break
        }
      })
    }
  })
}

function extractToken() {
  if (tokenExtractionDomains.includes(window.location.hostname)) {
    const intId = setInterval(() => {
      readExtensionToken(intId)
    }, 2000)
  }
}

function readExtensionToken(intId: any) {
  const tokenEl: HTMLInputElement = document.getElementById(
    'extToken'
  ) as HTMLInputElement
  if (tokenEl && tokenEl.value) {
    clearInterval(intId)
    storage.setItem('ext-token', tokenEl.value)
  }
}
