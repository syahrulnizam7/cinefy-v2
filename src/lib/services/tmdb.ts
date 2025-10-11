import axios from "axios";
import { Movie, MovieDetails } from "../redux/types";

const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

const tmdbApi = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

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
};
