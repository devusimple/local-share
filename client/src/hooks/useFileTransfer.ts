import { useCallback } from "react"
import { getSocket } from "../lib/socket"
import { useAppStore } from "../store/appStore"
import { chunkFile, getTotalChunks } from "../lib/chunker"
import { MAX_FILE_SIZE } from "../lib/constants"
import type { FileMeta, Transfer } from "../types"

export function useFileTransfer() {
  const myId = useAppStore((s) => s.myId)
  const myName = useAppStore((s) => s.myName)
  const updateTransfer = useAppStore((s) => s.updateTransfer)

  const sendFile = useCallback(
    async (file: File, to: string) => {
      if (file.size > MAX_FILE_SIZE) {
        alert("File too large (max 500MB)")
        return
      }

      const fileId = crypto.randomUUID()
      const totalChunks = getTotalChunks(file.size)

      const meta: FileMeta = {
        fileId,
        from: myId!,
        fromName: myName,
        to,
        name: file.name,
        size: file.size,
        mime: file.type,
        totalChunks,
      }

      const transfer: Transfer = {
        meta,
        chunks: [],
        receivedCount: 0,
        status: "sending",
        progress: 0,
      }

      updateTransfer(fileId, transfer as unknown as Partial<Transfer>)

      const socket = getSocket()
      socket.emit("file:start", {
        fileId,
        name: file.name,
        size: file.size,
        mime: file.type,
        to,
        totalChunks,
      })

      const buffer = await file.arrayBuffer()
      let index = 0
      for (const chunk of chunkFile(buffer)) {
        socket.emit("file:chunk", { fileId, index, data: chunk, to })
        index++
        const progress = Math.round((index / totalChunks) * 100)
        updateTransfer(fileId, { progress })
        await new Promise((r) => setTimeout(r, 0))
      }

      socket.emit("file:end", { fileId, to })
      const blobUrl = URL.createObjectURL(file)
      updateTransfer(fileId, { status: "done", progress: 100, blobUrl })
    },
    [myId, myName, updateTransfer],
  )

  const cancelTransfer = useCallback(
    (fileId: string) => {
      const store = useAppStore.getState()
      const transfer = store.transfers[fileId]
      if (!transfer) return
      const socket = getSocket()
      socket.emit("file:cancel", { fileId, to: transfer.meta.to })
      store.removeTransfer(fileId)
    },
    [],
  )

  return { sendFile, cancelTransfer }
}
