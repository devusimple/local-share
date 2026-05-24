import { useCallback } from "react"
import { getSocket } from "../lib/socket"
import { useAppStore } from "../store/appStore"
import type { Message } from "../types"

export function useChat() {
  const myId = useAppStore((s) => s.myId)
  const myName = useAppStore((s) => s.myName)

  const sendMessage = useCallback(
    (to: string, text: string) => {
      const socket = getSocket()
      const msg: Message = {
        id: crypto.randomUUID(),
        from: myId!,
        fromName: myName,
        to,
        text,
        ts: Date.now(),
      }
      socket.emit("message", { to, text })
      useAppStore.getState().addMessage(msg)
    },
    [myId, myName],
  )

  return { sendMessage }
}
