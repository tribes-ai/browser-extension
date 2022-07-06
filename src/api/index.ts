import { ApiService } from './httpClient'
const url = process.env.APP_API_URL as string

const ApiManager = () => {
  let instance: ApiService
  return (token?: string, baseURL: string = url) => {
    instance =
      instance ||
      new ApiService({
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
    return instance
  }
}

export default ApiManager
