const peers = new Map()

export function addPeer(socketId, name) {
  const peer = { id: socketId, name, joinedAt: Date.now() }
  peers.set(socketId, peer)
  return peer
}

export function removePeer(socketId) {
  peers.delete(socketId)
}

export function getPeer(socketId) {
  return peers.get(socketId)
}

export function getAllPeers() {
  return Array.from(peers.values())
}
