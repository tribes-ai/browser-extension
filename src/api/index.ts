import { ApiService } from './httpClient'
const url = (process.env.APP_API_URL ||
  import.meta.env.VITE_APP_API_URL) as string

const ApiManager = () => {
  return (token?: string, baseURL: string = url): ApiService => {
    return new ApiService({
      baseURL,
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        token: token,
      },
    })
  }
}

export default ApiManager
