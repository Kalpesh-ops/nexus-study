"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted/50",
        className
      )}
    />
  )
}

export function VideoSkeleton() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 rounded-2xl overflow-hidden bg-card border border-border">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto mb-2" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
        </div>
      </div>

      <div className="h-48 rounded-2xl overflow-hidden bg-card border border-border">
        <Skeleton className="w-full h-full" />
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
          <Skeleton className="h-3 w-40 mx-auto" />
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-11 rounded-xl" />
          <Skeleton className="w-11 h-11 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function StudyHubSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>

        <Skeleton className="h-48 rounded-2xl" />

        <div className="flex items-center justify-center gap-4 mt-4">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <Skeleton className="h-5 w-24 mb-4" />

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}