export interface Peer {
  id: string
  name: string
  joinedAt: number
}

export interface Message {
  id: string
  from: string
  fromName: string
  to: string
  text: string
  ts: number
}

export interface FileMeta {
  fileId: string
  from: string
  fromName: string
  to: string
  name: string
  size: number
  mime: string
  totalChunks: number
}

export interface FileChunk {
  fileId: string
  index: number
  data: ArrayBuffer
}

export type TransferStatus = "receiving" | "done" | "cancelled" | "sending"

export interface Transfer {
  meta: FileMeta
  chunks: ArrayBuffer[]
  receivedCount: number
  status: TransferStatus
  progress: number
  blobUrl?: string
}
