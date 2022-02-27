import { getHostname } from 'tldts'
import { Windows, Tabs } from 'webextension-polyfill'
import { pick } from 'lodash-es'
import { Tab, DomainList, TabData, WindowData, Window } from '~/types'
import { PICK_FROM_TAB_OBJ, PICK_FROM_WINDOW_OBJ } from '~/utils/Constants'

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
  tab: Tabs.Tab
): TabData | null {
  if (url !== 'newtab' && url) {
    const data = {
      userId: 'test@test.com',
      eventId: '<userId>|<windowId>|<tabId>|<url>|<datetime>',
      eventType: eventName,
      datetime: new Date().toISOString(),
      data: pick(tab, PICK_FROM_TAB_OBJ) as Tab,
      metaData: {
        created_at: new Date(),
        created_by: 'test',
      },
      domData: [
        {
          divClass: '<div></div>',
          value: 'this is a div',
        },
      ],
    }
    return data
  }
  return null
}

export function getWindowData(
  url: string,
  eventName: string,
  window: Windows.Window,
  tabs: Tabs.Tab[]
): WindowData | null {
  if (url !== 'newtab' && url) {
    const newTabsData = tabs.map((tab) => pick(tab, PICK_FROM_TAB_OBJ)) as Tab[]
    const newWindowData = pick(window, PICK_FROM_WINDOW_OBJ) as Window
    newWindowData.tabs = newTabsData
    const data = {
      userId: 'test@test.com',
      eventId: '<userId>|<windowId>|<tabId>|<url>|<datetime>',
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
  return null
}
