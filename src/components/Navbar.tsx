"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Home,
  Compass,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Film,
  Star,
  Tv,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/lib/services/tmdb";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Community", href: "/community", icon: Users },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Effect untuk handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch autocomplete results
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["search-autocomplete", searchQuery],
    queryFn: async () => {
      if (searchQuery.trim().length < 2) return { results: [] };
      const data = await tmdbService.search(searchQuery, 1);
      return {
        results: data.results?.slice(0, 8) || [] 
      };
    },
    enabled: searchQuery.trim().length >= 2 && isSearchOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleResultClick = (item: any) => {
    const mediaType = item.media_type === 'movie' ? 'movie' : 'tv';
    window.location.href = `/${mediaType}/${item.id}`;
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/30" 
          : "glass-dark border-b border-white/10"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image
                src="/cinefy-v2-logo.png"
                alt="logo"
                width={120}
                height={40}
                priority
                className="w-[80px] sm:w-[100px] md:w-[120px] h-auto transition-all duration-300 hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Search & Profile */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Profile / Sign In - Desktop Only */}
              {session ? (
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="cursor-pointer flex items-center space-x-2 p-1 rounded-full hover:bg-white/10 transition-all"
                  >
                    {session.user?.image && !imgError ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-white/20"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#2596be] to-[#2596be] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden"
                      >
                        <div className="p-3 border-b border-white/20">
                          <p className="font-semibold text-sm text-white">
                            {session.user?.name}
                          </p>
                          <p className="text-xs text-white/70 truncate">
                            {session.user?.email}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 px-4 py-3 hover:bg-white/10 transition-all duration-200 text-white/90 hover:text-white"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm">My Profile</span>
                        </Link>
                        <button
                          onClick={() => {
                            signOut();
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center space-x-2 px-4 py-3 hover:bg-red-500/20 transition-all duration-200 text-red-300 hover:text-red-100 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="hidden md:block px-4 py-2 rounded-lg bg-gradient-to-r from-[#2596be] to-[#1b5186] hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium text-white"
                >
                  Sign In
                </Link>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="md:hidden border-t border-white/20 bg-black/80 backdrop-blur-xl z-50 relative"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-white ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
                
                {/* Mobile Profile Section */}
                {session && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="pt-4 border-t border-white/20 mt-4"
                  >
                    <div className="px-4 py-2 mb-2">
                      <p className="font-semibold text-white text-sm">
                        {session.user?.name}
                      </p>
                      <p className="text-white/70 text-xs truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">My Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-red-300 hover:bg-red-500/20 hover:text-red-100 w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </motion.div>
                )}

                {!session && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="pt-4 border-t border-white/20 mt-4"
                  >
                    <Link
                      href="/auth/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#2596be] to-[#1b5186] hover:brightness-110 transition-all font-medium text-white w-full"
                    >
                      <User className="w-5 h-5" />
                      <span>Sign In</span>
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
            onClick={() => setIsSearchOpen(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="relative w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
              ref={searchInputRef}
            >
              <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center space-x-3 p-4 border-b border-white/10">
                  <Search className="w-6 h-6 text-white/70" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search movies, TV shows..."
                    className="flex-1 bg-transparent outline-none text-lg placeholder-white/50 text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Autocomplete Results */}
                <AnimatePresence>
                  {searchQuery.trim().length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="max-h-96 overflow-y-auto"
                    >
                      {/* Loading State */}
                      {isSearching && (
                        <div className="p-4 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <p className="text-white/70 text-sm mt-2">Searching...</p>
                        </div>
                      )}

                      {/* Results */}
                      {!isSearching && searchResults?.results && searchResults.results.length > 0 && (
                        <div className="p-2">
                          {searchResults.results.map((item: any, index: number) => (
                            <motion.button
                              key={`${item.id}-${item.media_type}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleResultClick(item)}
                              className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 group"
                            >
                              {/* Poster */}
                              <div className="flex-shrink-0 w-12 h-16 bg-gray-700/50 rounded overflow-hidden">
                                {item.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                    alt={item.title || item.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-600">
                                    <Film className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                                    {item.title || item.name}
                                  </h3>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    item.media_type === 'movie' 
                                      ? 'bg-blue-500/20 text-blue-300' 
                                      : 'bg-purple-500/20 text-purple-300'
                                  }`}>
                                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-3 text-sm text-white/70">
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span>{item.vote_average?.toFixed(1)}</span>
                                  </div>
                                  <span>•</span>
                                  <span>
                                    {item.release_date 
                                      ? new Date(item.release_date).getFullYear()
                                      : item.first_air_date 
                                        ? new Date(item.first_air_date).getFullYear()
                                        : 'N/A'
                                    }
                                  </span>
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* No Results */}
                      {!isSearching && searchQuery.trim().length >= 2 && searchResults?.results?.length === 0 && (
                        <div className="p-6 text-center">
                          <Search className="w-12 h-12 text-white/30 mx-auto mb-3" />
                          <p className="text-white/70">No results found for "{searchQuery}"</p>
                          <p className="text-white/50 text-sm mt-1">Try different keywords</p>
                        </div>
                      )}

                      {/* Search Prompt */}
                      {searchQuery.trim().length < 2 && (
                        <div className="p-6 text-center">
                          <Search className="w-12 h-12 text-white/30 mx-auto mb-3" />
                          <p className="text-white/70">Type at least 2 characters to search</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* View All Results Button */}
                {searchQuery.trim().length >= 2 && searchResults?.results && searchResults.results.length > 0 && (
                  <div className="p-3 border-t border-white/10">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>View all results for "{searchQuery}"</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}