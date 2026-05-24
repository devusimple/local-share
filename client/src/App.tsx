import { useState } from "react"
import { useAppStore } from "@/store/appStore"
import { useSocket } from "@/hooks/useSocket"
import { JoinScreen } from "@/components/JoinScreen"
import { Sidebar } from "@/components/Sidebar"
import { ChatView } from "@/components/ChatView"

export default function App() {
  const joined = useAppStore((s) => s.joined)
  useSocket()

  const [selectedPeer, setSelectedPeer] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!joined) {
    return <JoinScreen />
  }

  return (
    <div className="flex h-screen bg-[#efeae2] dark:bg-[#0b141a]">
      <Sidebar
        selectedPeer={selectedPeer}
        onSelectPeer={(id) => {
          setSelectedPeer(id)
          setSidebarOpen(false)
        }}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <ChatView
        selectedPeer={selectedPeer}
        onBack={() => setSidebarOpen(true)}
      />
    </div>
  )
}
