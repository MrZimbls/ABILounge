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
    try {
      const errorData = await res.json().catch(() => null)
      if (errorData) {
        message = errorData.error || errorData.message || JSON.stringify(errorData)
      } else {
        message = await res.text()
      }
    } catch {
      message = 'Request failed'
    }
    throw new Error(message)
  }

  return res.json()
}

export async function updateAmmunitionType(id, updateData, { token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(getApiUrl(`/api/ammunition/types/${id}`), {
    method: 'PUT',
    headers,
    body: JSON.stringify(updateData)
  })

  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = await res.json().catch(() => ({}))
      message = data.message || data.error || 'Request failed'
    } catch {
      message = 'Request failed'
    }
    throw new Error(message)
  }

  return res.json()
}

export async function updateWeapon(id, updateData, { token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(getApiUrl(`/api/weapons/${id}`), {
    method: 'PUT',
    headers,
    body: JSON.stringify(updateData)
  })

  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = await res.json().catch(() => ({}))
      message = data.message || data.error || 'Request failed'
    } catch {
      message = 'Request failed'
    }
    throw new Error(message)
  }

  return res.json()
}


