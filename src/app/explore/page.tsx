/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/services/tmdb";
import MovieCard from "@/components/MovieCard";
import { MovieGridSkeleton } from "@/components/LoadingSkeleton";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [isGenresExpanded, setIsGenresExpanded] = useState(false);

  // Reset genres ketika tab berubah
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedGenres([]);
    setIsGenresExpanded(false);
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["explore", activeTab, activeCategory, selectedGenres, page],
    queryFn: async () => {
      if (activeTab === "trending") {
        return tmdbService.getTrending("all", "week");
      } else if (activeTab === "movies") {
        if (selectedGenres.length > 0) {
          return tmdbService.getMoviesByGenre(selectedGenres, page);
        }
        return activeCategory === "popular"
          ? tmdbService.getPopularMovies(page)
          : tmdbService.getTopRatedMovies(page);
      } else {
        if (selectedGenres.length > 0) {
          return tmdbService.getTVByGenre(selectedGenres, page);
        }
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

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres(prev => {
      // Jika genre sudah dipilih, hapus dari selection
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      }
      // Jika genre belum dipilih, tambahkan ke selection (max 3 genres)
      if (prev.length < 3) {
        return [...prev, genreId];
      }
      return prev; // Tetap sama jika sudah mencapai batas maksimum
    });
    setPage(1);
  };

  const clearGenreFilter = () => {
    setSelectedGenres([]);
    setPage(1);
  };

  const removeSingleGenre = (genreId: number) => {
    setSelectedGenres(prev => prev.filter(id => id !== genreId));
    setPage(1);
  };

  // Dapatkan nama genre yang sedang dipilih
  const getSelectedGenreNames = () => {
    if (selectedGenres.length === 0 || !genresData) return [];
    return selectedGenres.map(genreId => {
      const genre = genresData.find((g: any) => g.id === genreId);
      return genre?.name || `Genre ${genreId}`;
    });
  };

  // Generate title berdasarkan filter yang aktif
  const getContentTitle = () => {
    if (selectedGenres.length > 0) {
      const genreNames = getSelectedGenreNames();
      const mediaType = activeTab === 'movies' ? 'Movies' : 'TV Shows';
      
      if (genreNames.length === 1) {
        return `${genreNames[0]} ${mediaType}`;
      } else if (genreNames.length === 2) {
        return `${genreNames[0]} & ${genreNames[1]} ${mediaType}`;
      } else {
        return `${genreNames.slice(0, -1).join(', ')} & ${genreNames[genreNames.length - 1]} ${mediaType}`;
      }
    }
    
    if (activeTab === 'trending') {
      return 'Trending Now';
    }
    
    return `${activeCategory === 'popular' ? 'Popular' : 'Top Rated'} ${activeTab === 'movies' ? 'Movies' : 'TV Shows'}`;
  };

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
            onClick={() => handleTabChange(tab.id)}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-[#2596be] to-[#1b5186] hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30 transition-all text-white"
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
                setSelectedGenres([]); // Clear genre filter ketika ganti category
                setIsGenresExpanded(false);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === category.id && selectedGenres.length === 0
                  ? "bg-white/20 text-white"
                  : "glass hover:bg-white/10 text-gray-300"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      {/* Active Filter Display */}
      <AnimatePresence>
        {selectedGenres.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 mb-4 p-3 glass rounded-lg"
          >
            <span className="text-sm text-gray-300">Filters:</span>
            <div className="flex flex-wrap gap-2">
              {getSelectedGenreNames().map((genreName, index) => (
                <motion.div
                  key={selectedGenres[index]}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full"
                >
                  <span className="text-sm text-blue-400">{genreName}</span>
                  <button
                    onClick={() => removeSingleGenre(selectedGenres[index])}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400">
                {selectedGenres.length}/3 selected
              </span>
              <button
                onClick={clearGenreFilter}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Genres Filter */}
      {genresData && activeTab !== "trending" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 mb-6"
        >
          {/* Genres Header - Clickable */}
          <div className="flex items-center justify-between w-full mb-3">
            <button
              onClick={() => setIsGenresExpanded(!isGenresExpanded)}
              className="flex items-center space-x-2 hover:bg-white/5 rounded-lg transition-all duration-200 p-2 flex-1 text-left"
            >
              <Filter className="w-5 h-5" />
              <span className="font-semibold">Genres</span>
              {selectedGenres.length > 0 && (
                <span className="text-sm text-blue-400">
                  ({selectedGenres.length}/3 selected)
                </span>
              )}
            </button>
            
            <div className="flex items-center space-x-2">
              {selectedGenres.length > 0 && (
                <button
                  onClick={clearGenreFilter}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-white/10"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsGenresExpanded(!isGenresExpanded)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                {isGenresExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Genres List - Animated Expand/Collapse */}
          <AnimatePresence>
            {isGenresExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {genresData.map((genre: any) => (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreToggle(genre.id)}
                      disabled={selectedGenres.length >= 3 && !selectedGenres.includes(genre.id)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        selectedGenres.includes(genre.id)
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                          : selectedGenres.length >= 3
                          ? "glass text-gray-500 cursor-not-allowed"
                          : "glass hover:bg-white/10 text-gray-300 hover:text-white"
                      }`}
                    >
                      {genre.name}
                      {selectedGenres.includes(genre.id) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                
                
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Genres Preview (when collapsed) */}
          {!isGenresExpanded && selectedGenres.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-2 border-t border-white/10"
            >
              <p className="text-xs text-gray-400 mb-2">Selected genres:</p>
              <div className="flex flex-wrap gap-1">
                {getSelectedGenreNames().slice(0, 3).map((genreName, index) => (
                  <span
                    key={selectedGenres[index]}
                    className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                  >
                    {genreName}
                  </span>
                ))}
                {selectedGenres.length > 3 && (
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                    +{selectedGenres.length - 3} more
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Content Title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold">
          {getContentTitle()}
        </h2>
        <p className="text-gray-400 text-sm">
          {data?.total_results ? `${data.total_results.toLocaleString()} results` : 'Loading...'}
        </p>
      </motion.div>

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

          {/* No Results */}
          {data?.results?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-400 text-lg">No results found</p>
              <p className="text-gray-500 text-sm mt-2">
                Try selecting different filters
              </p>
            </motion.div>
          )}

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