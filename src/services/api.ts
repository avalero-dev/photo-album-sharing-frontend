const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export interface HealthResponse {
  status: string
  service: string
}

export interface AdminUser {
  email: string
}

export interface Album {
  id: number
  title: string
  quota: number
  status: string
  token: string
  hasPassword: boolean
  createdAt: string
  publishedAt: string | null
  selectionFinalizedAt: string | null
  deliveryOpenedAt: string | null
}

export interface AlbumInput {
  title: string
  quota: number
  password?: string
}

export interface PublicPhoto {
  id: number
  baseFilename: string
}

export interface PublicAlbum {
  title: string
  quota: number
  status: string
  requiresPassword: boolean
  unlocked: boolean
  photos: PublicPhoto[]
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function ensureOk(response: Response): Promise<void> {
  if (response.ok) {
    return
  }
  let message = `Error ${response.status}`
  try {
    const body = (await response.json()) as { message?: string }
    if (body?.message) {
      message = body.message
    }
  } catch {
    // non-JSON error body, keep default message
  }
  throw new ApiError(response.status, message)
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, { credentials: 'include' })
  await ensureOk(response)
  return response.json() as Promise<HealthResponse>
}

export async function login(email: string, password: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }),
  })
  if (response.status === 401) {
    throw new ApiError(401, 'Credenciales inválidas')
  }
  await ensureOk(response)
  return response.json() as Promise<AdminUser>
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function fetchMe(): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
  if (!response.ok) {
    throw new ApiError(response.status, 'No autenticado')
  }
  return response.json() as Promise<AdminUser>
}

export async function listAlbums(): Promise<Album[]> {
  const response = await fetch(`${API_BASE_URL}/api/albums`, { credentials: 'include' })
  await ensureOk(response)
  return response.json() as Promise<Album[]>
}

export async function createAlbum(input: AlbumInput): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/api/albums`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await ensureOk(response)
  return response.json() as Promise<Album>
}

export async function updateAlbum(id: number, input: AlbumInput): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/api/albums/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await ensureOk(response)
  return response.json() as Promise<Album>
}

export async function getPublicAlbum(token: string): Promise<PublicAlbum> {
  const response = await fetch(`${API_BASE_URL}/api/public/albums/${encodeURIComponent(token)}`, {
    credentials: 'include',
  })
  await ensureOk(response)
  return response.json() as Promise<PublicAlbum>
}

export async function unlockAlbum(token: string, password: string): Promise<PublicAlbum> {
  const response = await fetch(
    `${API_BASE_URL}/api/public/albums/${encodeURIComponent(token)}/unlock`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    },
  )
  await ensureOk(response)
  return response.json() as Promise<PublicAlbum>
}
