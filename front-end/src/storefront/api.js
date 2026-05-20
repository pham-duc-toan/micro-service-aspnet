const API_BASES = {
  identity: import.meta.env.VITE_IDENTITY_URL || 'http://localhost:6011',
  gateway: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:6001',
}

const SERVICE_BASES = {
  identity: API_BASES.identity,
  catalog: API_BASES.gateway,
  customer: API_BASES.gateway,
  basket: API_BASES.gateway,
  orders: API_BASES.gateway,
  inventory: API_BASES.gateway,
  jobs: API_BASES.gateway,
}

export function getBaseUrl(service) {
  const baseUrl = SERVICE_BASES[service]
  if (!baseUrl) {
    throw new Error(`Unknown service: ${service}`)
  }
  return baseUrl
}

export async function request({ service, path, method = 'GET', body, headers = {}, auth = true, token = '' }) {
  const baseUrl = getBaseUrl(service)
  const url = `${baseUrl}${path}`
  const requestHeaders = new Headers(headers)
  if (auth && token) requestHeaders.set('Authorization', `Bearer ${token}`)

  let requestBody = body
  if (body !== undefined && body !== null) {
    const serializable =
      typeof body === 'object' &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof FormData) &&
      !(body instanceof Blob) &&
      typeof body !== 'string'

    if (serializable) {
      requestHeaders.set('Content-Type', 'application/json')
      requestBody = JSON.stringify(body)
    }
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  })

  const raw = await response.text()
  const contentType = response.headers.get('content-type') || ''
  const parsed = parseBody(raw, contentType)

  if (!response.ok) {
    throw new Error(extractMessage(parsed, response.status, response.statusText))
  }

  return parsed
}

export function parseBody(raw, contentType) {
  if (!raw) return ''
  if (contentType.includes('application/json') || raw.startsWith('{') || raw.startsWith('[')) {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

export function extractMessage(payload, status, statusText) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object') {
    return payload.message || payload.error || payload.title || JSON.stringify(payload)
  }
  return `${status} ${statusText}`
}

export { API_BASES, SERVICE_BASES }
