"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { tmdbService } from "@/lib/services/tmdb";
import { supabaseService } from "@/lib/services/supabase";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Play, Plus, Star, Share2, Clock, Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import MovieCard from "@/components/MovieCard";
import { useAppDispatch } from "@/lib/redux/hooks";
import {
  addToWatchlist,
  removeFromWatchlist,
  addRating,
} from "@/lib/redux/slices";
import { Movie } from "@/lib/redux/types";
import Image from "next/image";
import Loader from "@/components/Loader";

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
  const [watchlistId, setWatchlistId] = useState<string | null>(null);

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

  // Query untuk mendapatkan data watchlist yang lebih detail
  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist-detail", id, type, session?.user?.id],
    queryFn: () =>
      supabaseService.getWatchlistItem(session!.user!.id, id, type),
    enabled: !!session?.user,
  });

  const { data: userRatingData } = useQuery({
    queryKey: ["user-rating", id, type, session?.user?.id],
    queryFn: () => supabaseService.getRating(session!.user!.id, id, type),
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (watchlistData) {
      setIsInWatchlist(!!watchlistData);
      setWatchlistId(watchlistData?.id || null);
    }
  }, [watchlistData]);

  useEffect(() => {
    if (userRatingData) {
      setUserRating(userRatingData.rating);
      setReview(userRatingData.review || "");
    }
  }, [userRatingData]);

  // Mutation untuk menambah watchlist
  const addWatchlistMutation = useMutation({
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
      setWatchlistId(result.id);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist-detail"] });
      toast.success("Added to watchlist!");
    },
    onError: () => {
      toast.error("Failed to add to watchlist");
    },
  });

  // Mutation untuk menghapus watchlist
  const removeWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (!watchlistId) throw new Error("No watchlist ID");
      return supabaseService.removeFromWatchlist(watchlistId);
    },
    onSuccess: () => {
      dispatch(removeFromWatchlist({ movie_id: id, media_type: type }));
      setIsInWatchlist(false);
      setWatchlistId(null);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist-detail"] });
      toast.success("Removed from watchlist!");
    },
    onError: () => {
      toast.error("Failed to remove from watchlist");
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

  // Fungsi toggle watchlist
  const handleToggleWatchlist = () => {
    if (!session) {
      toast.error("Please sign in to manage watchlist");
      router.push("/auth/signin");
      return;
    }

    if (isInWatchlist) {
      removeWatchlistMutation.mutate();
    } else {
      addWatchlistMutation.mutate();
    }
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

  // Fungsi untuk navigasi ke halaman detail cast
  const handleCastClick = (personId: number) => {
    router.push(`/person/${personId}`);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-bold mb-2">Content not found</p>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            The requested content could not be found.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all text-sm sm:text-base"
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
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="relative pt-16"> 
        <div className="absolute inset-0 h-[50vh] xs:h-[55vh] sm:h-[60vh] z-0">
          <Image
            src={
              details.backdrop_path
                ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
                : "/no-img.png"
            }
            alt={title ?? ""}
            fill
            className="w-full h-full object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] via-[#0a0e27]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e27] via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-start pt-0 xs:pt-36 sm:pt-40 md:pt-44"> {/* Increased top padding */}
            
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0 w-32 xs:w-36 sm:w-40 md:w-44 lg:w-52 xl:w-60 mx-auto md:mx-0"
            >
              <div className="relative aspect-[2/3] w-full rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 bg-gray-800">
                <Image
                  src={
                    details.poster_path
                      ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                      : "/no-img.png"
                  }
                  alt={title ?? ""}
                  fill
                  className="object-cover"
                  sizes="(max-width: 360px) 128px, (max-width: 480px) 144px, (max-width: 640px) 160px, (max-width: 768px) 176px, (max-width: 1024px) 208px, 240px"
                  priority
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 space-y-3 xs:space-y-4 text-center md:text-left min-w-0 pb-6 md:pb-8"
            >
              <h1 className="text-white text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold leading-tight break-words">
                {title}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 xs:gap-3 sm:gap-4 text-xs xs:text-sm">
                <div className="flex items-center space-x-1 xs:space-x-2">
                  <Star className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-base xs:text-base sm:text-lg font-semibold text-gray-200">
                    {details.vote_average.toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-xs xs:text-sm">/10</span>
                </div>
                {releaseDate && (
                  <div className="flex items-center space-x-1 xs:space-x-2">
                    <Calendar className="w-4 h-4 xs:w-4 xs:h-4" />
                    <span className="text-gray-400 font-semibold">{new Date(releaseDate).getFullYear()}</span>
                  </div>
                )}
                {details.runtime && (
                  <div className="flex items-center space-x-1 xs:space-x-2">
                    <Clock className="w-4 h-4 xs:w-4 xs:h-4" />
                    <span className="text-gray-400 font-semibold">
                      {Math.floor(details.runtime / 60)}h {details.runtime % 60}
                      m
                    </span>
                  </div>
                )}
                {details.number_of_seasons && (
                  <div className="px-2 xs:px-3 py-1 rounded-full  bg-white/10 text-xs xs:text-sm backdrop-blur-sm text-[#39b5f0] font-semibold">
                    {details.number_of_seasons} Season
                    {details.number_of_seasons > 1 ? "s" : ""}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1 xs:gap-2 justify-center md:justify-start">
                {details.genres?.slice(0, 3).map((genre) => (
                  <span
                    key={genre.id}
                    className="px-2 xs:px-3 py-1 rounded-full text-[#39b5f0] bg-white/10 text-xs xs:text-sm backdrop-blur-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              <div className="max-h-[80px] xs:max-h-[90px] sm:max-h-[100px] overflow-y-auto">
                <p className="text-gray-300 text-sm xs:text-base leading-relaxed pr-2">
                  {details.overview}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 xs:gap-3 pt-4 justify-center md:justify-start">
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 xs:space-x-2 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors text-xs xs:text-sm sm:text-base flex-1 sm:flex-none justify-center min-w-0 max-w-[180px]"
                  >
                    <Play className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 fill-black flex-shrink-0" />
                    <span className="truncate">Trailer</span>
                  </a>
                )}
                <button
                  onClick={handleToggleWatchlist}
                  disabled={
                    addWatchlistMutation.isPending ||
                    removeWatchlistMutation.isPending
                  }
                  className="flex items-center space-x-1 xs:space-x-2 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs xs:text-sm sm:text-base flex-1 sm:flex-none justify-center min-w-0 max-w-[180px]"
                >
                  {isInWatchlist ? (
                    <>
                      <X className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 flex-shrink-0" color="#e5e7eb" />
                      <span className="truncate text-gray-200">Remove</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 flex-shrink-0" color="#e5e7eb" />
                      <span className="truncate text-gray-200">Add to List</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center space-x-1 xs:space-x-2 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-xs xs:text-sm sm:text-base flex-1 sm:flex-none justify-center min-w-0 max-w-[180px]"
                >
                  <Star
                    className={`w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                      userRatingData ? "fill-yellow-400 text-yellow-400" : ""
                    }`}
                    color="#e5e7eb"
                  />
                  <span className="truncate text-gray-200">{userRatingData ? "Edit" : "Rate"}</span>
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center space-x-1 xs:space-x-2 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-xs xs:text-sm sm:text-base flex-1 sm:flex-none justify-center min-w-0 max-w-[180px]"
                >
                  <Share2 className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 flex-shrink-0" color="#e5e7eb" />
                  <span className="truncate text-gray-200">Share</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-[#0a0e27] relative z-10">
        {details.credits?.cast && details.credits.cast.length > 0 && (
          <section className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
            <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-4 xs:mb-5 sm:mb-6">Cast</h2>
            <div className="relative">
              <div
                className="flex overflow-x-auto gap-3 xs:gap-4 sm:gap-5 pb-4 xs:pb-5
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
          scroll-smooth"
              >
                {details.credits.cast.slice(0, 12).map((person, index) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="flex-shrink-0 w-24 xs:w-28 sm:w-32 md:w-36 cursor-pointer"
                    onClick={() => handleCastClick(person.id)}
                  >
                    <div className="bg-white/5 rounded-lg overflow-hidden transition-all duration-300 group hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/20 border border-white/10 hover:border-white/20">
                      <div className="relative aspect-[2/3]">
                        <Image
                          src={
                            person.profile_path
                              ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                              : "/no-img.png"
                          }
                          alt={person.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 360px) 96px, (max-width: 480px) 112px, (max-width: 640px) 128px, 144px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      </div>
                      <div className="p-2 xs:p-3 sm:p-4">
                        <p className="font-semibold text-xs sm:text-sm line-clamp-1 text-white group-hover:text-blue-300 transition-colors">
                          {person.name}
                        </p>
                        <p className="text-xs text-gray-300 line-clamp-1 mt-1 group-hover:text-gray-200 transition-colors">
                          {person.character}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Similar Section */}
        {similar?.results && similar.results.length > 0 && (
          <section className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
            <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-4 xs:mb-5 sm:mb-6">
              Similar {type === "movie" ? "Movies" : "Shows"}
            </h2>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 xs:gap-4 sm:gap-5">
              {similar.results
                .slice(0, type === 'movie' ? 12 : 10)
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
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4"
            onClick={() => setShowRatingModal(false)}
          >
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
              className="absolute inset-0"
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative bg-gray-900 rounded-xl p-4 xs:p-5 sm:p-6 max-w-md w-full mx-2 border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg xs:text-xl font-bold mb-4 text-center text-gray-200">
                Rate this {type}
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex flex-wrap justify-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <motion.button
                        key={star}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1"
                      >
                        <Star
                          className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 ${
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

                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-yellow-400">
                      {userRating || 0}
                    </span>
                    <span className="text-gray-400 text-lg">/ 10</span>
                  </div>

                  {userRating > 0 && (
                    <p className="text-gray-300 text-center text-sm">
                      {userRating <= 3 && "Poor"}
                      {userRating === 4 && "Below Average"}
                      {userRating === 5 && "Average"}
                      {userRating === 6 && "Above Average"}
                      {userRating === 7 && "Good"}
                      {userRating === 8 && "Very Good"}
                      {userRating === 9 && "Excellent"}
                      {userRating === 10 && "Masterpiece"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Review (optional)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your thoughts about this movie/show..."
                    className="w-full h-20 xs:h-24 bg-gray-800 rounded-lg p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-200"
                  />
                </div>

                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-2">
                  <button
                    onClick={handleSubmitRating}
                    disabled={ratingMutation.isPending || userRating === 0}
                    className="flex-1 px-4 py-2.5 xs:py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-semibold text-white transition-all disabled:opacity-50 text-sm"
                  >
                    {ratingMutation.isPending
                      ? "Submitting..."
                      : "Submit Rating"}
                  </button>
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2.5 xs:py-3 bg-gray-800 text-white hover:bg-gray-700 rounded-lg transition-all text-sm xs:flex-none"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4"
            onClick={() => setShowShareModal(false)}
          >
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
              className="absolute inset-0"
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative bg-gray-900 rounded-xl p-4 xs:p-5 sm:p-6 max-w-md w-full border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg xs:text-xl font-bold mb-4 text-gray-200">Share to Community</h3>

              <div className="flex items-center gap-3 xs:gap-4 mb-4 p-3 rounded-lg bg-gray-800">
                <div className="relative w-12 xs:w-14 sm:w-16 h-18 xs:h-21 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={
                      details.poster_path
                        ? `https://image.tmdb.org/t/p/w200${details.poster_path}`
                        : "/no-img.png"
                    }
                    alt={title ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 360px) 48px, (max-width: 480px) 56px, 64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold line-clamp-2 text-sm xs:text-base text-gray-200">
                    {title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {type === "movie" ? "Movie" : "TV Show"} •{" "}
                    {releaseDate ? new Date(releaseDate).getFullYear() : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add a caption (optional)
                </label>
                <textarea
                  value={shareCaption}
                  onChange={(e) => setShareCaption(e.target.value)}
                  placeholder={`Share your thoughts about ${title}...`}
                  className="w-full h-20 xs:h-24 bg-gray-800 rounded-lg p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-200"
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>What makes this {type} special?</span>
                  <span>{shareCaption.length}/500</span>
                </div>
              </div>

              <p className="text-gray-300 mb-4 xs:mb-6 text-xs xs:text-sm">
                Your post will be visible to the Cinefy community
              </p>

              <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
                <button
                  onClick={handleShare}
                  disabled={shareMutation.isPending}
                  className="flex-1 px-4 py-2.5 xs:py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-semibold transition-all disabled:opacity-50 text-sm"
                >
                  {shareMutation.isPending ? "Sharing..." : "Share Now"}
                </button>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setShareCaption("");
                  }}
                  className="px-4 py-2.5 xs:py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-sm xs:flex-none"
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