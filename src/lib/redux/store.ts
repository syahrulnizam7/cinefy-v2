import { configureStore } from "@reduxjs/toolkit";
import {
  userSlice,
  watchlistSlice,
  ratingsSlice,
  communitySlice,
} from "./slices";

export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    watchlist: watchlistSlice.reducer,
    ratings: ratingsSlice.reducer,
    community: communitySlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
