import { getApiUrl } from '../config/api.js'

export async function authenticateDemoCode(code) {
  const res = await fetch(getApiUrl('/api/auth/demo'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.message || data.error || 'Authentication failed')
  }

  return res.json()
}

