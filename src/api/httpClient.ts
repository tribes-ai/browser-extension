import axios, { AxiosRequestConfig } from 'axios'
import LocalStorage from '~/utils/LocalStorage'
const localStorage = new LocalStorage()
let data = { 'ext-token': '' }

;(async () => {
  data = await localStorage.getItem('ext-token')
})()

browser.storage.onChanged.addListener((changes: any) => {
  data = changes['ext-token']?.newValue
})

const options: AxiosRequestConfig = {}
options.baseURL = import.meta.env.VITE_APP_API_URL_DEV as string
options.headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  token: data['ext-token'],
}
const httpClient = axios.create(options)

export default httpClient
