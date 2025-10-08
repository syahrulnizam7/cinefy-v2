"use client";

import Link from "next/link";
import { Star, Calendar } from "lucide-react";
import { Movie } from "@/lib/redux/types";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export default function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const title = movie.title || movie.name;
  const releaseDate = movie.release_date || movie.first_air_date;
  const mediaType = movie.media_type || "movie";
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <Link href={`/${mediaType}/${movie.id}`}>
        <div className="relative overflow-hidden rounded-xl glass card-hover cursor-pointer">
          {/* Poster Image */}
          <div className="aspect-[2/3] relative overflow-hidden bg-gray-800">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Rating Badge */}
            {movie.vote_average > 0 && (
              <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold">
                  {movie.vote_average.toFixed(1)}
                </span>
              </div>
            )}

            {/* Media Type Badge */}
            <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-blue-500/80 backdrop-blur-sm text-xs font-semibold uppercase">
              {mediaType === "tv" ? "TV" : "Movie"}
            </div>

            {/* Hover Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-sm line-clamp-3 text-gray-200">
                {movie.overview || "No description available."}
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-3 space-y-1">
            <h3 className="font-semibold line-clamp-1 group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            {releaseDate && (
              <div className="flex items-center space-x-1 text-sm text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{new Date(releaseDate).getFullYear()}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
