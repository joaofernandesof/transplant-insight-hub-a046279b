import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, Heart, MessageCircle, Send, Pin, Users, Image as ImageIcon, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function NeoAcademyCommunity() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const { data: posts, isLoading } = useQuery({
    queryKey: ['neoacademy-community'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_community_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userLikes } = useQuery({
    queryKey: ['neoacademy-my-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('neoacademy_post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      return data?.map(l => l.post_id) || [];
    },
    enabled: !!user?.id,
  });

  const { data: allComments } = useQuery({
    queryKey: ['neoacademy-comments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('neoacademy_post_comments')
        .select('*')
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: account } = await supabase
        .from('neoacademy_account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .single();
      if (!account) throw new Error('No account');

      const { error } = await supabase.from('neoacademy_community_posts').insert({
        account_id: account.account_id,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-community'] });
      setNewPost('');
      toast.success('Post publicado!');
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) return;
      const isLiked = userLikes?.includes(postId);
      if (isLiked) {
        await supabase.from('neoacademy_post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('neoacademy_post_likes').insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-community'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-my-likes'] });
    },
  });

  const createComment = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: account } = await supabase
        .from('neoacademy_account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .single();
      if (!account) throw new Error('No account');

      const { error } = await supabase.from('neoacademy_post_comments').insert({
        post_id: postId,
        user_id: user.id,
        account_id: account.account_id,
        content,
      });
      if (error) throw error;

      // Update comments_count
      const post = posts?.find(p => p.id === postId);
      if (post) {
        await supabase.from('neoacademy_community_posts')
          .update({ comments_count: (post.comments_count || 0) + 1 })
          .eq('id', postId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-community'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-comments'] });
      setCommentTexts(prev => ({ ...prev, [variables.postId]: '' }));
      toast.success('Comentário publicado!');
    },
    onError: () => toast.error('Erro ao comentar'),
  });

  const deleteComment = useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase.from('neoacademy_post_comments').delete().eq('id', commentId);
      if (error) throw error;
      
      const post = posts?.find(p => p.id === postId);
      if (post && (post.comments_count || 0) > 0) {
        await supabase.from('neoacademy_community_posts')
          .update({ comments_count: Math.max(0, (post.comments_count || 0) - 1) })
          .eq('id', postId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-community'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-comments'] });
    },
  });

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-violet-400" />
          <h1 className="text-lg font-bold text-white">Comunidade</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* New post */}
        <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Compartilhe algo com a comunidade..."
            className="bg-transparent border-none text-white placeholder:text-zinc-600 resize-none focus-visible:ring-0 min-h-[80px]"
          />
          <div className="flex justify-between items-center mt-3">
            <button className="p-2 rounded-lg hover:bg-white/5 text-zinc-500">
              <ImageIcon className="h-5 w-5" />
            </button>
            <Button
              size="sm"
              disabled={!newPost.trim() || createPost.isPending}
              onClick={() => createPost.mutate(newPost.trim())}
              className="bg-violet-500 hover:bg-violet-600 text-white gap-2"
            >
              <Send className="h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>

        {/* Posts */}
        {posts?.map((post: any) => {
          const isLiked = userLikes?.includes(post.id);
          const postComments = allComments?.filter(c => c.post_id === post.id) || [];
          const isExpanded = expandedComments.has(post.id);
          const commentText = commentTexts[post.id] || '';

          return (
            <div
              key={post.id}
              className="p-4 rounded-xl bg-[#14141f] border border-white/5 space-y-3"
            >
              {post.is_pinned && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                  <Pin className="h-3 w-3" /> Fixado
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                  {post.user_id?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Aluno</p>
                  <p className="text-[10px] text-zinc-600">
                    {post.created_at
                      ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })
                      : ''}
                  </p>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {post.image_url && (
                <img src={post.image_url} alt="" className="rounded-lg max-h-64 object-cover w-full" />
              )}

              <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                <button
                  onClick={() => toggleLike.mutate(post.id)}
                  className={`flex items-center gap-1.5 text-xs transition ${
                    isLiked ? 'text-rose-400' : 'text-zinc-500 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-400' : ''}`} />
                  {post.likes_count || 0}
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-400 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.comments_count || 0}
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>

              {/* Comments Section */}
              {isExpanded && (
                <div className="space-y-3 pt-2">
                  {/* Existing comments */}
                  {postComments.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-white/5">
                      {postComments.map((comment: any) => (
                        <div key={comment.id} className="flex items-start gap-2 group/comment">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500/60 to-fuchsia-500/60 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">
                            {comment.user_id?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-300">
                                {comment.user_id === user?.id ? 'Você' : 'Aluno'}
                              </span>
                              <span className="text-[10px] text-zinc-600">
                                {comment.created_at
                                  ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })
                                  : ''}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">{comment.content}</p>
                          </div>
                          {comment.user_id === user?.id && (
                            <button
                              onClick={() => deleteComment.mutate({ commentId: comment.id, postId: post.id })}
                              className="opacity-0 group-hover/comment:opacity-100 p-1 rounded text-zinc-600 hover:text-rose-400 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New comment input */}
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {user?.id?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <input
                      value={commentText}
                      onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                          e.preventDefault();
                          createComment.mutate({ postId: post.id, content: commentText.trim() });
                        }
                      }}
                      placeholder="Escreva um comentário..."
                      className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                      onClick={() => {
                        if (commentText.trim()) {
                          createComment.mutate({ postId: post.id, content: commentText.trim() });
                        }
                      }}
                      disabled={!commentText.trim() || createComment.isPending}
                      className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
