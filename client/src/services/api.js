const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function api(path, options = {}) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : {}
  if (!response.ok) throw new Error(data.message || 'Request failed')
  return data
}
