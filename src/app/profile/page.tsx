/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "@/lib/services/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MovieCard from "@/components/MovieCard";
import { MovieGridSkeleton } from "@/components/LoadingSkeleton";
import { Film, Star, User, Search, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

const tabs = [
  { id: "watchlist", label: "Watchlist", icon: Film },
  { id: "ratings", label: "Ratings", icon: Star },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("watchlist");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Di dalam komponen ProfilePage
  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ["watchlist", session?.user?.id],
    queryFn: () => supabaseService.getWatchlist(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["ratings", session?.user?.id],
    queryFn: () => supabaseService.getRatings(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const { data: ratingsCount } = useQuery({
    queryKey: ["ratingsCount", session?.user?.id],
    queryFn: () => supabaseService.getRatingsCount(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const deleteWatchlistMutation = useMutation({
    mutationFn: (id: string) => supabaseService.removeFromWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      setDeleteConfirm(null);
      toast.success("Removed from watchlist");
    },
    onError: () => {
      toast.error("Failed to remove from watchlist");
    },
  });

  const deleteRatingMutation = useMutation({
    mutationFn: (id: string) => supabaseService.deleteRating(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      setDeleteConfirm(null);
      toast.success("Rating deleted");
    },
    onError: () => {
      toast.error("Failed to delete rating");
    },
  });

  const handleDelete = (item: any) => {
    if (activeTab === "watchlist") {
      deleteWatchlistMutation.mutate(item.id);
    } else {
      deleteRatingMutation.mutate(item.id);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-16 h-16 rounded-full" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  const isLoading =
    activeTab === "watchlist" ? watchlistLoading : ratingsLoading;
  const items = activeTab === "watchlist" ? watchlist : ratings;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-white/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-12 h-12" />
            </div>
          )}

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2 text-white">{session.user?.name}</h1>
            <p className="text-gray-400 mb-4">{session.user?.email}</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {watchlist?.length || 0}
                </p>
                <p className="text-sm text-gray-400">Watchlist</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {ratingsCount ?? 0}
                </p>
                <p className="text-sm text-gray-400">Ratings</p>
              </div>
              {/* <div className="text-center">
                <p className="text-2xl font-bold text-pink-400">
                  {(
                    (ratings?.reduce((sum, r) => sum + Number(r.rating), 0) ??
                      0) / (ratings?.length || 1)
                  ).toFixed(1)}
                </p>
                <p className="text-sm text-gray-400">Avg Rating</p>
              </div> */}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex cursor-pointer items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#2596be] to-[#1b5186] hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30 transition-all text-white"
                  : "glass hover:bg-white/10 text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <MovieGridSkeleton count={10} />
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item: any, index: number) => (
            <motion.div
              key={`${item.id}-${item.media_type}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: index * 0.05 + 0.1,
                  type: "spring",
                  stiffness: 200,
                }}
                onClick={() => setDeleteConfirm(item.id)}
                className="cursor-pointer absolute bottom-1 right-2 z-20 w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                title={`Delete ${
                  activeTab === "watchlist" ? "from watchlist" : "rating"
                }`}
              >
                <Trash2 className="w-4 h-4 text-white" />
              </motion.button>

              <AnimatePresence>
                {activeTab === "ratings" &&
                  item.review &&
                  hoveredItem === item.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="absolute -top-2 right-0 z-10 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg max-w-[200px]"
                    >
                      <p className="italic line-clamp-4">{item.review}</p>
                      {/* Chat Bubble Tail */}
                      <div className="absolute top-full right-3 w-0 h-0 border-t-[10px] border-t-gray-900 border-x-[8px] border-x-transparent"></div>
                    </motion.div>
                  )}
              </AnimatePresence>

              <MovieCard
                movie={{
                  id: item.movie_id,
                  title: item.title,
                  poster_path: item.poster_path,
                  vote_average:
                    activeTab === "ratings" ? 0 : item.vote_average || 0,
                  media_type: item.media_type,
                  overview: item.overview || "",
                  backdrop_path: item.backdrop_path || "",
                  genre_ids: item.genre_ids || [],
                  release_date: item.release_date || "",
                }}
                index={index}
              />

              {activeTab === "ratings" && item.rating && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: index * 0.05 + 0.15,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="absolute bottom-2 right-12 z-10"
                >
                  <div className="flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <Star className="w-3 h-3 text-white fill-white" />
                    <span className="text-xs font-semibold text-white">
                      {item.rating}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-12 text-center backdrop-blur-sm"
        >
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64">
              <Image
                src="/empty-state.png"
                alt="Empty state"
                width={256}
                height={256}
                className="object-contain"
              />
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              {activeTab === "watchlist"
                ? "Your Watchlist is Empty"
                : "No Ratings Yet"}
            </h3>

            <p className="text-gray-300 mb-2 text-lg">
              {activeTab === "watchlist"
                ? "Hmm, looks like there's nothing here yet!"
                : "Your opinion matters - start rating!"}
            </p>

            <p className="text-gray-400 mb-8">
              {activeTab === "watchlist"
                ? "Explore amazing movies and TV shows to build your perfect watchlist."
                : "Share your thoughts on the movies and shows you've watched."}
            </p>

            {/* Action Button */}
            <Link
              href="/explore"
              className="inline-flex items-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#2596be] to-[#1b5186] hover:brightness-110 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 text-white font-semibold text-lg"
            >
              <Search className="w-5 h-5" />
              <span>Explore Content</span>
            </Link>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Confirm Delete</h3>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-300 mb-6">
                Are you sure you want to remove this{" "}
                {activeTab === "watchlist" ? "from your watchlist" : "rating"}?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const item = (items ?? []).find(
                      (i: any) => i.id === deleteConfirm
                    );
                    if (item) handleDelete(item);
                  }}
                  disabled={
                    deleteWatchlistMutation.isPending ||
                    deleteRatingMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {deleteWatchlistMutation.isPending ||
                  deleteRatingMutation.isPending
                    ? "Deleting..."
                    : "Delete"}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 glass hover:bg-white/10 rounded-lg transition-colors"
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
