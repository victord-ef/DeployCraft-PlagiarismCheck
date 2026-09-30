const BASE = '/api/v1'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Request failed: ${res.statusText}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const checkText = (text) =>
  request('/check/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

export function checkFile(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/check/upload', { method: 'POST', body: form })
}

export const listDocuments = () => request('/documents/')

export const addDocument = (title, content) =>
  request('/documents/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  })

export function uploadDocument(title, file) {
  const form = new FormData()
  form.append('title', title)
  form.append('file', file)
  return request('/documents/upload', { method: 'POST', body: form })
}

export const deleteDocument = (id) =>
  request(`/documents/${id}`, { method: 'DELETE' })
