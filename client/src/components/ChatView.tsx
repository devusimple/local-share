import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAppStore } from "@/store/appStore"
import { useChat } from "@/hooks/useChat"
import { useFileTransfer } from "@/hooks/useFileTransfer"
import { formatTime, formatBytes, peerColor } from "@/lib/utils"
import { MAX_FILE_SIZE } from "@/lib/constants"
import type { Message, Transfer } from "@/types"

interface ChatViewProps {
  selectedPeer: string | null
  onBack: () => void
}

export function ChatView({ selectedPeer, onBack }: ChatViewProps) {
  const [text, setText] = useState("")
  const myId = useAppStore((s) => s.myId)
  const messages = useAppStore((s) => s.messages)
  const peers = useAppStore((s) => s.peers)
  const transfers = useAppStore((s) => s.transfers)
  const connected = useAppStore((s) => s.connected)
  const { sendMessage } = useChat()
  const { sendFile, cancelTransfer } = useFileTransfer()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const selectedPeerName = useMemo(() => {
    if (selectedPeer === null) return "Everyone"
    return peers.find((p) => p.id === selectedPeer)?.name ?? "Unknown"
  }, [selectedPeer, peers])

  const selectedPeerColor = useMemo(() => {
    if (selectedPeer === null) return "#667781"
    return peerColor(selectedPeer)
  }, [selectedPeer])

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (selectedPeer === null) return m.to === "all"
      return (
        (m.from === myId && m.to === selectedPeer) ||
        (m.from === selectedPeer && (m.to === "all" || m.to === myId))
      )
    })
  }, [messages, selectedPeer, myId])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [filtered.length, transfers])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    sendMessage(selectedPeer ?? "all", trimmed)
    setText("")
  }

  const handleFiles = (files: FileList) => {
    const target = selectedPeer ?? "all"
    for (const file of Array.from(files)) {
      sendFile(file, target)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const conversationTransfers = useMemo(() => {
    return Object.values(transfers).filter((t) => {
      if (selectedPeer === null) return t.meta.to === "all"
      return (
        (t.meta.from === myId && t.meta.to === selectedPeer) ||
        (t.meta.from === selectedPeer && (t.meta.to === "all" || t.meta.to === myId))
      )
    })
  }, [transfers, selectedPeer, myId])

  const statusColor = (status: Transfer["status"]) => {
    switch (status) {
      case "sending":
      case "receiving":
        return "default" as const
      case "done":
        return "secondary" as const
      case "cancelled":
        return "destructive" as const
    }
  }

  const showPlaceholder = selectedPeer === null && filtered.length === 0

  return (
    <div
      ref={dropRef}
      className="flex flex-1 flex-col bg-[#efeae2] dark:bg-[#111b21]"
    >
      {dragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
        >
          <div className="rounded-2xl border-2 border-dashed border-white/60 p-12 text-center text-white">
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm text-white/70">Max {formatBytes(MAX_FILE_SIZE)} per file</p>
          </div>
        </div>
      )}

      <header className="flex items-center gap-3 bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 shadow-sm">
        <button className="md:hidden" onClick={onBack}>
          <svg className="h-6 w-6 text-[#54656f] dark:text-[#aebac1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar className="h-10 w-10 shrink-0 cursor-pointer">
          <AvatarFallback
            className="text-white text-sm"
            style={{ backgroundColor: selectedPeerColor }}
          >
            {selectedPeerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-medium truncate text-[#111b21] dark:text-[#e9edef]">
            {selectedPeerName}
          </h2>
          <p className="text-xs text-[#667781] dark:text-[#8696a0]">
            {connected ? "Online" : "Connecting..."}
          </p>
        </div>
      </header>

      {showPlaceholder && conversationTransfers.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00a884]/10">
              <svg className="h-8 w-8 text-[#00a884]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#41525d] dark:text-[#aebac1]">
              {selectedPeer === null ? "Broadcast messages" : `Chat with ${selectedPeerName}`}
            </h3>
            <p className="mt-1 text-sm text-[#667781] dark:text-[#8696a0]">
              {selectedPeer === null
                ? "Messages sent here are visible to everyone on the network"
                : "Send a message or drop a file to start"}
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4 py-3"
          onDragOver={(e) => { e.preventDefault(); if (!dragging) setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="space-y-1">
            {filtered.map((msg) => <MessageBubble key={msg.id} msg={msg} myId={myId} />)}
            {conversationTransfers.map((t) => (
              <FileTransferBubble
                key={t.meta.fileId}
                transfer={t}
                myId={myId}
                onCancel={cancelTransfer}
                statusColor={statusColor}
              />
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      )}

      <div
        className="flex items-center gap-2 bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 pb-3 md:pb-2"
        onDragOver={(e) => { e.preventDefault(); if (!dragging) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </Button>
        <Input
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 border-0 bg-white dark:bg-[#2a3942] text-sm text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0] rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5"
          onClick={handleSend}
          disabled={!text.trim()}
          title="Send"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </Button>
      </div>
    </div>
  )
}

function MessageBubble({ msg, myId }: { msg: Message; myId: string | null }) {
  const isMine = msg.from === myId
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`relative max-w-[75%] rounded-lg px-3 py-1.5 text-sm shadow-sm ${
          isMine
            ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef]"
            : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef]"
        }`}
      >
        {!isMine && (
          <div className="mb-0.5 text-[11px] font-medium" style={{ color: peerColor(msg.from) }}>
            {msg.fromName}
          </div>
        )}
        <div className="text-[14px] leading-5 whitespace-pre-wrap break-words">{msg.text}</div>
        <div className={`-mr-1 -mb-0.5 flex justify-end text-[11px] ${
          isMine ? "text-[#667781] dark:text-[#aebac1]" : "text-[#667781] dark:text-[#8696a0]"
        }`}>
          {formatTime(msg.ts)}
        </div>
      </div>
    </div>
  )
}

function FileTransferBubble({
  transfer,
  myId,
  onCancel,
  statusColor,
}: {
  transfer: Transfer
  myId: string | null
  onCancel: (fileId: string) => void
  statusColor: (status: Transfer["status"]) => "default" | "secondary" | "destructive"
}) {
  const isMine = transfer.meta.from === myId
  const isActive = transfer.status === "sending" || transfer.status === "receiving"
  const isDone = transfer.status === "done"
  const mime = transfer.meta.mime
  const isImage = mime.startsWith("image/")
  const isVideo = mime.startsWith("video/")

  const handleDownload = () => {
    if (!transfer.blobUrl) return
    const a = document.createElement("a")
    a.href = transfer.blobUrl
    a.download = transfer.meta.name
    a.click()
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`relative max-w-[75%] rounded-lg px-3 py-2 shadow-sm overflow-hidden ${
          isMine
            ? "bg-[#d9fdd3] dark:bg-[#005c4b]"
            : "bg-white dark:bg-[#202c33]"
        }`}
      >
        {!isMine && (
          <div className="mb-1 text-[11px] font-medium px-1" style={{ color: peerColor(transfer.meta.from) }}>
            {transfer.meta.fromName}
          </div>
        )}

        {isDone && isImage && transfer.blobUrl && (
          <div className="mb-2 -mx-3 -mt-2">
            <img
              src={transfer.blobUrl}
              alt={transfer.meta.name}
              className="max-h-48 sm:max-h-72 w-full object-cover cursor-pointer"
              onClick={handleDownload}
              loading="lazy"
            />
          </div>
        )}

        {isDone && isVideo && transfer.blobUrl && (
          <div className="mb-2 -mx-3 -mt-2">
            <video
              src={transfer.blobUrl}
              controls
              className="max-h-48 sm:max-h-72 w-full"
              preload="metadata"
              playsInline
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isImage && !isVideo && (
            <svg className="h-8 w-8 shrink-0 text-[#667781] dark:text-[#aebac1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate text-[#111b21] dark:text-[#e9edef]">
              {transfer.meta.name}
            </div>
            <div className="text-xs text-[#667781] dark:text-[#8696a0]">
              {formatBytes(transfer.meta.size)}
            </div>
          </div>
          {isActive && (
            <Badge variant={statusColor(transfer.status)} className="shrink-0">
              {`${transfer.progress}%`}
            </Badge>
          )}
        </div>

        {isActive && (
          <div className="mt-2">
            <Progress value={transfer.progress} className="h-1" />
            <div className="mt-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-[#667781] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => onCancel(transfer.meta.fileId)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isDone && (
          <div className="mt-1 flex items-center justify-between">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs text-[#00a884] hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
            <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
