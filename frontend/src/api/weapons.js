import { getApiUrl } from '../config/api.js'

export async function searchWeapons({ page = 1, perPage = 20, sortBy, sortDir = 'asc', filters = {}, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(getApiUrl('/api/weapons/search'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ page, perPage, sortBy, sortDir, filters })
  })

  if (!res.ok) {
    let message = 'Request failed'
    try { message = await res.text() } catch { message = 'Request failed' }
    throw new Error(message)
  }

  return res.json()
}


export async function listAmmunition({ token } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(getApiUrl('/api/ammunition'), { headers })

  if (!res.ok) {
    let message = 'Request failed'
    try { message = await res.text() } catch { message = 'Request failed' }
    throw new Error(message)
  }

  return res.json()
}

export async function listAmmunitionTypes({ token } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(getApiUrl('/api/ammunition/types'), { headers })

  if (!res.ok) {
    let message = 'Request failed'
    try { message = await res.text() } catch { message = 'Request failed' }
    throw new Error(message)
  }

  return res.json()
}


