# AGENTS.md — LAN Messenger & File Sharing App

> Vibe coding guide for AI agents. Read fully before writing any code.

---

## Concept

A **local network messenger and file sharing app**.  
One person runs the server. Everyone on the same WiFi opens the app in their browser and connects. No internet required. No WebRTC. No accounts.

```
[ Browser A ] ──┐
[ Browser B ] ──┼──► [ Socket.io Server on LAN ] ◄── relay ──► all peers
[ Browser C ] ──┘
```

Simple. The server is just a relay — it never stores anything permanently.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui |
| Realtime | Socket.io (client + server) |
| State | Zustand |
| Runtime | Node.js (server) |

No WebRTC. No databases. No auth. No cloud.

---

## Project Structure

```
├── client/                      # React app (Vite)
│   └── src/
│       ├── components/
│       │   ├── ui/              # shadcn/ui — do not edit
│       │   ├── JoinScreen.tsx   # Enter your name to join
│       │   ├── ChatPanel.tsx    # Message thread
│       │   ├── FilePanel.tsx    # File drop zone + transfer list
│       │   ├── PeerList.tsx     # Who's online
│       │   └── StatusBar.tsx    # Connected / disconnected
│       ├── hooks/
│       │   ├── useSocket.ts     # Socket.io connection
│       │   ├── useChat.ts       # Send / receive messages
│       │   └── useFileTransfer.ts # Chunked file send / receive
│       ├── lib/
│       │   ├── socket.ts        # Socket.io client singleton
│       │   ├── chunker.ts       # File → binary chunks
│       │   └── utils.ts         # formatBytes, formatTime
│       ├── store/
│       │   └── appStore.ts      # Zustand state
│       └── types/index.ts       # All shared types
│
└── server/
    ├── index.js                 # Socket.io server entry
    ├── roomManager.js           # Track peers
    └── fileRelay.js             # Stream file chunks between peers
```

---

## How It Works

### Connection Flow

```
1. Server starts on port 3001 (LAN IP printed in terminal on start)
2. User opens http://<server-ip>:3001 in browser
3. User enters a display name → joins the global room
4. Server broadcasts updated peer list to everyone
5. Messages and files relay through the server in real time
```

---

## Socket Events

### Client → Server

```ts
socket.emit("join",        { name: string })
socket.emit("message",     { to: string | "all"; text: string })
socket.emit("file:start",  { fileId: string; name: string; size: number; mime: string; to: string | "all" })
socket.emit("file:chunk",  { fileId: string; index: number; data: ArrayBuffer })
socket.emit("file:end",    { fileId: string })
socket.emit("file:cancel", { fileId: string })
```

### Server → Client

```ts
socket.on("peers",        (peers: Peer[]) => void)
socket.on("peer:joined",  (peer: Peer) => void)
socket.on("peer:left",    (peerId: string) => void)
socket.on("message",      (msg: Message) => void)
socket.on("file:start",   (meta: FileMeta) => void)
socket.on("file:chunk",   (chunk: FileChunk) => void)
socket.on("file:end",     (payload: { fileId: string }) => void)
socket.on("file:cancel",  (payload: { fileId: string }) => void)
```

---

## TypeScript Types (`types/index.ts`)

```ts
interface Peer {
  id: string        // socket.id
  name: string
  joinedAt: number
}

interface Message {
  id: string
  from: string
  fromName: string
  to: string        // socket.id or "all"
  text: string
  ts: number
}

interface FileMeta {
  fileId: string
  from: string
  fromName: string
  to: string
  name: string
  size: number
  mime: string
  totalChunks: number
}

interface FileChunk {
  fileId: string
  index: number
  data: ArrayBuffer
}

type TransferStatus = "receiving" | "done" | "cancelled" | "sending"

interface Transfer {
  meta: FileMeta
  chunks: ArrayBuffer[]
  receivedCount: number
  status: TransferStatus
  progress: number   // 0–100
}
```

---

## State Shape (Zustand)

```ts
interface AppState {
  myId: string | null
  myName: string
  peers: Peer[]
  messages: Message[]
  transfers: Record<string, Transfer>
  connected: boolean

  setMyName: (name: string) => void
  addMessage: (msg: Message) => void
  updateTransfer: (fileId: string, patch: Partial<Transfer>) => void
}
```

