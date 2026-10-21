import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePostStore } from '../../src/stores/post';
import { useSlangStore } from '../../src/stores/slang';
import { MockStorageAdapter } from '../../src/api/MockStorageAdapter';

describe('Iteration 3: Reactions, Comments & Slang Dictionary Tests', () => {
  let mockAdapter: MockStorageAdapter;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockAdapter = new MockStorageAdapter();
    mockAdapter.clearAll();
  });

  it('1. 应当支持点击表态，且再次点击可取消（防重复防刷）', async () => {
    const postStore = usePostStore();
    await postStore.loadPosts('dorm_4_304');
    const targetPost = postStore.posts[0];
    const initialLaughCount = targetPost.reactions['🤣'] || 0;

    // 首次点击：表态 +1
    await postStore.toggleReaction(targetPost.id, '🤣', 'user_tester_1', 'dorm_4_304');
    expect(targetPost.reactions['🤣']).toBe(initialLaughCount + 1);
    expect(targetPost.reactedUsers['🤣']).toContain('user_tester_1');

    // 再次点击同一表情：取消表态 -1
    await postStore.toggleReaction(targetPost.id, '🤣', 'user_tester_1', 'dorm_4_304');
    expect(targetPost.reactions['🤣']).toBe(initialLaughCount);
    expect(targetPost.reactedUsers['🤣']).not.toContain('user_tester_1');
  });

  it('2. 应当支持室友发表评论，且自动更新帖子评论总数', async () => {
    const postStore = usePostStore();
    await postStore.loadPosts('dorm_4_304');
    const targetPost = postStore.posts[0];
    const initialCommentCount = targetPost.commentCount || 0;

    const newComment = await postStore.submitComment({
      postId: targetPost.id,
      dormId: 'dorm_4_304',
      authorId: 'mem_wang',
      authorName: '王晨',
      isAnonymous: false,
      content: '我真的会倒立洗头，说到做到！🤝',
    });

    expect(newComment.content).toContain('倒立洗头');
    expect(targetPost.commentCount).toBe(initialCommentCount + 1);

    const comments = await postStore.fetchComments(targetPost.id, 'dorm_4_304');
    expect(comments.some((c) => c.id === newComment.id)).toBe(true);
  });

  it('3. 在匿名模式下评论，姓名与头像必须全部被脱敏遮蔽', async () => {
    const postStore = usePostStore();
    await postStore.loadPosts('dorm_4_304');

    const anonComment = await postStore.submitComment({
      postId: postStore.posts[0].id,
      dormId: 'dorm_4_304',
      authorId: 'mem_stealth',
      authorName: '小肥肥',
      isAnonymous: true,
      content: '其实昨天晚上我也说了梦话...',
    });

    expect(anonComment.isAnonymous).toBe(true);
    expect(anonComment.authorName).toBe('神秘室友');
    expect(anonComment.authorName).not.toBe('小肥肥');
  });

  it('4. 应当支持黑话词典查询、新增金句并按热度点赞排序', async () => {
    const slangStore = useSlangStore();
    await slangStore.loadQuotes('dorm_4_304');

    expect(slangStore.quotes.length).toBeGreaterThanOrEqual(2);
    // 第一条应当是高赞经典
    expect(slangStore.topQuote).not.toBeNull();

    // 为某条黑话点赞
    const top = slangStore.quotes[0];
    const oldLikes = top.likesCount;
    await slangStore.likeQuote('dorm_4_304', top.id);
    expect(top.likesCount).toBe(oldLikes + 1);
  });

  it('5. 当发布带有 [黑话梗合集] 标签的事件时，系统必须自动同步收录入黑话词典', async () => {
    const postStore = usePostStore();
    const slangStore = useSlangStore();

    // 发布一条自创新黑话
    await postStore.publishPost({
      dormId: 'dorm_4_304',
      authorId: 'mem_1',
      authorName: '哈基',
      targetGuyRoles: ['晴晴姨'],
      content: '今晚十点准时熄灯睡觉（谁信谁小狗）',
      funnyLevel: 5,
      tag: '黑话梗合集',
    });

    // 查询黑话词典
    await slangStore.loadQuotes('dorm_4_304');
    const matched = slangStore.quotes.find((q) => q.content.includes('谁信谁小狗'));
    expect(matched).toBeDefined();
    expect(matched?.speakerRole).toBe('晴晴姨');
  });
});
