import { getHostname } from 'tldts'
import { Windows, Tabs } from 'webextension-polyfill'
import { pick } from 'lodash-es'
import { Tab, TabData, WindowData, Window, DomainList } from '~/types'
import { PICK_FROM_TAB_OBJ, PICK_FROM_WINDOW_OBJ } from '~/utils/Constants'
import LocalStorage from '~/utils/LocalStorage'
import ApiManager from '~/api'
import Logger from '~/utils/Logger'
const storage = new LocalStorage()
const apiManager = ApiManager()
const logger = new Logger()
let blockedDomains: DomainList
let token: string

//prettier-ignore
(async () => {
  const data = await storage.getItem('ext-token')
  token = data['ext-token']
  const bData = await storage.getItem('blockedDomains')
  blockedDomains = bData['blockedDomains'] || {}
})()

browser.storage.onChanged.addListener((changes: any) => {
  if (changes?.['ext-token']) {
    token = changes?.['ext-token']?.newValue
  }
})

export function getParsedURL(tab: Tabs.Tab | string): string | null {
  let hostname = null
  if (typeof tab === 'string') {
    hostname = getHostname(tab) || ''
  } else if (tab?.url) {
    hostname = getHostname(tab.url) || ''
  }
  if (hostname) {
    hostname = hostname.startsWith('www.') ? hostname.substring(4) : hostname
    return hostname
  }
  return hostname
}

export function getTabData(
  url: string,
  eventName: string,
  tab: Tabs.Tab,
  ...rest: any
): TabData | undefined {
  if (url !== 'newtab' && url && token) {
    const datetime = new Date().toISOString()
    const eventId = `${token}|${tab.windowId}|${datetime}`
    const timezoneUtcOffset = -new Date().getTimezoneOffset()
    const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
    const data = {
      eventId,
      timezoneUtcOffset,
      timezoneId,
      datetime,
      userId: token,
      eventType: eventName,
      data: pick(tab, PICK_FROM_TAB_OBJ) as Tab,
      domData: rest.domData,
      version: process.env.VITE_APP_VERSION as string,
    }
    return data
  }
  return undefined
}

export function getWindowData(
  eventName: string,
  window: Windows.Window
): WindowData | undefined {
  if (token) {
    const newWindowData = pick(window, PICK_FROM_WINDOW_OBJ) as Window
    const datetime = new Date().toISOString()
    const eventId = `${token}|${window.id}|${datetime}`
    const timezoneUtcOffset = -new Date().getTimezoneOffset()
    const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
    const data = {
      eventId,
      timezoneUtcOffset,
      timezoneId,
      userId: token,
      eventType: eventName,
      datetime: new Date().toISOString(),
      data: newWindowData,
      version: process.env.VITE_APP_VERSION as string,
    }
    return data
  }
  return undefined
}

// Calculate a string representation of a node's DOM path.
const pathToSelector = function (node: any) {
  if (!node || !node.outerHTML) {
    return null
  }

  let path
  while (node.parentElement) {
    let name = node.localName
    if (!name) break
    name = name.toLowerCase()
    const parent = node.parentElement

    const domSiblings = []

    if (parent.children && parent.children.length > 0) {
      for (let i = 0; i < parent.children.length; i++) {
        const sibling = parent.children[i]
        if (sibling.localName && sibling.localName.toLowerCase) {
          if (sibling.localName.toLowerCase() === name) {
            domSiblings.push(sibling)
          }
        }
      }
    }

    if (domSiblings.length > 1) {
      name += ':eq(' + domSiblings.indexOf(node) + ')'
    }
    path = name + (path ? '>' + path : '')
    node = parent
  }

  return path
}

// Generate a JSON version of the event.
export const serializeEvent = function (e: any): string {
  if (e) {
    const o = {
      eventName: e.toString(),
      button: e.button,
      buttons: e.buttons,
      cancelBubble: e.cancelBubble,
      cancelable: e.cancelable,
      clientX: e.clientX,
      clientY: e.clientY,
      composed: e.composed,
      ctrlKey: e.ctrlKey,
      currentTarget: e.currentTarget ? e.currentTarget.outerHTML : null,
      defaultPrevented: e.defaultPrevented,
      detail: e.detail,
      eventPhase: e.eventPhase,
      fromElement: e.fromElement ? e.fromElement.outerHTML : null,
      isTrusted: e.isTrusted,
      metaKey: e.metaKey,
      path: pathToSelector(e.path && e.path.length ? e.path[0] : null),
      sourceCapabilities: e.sourceCapabilities
        ? e.sourceCapabilities.toString()
        : null,
      target: e.target ? e.target.outerHTML : null,
      timeStamp: e.timeStamp,
      toElement: e.toElement ? e.toElement.outerHTML : null,
      type: e.type,
      url: window.location.hostname,
    }
    return JSON.stringify(o, null, 2)
  }
  return ''
}

export function isDomainBlocked(
  domain: string,
  dDomains: DomainList = blockedDomains
): boolean {
  let matched = false
  for (const [, value] of Object.entries(dDomains)) {
    const regex = new RegExp(value.pattern || '')
    matched = regex.test(domain)
    if (matched) {
      return matched
    }
  }
  return matched
}

export async function fetchUserDomains(
  graphqlURL: string
): Promise<DomainList | undefined> {
  try {
    if (token) {
      const res = await apiManager('', graphqlURL).fetchUserDomains({
        token,
      })
      if (res?.errors[0]?.message === 'Invalid access/browser token') {
        token = ''
        await storage.removeItem('ext-token')
      }

      const data = res?.data?.userWhitelistedDomains?.items.reduce(
        (prev: any, curr: any) => {
          const isBlocked = isDomainBlocked(curr.domain)
          return {
            ...prev,
            [curr.domain]: {
              url: getParsedURL(curr.domain),
              isActive: isBlocked
                ? false
                : curr.status === 'active'
                ? true
                : false,
              isBlocked,
            },
          }
        },
        {}
      )
      await storage.removeItem('trackedDomains')
      await storage.setItem('trackedDomains', data)
      return data
    }
    return undefined
  } catch (e) {
    logger.error(e)
  }
}
