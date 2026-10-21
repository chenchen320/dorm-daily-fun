import type { IStorageAdapter } from './IStorageAdapter';
import type { Room, Member, Post, Comment, SlangQuote } from '../types';

// 跨环境存储桥接 (Uni-app runtime 或 Node/Vitest runtime)
const getStorage = (key: string): string | null => {
  try {
    if (typeof uni !== 'undefined' && uni.getStorageSync) {
      const val = uni.getStorageSync(key);
      return val ? (typeof val === 'string' ? val : JSON.stringify(val)) : null;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    // fallback
  }
  return memoryStorage.get(key) || null;
};

const setStorage = (key: string, value: string): void => {
  try {
    if (typeof uni !== 'undefined' && uni.setStorageSync) {
      uni.setStorageSync(key, value);
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    // fallback
  }
  memoryStorage.set(key, value);
};

const memoryStorage = new Map<string, string>();

const STORAGE_KEYS = {
  ROOMS: 'dorm_mock_rooms_v1',
  MEMBERS: 'dorm_mock_members_v1',
  POSTS: 'dorm_mock_posts_v1',
  COMMENTS: 'dorm_mock_comments_v1',
  SLANGS: 'dorm_mock_slangs_v1',
  SESSION: 'dorm_mock_session_v1',
};

// 默认内置的 4#304 寝室种子数据
const DEFAULT_ROOM: Room = {
  id: 'dorm_4_304',
  roomCode: '4#304',
  secretPIN: '304888',
  maxCapacity: 6,
  ownerOpenId: 'openid_owner_304',
  notice: '4#304沙雕大本营：严禁熄灯后大喊大叫，除非有人选了C！',
  createdAt: 1729500000000,
};

const DEFAULT_POSTS: Post[] = [
  {
    id: 'post_seed_1',
    dormId: 'dorm_4_304',
    authorId: 'mem_seed_1',
    authorName: '寝室长',
    authorAvatar: '/static/logo.png',
    isAnonymous: false,
    targetGuyRoles: ['王晨'],
    content: '老王昨天半夜突然从床上笔直坐起来大喊：“这道题必须选C，不选C我倒立洗头！”，喊完倒头秒打呼噜，全寝室直接笑醒！',
    images: [],
    funnyLevel: 5,
    tag: '梦话暴论',
    reactions: { '🤣': 5, '🤯': 3, '📁': 2 },
    reactedUsers: {},
    commentCount: 2,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: 'post_seed_2',
    dormId: 'dorm_4_304',
    authorId: 'mem_seed_2',
    authorName: '小肥肥',
    authorAvatar: '/static/logo.png',
    isAnonymous: false,
    targetGuyRoles: ['皇上'],
    content: '皇上白天发誓今晚要健康生活、戒断夜宵。结果半夜11点半外卖员敲门，一份炸鸡豪华桶配超大杯全糖奶茶赫然在案！',
    images: [],
    funnyLevel: 4,
    tag: '宿舍搞笑日常',
    reactions: { '🤣': 6, '📁': 4, '🚪': 1 },
    reactedUsers: {},
    commentCount: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
  },
];

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'comm_seed_1',
    postId: 'post_seed_1',
    dormId: 'dorm_4_304',
    authorId: 'mem_seed_2',
    authorName: '小肥肥',
    authorAvatar: '/static/logo.png',
    isAnonymous: false,
    content: '当时把我笑得从床上滚下来，太逆天了！🤣',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'comm_seed_2',
    postId: 'post_seed_1',
    dormId: 'dorm_4_304',
    authorId: 'mem_seed_3',
    authorName: '皇上',
    authorAvatar: '/static/logo.png',
    isAnonymous: false,
    content: '我作证，老王洗发水我都准备好了 👋',
    createdAt: Date.now() - 1000 * 60 * 60 * 1,
  },
];

