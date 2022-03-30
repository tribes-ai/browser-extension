import { getHostname } from 'tldts'
import { Windows, Tabs } from 'webextension-polyfill'
import { pick } from 'lodash-es'
import { Tab, DomainList, TabData, WindowData, Window } from '~/types'
import { PICK_FROM_TAB_OBJ, PICK_FROM_WINDOW_OBJ } from '~/utils/Constants'
import LocalStorage from '~/utils/LocalStorage'
const storage = new LocalStorage()
let token: string

//prettier-ignore
(async () => {
  const data = await storage.getItem('ext-token')
  token = data['ext-token']
})()

export function getParsedURL(
  tab: Tabs.Tab,
  domainsList: DomainList
): string | null {
  let hostname = null
  if (tab?.url && !domainsList[tab.url]) {
    hostname = getHostname(tab.url) || ''
    return hostname
  }
  return hostname
}

export function getTabData(
  url: string,
  eventName: string,
  tab: Tabs.Tab,
  ...rest: any
): TabData {
  if (url !== 'newtab' && url) {
    const datetime = new Date().toISOString()
    const eventId = `${token}|${tab.windowId}|${datetime}`
    const timezoneUtcOffset = new Date().getTimezoneOffset()
    const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
    const data = {
      eventId,
      timezoneUtcOffset,
      timezoneId,
      datetime,
      userId: token,
      eventType: eventName,
      data: pick(tab, PICK_FROM_TAB_OBJ) as Tab,
      metaData: {
        created_at: new Date(),
        created_by: 'test',
      },
      domData: rest.domData,
    }
    return data
  }
  return {} as TabData
}

export function getWindowData(
  eventName: string,
  window: Windows.Window
): WindowData {
  const newWindowData = pick(window, PICK_FROM_WINDOW_OBJ) as Window
  const datetime = new Date().toISOString()
  const eventId = `${token}|${window.id}|${datetime}`
  const timezoneUtcOffset = new Date().getTimezoneOffset()
  const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
  const data = {
    eventId,
    timezoneUtcOffset,
    timezoneId,
    userId: token,
    eventType: eventName,
    datetime: new Date().toISOString(),
    data: newWindowData,
    metaData: {
      created_at: new Date(),
      created_by: 'test',
    },
  }
  return data
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
