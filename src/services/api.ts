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
  selected: boolean
  hasOriginal: boolean
  width: number | null
  height: number | null
}

export interface PublicAlbumSummary {
  title: string
  quota: number
  status: string
  requiresPassword: boolean
  unlocked: boolean
  selectedCount: number
}

export interface PublicPhotoPage {
  content: PublicPhoto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface PublicSelectionResult {
  status: string
  selectedCount: number
  photo: PublicPhoto
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

export async function getAlbum(id: number): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/api/albums/${id}`, { credentials: 'include' })
  await ensureOk(response)
  return response.json() as Promise<Album>
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

export async function openAlbumDelivery(id: number): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/api/albums/${id}/open-delivery`, {
    method: 'POST',
    credentials: 'include',
  })
  await ensureOk(response)
  return response.json() as Promise<Album>
}

export async function publishAlbum(id: number): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/api/albums/${id}/publish`, {
    method: 'POST',
    credentials: 'include',
  })
  await ensureOk(response)
  return response.json() as Promise<Album>
}

export async function getPublicAlbum(token: string): Promise<PublicAlbumSummary> {
  const response = await fetch(`${API_BASE_URL}/api/public/albums/${encodeURIComponent(token)}`, {
    credentials: 'include',
  })
  await ensureOk(response)
  return response.json() as Promise<PublicAlbumSummary>
}

export async function getPublicAlbumPhotos(
  token: string,
  page: number,
  size: number,
): Promise<PublicPhotoPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const response = await fetch(
    `${API_BASE_URL}/api/public/albums/${encodeURIComponent(token)}/photos?${params}`,
    { credentials: 'include' },
  )
  await ensureOk(response)
  return response.json() as Promise<PublicPhotoPage>
}

export async function unlockAlbum(token: string, password: string): Promise<PublicAlbumSummary> {
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
  return response.json() as Promise<PublicAlbumSummary>
}

export async function selectPublicPhoto(
  token: string,
  photoId: number,
): Promise<PublicSelectionResult> {
  return mutatePublicSelection(token, photoId, 'select')
}

export async function deselectPublicPhoto(
  token: string,
  photoId: number,
): Promise<PublicSelectionResult> {
  return mutatePublicSelection(token, photoId, 'deselect')
}

async function mutatePublicSelection(
  token: string,
  photoId: number,
  action: 'select' | 'deselect',
): Promise<PublicSelectionResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/public/albums/${encodeURIComponent(token)}/photos/${photoId}/${action}`,
    { method: 'POST', credentials: 'include' },
  )
  await ensureOk(response)
  return response.json() as Promise<PublicSelectionResult>
}

export async function finalizeSelection(token: string): Promise<PublicAlbumSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/public/albums/${encodeURIComponent(token)}/finalize`,
    { method: 'POST', credentials: 'include' },
  )
  await ensureOk(response)
  return response.json() as Promise<PublicAlbumSummary>
}

export interface AdminPhoto {
  id: number
  albumId: number
  baseFilename: string
  position: number
  selectedAt: string | null
  webKey: string
  thumbKey: string
  originalKey: string | null
  createdAt: string
}

export async function listAdminPhotos(albumId: number): Promise<AdminPhoto[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/photos`, {
    credentials: 'include',
  })
  await ensureOk(response)
  return response.json() as Promise<AdminPhoto[]>
}

export async function uploadAdminPhotos(
  albumId: number,
  files: File[],
): Promise<{ uploaded: number; photos: AdminPhoto[] }> {
  const form = new FormData()
  for (const file of files) {
    form.append('files', file)
  }
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/photos`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  await ensureOk(response)
  return response.json() as Promise<{ uploaded: number; photos: AdminPhoto[] }>
}

export async function deleteAdminPhoto(albumId: number, photoId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/photos/${photoId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  await ensureOk(response)
}

export interface OriginalUploadResult {
  uploaded: number
  unmatched: number
  unmatchedFilenames: string[]
  photos: AdminPhoto[]
}

export async function uploadAdminOriginals(
  albumId: number,
  files: File[],
): Promise<OriginalUploadResult> {
  const form = new FormData()
  for (const file of files) {
    form.append('files', file)
  }
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/originals`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  await ensureOk(response)
  return response.json() as Promise<OriginalUploadResult>
}

export function publicPhotoUrl(
  token: string,
  photoId: number,
  variant: 'thumb' | 'web' | 'original',
): string {
  return `${API_BASE_URL}/api/public/albums/${encodeURIComponent(token)}/photos/${photoId}/${variant}`
}

export function publicDownloadUrl(
  token: string,
  photoId: number,
  variant: 'web' | 'original',
): string {
  return `${API_BASE_URL}/api/public/albums/${encodeURIComponent(token)}/photos/${photoId}/download/${variant}`
}

export function adminPhotoUrl(
  albumId: number,
  photoId: number,
  variant: 'thumb' | 'web' | 'original',
): string {
  return `${API_BASE_URL}/api/admin/albums/${albumId}/photos/${photoId}/${variant}`
}

export interface Notification {
  id: string
  type: string
  albumId: number
  occurredAt: string
  payload: Record<string, unknown>
  read: boolean
}

export interface NotificationInbox {
  unread: number
  items: Notification[]
}

export async function listNotifications(): Promise<NotificationInbox> {
  const response = await fetch(`${API_BASE_URL}/api/admin/notifications`, {
    credentials: 'include',
  })
  await ensureOk(response)
  return response.json() as Promise<NotificationInbox>
}

export async function markNotificationRead(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/notifications/${encodeURIComponent(id)}/read`,
    { method: 'POST', credentials: 'include' },
  )
  await ensureOk(response)
}
