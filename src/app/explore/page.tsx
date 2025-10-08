/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/services/tmdb";
import MovieCard from "@/components/MovieCard";
import { MovieGridSkeleton } from "@/components/LoadingSkeleton";
import { Filter } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { id: "trending", label: "Trending" },
  { id: "movies", label: "Movies" },
  { id: "tv", label: "TV Shows" },
];

const categories = [
  { id: "popular", label: "Popular" },
  { id: "top_rated", label: "Top Rated" },
];

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState("trending");
  const [activeCategory, setActiveCategory] = useState("popular");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["explore", activeTab, activeCategory, page],
    queryFn: async () => {
      if (activeTab === "trending") {
        return tmdbService.getTrending("all", "week");
      } else if (activeTab === "movies") {
        return activeCategory === "popular"
          ? tmdbService.getPopularMovies(page)
          : tmdbService.getTopRatedMovies(page);
      } else {
        return activeCategory === "popular"
          ? tmdbService.getPopularTV(page)
          : tmdbService.getTopRatedTV(page);
      }
    },
  });

  const { data: genresData } = useQuery({
    queryKey: ["genres", activeTab],
    queryFn: () =>
      activeTab === "movies"
        ? tmdbService.getMovieGenres()
        : tmdbService.getTVGenres(),
    enabled: activeTab !== "trending",
  });

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
          Explore
        </h1>
        <p className="text-gray-400">Discover movies and TV shows</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                : "glass hover:bg-white/10 text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Categories (for movies and tv) */}
      {activeTab !== "trending" && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? "bg-white/20 text-white"
                  : "glass hover:bg-white/10 text-gray-300"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      {/* Genres Filter */}
      {genresData && activeTab !== "trending" && (
        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-5 h-5" />
            <span className="font-semibold">Genres</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {genresData.map((genre: any) => (
              <button
                key={genre.id}
                className="px-3 py-1 rounded-full glass-hover text-sm"
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Grid */}
      {isLoading ? (
        <MovieGridSkeleton count={20} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data?.results?.map((item: any, index: number) => (
              <MovieCard
                key={item.id}
                movie={{
                  ...item,
                  media_type:
                    activeTab === "movies"
                      ? "movie"
                      : activeTab === "tv"
                      ? "tv"
                      : item.media_type,
                }}
                index={index}
              />
            ))}
          </div>

          {/* Pagination */}
          {data?.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg glass hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="px-4 py-2 glass rounded-lg">
                Page {page} of {Math.min(data.total_pages, 500)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.min(data.total_pages, 500)}
                className="px-4 py-2 rounded-lg glass hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
