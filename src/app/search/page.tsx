/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/services/tmdb";
import MovieCard from "@/components/MovieCard";
import { MovieGridSkeleton } from "@/components/LoadingSkeleton";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => tmdbService.search(query),
    enabled: query.length > 0,
  });

  const filteredResults = data?.results?.filter(
    (item: any) => item.media_type === "movie" || item.media_type === "tv"
  );

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Search className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl md:text-5xl font-bold">Search Results</h1>
        </div>
        {query && (
          <p className="text-gray-400">
            Showing results for{" "}
            <span className="text-white font-semibold">
              &quot;{query}&quot;
            </span>
            {data?.total_results && (
              <span className="ml-2">({data.total_results} results)</span>
            )}
          </p>
        )}
      </motion.div>

      {/* Results */}
      {!query ? (
        <div className="glass rounded-xl p-12 text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">Enter a search query to get started</p>
        </div>
      ) : isLoading ? (
        <MovieGridSkeleton count={20} />
      ) : filteredResults && filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredResults.map((item: any, index: number) => (
            <MovieCard key={item.id} movie={item} index={index} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">
            No results found for &quot;{query}&quot;
          </p>
          <p className="text-sm text-gray-500">
            Try different keywords or check your spelling
          </p>
        </div>
      )}
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <Search className="w-8 h-8 text-blue-400" />
        <div className="h-12 w-48 bg-gray-700/50 rounded-lg animate-pulse" />
      </div>
      <MovieGridSkeleton count={20} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}