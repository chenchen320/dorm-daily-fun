import type { Room, Member, Post, Comment, SlangQuote } from '../types';

export interface IStorageAdapter {
  // 寝室操作
  getRoom(dormId: string): Promise<Room | null>;
  getRoomByCode(roomCode: string): Promise<Room | null>;
  createRoom(room: Room): Promise<Room>;
  updateRoom(dormId: string, updates: Partial<Room>): Promise<Room>;

  // 成员操作
  getMembers(dormId: string): Promise<Member[]>;
  getMemberByOpenId(openid: string): Promise<Member | null>;
  addMember(member: Member): Promise<Member>;
  removeMember(dormId: string, memberId: string): Promise<boolean>;

  // 沙雕日常帖子操作
  getPosts(dormId: string, filterTag?: string): Promise<Post[]>;
  createPost(post: Post): Promise<Post>;
  deletePost(dormId: string, postId: string): Promise<boolean>;
  addReaction(dormId: string, postId: string, emoji: string, userOpenId: string): Promise<Post>;

  // 评论与神评操作
  getComments(dormId: string, postId: string): Promise<Comment[]>;
  addComment(comment: Comment): Promise<Comment>;

  // 黑话词典与金句墙操作
  getSlangQuotes(dormId: string): Promise<SlangQuote[]>;
  addSlangQuote(quote: SlangQuote): Promise<SlangQuote>;
  likeSlangQuote(dormId: string, quoteId: string): Promise<number>;

  // 本地活跃会话
  getActiveSession(): { openid: string; dormId: string } | null;
  setActiveSession(session: { openid: string; dormId: string } | null): void;
}
