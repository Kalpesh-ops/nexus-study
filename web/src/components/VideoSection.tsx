"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoSectionProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isConnected: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onLeave: () => void
}

export function VideoSection({
  localStream,
  remoteStream,
  isConnected,
  onToggleMute,
  onToggleVideo,
  onLeave,
}: VideoSectionProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const handleMute = () => {
    setIsMuted(!isMuted)
    onToggleMute()
  }

  const handleVideo = () => {
    setIsVideoOff(!isVideoOff)
    onToggleVideo()
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="relative flex-1 rounded-2xl overflow-hidden bg-card border border-border shadow-2xl">
        {isConnected && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-card">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
                <div className="relative w-full h-full rounded-full bg-primary/30 flex items-center justify-center">
                  <span className="text-3xl font-semibold text-primary">?</span>
                </div>
              </div>
              <p className="text-muted-foreground text-lg">
                {isConnected ? "Connecting to peer..." : "Waiting for a study partner..."}
              </p>
              <p className="text-muted-foreground/60 text-sm mt-2">
                We&apos;ll match you with someone soon
              </p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-sm text-white/90">
          {isConnected ? "Connected" : "Searching..."}
        </div>
      </div>

      <div className="h-48 rounded-2xl overflow-hidden bg-card border border-border shadow-xl">
        {localStream && !isVideoOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-card">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}
        
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-xs text-white/80">
          You
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
        <button
          onClick={handleMute}
          onMouseEnter={() => setHoveredButton("mic")}
          onMouseLeave={() => setHoveredButton(null)}
          className={cn(
            "relative p-4 rounded-full transition-all duration-300 ease-out",
            "hover:scale-110 hover:shadow-lg",
            isMuted 
              ? "bg-red-500/80 hover:bg-red-500" 
              : "bg-secondary hover:bg-secondary/80",
            hoveredButton === "mic" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-foreground" />
          )}
          <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          onClick={handleVideo}
          onMouseEnter={() => setHoveredButton("video")}
          onMouseLeave={() => setHoveredButton(null)}
          className={cn(
            "relative p-4 rounded-full transition-all duration-300 ease-out",
            "hover:scale-110 hover:shadow-lg",
            isVideoOff 
              ? "bg-red-500/80 hover:bg-red-500" 
              : "bg-secondary hover:bg-secondary/80",
            hoveredButton === "video" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          {isVideoOff ? (
            <VideoOff className="w-6 h-6 text-white" />
          ) : (
            <Video className="w-6 h-6 text-foreground" />
          )}
          <span className="sr-only">{isVideoOff ? "Turn on camera" : "Turn off camera"}</span>
        </button>

        <button
          onClick={onLeave}
          onMouseEnter={() => setHoveredButton("leave")}
          onMouseLeave={() => setHoveredButton(null)}
          className={cn(
            "relative p-4 rounded-full bg-red-600 hover:bg-red-500 transition-all duration-300 ease-out",
            "hover:scale-110 hover:shadow-lg hover:shadow-red-500/30",
            hoveredButton === "leave" && "ring-2 ring-red-400 ring-offset-2 ring-offset-background"
          )}
        >
          <PhoneOff className="w-6 h-6 text-white" />
          <span className="sr-only">Leave room</span>
        </button>
      </div>
    </div>
  )
}