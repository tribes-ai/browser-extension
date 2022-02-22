import Browser, { Windows } from 'webextension-polyfill'

export default class Tracking {
  constructor() {
    this.initListeners()
  }
  initListeners(): void {
    Browser.windows.onCreated.addListener(this.trackCreatedWindow)
    // Browser.windows.onRemoved.addListener()
  }

  trackCreatedWindow(window: Windows.Window): void {
    console.log(window)
  }
}
