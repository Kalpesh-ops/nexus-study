"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoSection } from "@/components/VideoSection"
import { Chat } from "@/components/Chat"
import { StudyHub } from "@/components/StudyHub"
import { VideoSkeleton, ChatSkeleton, StudyHubSkeleton } from "@/components/Skeleton"
import { useWebRTC } from "@/lib/useWebRTC"

export default function StudyRoom() {
  const [subjectInput, setSubjectInput] = useState("")
  const [activeSubject, setActiveSubject] = useState("")
  const [sessionUserId] = useState(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID()
    }
    return `user-${Date.now()}`
  })

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
    []
  )
  const wsUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_MATCHING_WS_URL) {
      return process.env.NEXT_PUBLIC_MATCHING_WS_URL
    }
    return `${apiBaseUrl.replace(/^http/, "ws")}/matching/ws`
  }, [apiBaseUrl])

  const {
    localStream,
    remoteStream,
    status,
    error,
    connect,
    disconnect,
  } = useWebRTC({
    wsUrl,
    userId: sessionUserId,
    subject: activeSubject,
    signalingBaseUrl: `${apiBaseUrl}/matching`,
  })

  const isConnecting = status === "connecting"
  const isConnected = status === "matched" || status === "connected"
  const canStartMatch = !!subjectInput.trim() && (status === "disconnected" || status === "failed")

  const handleToggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
      }
    }
  }

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
      }
    }
  }

  const handleLeave = () => {
    disconnect()
  }

  const handleConnect = async () => {
    if (!subjectInput.trim()) {
      return
    }
    const normalized = subjectInput.trim()
    setActiveSubject(normalized)
    await connect(normalized)
  }

  const handleClearChat = () => {
    console.log("Chat cleared")
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto h-[calc(100vh-3rem)]">
        <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-md">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              placeholder="Enter subject (e.g., Data Structures)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              disabled={status === "connecting" || status === "queued"}
            />
            <button
              onClick={handleConnect}
              disabled={!canStartMatch}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "connecting" || status === "queued" ? "Matching..." : "Find Partner"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Status: {status}{activeSubject ? ` | Subject: ${activeSubject}` : ""}
            {error ? ` | Error: ${error}` : ""}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-2 h-full">
            {isConnecting ? <VideoSkeleton /> : (
              <VideoSection
                localStream={localStream}
                remoteStream={remoteStream}
                isConnected={isConnected}
                onToggleMute={handleToggleMute}
                onToggleVideo={handleToggleVideo}
                onLeave={handleLeave}
              />
            )}
          </div>

          <div className="h-full">
            <Tabs defaultValue="chat" className="h-full bg-card rounded-2xl border border-border p-4 shadow-xl">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="study-hub">Study Hub</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="m-0 h-[calc(100%-4rem)]">
                {isConnecting ? <ChatSkeleton /> : <Chat onClear={handleClearChat} />}
              </TabsContent>
              
              <TabsContent value="study-hub" className="m-0 h-[calc(100%-4rem)] overflow-y-auto">
                {isConnecting ? <StudyHubSkeleton /> : <StudyHub subject={activeSubject} apiBaseUrl={apiBaseUrl} />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}