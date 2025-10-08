/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { tmdbService } from "@/lib/services/tmdb";
import { supabaseService } from "@/lib/services/supabase";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Play, Plus, Star, Share2, Clock, Calendar, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import MovieCard from "@/components/MovieCard";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToWatchlist, addRating } from "@/lib/redux/slices";
import { Movie } from "@/lib/redux/types";

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const type = params.type as "movie" | "tv";
  const id = parseInt(params.id as string);

  // Fetch movie/TV details
  const { data: details, isLoading } = useQuery({
    queryKey: [type, id],
    queryFn: () =>
      type === "movie"
        ? tmdbService.getMovieDetails(id)
        : tmdbService.getTVDetails(id),
  });

  // Fetch similar content
  const { data: similar } = useQuery({
    queryKey: ["similar", type, id],
    queryFn: () => tmdbService.getSimilar(type, id),
    enabled: !!details,
  });

  // Check if in watchlist
  const { data: watchlistCheck } = useQuery({
    queryKey: ["watchlist-check", id, type, session?.user?.id],
    queryFn: () => supabaseService.isInWatchlist(session!.user!.id, id, type),
    enabled: !!session?.user,
  });

  // Get user's rating
  const { data: userRatingData } = useQuery({
    queryKey: ["user-rating", id, type, session?.user?.id],
    queryFn: () => supabaseService.getRating(session!.user!.id, id, type),
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (watchlistCheck !== undefined) {
      setIsInWatchlist(watchlistCheck);
    }
  }, [watchlistCheck]);

  useEffect(() => {
    if (userRatingData) {
      setUserRating(userRatingData.rating);
      setReview(userRatingData.review || "");
    }
  }, [userRatingData]);

  // Add to watchlist mutation
  const watchlistMutation = useMutation({
    mutationFn: async () => {
      const watchlistItem = {
        user_id: session!.user!.id,
        movie_id: id,
        media_type: type,
        title: details?.title || details?.name || "",
        poster_path: details?.poster_path || null,
        status: "plan_to_watch" as const,
      };
      return supabaseService.addToWatchlist(watchlistItem);
    },
    onSuccess: (result) => {
      dispatch(addToWatchlist(result));
      setIsInWatchlist(true);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Added to watchlist!");
    },
    onError: () => {
      toast.error("Failed to add to watchlist");
    },
  });

  // Submit rating mutation
  const ratingMutation = useMutation({
    mutationFn: async () => {
      const ratingData = {
        user_id: session!.user!.id,
        movie_id: id,
        media_type: type,
        rating: userRating,
        review: review || undefined,
        title: details?.title || details?.name || "",
        poster_path: details?.poster_path || undefined,
      };
      return supabaseService.upsertRating(ratingData);
    },
    onSuccess: (result) => {
      dispatch(addRating(result));
      queryClient.invalidateQueries({ queryKey: ["user-rating"] });
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      setShowRatingModal(false);
      toast.success("Rating submitted!");
    },
    onError: () => {
      toast.error("Failed to submit rating");
    },
  });

  // Share to community mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      const post = {
        user_id: session!.user!.id,
        movie_id: id,
        media_type: type,
        title: details?.title || details?.name || "",
        poster_path: details?.poster_path || null,
        content: `Check out this amazing ${type}!`,
      };
      return supabaseService.createCommunityPost(post);
    },
    onSuccess: () => {
      setShowShareModal(false);
      toast.success("Shared to community!");
      router.push("/community");
    },
    onError: () => {
      toast.error("Failed to share");
    },
  });

  const handleAddToWatchlist = () => {
    if (!session) {
      toast.error("Please sign in to add to watchlist");
      router.push("/auth/signin");
      return;
    }
    watchlistMutation.mutate();
  };

  const handleSubmitRating = () => {
    if (!session) {
      toast.error("Please sign in to rate");
      router.push("/auth/signin");
      return;
    }

    if (userRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    ratingMutation.mutate();
  };

  const handleShare = () => {
    if (!session) {
      toast.error("Please sign in to share");
      router.push("/auth/signin");
      return;
    }
    shareMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="shimmer w-16 h-16 rounded-full" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Content not found</p>
          <p className="text-gray-400 mb-6">
            The requested content could not be found.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const title = details.title || details.name;
  const releaseDate = details.release_date || details.first_air_date;
  const trailer = details.videos?.results.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] via-[#0a0e27]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e27] via-transparent to-transparent" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0"
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                alt={title}
                className="w-48 md:w-64 rounded-xl shadow-2xl glass border-2 border-white/10"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 space-y-4"
            >
              <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-lg font-semibold">
                    {details.vote_average.toFixed(1)}
                  </span>
                  <span className="text-gray-400">/10</span>
                </div>
                {releaseDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(releaseDate).getFullYear()}</span>
                  </div>
                )}
                {details.runtime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {Math.floor(details.runtime / 60)}h {details.runtime % 60}
                      m
                    </span>
                  </div>
                )}
                {details.number_of_seasons && (
                  <div className="px-3 py-1 rounded-full glass text-sm">
                    {details.number_of_seasons} Season
                    {details.number_of_seasons > 1 ? "s" : ""}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {details.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 rounded-full glass text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              <p className="text-gray-300 max-w-3xl leading-relaxed">
                {details.overview}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <Play className="w-5 h-5 fill-black" />
                    <span>Watch Trailer</span>
                  </a>
                )}
                <button
                  onClick={handleAddToWatchlist}
                  disabled={isInWatchlist || watchlistMutation.isPending}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg glass hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInWatchlist ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  <span>{isInWatchlist ? "In Watchlist" : "Add to List"}</span>
                </button>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg glass hover:bg-white/10 transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${
                      userRatingData ? "fill-yellow-400 text-yellow-400" : ""
                    }`}
                  />
                  <span>{userRatingData ? "Edit Rating" : "Rate"}</span>
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg glass hover:bg-white/10 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cast */}
      {details.credits?.cast && details.credits.cast.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6">Cast</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {details.credits.cast.slice(0, 10).map((person) => (
              <div key={person.id} className="flex-shrink-0 w-32">
                <div className="glass rounded-lg overflow-hidden card-hover">
                  <img
                    src={
                      person.profile_path
                        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                        : "/placeholder-person.png"
                    }
                    alt={person.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2">
                    <p className="font-semibold text-sm line-clamp-1">
                      {person.name}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {person.character}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar */}
      {similar?.results && similar.results.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6">
            Similar {type === "movie" ? "Movies" : "Shows"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similar.results
              .slice(0, 10)
              .map((item: Movie, index: number | undefined) => (
                <MovieCard
                  key={item.id}
                  movie={{ ...item, media_type: type }}
                  index={index}
                />
              ))}
          </div>
        </section>
      )}

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRatingModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative glass rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">Rate this {type}</h3>
              <div className="space-y-4">
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setUserRating(rating)}
                      onMouseEnter={() => setHoverRating(rating)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                        (
                          hoverRating
                            ? hoverRating >= rating
                            : userRating >= rating
                        )
                          ? "bg-yellow-500 text-black scale-110"
                          : "glass hover:bg-white/10"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Write a review (optional)"
                  className="w-full h-32 glass rounded-lg p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSubmitRating}
                    disabled={ratingMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-semibold transition-all disabled:opacity-50"
                  >
                    {ratingMutation.isPending ? "Submitting..." : "Submit"}
                  </button>
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative glass rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">Share to Community</h3>
              <p className="text-gray-300 mb-6">
                Share {title} with the Cinefy community!
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleShare}
                  disabled={shareMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-semibold transition-all disabled:opacity-50"
                >
                  {shareMutation.isPending ? "Sharing..." : "Share Now"}
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
