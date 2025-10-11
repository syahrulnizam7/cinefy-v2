/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabaseService, supabase } from "@/lib/services/supabase";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import MovieCard from "@/components/MovieCard";
import { MovieGridSkeleton } from "@/components/LoadingSkeleton";
import { Film, Star, User, Search } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const tabs = [
  { id: "watchlist", label: "Watchlist", icon: Film },
  { id: "ratings", label: "Ratings", icon: Star },
];

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("watchlist");

  const userId = params.userId as string;

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, image")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch user's watchlist
  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ["user-watchlist", userId],
    queryFn: () => supabaseService.getWatchlist(userId),
    enabled: !!userId && activeTab === "watchlist",
  });

  // Fetch user's ratings
  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["user-ratings", userId],
    queryFn: () => supabaseService.getRatings(userId),
    enabled: !!userId && activeTab === "ratings",
  });

  const isLoading = userLoading || (activeTab === "watchlist" ? watchlistLoading : ratingsLoading);
  const items = activeTab === "watchlist" ? watchlist : ratings;

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-16 h-16 rounded-full" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">User not found</p>
          <p className="text-gray-400 mb-6">
            The requested user could not be found.
          </p>
          <button
            onClick={() => router.push("/community")}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          {userData.image ? (
            <Image
              src={userData.image}
              alt={userData.name || "User"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-white/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          )}

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{userData.name || "Anonymous User"}</h1>
            <p className="text-gray-400 mb-4">{userData.email}</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {watchlist?.length || 0}
                </p>
                <p className="text-sm text-gray-400">Watchlist</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {ratings?.length || 0}
                </p>
                <p className="text-sm text-gray-400">Ratings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-400">
                  {(
                    (ratings?.reduce((sum, r) => sum + Number(r.rating), 0) ??
                      0) / (ratings?.length || 1)
                  ).toFixed(1)}
                </p>
                <p className="text-sm text-gray-400">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
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

      {/* Content */}
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
            >
              <MovieCard
                movie={{
                  id: item.movie_id,
                  title: item.title,
                  poster_path: item.poster_path,
                  vote_average: activeTab === "ratings" ? 0 : item.vote_average || 0,
                  media_type: item.media_type,
                  overview: item.overview || "",
                  backdrop_path: item.backdrop_path || "",
                  genre_ids: item.genre_ids || [],
                  release_date: item.release_date || "",
                }}
                index={index}
              />
              
              {/* User Rating Badge untuk Ratings */}
              {activeTab === "ratings" && item.rating && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.15, type: "spring", stiffness: 200 }}
                  className="absolute bottom-2 right-2 z-10"
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
                ? "Watchlist is Empty"
                : "No Ratings Yet"}
            </h3>

            <p className="text-gray-300 mb-2 text-lg">
              {activeTab === "watchlist"
                ? "This user hasn't added anything to their watchlist yet."
                : "This user hasn't rated any content yet."}
            </p>

            <p className="text-gray-400 mb-8">
              {activeTab === "watchlist"
                ? "Check back later to see what they're watching."
                : "They might share their ratings soon!"}
            </p>

            <Link
              href="/community"
              className="inline-flex items-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#2596be] to-[#1b5186] hover:brightness-110 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 text-white font-semibold text-lg"
            >
              <Search className="w-5 h-5" />
              <span>Back to Community</span>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}