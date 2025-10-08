import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  UserState,
  WatchlistState,
  RatingsState,
  CommunityState,
  User,
  WatchlistItem,
  Rating,
  CommunityPost,
} from "../types";

// User Slice
const initialUserState: UserState = {
  user: null,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState: initialUserState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

// Watchlist Slice
const initialWatchlistState: WatchlistState = {
  items: [],
  loading: false,
  error: null,
};

export const watchlistSlice = createSlice({
  name: "watchlist",
  initialState: initialWatchlistState,
  reducers: {
    setWatchlist: (state, action: PayloadAction<WatchlistItem[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addToWatchlist: (state, action: PayloadAction<WatchlistItem>) => {
      state.items.push(action.payload);
    },
    removeFromWatchlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateWatchlistStatus: (
      state,
      action: PayloadAction<{ id: string; status: WatchlistItem["status"] }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        item.status = action.payload.status;
      }
    },
    setWatchlistLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setWatchlistError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// Ratings Slice
const initialRatingsState: RatingsState = {
  items: [],
  loading: false,
  error: null,
};

export const ratingsSlice = createSlice({
  name: "ratings",
  initialState: initialRatingsState,
  reducers: {
    setRatings: (state, action: PayloadAction<Rating[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addRating: (state, action: PayloadAction<Rating>) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.movie_id === action.payload.movie_id &&
          item.media_type === action.payload.media_type
      );
      if (existingIndex >= 0) {
        state.items[existingIndex] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    },
    removeRating: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setRatingsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRatingsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// Community Slice
const initialCommunityState: CommunityState = {
  posts: [],
  loading: false,
  error: null,
};

export const communitySlice = createSlice({
  name: "community",
  initialState: initialCommunityState,
  reducers: {
    setCommunityPosts: (state, action: PayloadAction<CommunityPost[]>) => {
      state.posts = action.payload;
      state.loading = false;
      state.error = null;
    },
    addCommunityPost: (state, action: PayloadAction<CommunityPost>) => {
      state.posts.unshift(action.payload);
    },
    removeCommunityPost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter((post) => post.id !== action.payload);
    },
    updatePostLike: (
      state,
      action: PayloadAction<{ postId: string; isLiked: boolean; likes: number }>
    ) => {
      const post = state.posts.find((p) => p.id === action.payload.postId);
      if (post) {
        post.isLiked = action.payload.isLiked;
        post.likes = action.payload.likes;
      }
    },
    setCommunityLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCommunityError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export const {
  setWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistStatus,
  setWatchlistLoading,
  setWatchlistError,
} = watchlistSlice.actions;
export const {
  setRatings,
  addRating,
  removeRating,
  setRatingsLoading,
  setRatingsError,
} = ratingsSlice.actions;
export const {
  setCommunityPosts,
  addCommunityPost,
  removeCommunityPost,
  updatePostLike,
  setCommunityLoading,
  setCommunityError,
} = communitySlice.actions;
