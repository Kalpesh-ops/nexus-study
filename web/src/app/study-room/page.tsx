"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoSection } from "@/components/VideoSection"
import { Chat } from "@/components/Chat"
import { StudyHub } from "@/components/StudyHub"
import { VideoSkeleton, ChatSkeleton, StudyHubSkeleton } from "@/components/Skeleton"

export default function StudyRoom() {
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream] = useState<MediaStream | null>(null)
  const localStreamRef = useRef(localStream)

  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  useEffect(() => {
    async function initializeMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        setLocalStream(stream)
        
        setTimeout(() => {
          setIsConnecting(false)
          setIsConnected(true)
        }, 3000)
      } catch (err) {
        console.error("Failed to get media devices:", err)
        setIsConnecting(false)
      }
    }

    initializeMedia()

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

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
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    setLocalStream(null)
    setIsConnected(false)
    setIsConnecting(true)
    
    setTimeout(() => {
      initializeAfterLeave()
    }, 1000)
  }

  const initializeAfterLeave = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setLocalStream(stream)
      
      setTimeout(() => {
        setIsConnecting(false)
        setIsConnected(true)
      }, 3000)
    } catch (err) {
      console.error("Failed to get media devices:", err)
    }
  }

  const handleClearChat = () => {
    console.log("Chat cleared")
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto h-[calc(100vh-3rem)]">
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
                {isConnecting ? <StudyHubSkeleton /> : <StudyHub />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}