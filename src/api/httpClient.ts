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
    return this.httpClient('/', options)
  }

  async fetchBlockedDomains(payload: { token: string }): Promise<any> {
    const graphqlQuery = {
      query: 'query { blockedDomains{ items } }',
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Browser-Token': payload.token,
      },
      body: JSON.stringify(graphqlQuery),
    }
    const res = await this.httpClient('/graphql', options)
    return res.json()
  }

  async fetchUserDomains(payload: { token: string }): Promise<any> {
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
        'X-Browser-Token': payload.token,
      },
      body: JSON.stringify(graphqlQuery),
    }
    const res = await this.httpClient('/graphql', options)
    return res.json()
  }

  async createUpdateUserWhitelistDomain(payload: {
    token: string
    data: any
  }): Promise<any> {
    const graphqlQuery = {
      query: `
      mutation createUpdateUserDomainWhitelist(
        $domainsWhitelists: [ExtensionDomainsWhitelistInput!]
      ) {
        createUpdateUserDomainWhitelist(domainsWhitelists: $domainsWhitelists) {
          items {
            whitelistId
            domain
            status
          }
        }
      }
      `,
      variables: {
        domainsWhitelists: payload.data,
      },
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Browser-Token': payload.token,
      },
      body: JSON.stringify(graphqlQuery),
    }
    const res = await this.httpClient('/graphql', options)
    return res.json()
  }
}
