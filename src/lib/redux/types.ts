// Movie/TV Show types
export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
  genre_ids: number[];
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  videos?: {
    results: Video[];
  };
  credits?: {
    cast: Cast[];
  };
}

export interface Genre {
  id: number;
  name: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

// Watchlist types
export interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  status: "plan_to_watch" | "watching" | "completed";
  added_at: string;
}

// Rating types
export interface Rating {
  id: string;
  user_id: string;
  movie_id: number;
  media_type: "movie" | "tv";
  rating: number;
  review?: string;
  title?: string;
  poster_path?: string;
  created_at: string;
  updated_at: string;
}

// Community types
export interface CommunityPost {
  id: string;
  user_id: string;
  movie_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  content: string | null;
  likes: number;
  created_at: string;
  updated_at: string;
  user?: User;
  comments?: Comment[];
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user?: User;
}

// Redux state types
export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface WatchlistState {
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
}

export interface RatingsState {
  items: Rating[];
  loading: boolean;
  error: string | null;
}

export interface CommunityState {
  posts: CommunityPost[];
  loading: boolean;
  error: string | null;
}
