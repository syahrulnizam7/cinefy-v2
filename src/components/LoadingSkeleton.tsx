"use client";

export function MovieCardSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-gray-700/50 shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-700/50 rounded shimmer" />
        <div className="h-3 bg-gray-700/50 rounded w-2/3 shimmer" />
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] overflow-hidden">
      <div className="absolute inset-0 bg-gray-800/50 shimmer" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
        <div className="h-12 bg-gray-700/50 rounded w-1/2 shimmer" />
        <div className="h-4 bg-gray-700/50 rounded w-3/4 shimmer" />
        <div className="h-4 bg-gray-700/50 rounded w-2/3 shimmer" />
        <div className="flex space-x-3 mt-4">
          <div className="h-12 w-32 bg-gray-700/50 rounded shimmer" />
          <div className="h-12 w-32 bg-gray-700/50 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}
