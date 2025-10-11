/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { tmdbService } from "@/lib/services/tmdb";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, MapPin, Star, Film } from "lucide-react";
import { PageLoader } from "@/components/Loader";
import { useState } from "react";

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const id = parseInt(params.id as string);

  const { data: person, isLoading } = useQuery({
    queryKey: ["person", id],
    queryFn: () => tmdbService.getPersonDetails(id),
  });

  const { data: personCredits } = useQuery({
    queryKey: ["person-credits", id],
    queryFn: () => tmdbService.getPersonCredits(id),
    enabled: !!person,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e27]">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2 text-white">Person not found</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const knownFor = personCredits?.cast
    ?.filter(credit => credit.poster_path) 
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 12) || [];

  // Hitung total credits
  const totalCredits = personCredits?.cast?.length || 0;

  
  const handleCreditClick = (credit: any) => {
    router.push(`/${credit.media_type}/${credit.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Hero Section */}
      <div className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          {person.profile_path && !imageError ? (
            <Image
              src={`https://image.tmdb.org/t/p/original${person.profile_path}`}
              alt={person.name}
              fill
              className="w-full h-full object-cover"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] via-[#0a0e27]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e27] via-transparent to-transparent" />
        </div>

     

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-8 md:pb-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full items-center md:items-end">
            {/* Profile Photo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0 w-40 sm:w-48 md:w-56 lg:w-64"
            >
              <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-gray-800">
                {person.profile_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                    alt={person.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <Film className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1 space-y-4 text-center md:text-left"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                {person.name}
              </h1>

              {/* Personal Info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-300">
                {person.birthday && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Born {new Date(person.birthday).toLocaleDateString()}
                      {person.deathday && ` - Died ${new Date(person.deathday).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{person.place_of_birth}</span>
                  </div>
                )}
              </div>

              {/* Department */}
              {person.known_for_department && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm">
                    {person.known_for_department}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">
                    {person.popularity?.toFixed(0) || 0}
                  </span>
                  <span className="text-gray-400">Popularity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Film className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold">{totalCredits}</span>
                  <span className="text-gray-400">Credits</span>
                </div>
              </div>

              {/* Biography */}
              {person.biography && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="max-w-3xl"
                >
                  <h3 className="text-xl font-bold mb-3 text-white">Biography</h3>
                  <div className="relative">
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base line-clamp-4">
                      {person.biography}
                    </p>
                    {person.biography.length > 300 && (
                      <button
                        onClick={(e) => {
                          const paragraph = e.currentTarget.previousElementSibling as HTMLElement;
                          if (paragraph) {
                            paragraph.classList.toggle('line-clamp-4');
                            e.currentTarget.textContent = 
                              paragraph.classList.contains('line-clamp-4') ? 'Read More' : 'Read Less';
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-2 transition-colors"
                      >
                        Read More
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Known For Section */}
      {knownFor.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white">Known For</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {knownFor.map((credit, index) => (
              <motion.div
                key={`${credit.id}-${credit.media_type}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => handleCreditClick(credit)}
              >
                <div className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-all duration-300 group-hover:scale-105">
                  <div className="relative aspect-[2/3]">
                    <Image
                      src={
                        credit.poster_path
                          ? `https://image.tmdb.org/t/p/w300${credit.poster_path}`
                          : "/no-img.png"
                      }
                      alt={credit.title || credit.name || 'Unknown'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm text-white line-clamp-2 mb-1">
                      {credit.title || credit.name}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {credit.character && `as ${credit.character}`}
                    </p>
                    {(credit.release_date || credit.first_air_date) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(credit.release_date || credit.first_air_date!).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}