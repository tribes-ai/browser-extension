const baseURL = process.env.APP_API_URL as string

export const postData = async (
  payload: unknown,
  token: string
): Promise<Response> => {
  const response = await fetch(baseURL + '/event', {
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
