const baseURL = process.env.APP_API_URL as string

export const postData = async (payload: any, token: string) => {
  const response = await fetch(baseURL, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      token: token,
    },
    body: JSON.stringify(payload),
  })
  return response.json()
}
