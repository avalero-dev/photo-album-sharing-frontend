// Etiquetas y tono de los estados de álbum, compartidos por las pantallas del panel.
// El texto siempre acompaña al marcador: el estado no se comunica solo con color.

export type AlbumStatusTone = 'neutral' | 'accent' | 'ready' | 'danger'

const ALBUM_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SELECTING: 'Selección',
  SELECTION_FINALIZED: 'Selección finalizada',
  DELIVERING: 'Entrega abierta',
}

const ALBUM_STATUS_TONES: Record<string, AlbumStatusTone> = {
  DRAFT: 'neutral',
  SELECTING: 'accent',
  SELECTION_FINALIZED: 'ready',
  DELIVERING: 'ready',
}

export function albumStatusLabel(status: string): string {
  return ALBUM_STATUS_LABELS[status] ?? status
}

export function albumStatusTone(status: string): AlbumStatusTone {
  return ALBUM_STATUS_TONES[status] ?? 'neutral'
}
