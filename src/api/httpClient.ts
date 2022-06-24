export class ApiService {
  private httpClient: any

  constructor(config: any) {
    this.httpClient = (endpoint = '/', options: any) =>
      fetch(config.baseURL + endpoint, { options: config.options, ...options })
  }

  saveEvents(payload: unknown): Promise<Response> {
    const options = {
      method: 'POST',
      body: JSON.stringify(payload),
    }
    return this.httpClient('/event', options)
  }

  async fetchBlockedDomains(payload: any): Promise<any> {
    const graphqlQuery = {
      query: 'query { blockedDomains{ items } }',
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        userId: payload.token,
      },
      body: JSON.stringify(graphqlQuery),
    }
    const res = await this.httpClient('/graphql', options)
    return res.json()
  }
}
