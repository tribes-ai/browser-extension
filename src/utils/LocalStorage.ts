export default class LocalStorage {
  setItem(key: string, value: unknown): Promise<void> {
    return browser.storage.local.set({ [key]: value })
  }

  getItem(key: string): Promise<any> {
    return browser.storage.local.get([key])
  }

  removeItem(key: string): Promise<void> {
    return browser.storage.local.remove([key])
  }
}