const DEFAULT_SLANGS: SlangQuote[] = [
  {
    id: 'slang_seed_1',
    dormId: 'dorm_4_304',
    content: '这道题必须选C，不选C我倒立洗头！',
    speakerRole: '王晨',
    explanation: '源自老王半夜梦话名场面，现已成为4#304遇到重大决策时的誓言型口头禅。',
    originPostId: 'post_seed_1',
    likesCount: 12,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'slang_seed_2',
    dormId: 'dorm_4_304',
    content: '今晚戒断夜宵（炸鸡奶茶除外）',
    speakerRole: '皇上',
    explanation: '皇上专属自律口头禅，只要有外卖单，自律自动顺延到明天。',
    originPostId: 'post_seed_2',
    likesCount: 9,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
];

export class MockStorageAdapter implements IStorageAdapter {
  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const existingRooms = this.readRooms();
    if (!existingRooms.some((r) => r.roomCode === DEFAULT_ROOM.roomCode)) {
      existingRooms.push(DEFAULT_ROOM);
      this.writeRooms(existingRooms);
    }

    const existingPosts = this.readPosts();
    if (existingPosts.length === 0) {
      this.writePosts(DEFAULT_POSTS);
    }

    const existingComments = this.readComments();
    if (existingComments.length === 0) {
      this.writeComments(DEFAULT_COMMENTS);
    }

    const existingSlangs = this.readSlangs();
    if (existingSlangs.length === 0) {
      this.writeSlangs(DEFAULT_SLANGS);
    }
  }

  private readRooms(): Room[] {
    const raw = getStorage(STORAGE_KEYS.ROOMS);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  private writeRooms(rooms: Room[]): void {
    setStorage(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }

  private readMembers(): Member[] {
    const raw = getStorage(STORAGE_KEYS.MEMBERS);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  private writeMembers(members: Member[]): void {
    setStorage(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }

  private readPosts(): Post[] {
    const raw = getStorage(STORAGE_KEYS.POSTS);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  private writePosts(posts: Post[]): void {
    setStorage(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }

  private readComments(): Comment[] {
    const raw = getStorage(STORAGE_KEYS.COMMENTS);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  private writeComments(comments: Comment[]): void {
    setStorage(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  }

  private readSlangs(): SlangQuote[] {
    const raw = getStorage(STORAGE_KEYS.SLANGS);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  private writeSlangs(slangs: SlangQuote[]): void {
    setStorage(STORAGE_KEYS.SLANGS, JSON.stringify(slangs));
  }

  async getRoom(dormId: string): Promise<Room | null> {
    const rooms = this.readRooms();
    return rooms.find((r) => r.id === dormId) || null;
  }

  async getRoomByCode(roomCode: string): Promise<Room | null> {
    const rooms = this.readRooms();
    return rooms.find((r) => r.roomCode.toLowerCase() === roomCode.trim().toLowerCase()) || null;
  }

  async createRoom(room: Room): Promise<Room> {
    const rooms = this.readRooms();
    rooms.push(room);
    this.writeRooms(rooms);
    return room;
  }

  async updateRoom(dormId: string, updates: Partial<Room>): Promise<Room> {
    const rooms = this.readRooms();
    const index = rooms.findIndex((r) => r.id === dormId);
    if (index === -1) throw new Error(`寝室不存在: ${dormId}`);
    rooms[index] = { ...rooms[index], ...updates };
    this.writeRooms(rooms);
    return rooms[index];
  }

  async getMembers(dormId: string): Promise<Member[]> {
    const members = this.readMembers();
    return members.filter((m) => m.dormId === dormId);
  }

  async getMemberByOpenId(openid: string): Promise<Member | null> {
    const members = this.readMembers();
    return members.find((m) => m.openid === openid) || null;
  }

  async addMember(member: Member): Promise<Member> {
    const members = this.readMembers();
    const index = members.findIndex((m) => m.id === member.id || (m.dormId === member.dormId && m.openid === member.openid));
    if (index >= 0) {
      members[index] = member;
    } else {
      members.push(member);
    }
    this.writeMembers(members);
    return member;
  }

  async removeMember(dormId: string, memberId: string): Promise<boolean> {
    const members = this.readMembers();
    const filtered = members.filter((m) => !(m.dormId === dormId && m.id === memberId));
    this.writeMembers(filtered);
    return true;
  }

  async getPosts(dormId: string, filterTag?: string): Promise<Post[]> {
    const allPosts = this.readPosts();
    let dormPosts = allPosts.filter((p) => p.dormId === dormId);

    if (filterTag && filterTag !== '全部') {
      dormPosts = dormPosts.filter((p) => p.tag === filterTag);
    }

    return dormPosts.sort((a, b) => b.createdAt - a.createdAt);
  }

  async createPost(post: Post): Promise<Post> {
    const posts = this.readPosts();
    posts.unshift(post);
    this.writePosts(posts);

    // 如果带有 [黑话梗合集] 标签，自动同步收录至寝室黑话词典！
    if (post.tag === '黑话梗合集') {
      const slang: SlangQuote = {
        id: 'slang_auto_' + post.id,
        dormId: post.dormId,
        content: post.content,
        speakerRole: post.targetGuyRoles[0] || post.authorName,
        explanation: `自动收录自日常分享（记录人：${post.authorName}）`,
        originPostId: post.id,
        likesCount: 1,
        createdAt: post.createdAt,
      };
      await this.addSlangQuote(slang);
    }

    return post;
  }

  async deletePost(dormId: string, postId: string): Promise<boolean> {
    const posts = this.readPosts();
    const filtered = posts.filter((p) => !(p.dormId === dormId && p.id === postId));
    this.writePosts(filtered);
    return true;
  }

  // 专属表态 Reaction（含防刷与点击取消逻辑）
  async addReaction(dormId: string, postId: string, emoji: string, userOpenId: string): Promise<Post> {
    const posts = this.readPosts();
    const target = posts.find((p) => p.dormId === dormId && p.id === postId);
    if (!target) throw new Error('事件不存在');

    if (!target.reactions) target.reactions = {};
    if (!target.reactedUsers) target.reactedUsers = {};

    const usersForEmoji = target.reactedUsers[emoji] || [];
    const hasReacted = usersForEmoji.includes(userOpenId);

    if (hasReacted) {
      // 已经点过：再次点击取消表态
      target.reactions[emoji] = Math.max(0, (target.reactions[emoji] || 1) - 1);
      target.reactedUsers[emoji] = usersForEmoji.filter((u) => u !== userOpenId);
    } else {
      // 首次点选：计数增加，记录用户 OpenID
      target.reactions[emoji] = (target.reactions[emoji] || 0) + 1;
      target.reactedUsers[emoji] = [...usersForEmoji, userOpenId];
    }

    this.writePosts(posts);
    return target;
  }

  // 评论机制
  async getComments(dormId: string, postId: string): Promise<Comment[]> {
    const all = this.readComments();
    return all
      .filter((c) => c.dormId === dormId && c.postId === postId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async addComment(comment: Comment): Promise<Comment> {
    const comments = this.readComments();
    comments.push(comment);
    this.writeComments(comments);

    // 同步增加对应帖子的 commentCount
    const posts = this.readPosts();
    const post = posts.find((p) => p.dormId === comment.dormId && p.id === comment.postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
      this.writePosts(posts);
    }

    return comment;
  }

  // 黑话词典与金句墙
  async getSlangQuotes(dormId: string): Promise<SlangQuote[]> {
    const slangs = this.readSlangs();
    return slangs
      .filter((s) => s.dormId === dormId)
      .sort((a, b) => b.likesCount - a.likesCount);
  }

  async addSlangQuote(quote: SlangQuote): Promise<SlangQuote> {
    const slangs = this.readSlangs();
    slangs.unshift(quote);
    this.writeSlangs(slangs);
    return quote;
  }

  async likeSlangQuote(dormId: string, quoteId: string): Promise<number> {
    const slangs = this.readSlangs();
    const target = slangs.find((s) => s.dormId === dormId && s.id === quoteId);
    if (!target) throw new Error('词条不存在');
    target.likesCount += 1;
    this.writeSlangs(slangs);
    return target.likesCount;
  }

  getActiveSession(): { openid: string; dormId: string } | null {
    const raw = getStorage(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  setActiveSession(session: { openid: string; dormId: string } | null): void {
    if (!session) {
      setStorage(STORAGE_KEYS.SESSION, '');
    } else {
      setStorage(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  }

  clearAll(): void {
    memoryStorage.clear();
    setStorage(STORAGE_KEYS.ROOMS, '');
    setStorage(STORAGE_KEYS.MEMBERS, '');
    setStorage(STORAGE_KEYS.POSTS, '');
    setStorage(STORAGE_KEYS.COMMENTS, '');
    setStorage(STORAGE_KEYS.SLANGS, '');
    setStorage(STORAGE_KEYS.SESSION, '');
    this.seedInitialData();
  }
}
