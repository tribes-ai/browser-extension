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

  async fetchBlockedDomains(payload: { token: string }): Promise<any> {
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

  async fetchUserAndAdminDomains(payload: { token: string }): Promise<any> {
    const graphqlQuery = {
      query: `
      query {
        userWhitelistedDomains{
          items{
            whitelistId
            domain
            status
          }
        }
      }`,
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

  async createUserWhitelistDomain(payload: {
    token: string
    data: [string]
  }): Promise<any> {
    const graphqlQuery = {
      query: `
        mutation createUserDomainWhitelist($domains: [String!]){
          createUserDomainWhitelist (domains: $domains) {
          items {
              whitelistId
              domain
              status
          }
        }
      }`,
      variables: {
        domains: payload.data,
      },
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

  // async updateUserWhitelistDomain(payload: {token:string, data: {url:string,}})
}
