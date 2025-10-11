import axios from "axios";
import { MovieDetails } from "../redux/types";

const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const tmdbApi = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

// Tambahkan interface untuk Person
export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
}

export interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  character: string;
  poster_path: string | null;
  media_type: string;
  release_date?: string;
  first_air_date?: string;
  popularity: number;
}

export interface PersonCreditsResponse {
  cast: PersonCredit[];
  crew: PersonCredit[];
}

export const tmdbService = {
  // Get trending movies/tv
  getTrending: async (
    mediaType: "movie" | "tv" | "all" = "all",
    timeWindow: "day" | "week" = "week"
  ) => {
    const { data } = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
    return data;
  },

  // Search movies/tv
  search: async (query: string, page: number = 1) => {
    const { data } = await tmdbApi.get("/search/multi", {
      params: { query, page },
    });
    return data;
  },

  // Get movie details
  getMovieDetails: async (id: number): Promise<MovieDetails> => {
    const { data } = await tmdbApi.get(`/movie/${id}`, {
      params: {
        append_to_response: "videos,credits",
      },
    });
    return { ...data, media_type: "movie" };
  },

  // Get TV show details
  getTVDetails: async (id: number): Promise<MovieDetails> => {
    const { data } = await tmdbApi.get(`/tv/${id}`, {
      params: {
        append_to_response: "videos,credits",
      },
    });
    return { ...data, media_type: "tv" };
  },

  // Get popular movies
  getPopularMovies: async (page: number = 1) => {
    const { data } = await tmdbApi.get("/movie/popular", { params: { page } });
    return data;
  },

  // Get popular TV shows
  getPopularTV: async (page: number = 1) => {
    const { data } = await tmdbApi.get("/tv/popular", { params: { page } });
    return data;
  },

  // Get top rated movies
  getTopRatedMovies: async (page: number = 1) => {
    const { data } = await tmdbApi.get("/movie/top_rated", {
      params: { page },
    });
    return data;
  },

  // Get top rated TV shows
  getTopRatedTV: async (page: number = 1) => {
    const { data } = await tmdbApi.get("/tv/top_rated", { params: { page } });
    return data;
  },

  // Get movies by multiple genre
  getMoviesByGenre: async (genreIds: number | number[], page: number = 1) => {
    const { data } = await tmdbApi.get("/discover/movie", {
      params: { 
        with_genres: Array.isArray(genreIds) ? genreIds.join(',') : genreIds, 
        page,
        sort_by: 'popularity.desc'
      },
    });
    return data;
  },

  // Get TV shows by multiple genres
  getTVByGenre: async (genreIds: number | number[], page: number = 1) => {
    const { data } = await tmdbApi.get("/discover/tv", {
      params: { 
        with_genres: Array.isArray(genreIds) ? genreIds.join(',') : genreIds, 
        page,
        sort_by: 'popularity.desc'
      },
    });
    return data;
  },

  // Get movie genres
  getMovieGenres: async () => {
    const { data } = await tmdbApi.get("/genre/movie/list");
    return data.genres;
  },

  // Get TV genres
  getTVGenres: async () => {
    const { data } = await tmdbApi.get("/genre/tv/list");
    return data.genres;
  },

  // Get similar movies/tv
  getSimilar: async (
    mediaType: "movie" | "tv",
    id: number,
    page: number = 1
  ) => {
    const { data } = await tmdbApi.get(`/${mediaType}/${id}/similar`, {
      params: { page },
    });
    return data;
  },

  // Get recommendations
  getRecommendations: async (
    mediaType: "movie" | "tv",
    id: number,
    page: number = 1
  ) => {
    const { data } = await tmdbApi.get(`/${mediaType}/${id}/recommendations`, {
      params: { page },
    });
    return data;
  },

  // Get person details
  getPersonDetails: async (id: number): Promise<PersonDetails> => {
    const { data } = await tmdbApi.get(`/person/${id}`);
    return data;
  },

  // Get person credits (movies and TV shows they've been in)
  getPersonCredits: async (id: number): Promise<PersonCreditsResponse> => {
    const { data } = await tmdbApi.get(`/person/${id}/combined_credits`);
    return data;
  },

  // Get person movie credits only
  getPersonMovieCredits: async (id: number) => {
    const { data } = await tmdbApi.get(`/person/${id}/movie_credits`);
    return data;
  },

  // Get person TV credits only
  getPersonTVCredits: async (id: number) => {
    const { data } = await tmdbApi.get(`/person/${id}/tv_credits`);
    return data;
  },
};