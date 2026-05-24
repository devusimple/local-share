import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/store/appStore"
import { useFileTransfer } from "@/hooks/useFileTransfer"
import { formatBytes } from "@/lib/utils"
import { MAX_FILE_SIZE } from "@/lib/constants"
import type { Transfer } from "@/types"

interface FilePanelProps {
  selectedPeer: string | null
}

export function FilePanel({ selectedPeer }: FilePanelProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const transfers = useAppStore((s) => s.transfers)
  const { sendFile, cancelTransfer } = useFileTransfer()

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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = () => setDragging(false)

  const statusColor = (status: Transfer["status"]): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "sending":
      case "receiving":
        return "default"
      case "done":
        return "secondary"
      case "cancelled":
        return "destructive"
    }
  }

  return (
    <div className="flex h-full flex-col border-t">
      <div
        className={`flex flex-col items-center justify-center gap-2 p-6 text-sm ${
          dragging ? "bg-accent" : ""
        } ${selectedPeer === null ? "cursor-pointer" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          multiple
        />
        <div className="text-muted-foreground">
          {selectedPeer === null
            ? "Drop files here or click to browse"
            : "Drop files here to send"}
        </div>
        <div className="text-xs text-muted-foreground">
          Max {formatBytes(MAX_FILE_SIZE)} per file
        </div>
      </div>

      {Object.keys(transfers).length > 0 && (
        <ScrollArea className="max-h-40 border-t p-3">
          <div className="space-y-2">
            {Object.values(transfers).map((t) => (
              <div key={t.meta.fileId} className="rounded-lg border p-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="max-w-[180px] truncate font-medium">{t.meta.name}</span>
                  <Badge variant={statusColor(t.status)}>
                    {t.status === "done"
                      ? "Done"
                      : t.status === "cancelled"
                        ? "Cancelled"
                        : `${t.progress}%`}
                  </Badge>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {formatBytes(t.meta.size)}
                </div>
                {(t.status === "sending" || t.status === "receiving") && (
                  <Progress value={t.progress} className="mt-1 h-1.5" />
                )}
                {(t.status === "sending" || t.status === "receiving") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 px-2 text-xs"
                    onClick={() => cancelTransfer(t.meta.fileId)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
