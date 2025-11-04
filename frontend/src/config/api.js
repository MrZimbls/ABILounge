// API configuration
// In production, this will use the VITE_API_URL environment variable
// In development, it defaults to empty string (uses Vite proxy)

const API_URL = import.meta.env.VITE_API_URL || ''

export function getApiUrl(path) {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  // If API_URL is set, use it; otherwise use relative path (for dev proxy)
  return API_URL ? `${API_URL.replace(/\/$/, '')}/${cleanPath}` : `/${path}`
}

export default {
  API_URL,
  getApiUrl
}

