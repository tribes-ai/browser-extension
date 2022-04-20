import LocalStorage from '~/utils/LocalStorage'
const localStorage = new LocalStorage()
let data = { 'ext-token': '' }
const baseURL = process.env.APP_API_URL as string

;(async () => {
  data = await localStorage.getItem('ext-token')
})()

browser.storage.onChanged.addListener((changes: any) => {
  data = changes['ext-token']?.newValue
})

export const postData = async (payload: any) => {
  const response = await fetch(baseURL, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      token: data['ext-token'],
    },
    body: JSON.stringify(payload),
  })
  return response.json()
}
