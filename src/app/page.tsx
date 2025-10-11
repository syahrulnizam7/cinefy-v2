"use client";

import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/services/tmdb";
import MovieCard from "@/components/MovieCard";
import { MovieGridSkeleton, HeroSkeleton } from "@/components/LoadingSkeleton";
import { Play, Plus, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Movie } from "@/lib/redux/types";

export default function HomePage() {
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => tmdbService.getTrending("all", "week"),
  });

  const { data: popularMoviesData, isLoading: moviesLoading } = useQuery({
    queryKey: ["popular-movies"],
    queryFn: () => tmdbService.getPopularMovies(),
  });

  const { data: popularTVData, isLoading: tvLoading } = useQuery({
    queryKey: ["popular-tv"],
    queryFn: () => tmdbService.getPopularTV(),
  });

  const heroMovie = trendingData?.results?.[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {trendingLoading ? (
        <HeroSkeleton />
      ) : heroMovie ? (
        <div className="relative h-[70vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path}`}
              alt={heroMovie.title || heroMovie.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] via-[#0a0e27]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e27] via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl space-y-4"
            >
              <h1 className="text-4xl md:text-6xl font-bold">
                {heroMovie.title || heroMovie.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">★</span>
                  <span>{heroMovie.vote_average.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>
                  {new Date(
                    heroMovie.release_date || heroMovie.first_air_date
                  ).getFullYear()}
                </span>
                <span>•</span>
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase">
                  {heroMovie.media_type}
                </span>
              </div>
              <p className="text-gray-300 line-clamp-3">{heroMovie.overview}</p>
              <div className="flex space-x-3 pt-4">
                <Link
                  href={`/${heroMovie.media_type}/${heroMovie.id}`}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Play className="w-5 h-5 fill-black" />
                  <span>Watch Now</span>
                </Link>
                <button className="flex items-center space-x-2 px-6 py-3 rounded-lg glass hover:bg-white/10 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>My List</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              Trending This Week
            </h2>
            <Link
              href="/explore"
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>See All</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          {trendingLoading ? (
            <MovieGridSkeleton count={10} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trendingData?.results
                ?.slice(1, 11)
                .map((movie: Movie, index: number) => (
                  <MovieCard key={movie.id} movie={movie} index={index} />
                ))}
            </div>
          )}
        </section>

        {/* Popular Movies */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Popular Movies</h2>
            <Link
              href="/explore?tab=movies"
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>See All</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          {moviesLoading ? (
            <MovieGridSkeleton count={10} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {popularMoviesData?.results
                ?.slice(0, 10)
                .map((movie: Movie, index: number) => (
                  <MovieCard
                    key={movie.id}
                    movie={{ ...movie, media_type: "movie" }}
                    index={index}
                  />
                ))}
            </div>
          )}
        </section>

        {/* Popular TV Shows */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Popular TV Shows</h2>
            <Link
              href="/explore?tab=tv"
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>See All</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          {tvLoading ? (
            <MovieGridSkeleton count={10} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {popularTVData?.results
                ?.slice(0, 10)
                .map((show: Movie, index: number) => (
                  <MovieCard
                    key={show.id}
                    movie={{ ...show, media_type: "tv" }}
                    index={index}
                  />
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
