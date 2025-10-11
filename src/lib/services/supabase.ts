import { createClient } from "@supabase/supabase-js";
import { WatchlistItem, Rating, CommunityPost } from "../redux/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseService = {
  // ===== WATCHLIST =====

  // Get user's watchlist
  getWatchlist: async (userId: string): Promise<WatchlistItem[]> => {
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Add to watchlist
  addToWatchlist: async (
    item: Omit<WatchlistItem, "id" | "added_at">
  ): Promise<WatchlistItem> => {
    const { data, error } = await supabase
      .from("watchlist")
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove from watchlist
  // Fungsi untuk mendapatkan detail item watchlist
getWatchlistItem: async (userId: string, movieId: number, mediaType: string) => {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .eq('movie_id', movieId)
    .eq('media_type', mediaType)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting watchlist item:', error);
    return null;
  }

  return data;
},

// Fungsi untuk menghapus dari watchlist
removeFromWatchlist: async (watchlistId: string) => {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('id', watchlistId);

  if (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }

  return { success: true };
},

  // Update watchlist status
  updateWatchlistStatus: async (
    id: string,
    status: WatchlistItem["status"]
  ): Promise<WatchlistItem> => {
    const { data, error } = await supabase
      .from("watchlist")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check if item is in watchlist
  isInWatchlist: async (
    userId: string,
    movieId: number,
    mediaType: "movie" | "tv"
  ): Promise<boolean> => {
    const { data } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", userId)
      .eq("movie_id", movieId)
      .eq("media_type", mediaType)
      .single();

    return !!data;
  },

  // ===== RATINGS =====

  // Get user's ratings
  getRatings: async (userId: string): Promise<Rating[]> => {
    const { data, error } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Add or update rating
  upsertRating: async (
    rating: Omit<Rating, "id" | "created_at" | "updated_at">
  ): Promise<Rating> => {
    const { data, error } = await supabase
      .from("ratings")
      .upsert(rating, { onConflict: "user_id,movie_id,media_type" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete rating
  deleteRating: async (id: string): Promise<void> => {
    const { error } = await supabase.from("ratings").delete().eq("id", id);

    if (error) throw error;
  },

  // Get rating for specific movie
  getRating: async (
    userId: string,
    movieId: number,
    mediaType: "movie" | "tv"
  ): Promise<Rating | null> => {
    const { data, error } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", userId)
      .eq("movie_id", movieId)
      .eq("media_type", mediaType)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  

  // Get average rating for a movie
  getAverageRating: async (
    movieId: number,
    mediaType: "movie" | "tv"
  ): Promise<number> => {
    const { data, error } = await supabase
      .from("ratings")
      .select("rating")
      .eq("movie_id", movieId)
      .eq("media_type", mediaType);

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, curr) => acc + Number(curr.rating), 0);
    return sum / data.length;
  },

  // ===== COMMUNITY =====

  // Get all community posts
  getCommunityPosts: async (userId?: string): Promise<CommunityPost[]> => {
    // Dapatkan semua posts dengan comment count
    const query = supabase
      .from("community_posts")
      .select(
        `
      *,
      user:users(id, name, email, image),
      comments:comments(count)
      `
      )
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // Process data to include comment_count
    const processedData =
      data?.map((post) => ({
        ...post,
        comment_count: post.comments?.[0]?.count || 0,
      })) || [];

    // Jika ada userId, dapatkan SEMUA likes user sekaligus
    if (userId && processedData.length > 0) {
      // Dapatkan semua post IDs
      const postIds = processedData.map((post) => post.id);

      // Single query untuk mendapatkan semua likes user
      const { data: userLikes, error: likesError } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      if (likesError) throw likesError;

      // Buat Set untuk lookup yang cepat
      const likedPostIds = new Set(
        userLikes?.map((like) => like.post_id) || []
      );

      // Map isLiked ke setiap post
      const postsWithLikes = processedData.map((post) => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
      }));

      return postsWithLikes;
    }

    return processedData;
  },
  // Create community post
  createCommunityPost: async (
    post: Omit<CommunityPost, "id" | "created_at" | "updated_at" | "likes">
  ): Promise<CommunityPost> => {
    const { data, error } = await supabase
      .from("community_posts")
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete community post
  deleteCommunityPost: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Like/unlike post
  toggleLike: async (
    userId: string,
    postId: string
  ): Promise<{ isLiked: boolean; likes: number }> => {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase.from("post_likes").delete().eq("id", existingLike.id);

      await supabase.rpc("decrement_likes", { post_id: postId });

      const { data: post } = await supabase
        .from("community_posts")
        .select("likes")
        .eq("id", postId)
        .single();

      return { isLiked: false, likes: post?.likes || 0 };
    } else {
      // Like
      await supabase
        .from("post_likes")
        .insert({ user_id: userId, post_id: postId });

      await supabase.rpc("increment_likes", { post_id: postId });

      const { data: post } = await supabase
        .from("community_posts")
        .select("likes")
        .eq("id", postId)
        .single();

      return { isLiked: true, likes: post?.likes || 0 };
    }
  },

  // Get comments for a post
  getComments: async (postId: string) => {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:users(id, name, email, image)
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Add comment
  addComment: async (comment: {
    user_id: string;
    post_id: string;
    content: string;
  }) => {
    const { data, error } = await supabase
      .from("comments")
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
