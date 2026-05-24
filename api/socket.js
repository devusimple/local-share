import http from "http"
import { Server } from "socket.io"

const peers = new Map()

function addPeer(socketId, name) {
  const peer = { id: socketId, name, joinedAt: Date.now() }
  peers.set(socketId, peer)
  return peer
}

function removePeer(socketId) {
  peers.delete(socketId)
}

function getPeer(socketId) {
  return peers.get(socketId)
}

function getAllPeers() {
  return Array.from(peers.values())
}

const server = http.createServer()
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
})

io.on("connection", (socket) => {
  socket.on("join", ({ name }) => {
    const peer = addPeer(socket.id, name)
    socket.join("global")
    io.emit("peer:joined", peer)
    io.emit("peers", getAllPeers())
  })

  socket.on("message", ({ to, text }) => {
    const sender = getPeer(socket.id)
    if (!sender) return
    const msg = {
      id: crypto.randomUUID(),
      from: socket.id,
      fromName: sender.name,
      to,
      text,
      ts: Date.now(),
    }
    if (to === "all") {
      io.emit("message", msg)
    } else {
      io.to(to).emit("message", msg)
    }
  })

  socket.on("file:start", (data) => {
    const sender = getPeer(socket.id)
    if (!sender) return
    const event = {
      ...data,
      fileId: data.fileId,
      from: socket.id,
      fromName: sender.name,
      totalChunks: data.totalChunks,
    }
    if (data.to === "all") {
      io.emit("file:start", event)
    } else {
      io.to(data.to).emit("file:start", event)
    }
  })

  socket.on("file:chunk", (data) => {
    if (data.to === "all") {
      io.emit("file:chunk", { fileId: data.fileId, index: data.index, data: data.data })
    } else {
      io.to(data.to).emit("file:chunk", { fileId: data.fileId, index: data.index, data: data.data })
    }
  })

  socket.on("file:end", (data) => {
    if (data.to === "all") {
      io.emit("file:end", { fileId: data.fileId })
    } else {
      io.to(data.to).emit("file:end", { fileId: data.fileId })
    }
  })

  socket.on("file:cancel", (data) => {
    if (data.to === "all") {
      io.emit("file:cancel", { fileId: data.fileId })
    } else {
      io.to(data.to).emit("file:cancel", { fileId: data.fileId })
    }
  })

  socket.on("disconnect", () => {
    removePeer(socket.id)
    io.emit("peer:left", socket.id)
    io.emit("peers", getAllPeers())
  })
})

export default function handler(req, res) {
  if (typeof req.headers.upgrade === "string" && req.headers.upgrade.toLowerCase() === "websocket") {
    server.emit("upgrade", req, req.socket, Buffer.alloc(0))
  } else {
    server.emit("request", req, res)
  }
}
