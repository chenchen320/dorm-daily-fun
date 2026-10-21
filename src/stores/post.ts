import { defineStore } from 'pinia';
import { ref } from 'vue';
import { storageAdapter } from '../api';
import type { Post, PostTag, Comment } from '../types';

export const POST_TAGS: (PostTag | '全部')[] = [
  '全部',
  '宿舍搞笑日常',
  '黑话梗合集',
  '来吐槽吧',
  '梦话暴论',
  '外卖奇遇',
  '打呼连环',
  '破防时刻',
];

export const usePostStore = defineStore('post', () => {
  const posts = ref<Post[]>([]);
  const activeTag = ref<string>('全部');
  const loading = ref<boolean>(false);

  // 加载指定寝室的日常列表
  async function loadPosts(dormId: string) {
    loading.value = true;
    try {
      posts.value = await storageAdapter.getPosts(dormId, activeTag.value);
    } finally {
      loading.value = false;
    }
  }

  // 切换筛选标签
  async function switchTag(tag: string, dormId: string) {
    activeTag.value = tag;
    await loadPosts(dormId);
  }

  // 发布新的沙雕事件
  async function publishPost(payload: {
    dormId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    targetGuyRoles: string[];
    content: string;
    images?: string[];
    funnyLevel?: number;
    tag: PostTag;
  }) {
    if (!payload.content || !payload.content.trim()) {
      throw new Error('事件内容不能为空，快把室友的离谱事写下来！');
    }

    const images = payload.images || [];
    if (images.length > 9) {
      throw new Error('现场配图最多只能上传 9 张');
    }

    // 核心特性：[来吐槽吧] 触发匿名树洞模式，彻底抹去个人身份标识
    const isAnonymous = payload.tag === '来吐槽吧';
    const authorName = isAnonymous ? '神秘室友' : payload.authorName;
    const authorAvatar = isAnonymous ? '/static/anonymous.png' : (payload.authorAvatar || '/static/logo.png');

    const newPost: Post = {
      id: 'post_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      dormId: payload.dormId,
      authorId: payload.authorId,
      authorName,
      authorAvatar,
      isAnonymous,
      targetGuyRoles: payload.targetGuyRoles || [],
      content: payload.content.trim(),
      images,
      funnyLevel: payload.funnyLevel || 5,
      tag: payload.tag,
      reactions: { '🤣': 0, '🤯': 0, '📁': 0, '🚪': 0 },
      reactedUsers: {},
      commentCount: 0,
      createdAt: Date.now(),
    };

    const saved = await storageAdapter.createPost(newPost);
    posts.value.unshift(saved);
    return saved;
  }

  // 专属表态 Reaction (乐观更新 + 异步持久化)
  async function toggleReaction(postId: string, emoji: string, userOpenId: string, dormId: string) {
    const post = posts.value.find((p) => p.id === postId);
    if (!post) return;

    if (!post.reactions) post.reactions = {};
    if (!post.reactedUsers) post.reactedUsers = {};

    const users = post.reactedUsers[emoji] || [];
    const hasReacted = users.includes(userOpenId);

    // 本地乐观更新 (毫秒响应)
    if (hasReacted) {
      post.reactions[emoji] = Math.max(0, (post.reactions[emoji] || 1) - 1);
      post.reactedUsers[emoji] = users.filter((u) => u !== userOpenId);
    } else {
      post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
      post.reactedUsers[emoji] = [...users, userOpenId];
    }

    // 异步同步到底层
    await storageAdapter.addReaction(dormId, postId, emoji, userOpenId);
  }

  // 获取评论
  async function fetchComments(postId: string, dormId: string): Promise<Comment[]> {
    return await storageAdapter.getComments(dormId, postId);
  }

  // 提交评论
  async function submitComment(payload: {
    postId: string;
    dormId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    isAnonymous: boolean;
    content: string;
  }) {
    if (!payload.content.trim()) throw new Error('评论内容不能为空');

    const isAnon = payload.isAnonymous;
    const authorName = isAnon ? '神秘室友' : payload.authorName;
    const authorAvatar = isAnon ? '/static/anonymous.png' : (payload.authorAvatar || '/static/logo.png');

    const newComment: Comment = {
      id: 'comm_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      postId: payload.postId,
      dormId: payload.dormId,
      authorId: payload.authorId,
      authorName,
      authorAvatar,
      isAnonymous: isAnon,
      content: payload.content.trim(),
      createdAt: Date.now(),
    };

    const saved = await storageAdapter.addComment(newComment);

    // 乐观增加帖子的 commentCount
    const post = posts.value.find((p) => p.id === payload.postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
    }

    return saved;
  }

  // 删除某条记录
  async function deletePost(dormId: string, postId: string) {
    await storageAdapter.deletePost(dormId, postId);
    posts.value = posts.value.filter((p) => p.id !== postId);
  }

  return {
    posts,
    activeTag,
    loading,
    loadPosts,
    switchTag,
    publishPost,
    toggleReaction,
    fetchComments,
    submitComment,
    deletePost,
  };
});
