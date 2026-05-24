import express from "express"
import http from "http"
import { Server } from "socket.io"
import path from "path"
import os from "os"
import { fileURLToPath } from "url"
import { addPeer, removePeer, getPeer, getAllPeers } from "./roomManager.js"
import { relayFileChunk, relayFileEvent } from "./fileRelay.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: "*" } })

const PORT = process.env.PORT || 3001
const isDev = process.env.NODE_ENV !== "production"

if (!isDev) {
  const clientDist = path.join(__dirname, "..", "client", "dist")
  app.use(express.static(clientDist))
  app.get("*", (_, res) => res.sendFile(path.join(clientDist, "index.html")))
}

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
    relayFileEvent(io, socket.id, "file:start", {
      ...data,
      fileId: data.fileId,
      from: socket.id,
      fromName: sender.name,
      totalChunks: data.totalChunks,
    })
  })

  socket.on("file:chunk", (data) => {
    relayFileChunk(io, socket.id, {
      ...data,
      from: socket.id,
    })
  })

  socket.on("file:end", (data) => {
    relayFileEvent(io, socket.id, "file:end", data)
  })

  socket.on("file:cancel", (data) => {
    relayFileEvent(io, socket.id, "file:cancel", data)
  })

  socket.on("disconnect", () => {
    removePeer(socket.id)
    io.emit("peer:left", socket.id)
    io.emit("peers", getAllPeers())
  })
})

function getLanIp() {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address
      }
    }
  }
  return "localhost"
}

server.listen(PORT, () => {
  const lanIp = getLanIp()
  console.log(`\n  Local Share Server running`)
  console.log(`  LAN: http://${lanIp}:${PORT}`)
  console.log(`  Local: http://localhost:${PORT}\n`)
})
