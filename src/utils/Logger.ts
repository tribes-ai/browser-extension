import { LogEntry } from '~/types'

const baseURL = (process.env.APP_API_URL ||
  import.meta.env.VITE_APP_API_URL) as string

export default class Logger {
  static async client(payload: LogEntry): Promise<Response> {
    const response = await fetch(`${baseURL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error('HTTP error ' + response.status)
    }
    return response
  }
  public async info(
    message: string,
    optional_data?: Record<string, unknown>
  ): Promise<void> {
    Logger.client({
      severity: 'info',
      message,
      optional_data,
    })
  }
  public async error(
    error: unknown,
    optional_data?: Record<string, unknown>
  ): Promise<void> {
    let message = ''
    if (typeof error === 'string') {
      message = error.toUpperCase() // works, `e` narrowed to string
    }
    if (error instanceof Error) {
      message = error.message
    }
    Logger.client({
      severity: 'error',
      message,
      optional_data,
    })
  }
}
