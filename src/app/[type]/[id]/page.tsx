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
import Image from "next/image";

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
  const [shareCaption, setShareCaption] = useState("");
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const type = params.type as "movie" | "tv";
  const id = parseInt(params.id as string);

  const { data: details, isLoading } = useQuery({
    queryKey: [type, id],
    queryFn: () =>
      type === "movie"
        ? tmdbService.getMovieDetails(id)
        : tmdbService.getTVDetails(id),
  });

  const { data: similar } = useQuery({
    queryKey: ["similar", type, id],
    queryFn: () => tmdbService.getSimilar(type, id),
    enabled: !!details,
  });

  const { data: watchlistCheck } = useQuery({
    queryKey: ["watchlist-check", id, type, session?.user?.id],
    queryFn: () => supabaseService.isInWatchlist(session!.user!.id, id, type),
    enabled: !!session?.user,
  });

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

  const watchlistMutation = useMutation({
    mutationFn: async () => {
      const watchlistItem = {
        user_id: session!.user!.id,
        movie_id: id,
        media_type: type,
        title: details?.title || details?.name || "",
        poster_path: details?.poster_path || "",
        overview: details?.overview || "",
        backdrop_path: details?.backdrop_path || "",
        genre_ids: details?.genres?.map((g) => g.id) || [],
        vote_average: details?.vote_average || 0,
        release_date: details?.release_date || details?.first_air_date || "",
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

  const ratingMutation = useMutation({
    mutationFn: async () => {
      const ratingData = {
        user_id: session!.user!.id,
        movie_id: id,
        media_type: type,
        rating: userRating,
        review: review || undefined,
        title: details?.title || details?.name || "",
        poster_path: details?.poster_path || "",
        overview: details?.overview || "",
        backdrop_path: details?.backdrop_path || "",
        genre_ids: details?.genres?.map((g) => g.id) || [],
        vote_average: details?.vote_average || 0,
        release_date: details?.release_date || details?.first_air_date || "",
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

  const shareMutation = useMutation({
    mutationFn: async () => {
      const post = {
        user_id: session!.user!.id,
        movie_id: id,
        media_type: type,
        title: details?.title || details?.name || "",
        poster_path: details?.poster_path || null,
        content: shareCaption || `Check out this amazing ${type}!`,
      };
      return supabaseService.createCommunityPost(post);
    },
    onSuccess: () => {
      setShowShareModal(false);
      setShareCaption("");

      queryClient.invalidateQueries({
        queryKey: ["community-posts"],
      });

      toast.success("Shared to community!");

      setTimeout(() => {
        router.push("/community");
      }, 100);
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
          <Image
            src={
              details.backdrop_path
                ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
                : "/no-img.png"
            }
            alt={title ?? ""}
            fill
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
              <Image
                src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                alt={title??""}
                className="w-48 md:w-64 rounded-xl shadow-2xl glass border-2 border-white/10"
                layout="responsive"
                width={500}
                height={750}
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
          <div className="relative group">
            <div
              className="flex overflow-x-auto gap-4 pb-4 
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        scroll-smooth"
            >
              {details.credits.cast.slice(0, 10).map((person, index) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex-shrink-0 w-32 transform transition-all duration-300 hover:scale-105"
                >
                  <div className="glass rounded-lg overflow-hidden card-hover">
                    <div className="relative">
                      <Image
                        src={
                          person.profile_path
                            ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                            : "/placeholder-person.png"
                        }
                        alt={person.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-2">
                      <p className="font-semibold text-sm line-clamp-1 text-white">
                        {person.name}
                      </p>
                      <p className="text-xs text-gray-300 line-clamp-1">
                        {person.character}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#0a0e27] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#0a0e27] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRatingModal(false)}
          >
            {/* Background Overlay dengan Animasi Blur */}
            <motion.div
              initial={{
                backdropFilter: "blur(0px)",
                backgroundColor: "rgba(0,0,0,0)",
              }}
              animate={{
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(0,0,0,0.7)",
              }}
              exit={{
                backdropFilter: "blur(0px)",
                backgroundColor: "rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.4,
              }}
              className="relative glass rounded-xl p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center sm:text-left">
                Rate this {type}
              </h3>
              <div className="space-y-4">
                {/* Rating Stars 1-10 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="flex flex-col items-center space-y-4"
                >
                  <div className="w-full max-w-xs mx-auto">
                    <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-0.5 transition-all duration-200"
                        >
                          <Star
                            className={`w-5 h-5 sm:w-6 sm:h-6 ${
                              (
                                hoverRating
                                  ? hoverRating >= star
                                  : userRating >= star
                              )
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-400 fill-gray-400/20"
                            } transition-all duration-200`}
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Number Display */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center space-x-2"
                  >
                    <span className="text-2xl sm:text-3xl font-bold text-yellow-400">
                      {userRating || 0}
                    </span>
                    <span className="text-gray-400 text-lg sm:text-xl">
                      / 10
                    </span>
                  </motion.div>

                  {/* Rating Label */}
                  {userRating > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm sm:text-base text-gray-300 text-center px-2"
                    >
                      {userRating <= 3 && "Poor"}
                      {userRating === 4 && "Below Average"}
                      {userRating === 5 && "Average"}
                      {userRating === 6 && "Above Average"}
                      {userRating === 7 && "Good"}
                      {userRating === 8 && "Very Good"}
                      {userRating === 9 && "Excellent"}
                      {userRating === 10 && "Masterpiece"}
                    </motion.p>
                  )}
                </motion.div>

                {/* Review Textarea */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-gray-300">
                    Review (optional)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your thoughts about this movie/show..."
                    className="w-full h-24 sm:h-32 glass rounded-lg p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                  />
                </motion.div>

                {/* Action Buttons - Responsive */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2"
                >
                  <button
                    onClick={handleSubmitRating}
                    disabled={ratingMutation.isPending || userRating === 0}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-[#2596be] to-[#1b5186] hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30  font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 text-sm sm:text-base"
                  >
                    {ratingMutation.isPending
                      ? "Submitting..."
                      : "Submit Rating"}
                  </button>
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-3 glass hover:bg-white/10 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </motion.div>
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
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            {/* Background Overlay dengan Animasi Blur */}
            <motion.div
              initial={{
                backdropFilter: "blur(0px)",
                backgroundColor: "rgba(0,0,0,0)",
              }}
              animate={{
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(0,0,0,0.7)",
              }}
              exit={{
                backdropFilter: "blur(0px)",
                backgroundColor: "rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.4,
              }}
              className="relative glass rounded-xl p-6 max-w-md w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">Share to Community</h3>

              {/* Preview Item */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-white/5"
              >
                <Image
                  src={`https://image.tmdb.org/t/p/w200${details?.poster_path}`}
                  alt={title??""}
                  className="w-16 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold line-clamp-1">{title}</h4>
                  <p className="text-sm text-gray-400">
                    {type === "movie" ? "Movie" : "TV Show"} •{" "}
                    {releaseDate ? new Date(releaseDate).getFullYear() : "N/A"}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs">
                      {details?.vote_average?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Caption Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="mb-4"
              >
                <label
                  htmlFor="share-caption"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Add a caption (optional)
                </label>
                <textarea
                  id="share-caption"
                  value={shareCaption}
                  onChange={(e) => setShareCaption(e.target.value)}
                  placeholder={`Share your thoughts about ${title}...`}
                  className="w-full h-24 glass rounded-lg p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-200"
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>What makes this {type} special?</span>
                  <span>{shareCaption.length}/500</span>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-gray-300 mb-6 text-sm"
              >
                Your post will be visible to the Cinefy community
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="flex space-x-3"
              >
                <button
                  onClick={handleShare}
                  disabled={shareMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-semibold transition-all duration-200 disabled:opacity-50 transform hover:scale-105"
                >
                  {shareMutation.isPending ? "Sharing..." : "Share Now"}
                </button>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setShareCaption("");
                  }}
                  className="px-4 py-2 glass hover:bg-white/10 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
