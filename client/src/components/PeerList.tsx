import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/store/appStore"
import { peerColor } from "@/lib/utils"

interface PeerListProps {
  selectedPeer: string | null
  onSelectPeer: (id: string | null) => void
}

export function PeerList({ selectedPeer, onSelectPeer }: PeerListProps) {
  const myId = useAppStore((s) => s.myId)
  const peers = useAppStore((s) => s.peers)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3 font-semibold">Peers ({peers.length + 1})</div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              selectedPeer === null ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => onSelectPeer(null)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback style={{ backgroundColor: myId ? peerColor(myId) : "#888" }}>
                Me
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {useAppStore.getState().myName}
                <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
              </div>
            </div>
          </button>

          <SeparatorLine />

          {peers.map((peer) => (
            <button
              key={peer.id}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedPeer === peer.id ? "bg-accent" : "hover:bg-accent/50"
              }`}
              onClick={() => onSelectPeer(peer.id)}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback style={{ backgroundColor: peerColor(peer.id) }}>
                  {peer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="font-medium">{peer.name}</div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function SeparatorLine() {
  return <div className="mx-3 my-1 border-t" />
}