---

## File Transfer Logic

### Sending
```
1. User picks or drops a file
2. Validate: size < MAX_FILE_SIZE (500MB)
3. Read as ArrayBuffer, split into 64KB chunks
4. emit file:start  → metadata + totalChunks
5. emit file:chunk  → one per chunk, sequentially
6. emit file:end    → signals completion
7. Track progress: chunksSent / totalChunks * 100
```

### Receiving
```
1. file:start  → create Transfer entry in store
2. file:chunk  → push to chunks[], update progress
3. file:end    → new Blob(chunks) → object URL → auto download
4. file:cancel → remove Transfer, show notice
```

### Server relay rule
Server does NOT buffer file data. Every file:chunk received is immediately forwarded to the target peer(s). Zero persistence.

---

## Constants (`lib/constants.ts`)

```ts
export const CHUNK_SIZE    = 64 * 1024          // 64KB
export const MAX_FILE_SIZE = 500 * 1024 * 1024  // 500MB
export const MAX_NAME_LEN  = 24
export const SERVER_PORT   = 3001
```

---

## Server (`server/index.js`)

Responsibilities:
1. Serve the built React client (in production)
2. Track connected peers in memory
3. Relay all events to the correct recipient(s)
4. Broadcast peer list on any join/leave
5. Print the LAN IP on startup so users know the URL

Keep it under 100 lines. No business logic — relay only.

---

## UI Rules

### Design
- Clean and minimal. Tailwind utility classes only — no inline styles.
- Light theme default. Dark mode via Tailwind `dark:` variant.
- shadcn/ui for all interactive elements — no custom button/input components.
- Consistent spacing from Tailwind scale — no arbitrary values.
- Each peer gets a color derived from their socket ID — used on avatar and message accent.

### Layout (desktop)
```
┌──────────────────────────────────────────────────────┐
│  StatusBar: 🟢 Connected · LAN · 3 peers online      │
├────────────────┬─────────────────────────────────────┤
│                │                                     │
│   PeerList     │   ChatPanel                         │
│   w-64         │   (thread + input bar)              │
│                │                                     │
│                ├─────────────────────────────────────┤
│                │   FilePanel                         │
│                │   (drop zone + transfer list) h-48  │
└────────────────┴─────────────────────────────────────┘
```

### Layout (mobile)
- Full width, bottom tab bar: Chat / Files / Peers
- FilePanel as bottom sheet

### shadcn/ui components to use
`Button` `Input` `Badge` `Progress` `Avatar` `ScrollArea`
`Tooltip` `Alert` `Dialog` `Separator`

---

## Build Order

1. `types/index.ts`
2. `lib/constants.ts`
3. `server/index.js`
4. `lib/socket.ts`
5. `store/appStore.ts`
6. `hooks/useSocket.ts`
7. `hooks/useChat.ts`
8. `hooks/useFileTransfer.ts`
9. `components/JoinScreen.tsx`
10. `components/PeerList.tsx`
11. `components/ChatPanel.tsx`
12. `components/FilePanel.tsx`
13. `components/StatusBar.tsx`
14. `App.tsx`

---

## Commands

```bash
# Client
bun create vite@latest client -- --template react-ts
cd client
bun install socket.io-client zustand
bun install -D tailwindcss postcss autoprefixer
bunx tailwindcss init -p
bunx shadcn-ui@latest init
bunx shadcn-ui@latest add button input badge progress avatar dialog scroll-area tooltip alert separator

# Server
mkdir server && cd server
npm init -y
bun install socket.io express

# Dev — run both
node server/index.js        # Terminal 1
cd client && bun run dev    # Terminal 2
```

---

## Out of Scope (v1)

- No encryption
- No message history or database
- No user accounts
- No video / audio
- No internet relay — LAN only
- No WebRTC

---

## Done When

- [ ] Two devices on the same WiFi can see each other in the peer list
- [ ] Messages deliver instantly to all or a specific peer
- [ ] A 200MB file transfers with an accurate progress bar
- [ ] Disconnected peers vanish from the list immediately
- [ ] Works on a phone browser (responsive)
- [ ] `tsc --noEmit` passes clean

# NOTE: Make sure to the project ready to deploy vercel or netlify (both server side and frontend side)