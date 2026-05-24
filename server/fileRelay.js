export function relayFileChunk(io, senderId, data) {
  const { fileId, index, to } = data
  if (to === "all") {
    io.emit("file:chunk", { fileId, index, data: data.data })
  } else {
    io.to(to).emit("file:chunk", { fileId, index, data: data.data })
  }
}

export function relayFileEvent(io, senderId, event, data) {
  const { to } = data
  if (to === "all") {
    io.emit(event, data)
  } else {
    io.to(to).emit(event, data)
  }
}
