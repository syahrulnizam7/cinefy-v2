"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/cinefy-v2-logo-2.png"
              alt="logo"
              width={150}
              height={50}
              className="w-[80px] sm:w-[100px] md:w-[120px] h-auto"
            />
          </div>

          <h1 className="text-3xl font-bold mb-2 gradient-text text-white">
            Welcome to <span className="text-[#39b5f0]">Cinefy</span>
          </h1>
          <p className="text-gray-400 mb-8">
            Sign in to track your favorite movies and TV shows
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="cursor-pointer w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-gray-800 font-semibold 
             shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md 
             transition-all duration-300 border border-gray-200 hover:border-gray-300 active:scale-[0.98]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-900">Continue with Google</span>
          </button>

          <div className="mt-8 pt-8 border-t border-white/10 space-y-3 text-left">
            <p className="text-sm text-gray-400">With Cinefy you can:</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Create and manage your watchlist</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Rate and review movies & TV shows</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <span>Share recommendations with the community</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
