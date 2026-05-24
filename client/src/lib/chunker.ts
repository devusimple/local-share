import { CHUNK_SIZE } from "./constants"

export function* chunkFile(file: ArrayBuffer): Generator<ArrayBuffer> {
  let offset = 0
  while (offset < file.byteLength) {
    yield file.slice(offset, offset + CHUNK_SIZE)
    offset += CHUNK_SIZE
  }
}

export function getTotalChunks(size: number): number {
  return Math.ceil(size / CHUNK_SIZE)
}
