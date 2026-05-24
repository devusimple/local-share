import { useEffect } from "react"
import { getSocket } from "../lib/socket"
import { useAppStore } from "../store/appStore"
import type { Peer, Message, FileMeta, FileChunk } from "../types"

export function useSocket() {
  const setConnected = useAppStore((s) => s.setConnected)
  const setMyId = useAppStore((s) => s.setMyId)
  const setPeers = useAppStore((s) => s.setPeers)
  const addPeer = useAppStore((s) => s.addPeer)
  const removePeer = useAppStore((s) => s.removePeer)
  const addMessage = useAppStore((s) => s.addMessage)
  const updateTransfer = useAppStore((s) => s.updateTransfer)
  const removeTransfer = useAppStore((s) => s.removeTransfer)

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => {
      setConnected(true)
      setMyId(socket.id!)
    }

    const onDisconnect = () => {
      setConnected(false)
    }

    const onPeers = (peers: Peer[]) => {
      setPeers(peers)
    }

    const onPeerJoined = (peer: Peer) => {
      addPeer(peer)
    }

    const onPeerLeft = (peerId: string) => {
      removePeer(peerId)
    }

    const onMessage = (msg: Message) => {
      addMessage(msg)
    }

    const onFileStart = (meta: FileMeta) => {
      updateTransfer(meta.fileId, {
        meta,
        chunks: [],
        receivedCount: 0,
        status: "receiving",
        progress: 0,
      })
    }

    const onFileChunk = (chunk: FileChunk) => {
      const transfer = useAppStore.getState().transfers[chunk.fileId]
      if (!transfer) return
      const chunks = [...transfer.chunks, chunk.data]
      const receivedCount = transfer.receivedCount + 1
      const progress = Math.round((receivedCount / transfer.meta.totalChunks) * 100)
      updateTransfer(chunk.fileId, { chunks, receivedCount, progress })
    }

    const onFileEnd = ({ fileId }: { fileId: string }) => {
      const transfer = useAppStore.getState().transfers[fileId]
      if (!transfer) return
      const blob = new Blob(transfer.chunks, { type: transfer.meta.mime })
      const url = URL.createObjectURL(blob)
      updateTransfer(fileId, { status: "done", blobUrl: url })
    }

    const onFileCancel = ({ fileId }: { fileId: string }) => {
      const transfer = useAppStore.getState().transfers[fileId]
      if (!transfer) return
      if (transfer.status === "receiving") {
        removeTransfer(fileId)
      }
    }

    if (socket.connected) {
      setConnected(true)
      setMyId(socket.id!)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("peers", onPeers)
    socket.on("peer:joined", onPeerJoined)
    socket.on("peer:left", onPeerLeft)
    socket.on("message", onMessage)
    socket.on("file:start", onFileStart)
    socket.on("file:chunk", onFileChunk)
    socket.on("file:end", onFileEnd)
    socket.on("file:cancel", onFileCancel)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("peers", onPeers)
      socket.off("peer:joined", onPeerJoined)
      socket.off("peer:left", onPeerLeft)
      socket.off("message", onMessage)
      socket.off("file:start", onFileStart)
      socket.off("file:chunk", onFileChunk)
      socket.off("file:end", onFileEnd)
      socket.off("file:cancel", onFileCancel)
    }
  }, [setConnected, setMyId, setPeers, addPeer, removePeer, addMessage, updateTransfer, removeTransfer])
}
