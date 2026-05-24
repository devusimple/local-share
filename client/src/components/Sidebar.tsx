import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/store/appStore"
import { peerColor, formatTime } from "@/lib/utils"
import { useState, useMemo } from "react"
import type { Message } from "@/types"

interface SidebarProps {
  selectedPeer: string | null
  onSelectPeer: (id: string | null) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Sidebar({ selectedPeer, onSelectPeer, sidebarOpen, onToggleSidebar }: SidebarProps) {
  const myId = useAppStore((s) => s.myId)
  const peers = useAppStore((s) => s.peers)
  const messages = useAppStore((s) => s.messages)
  const connected = useAppStore((s) => s.connected)
  const [search, setSearch] = useState("")

  const lastMessage = useMemo(() => {
    const map = new Map<string, Message>()
    for (const msg of messages) {
      const key = msg.to === "all" ? "all" : msg.from === myId ? msg.to : msg.from
      const existing = map.get(key)
      if (!existing || msg.ts > existing.ts) {
        map.set(key, msg)
      }
    }
    return map
  }, [messages, myId])

  const conversations = useMemo(() => {
    const items: { id: string; name: string }[] = [
      { id: "all", name: "Everyone" },
      ...peers.filter((p) => p.id !== myId).map((p) => ({ id: p.id, name: p.name })),
    ]
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter((c) => c.name.toLowerCase().includes(q))
  }, [peers, search, myId])

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onToggleSidebar}
        />
      )}
      <aside
        className={cn(
          "flex w-[min(24rem,100vw)] flex-col bg-[#f0f2f5] dark:bg-[#111b21] border-r border-gray-200 dark:border-gray-800",
          "fixed inset-y-0 left-0 z-40 transition-transform md:static md:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between bg-[#00a884] dark:bg-[#202c33] px-4 py-3">
          <h1 className="text-lg font-semibold text-white">Local Share</h1>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-300" : "bg-red-400"}`} />
            <span className="text-xs text-white/80">{peers.length + 1} online</span>
          </div>
        </div>

        <div className="p-2">
          <Input
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-white dark:bg-[#2a3942] text-sm text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0] rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <ScrollArea className="flex-1">
          {conversations.map((conv) => {
            const isAll = conv.id === "all"
            const isSelected = isAll ? selectedPeer === null : selectedPeer === conv.id
            const last = lastMessage.get(conv.id)
            const avatarColor = isAll
              ? "#667781"
              : peerColor(conv.id)
            const avatarLetter = isAll
              ? "A"
              : conv.name.charAt(0).toUpperCase()

            return (
              <button
                key={conv.id}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  isSelected
                    ? "bg-[#f0f2f5] dark:bg-[#2a3942]"
                    : "hover:bg-[#f0f2f5]/80 dark:hover:bg-[#202c33]",
                )}
                onClick={() => onSelectPeer(isAll ? null : conv.id)}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback
                    className="text-white"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {avatarLetter}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium truncate">{conv.name}</span>
                    {last && (
                      <span className="shrink-0 text-[11px] text-[#667781] dark:text-[#8696a0] ml-2">
                        {formatTime(last.ts)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                    {last ? last.text : (connected ? "Click to start chatting" : "Connecting...")}
                  </div>
                </div>
              </button>
            )
          })}
          {conversations.length === 0 && (
            <div className="p-4 text-center text-sm text-[#667781] dark:text-[#8696a0]">
              No conversations found
            </div>
          )}
        </ScrollArea>
      </aside>
    </>
  )
}
