/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "@/lib/services/supabase";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Trash2, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Loader from "@/components/Loader";

export default function CommunityPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  // Single query untuk semua data
  const { data: posts, isLoading } = useQuery({
    queryKey: ["community-posts", session?.user?.id],
    queryFn: () => supabaseService.getCommunityPosts(session?.user?.id),
    staleTime: 1000 * 60 * 5, // Cache 5 menit
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", expandedPost],
    queryFn: () => supabaseService.getComments(expandedPost!),
    enabled: !!expandedPost,
  });

  // Optimistic Like Mutation dengan update manual
  const likeMutation = useMutation({
    mutationFn: async ({
      postId,
    }: {
      postId: string;
      isLiked: boolean;
    }) => {
      return await supabaseService.toggleLike(session!.user!.id, postId);
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["community-posts"] });

      const previousPosts = queryClient.getQueryData([
        "community-posts",
        session?.user?.id,
      ]);

      // Optimistic update
      queryClient.setQueryData(
        ["community-posts", session?.user?.id],
        (old: any) => {
          if (!old) return old;

          return old.map((post: any) => {
            if (post.id === postId) {
              return {
                ...post,
                likes: isLiked ? post.likes - 1 : post.likes + 1,
                isLiked: !isLiked,
              };
            }
            return post;
          });
        }
      );

      return { previousPosts };
    },
    onError: (error, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          ["community-posts", session?.user?.id],
          context.previousPosts
        );
      }
      toast.error("Failed to like post");
    },
    // Tidak perlu invalidate queries karena sudah optimistic update
  });

  // Sisanya tetap sama...
  const deleteMutation = useMutation({
    mutationFn: (postId: string) => supabaseService.deleteCommunityPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      setDeleteModal(null);
      toast.success("Post deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const commentMutation = useMutation({
    mutationFn: (comment: {
      user_id: string;
      post_id: string;
      content: string;
    }) => supabaseService.addComment(comment),
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({
        queryKey: ["comments", newComment.post_id],
      });

      const previousComments = queryClient.getQueryData([
        "comments",
        newComment.post_id,
      ]);

      queryClient.setQueryData(["comments", newComment.post_id], (old: any) => {
        const tempComment = {
          ...newComment,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          user: {
            id: session!.user!.id,
            name: session!.user!.name,
            email: session!.user!.email,
            image: session!.user!.image,
          },
        };
        return [...(old || []), tempComment];
      });

      return { previousComments, postId: newComment.post_id };
    },
    onSuccess: (newComment, variables, context) => {
      queryClient.setQueryData(["comments", context?.postId], (old: any) => {
        if (!old) return [newComment];
        const filtered = old.filter(
          (comment: any) => !comment.id.startsWith("temp-")
        );
        return [...filtered, newComment];
      });

      setCommentText("");
      toast.success("Comment added");
    },
    onError: (error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", context.postId],
          context.previousComments
        );
      }
      toast.error("Failed to add comment");
    },
  });

  const handleLike = (postId: string, isCurrentlyLiked: boolean) => {
    if (!session) {
      toast.error("Please sign in to like posts");
      router.push("/auth/signin");
      return;
    }
    likeMutation.mutate({ postId, isLiked: isCurrentlyLiked });
  };

  const handleDelete = (postId: string) => {
    deleteMutation.mutate(postId);
  };

  const handleComment = (postId: string) => {
    if (!session) {
      toast.error("Please sign in to comment");
      router.push("/auth/signin");
      return;
    }

    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    commentMutation.mutate({
      user_id: session.user.id,
      post_id: postId,
      content: commentText,
    });
  };

  const toggleComments = (postId: string) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  const getCommentCount = (postId: string) => {
    if (expandedPost === postId && comments) {
      return comments.length;
    }

    const post = posts?.find((p) => p.id === postId);
    return post?.comment_count || 0;
  };

  const getPostToDelete = () => {
    return posts?.find((post) => post.id === deleteModal);
  };

  // Render JSX tetap sama...
  if (isLoading) {
    return (
      <div className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
          Community
        </h1>
        <p className="text-gray-400">See what others are watching</p>
      </motion.div>

      {/* Posts */}
      <div className="space-y-4">
        {posts?.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No posts yet</p>
            <Link
              href="/explore"
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-[#2596be] to-[#1b5186] hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Explore Movies & TV Shows
            </Link>
          </div>
        ) : (
          posts?.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-6"
            >
              {/* User Info */}
              <div className="flex items-start justify-between mb-4">
                <Link
                  href={`/profile/${post.user_id}`}
                  className="flex items-center space-x-3 group cursor-pointer"
                >
                  {post.user?.image ? (
                    <div className="relative">
                      <Image
                        width={40}
                        height={40}
                        src={post.user.image}
                        alt={post.user.name || "User"}
                        className="w-10 h-10 rounded-full border-2 border-white/20 group-hover:border-blue-400 transition-all duration-200"
                      />
                      <div className="absolute inset-0 rounded-full bg-blue-400/0 group-hover:bg-blue-400/20 transition-all duration-200" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-200" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold group-hover:text-blue-400 transition-colors duration-200">
                      {post.user?.name || "Anonymous"}
                    </p>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                {session?.user?.id === post.user_id && (
                  <button
                    onClick={() => setDeleteModal(post.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors duration-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Post Content */}
              <Link href={`/${post.media_type}/${post.movie_id}`}>
                <div className="flex gap-4 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                  {post.poster_path && (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${post.poster_path}`}
                      alt={post.title}
                      width={96}
                      height={144}
                      className="w-24 h-36 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                    <p className="text-gray-300">{post.content}</p>
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center space-x-6 pt-4 border-t border-white/10">
                {/* Like Button */}
                <button
                  onClick={() => handleLike(post.id, !!post.isLiked)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    post.isLiked
                      ? "bg-red-500/20 text-red-400"
                      : "glass-hover text-gray-400 hover:text-red-400"
                  }`}
                >
                  <motion.div
                    whileTap={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Heart
                      className={`w-5 h-5 transition-all duration-200 ${
                        post.isLiked ? "fill-red-400" : ""
                      }`}
                    />
                  </motion.div>
                  <span className="font-medium">{post.likes}</span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg glass-hover text-gray-400 hover:text-blue-400 transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {getCommentCount(post.id)}
                  </span>
                </button>
              </div>

              {/* Comments Section */}
              {expandedPost === post.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10 space-y-3"
                >
                  {/* Comment Input */}
                  {session && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 glass rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleComment(post.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={commentMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {comments?.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex space-x-3"
                      >
                        {/* Comment User - Clickable */}
                        <Link
                          href={`/profile/${comment.user_id}`}
                          className="flex-shrink-0 group"
                        >
                          {comment.user?.image ? (
                            <div className="relative">
                              <Image
                                width={32}
                                height={32}
                                src={comment.user.image}
                                alt={comment.user.name || "User"}
                                className="w-8 h-8 rounded-full border border-white/20 group-hover:border-blue-400 transition-all duration-200"
                              />
                              <div className="absolute inset-0 rounded-full bg-blue-400/0 group-hover:bg-blue-400/20 transition-all duration-200" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-200" />
                          )}
                        </Link>
                        <div className="flex-1 glass rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <Link
                              href={`/profile/${comment.user_id}`}
                              className="font-semibold text-sm hover:text-blue-400 transition-colors duration-200"
                            >
                              {comment.user?.name || "Anonymous"}
                            </Link>
                            <p className="text-xs text-gray-400">
                              {new Date(
                                comment.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteModal(null)}
          >
            <motion.div
              initial={{
                backdropFilter: "blur(0px)",
                backgroundColor: "rgba(0,0,0,0)",
              }}
              animate={{
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(0,0,0,0.7)",
              }}
              exit={{
                backdropFilter: "blur(0px)",
                backgroundColor: "rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.4,
              }}
              className="relative glass rounded-xl p-6 max-w-md w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Delete Post</h3>
                <button
                  onClick={() => setDeleteModal(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const postToDelete = getPostToDelete();
                return postToDelete ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white/5"
                  >
                    {postToDelete.poster_path && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${postToDelete.poster_path}`}
                        alt={postToDelete.title}
                        width={48}
                        height={72}
                        className="w-12 h-18 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm line-clamp-1">
                        {postToDelete.title}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {postToDelete.content}
                      </p>
                    </div>
                  </motion.div>
                ) : null;
              })()}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-gray-300 mb-6 text-sm"
              >
                Are you sure you want to delete this post? This action cannot be
                undone.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex space-x-3"
              >
                <button
                  onClick={() => handleDelete(deleteModal)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 transform hover:scale-105"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Post"}
                </button>
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 glass hover:bg-white/10 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
