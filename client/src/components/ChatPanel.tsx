import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/store/appStore"
import { useChat } from "@/hooks/useChat"
import { formatTime, peerColor } from "@/lib/utils"

interface ChatPanelProps {
  selectedPeer: string | null
}

export function ChatPanel({ selectedPeer }: ChatPanelProps) {
  const [text, setText] = useState("")
  const myId = useAppStore((s) => s.myId)
  const messages = useAppStore((s) => s.messages)
  const peers = useAppStore((s) => s.peers)
  const { sendMessage } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedPeerName =
    selectedPeer === null ? "Everyone" : peers.find((p) => p.id === selectedPeer)?.name ?? "Unknown"

  const filtered = messages.filter((m) => {
    if (selectedPeer === null) return m.to === "all"
    return (
      (m.from === myId && m.to === selectedPeer) ||
      (m.from === selectedPeer && (m.to === "all" || m.to === myId))
    )
  })

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [filtered.length])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    sendMessage(selectedPeer ?? "all", trimmed)
    setText("")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3 font-semibold">
        Chat with {selectedPeerName}
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {filtered.map((msg) => {
            const isMine = msg.from === myId
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {!isMine && (
                    <div className="mb-1 text-xs font-medium" style={{ color: peerColor(msg.from) }}>
                      {msg.fromName}
                    </div>
                  )}
                  <div>{msg.text}</div>
                  <div className={`mt-1 text-right text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatTime(msg.ts)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 border-t p-3">
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend} disabled={!text.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}
