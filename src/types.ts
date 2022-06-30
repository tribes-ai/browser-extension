export interface DomainList {
  [url: string]: {
    url: string
    isBlocked?: boolean
    isActive?: boolean
    whitelistId?: number
    pattern?: string
  }
}

export interface TabData {
  userId: string
  eventId: string
  eventType: string
  datetime: string
  timezoneUtcOffset: number
  timezoneId: string
  data?: Tab
  domData?: Domdatum[]
  version: string
}

export interface Tab {
  active?: boolean
  discarded?: boolean
  groupId?: number
  height?: number
  highlighted?: boolean
  id: number
  incognito?: boolean
  pinned?: boolean
  selected?: boolean
  status?: string
  title?: string
  url?: string
  width?: number
  windowId?: number
}

export interface Domdatum {
  divClass: string
  value: string
}

export interface WindowData {
  userId: string
  eventId: string
  eventType: string
  timezoneUtcOffset: number
  timezoneId: string
  datetime: string
  data?: Window
  version: string
}

export interface Window {
  alwaysOnTop?: boolean
  focused?: boolean
  height?: number
  id: number
  incognito?: boolean
  state?: string
  tabs?: Tab[]
  type?: string
  width?: number
}

export interface LogEntry {
  severity: string
  message: string
  optional_data?: Record<string, unknown>
}
