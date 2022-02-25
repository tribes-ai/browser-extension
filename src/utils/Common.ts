import { getHostname } from 'tldts'

// import LocalStorage from '~/utils/LocalStorage'
import { Tabs } from 'webextension-polyfill'
import { DomainList } from '~/types'

// const localStorage = new LocalStorage()

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
