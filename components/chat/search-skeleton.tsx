"use client";

import { SearchIcon, GlobeIcon } from "lucide-react";

export function SearchSkeleton({ query }: { query?: string }) {
  return (
    <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="relative">
            <SearchIcon className="size-4 animate-pulse" />
            <div className="absolute -right-1 -top-1 size-2 rounded-full bg-blue-400 animate-ping" />
          </div>
          <span className="text-sm font-medium">
            {query ? `"${query}" 검색 최적화 중...` : "의도 분석 중..."}
          </span>
        </div>
        <div className="flex gap-1">
          <div className="size-1.5 rounded-full bg-blue-200 animate-bounce [animation-delay:-0.3s]" />
          <div className="size-1.5 rounded-full bg-blue-300 animate-bounce [animation-delay:-0.15s]" />
          <div className="size-1.5 rounded-full bg-blue-400 animate-bounce" />
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="size-8 shrink-0 rounded-lg bg-blue-100/50 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-blue-100 animate-pulse" />
              <div className="h-3 w-full rounded bg-blue-50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-blue-100/50 pt-2 text-[10px] text-blue-400/80">
        <GlobeIcon className="size-3" />
        <span>여러 출처에서 정보를 수집하고 있습니다...</span>
      </div>
    </div>
  );
}
