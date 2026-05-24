import { useAppStore } from "@/store/appStore"

export function StatusBar() {
  const connected = useAppStore((s) => s.connected)
  const peers = useAppStore((s) => s.peers)

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
      <span>{connected ? "Connected" : "Disconnected"}</span>
      <span className="text-muted-foreground/50">·</span>
      <span>LAN</span>
      <span className="text-muted-foreground/50">·</span>
      <span>{peers.length + 1} peers online</span>
    </div>
  )
}
