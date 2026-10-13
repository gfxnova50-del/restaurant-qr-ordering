import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-[#F1F2F4] rounded-xl shimmer-mask ${className}`}
    />
  );
}

export function MenuPageSkeleton() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white px-4 pt-4 pb-24 space-y-5 border-x border-[#ECECEC]">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-[#ECECEC]">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-36 h-5 rounded-md" />
            <Skeleton className="w-20 h-3 rounded-md" />
          </div>
        </div>
        <Skeleton className="w-20 h-8 rounded-full" />
      </div>

      {/* Search & Filter Skeleton */}
      <div className="space-y-3">
        <Skeleton className="w-full h-11 rounded-xl" />
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-6 rounded-md" />
          <Skeleton className="w-28 h-7 rounded-full" />
        </div>
      </div>

      {/* Category Pills Skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        <Skeleton className="w-24 h-9 rounded-full shrink-0" />
        <Skeleton className="w-28 h-9 rounded-full shrink-0" />
        <Skeleton className="w-24 h-9 rounded-full shrink-0" />
        <Skeleton className="w-20 h-9 rounded-full shrink-0" />
      </div>

      {/* Item Cards Skeleton */}
      <div className="space-y-4 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex gap-3 p-3.5 bg-white border border-[#ECECEC] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-32 h-5 rounded-md" />
              </div>
              <Skeleton className="w-20 h-4 rounded-md" />
              <Skeleton className="w-48 h-3 rounded-md" />
              <Skeleton className="w-40 h-3 rounded-md" />
            </div>
            <div className="relative w-24 h-24 shrink-0 flex flex-col items-center">
              <Skeleton className="w-full h-full rounded-xl" />
              <Skeleton className="w-16 h-7 rounded-lg -mt-3.5 shadow" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderTrackingSkeleton() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white px-4 py-6 space-y-6 border-x border-[#ECECEC]">
      <div className="text-center space-y-2">
        <Skeleton className="w-32 h-4 mx-auto rounded-md" />
        <Skeleton className="w-48 h-7 mx-auto rounded-lg" />
        <Skeleton className="w-24 h-5 mx-auto rounded-full" />
      </div>

      {/* Steps progress */}
      <div className="bg-[#F7F7F8] border border-[#ECECEC] rounded-2xl p-5 space-y-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="w-28 h-4 rounded-md" />
              <Skeleton className="w-40 h-3 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Order items summary */}
      <div className="bg-white border border-[#ECECEC] rounded-2xl p-5 space-y-3 shadow-sm">
        <Skeleton className="w-32 h-5 rounded-md" />
        <Skeleton className="w-full h-12 rounded-xl" />
        <Skeleton className="w-full h-12 rounded-xl" />
      </div>
    </div>
  );
}
