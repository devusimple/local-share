import { io, Socket } from "socket.io-client"

const STORAGE_KEY = "local-share-server-url"

let socket: Socket | null = null

export function getServerUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || window.location.origin
}

export function setServerUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url)
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getServerUrl(), { transports: ["websocket", "polling"] })
  }
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
