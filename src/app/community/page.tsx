"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "@/lib/services/supabase";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Trash2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CommunityPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["community-posts", session?.user?.id],
    queryFn: () => supabaseService.getCommunityPosts(session?.user?.id),
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", expandedPost],
    queryFn: () => supabaseService.getComments(expandedPost!),
    enabled: !!expandedPost,
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId }: { postId: string }) =>
      supabaseService.toggleLike(session!.user!.id, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => supabaseService.deleteCommunityPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Post deleted");
    },
  });

  const commentMutation = useMutation({
    mutationFn: (comment: {
      user_id: string;
      post_id: string;
      content: string;
    }) => supabaseService.addComment(comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setCommentText("");
      toast.success("Comment added");
    },
  });

  const handleLike = (postId: string) => {
    if (!session) {
      toast.error("Please sign in to like posts");
      router.push("/auth/signin");
      return;
    }
    likeMutation.mutate({ postId });
  };

  const handleDelete = (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(postId);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-700/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700/50 rounded w-1/4" />
                  <div className="h-3 bg-gray-700/50 rounded w-1/6" />
                </div>
              </div>
              <div className="h-20 bg-gray-700/50 rounded mb-4" />
              <div className="flex space-x-4">
                <div className="h-8 w-16 bg-gray-700/50 rounded" />
                <div className="h-8 w-16 bg-gray-700/50 rounded" />
              </div>
            </div>
          ))}
        </div>
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
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
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
                <div className="flex items-center space-x-3">
                  {post.user?.image ? (
                    <Image
                      width={40}
                      height={40}
                      src={post.user.image}
                      alt={post.user.name || "User"}
                      className="w-10 h-10 rounded-full border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {post.user?.name || "Anonymous"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {session?.user?.id === post.user_id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
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
              <div className="flex items-center space-x-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    post.isLiked ? "bg-red-500/20 text-red-400" : "glass-hover"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${post.isLiked ? "fill-red-400" : ""}`}
                  />
                  <span>{post.likes}</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg glass-hover"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Comment</span>
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
                        className="flex-1 glass rounded-lg px-4 py-2 outline-none"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleComment(post.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {comments?.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        {comment.user?.image ? (
                          <Image
                            width={32}
                            height={32}
                            src={comment.user.image}
                            alt={comment.user.name || "User"}
                            className="w-8 h-8 rounded-full border border-white/20"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
                        )}
                        <div className="flex-1 glass rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm">
                              {comment.user?.name || "Anonymous"}
                            </p>
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
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
