/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { supabaseService } from "@/lib/services/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MovieCard from "@/components/MovieCard";
import { MovieGridSkeleton } from "@/components/LoadingSkeleton";
import { Film, Star, Users, User } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const tabs = [
  { id: "watchlist", label: "Watchlist", icon: Film },
  { id: "ratings", label: "Ratings", icon: Star },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("watchlist");

  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ["watchlist", session?.user?.id],
    queryFn: () => supabaseService.getWatchlist(session!.user!.id),
    enabled: !!session?.user?.id && activeTab === "watchlist",
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["ratings", session?.user?.id],
    queryFn: () => supabaseService.getRatings(session!.user!.id),
    enabled: !!session?.user?.id && activeTab === "ratings",
  });

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
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-24 h-24 rounded-full border-4 border-white/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-12 h-12" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{session.user?.name}</h1>
            <p className="text-gray-400 mb-4">{session.user?.email}</p>

            {/* Stats */}
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
                  {(ratings?.reduce((sum, r) => sum + Number(r.rating), 0) ??
                    0) / (ratings?.length || 1) || 0}
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
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
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
            <div key={item.id} className="relative">
              <MovieCard
                movie={{
                  id: item.movie_id,
                  title: item.title,
                  poster_path: item.poster_path,
                  vote_average: item.rating || 0,
                  media_type: item.media_type,
                  overview: item.overview || "",
                  backdrop_path: item.backdrop_path || "",
                  genre_ids: item.genre_ids || [],
                }}
                index={index}
              />
              {activeTab === "watchlist" && (
                <div className="absolute top-2 right-2 z-10">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      item.status === "completed"
                        ? "bg-green-500/80"
                        : item.status === "watching"
                        ? "bg-blue-500/80"
                        : "bg-gray-500/80"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>
              )}
              {activeTab === "ratings" && item.rating && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="flex items-center space-x-1 bg-yellow-500/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-white fill-white" />
                    <span className="text-sm font-semibold text-white">
                      {item.rating}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">
            {activeTab === "watchlist"
              ? "Your watchlist is empty"
              : "You haven't rated any movies or shows yet"}
          </p>
          <Link
            href="/explore"
            className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Explore Movies & TV Shows
          </Link>
        </div>
      )}
    </div>
  );
}
