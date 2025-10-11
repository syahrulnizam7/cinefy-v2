"use client";

import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e27]">
      <div className="text-center">
        {/* Animated Logo/Brand */}
        <motion.div
          className="flex items-center justify-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2596be] to-[#1b5186] mr-3"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.h1
            className="text-2xl font-bold bg-gradient-to-r from-[#2596be] to-[#1b5186] bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Cinefy
          </motion.h1>
        </motion.div>

        {/* Main Loading Animation */}
        <div className="relative">
          {/* Outer Ring */}
          <motion.div
            className="w-20 h-20 border-4 border-[#2596be]/30 rounded-full absolute inset-0"
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />

          {/* Middle Ring */}
          <motion.div
            className="w-16 h-16 border-4 border-[#1b5186]/50 rounded-full absolute inset-0 m-auto"
            animate={{
              rotate: -360,
              scale: [1.1, 0.9, 1.1],
            }}
            transition={{
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />

          {/* Inner Core */}
          <motion.div
            className="w-8 h-8 bg-gradient-to-r from-[#2596be] to-[#1b5186] rounded-full absolute inset-0 m-auto"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Pulsing Dots */}
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="absolute w-2 h-2 bg-[#2596be] rounded-full"
              style={{
                top: "50%",
                left: "50%",
                x: -4,
                y: -4,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                x: [
                  -4,
                  Math.cos((index * 120 * Math.PI) / 180) * 30 - 4,
                  -4,
                ],
                y: [
                  -4,
                  Math.sin((index * 120 * Math.PI) / 180) * 30 - 4,
                  -4,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Loading Text */}
        <motion.p
          className="mt-12 text-gray-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading your experience
        </motion.p>

        {/* Animated Dots */}
        <motion.div className="flex justify-center space-x-1 mt-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-1 h-1 bg-[#2596be] rounded-full"
              animate={{
                scale: [0.5, 1, 0.5],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="mt-6 w-48 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 192 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-[#2596be] to-[#1b5186]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Loader untuk halaman spesifik (lebih kecil)
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e27]">
      <div className="text-center">
        <motion.div
          className="relative w-16 h-16 mx-auto mb-4"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="absolute inset-0 border-4 border-[#2596be]/30 rounded-full" />
          <div className="absolute inset-2 border-4 border-[#1b5186]/50 rounded-full" />
          <motion.div
            className="absolute inset-4 bg-gradient-to-r from-[#2596be] to-[#1b5186] rounded-full"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
        <motion.p
          className="text-gray-400"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          Loading...
        </motion.p>
      </div>
    </div>
  );
}