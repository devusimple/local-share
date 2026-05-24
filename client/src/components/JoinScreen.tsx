import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MAX_NAME_LEN } from "@/lib/constants"
import { getSocket, getServerUrl, setServerUrl } from "@/lib/socket"
import { useAppStore } from "@/store/appStore"

const NAME_KEY = "local-share-name"

export function JoinScreen() {
  const [name, setName] = useState("")
  const [showServer, setShowServer] = useState(false)
  const [serverInput, setServerInput] = useState(getServerUrl())
  const setMyName = useAppStore((s) => s.setMyName)
  const setJoined = useAppStore((s) => s.setJoined)
  const connected = useAppStore((s) => s.connected)
  const joinedRef = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem(NAME_KEY)
    if (saved) setName(saved)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(NAME_KEY)
    if (saved && connected && !joinedRef.current) {
      joinedRef.current = true
      setMyName(saved)
      getSocket().emit("join", { name: saved })
      setJoined(true)
    }
  }, [connected, setMyName, setJoined])

  const handleJoin = () => {
    const trimmed = name.trim().slice(0, MAX_NAME_LEN)
    if (!trimmed) return
    localStorage.setItem(NAME_KEY, trimmed)
    setMyName(trimmed)
    getSocket().emit("join", { name: trimmed })
    setJoined(true)
  }

  const handleServerChange = () => {
    const url = serverInput.trim().replace(/\/+$/, "") || window.location.origin
    setServerInput(url)
    setServerUrl(url)
    setShowServer(false)
  }

  if (localStorage.getItem(NAME_KEY) && connected) {
    return null
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#efeae2] dark:bg-[#111b21]">
      <div className="flex w-80 flex-col items-center gap-4 rounded-lg bg-white dark:bg-[#202c33] p-8 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00a884]">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[#111b21] dark:text-[#e9edef]">Local Share</h1>
        <p className="text-sm text-[#667781] dark:text-[#8696a0]">Enter your name to join the network</p>
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LEN}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          className="border-[#e9edef] dark:border-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0]"
        />
        <Button
          className="w-full bg-[#00a884] hover:bg-[#008f72] text-white"
          onClick={handleJoin}
          disabled={!connected || !name.trim()}
        >
          {connected ? "Join" : "Connecting..."}
        </Button>

        {showServer ? (
          <div className="flex w-full gap-2">
            <Input
              placeholder="http://192.168.1.100:3001"
              value={serverInput}
              onChange={(e) => setServerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleServerChange()}
              className="flex-1 border-[#e9edef] dark:border-[#2a3942] text-xs text-[#111b21] dark:text-[#e9edef]"
            />
            <Button
              size="sm"
              className="bg-[#00a884] hover:bg-[#008f72] text-white"
              onClick={handleServerChange}
            >
              Save
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowServer(true)}
            className="text-xs text-[#667781] dark:text-[#8696a0] hover:text-[#00a884] underline underline-offset-2"
          >
            Server: {getServerUrl()}
          </button>
        )}
      </div>
    </div>
  )
}
