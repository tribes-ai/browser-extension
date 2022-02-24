import { getHostname } from 'tldts'

import LocalStorage from '~/utils/LocalStorage'
import { Tabs } from 'webextension-polyfill'

const localStorage = new LocalStorage()

export function addToDomainList(tab: Tabs.Tab, domainsList: Set<string>): void {
  if (tab?.url && !Object.keys(domainsList).includes(tab.url)) {
    const hostname = getHostname(tab.url) || ''
    if (hostname !== 'newtab') {
      domainsList.add(hostname)

      localStorage.setItem('trackedDomains', [...domainsList])
    }
  }
}
