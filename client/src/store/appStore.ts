import { create } from "zustand"
import type { Peer, Message, Transfer } from "../types"

interface AppState {
  myId: string | null
  myName: string
  peers: Peer[]
  messages: Message[]
  transfers: Record<string, Transfer>
  connected: boolean
  joined: boolean

  setMyId: (id: string) => void
  setMyName: (name: string) => void
  setPeers: (peers: Peer[]) => void
  addPeer: (peer: Peer) => void
  removePeer: (peerId: string) => void
  addMessage: (msg: Message) => void
  updateTransfer: (fileId: string, patch: Partial<Transfer>) => void
  removeTransfer: (fileId: string) => void
  setConnected: (connected: boolean) => void
  setJoined: (joined: boolean) => void
  reset: () => void
}

const initialState = {
  myId: null,
  myName: "",
  peers: [],
  messages: [],
  transfers: {},
  connected: false,
  joined: false,
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setMyId: (myId) => set({ myId }),
  setMyName: (myName) => set({ myName }),
  setPeers: (peers) => set({ peers }),
  addPeer: (peer) => set((s) => ({ peers: [...s.peers.filter((p) => p.id !== peer.id), peer] })),
  removePeer: (peerId) => set((s) => ({ peers: s.peers.filter((p) => p.id !== peerId) })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateTransfer: (fileId, patch) =>
    set((s) => ({
      transfers: {
        ...s.transfers,
        [fileId]: { ...s.transfers[fileId], ...patch },
      },
    })),
  removeTransfer: (fileId) =>
    set((s) => {
      const { [fileId]: _, ...rest } = s.transfers
      return { transfers: rest }
    }),
  setConnected: (connected) => set({ connected }),
  setJoined: (joined) => set({ joined }),
  reset: () => set(initialState),
}))
