import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePostStore } from '../../src/stores/post';
import { MockStorageAdapter } from '../../src/api/MockStorageAdapter';

describe('Iteration 2: Post & Feed Core Stream Tests', () => {
  let mockAdapter: MockStorageAdapter;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockAdapter = new MockStorageAdapter();
    mockAdapter.clearAll();
  });

  it('1. 应当成功获取 4#304 的日常列表，并具备多租户强行级隔离', async () => {
    const postStore = usePostStore();
    await postStore.loadPosts('dorm_4_304');

    expect(postStore.posts.length).toBeGreaterThanOrEqual(2);
    // 验证每一条数据都属于 4#304
    postStore.posts.forEach((p) => {
      expect(p.dormId).toBe('dorm_4_304');
    });

    // 查询其他寝室（如 dorm_5_501），应当为空，不发生数据穿透
    const otherPosts = await mockAdapter.getPosts('dorm_5_501');
    expect(otherPosts.length).toBe(0);
  });

  it('2. 应当支持发布标准的日常记录，包含 @当事人 与 沙雕评级', async () => {
    const postStore = usePostStore();
    const created = await postStore.publishPost({
      dormId: 'dorm_4_304',
      authorId: 'mem_1',
      authorName: '小肥肥',
      targetGuyRoles: ['晴晴姨'],
      content: '晴晴姨敷着黑面膜上厕所，把半夜起床喝水的皇上吓得嗷嗷叫！',
      funnyLevel: 5,
      tag: '宿舍搞笑日常',
      images: ['https://example.com/pic1.jpg'],
    });

    expect(created.authorName).toBe('小肥肥');
    expect(created.targetGuyRoles).toContain('晴晴姨');
    expect(created.funnyLevel).toBe(5);
    expect(created.images.length).toBe(1);
    expect(postStore.posts[0].id).toBe(created.id); // 最新发布的排在第一位
  });

  it('3. 当标签为 [来吐槽吧] 时，系统必须强制开启匿名遮蔽（作者伪装为“神秘室友”）', async () => {
    const postStore = usePostStore();
    const anonPost = await postStore.publishPost({
      dormId: 'dorm_4_304',
      authorId: 'mem_real_id_999',
      authorName: '皇上', // 真实发布人
      targetGuyRoles: ['寝室长'],
      content: '每次喊大家下床关灯，只有寝室长装睡装得最逼真！',
      funnyLevel: 4,
      tag: '来吐槽吧', // 触发匿名树洞模式
    });

    expect(anonPost.isAnonymous).toBe(true);
    expect(anonPost.authorName).toBe('神秘室友'); // 真实姓名被成功抹除
    expect(anonPost.authorName).not.toBe('皇上');
    expect(anonPost.authorAvatar).toContain('anonymous');
  });

  it('4. 应当拦截内容为空或配图超限的非法提交（防呆拦截）', async () => {
    const postStore = usePostStore();

    // 空内容校验
    await expect(
      postStore.publishPost({
        dormId: 'dorm_4_304',
        authorId: 'mem_1',
        authorName: '哈基',
        targetGuyRoles: [],
        content: '   ',
        tag: '宿舍搞笑日常',
      })
    ).rejects.toThrow('事件内容不能为空');

    // 超过 9 张图片校验
    const tooManyImages = new Array(10).fill('https://example.com/img.jpg');
    await expect(
      postStore.publishPost({
        dormId: 'dorm_4_304',
        authorId: 'mem_1',
        authorName: '哈基',
        targetGuyRoles: [],
        content: '配图爆炸了',
        tag: '宿舍搞笑日常',
        images: tooManyImages,
      })
    ).rejects.toThrow('最多只能上传 9 张');
  });

  it('5. 应当支持按分类标签快速精准筛选', async () => {
    const postStore = usePostStore();
    await postStore.loadPosts('dorm_4_304');

    // 切换到 [梦话暴论]
    await postStore.switchTag('梦话暴论', 'dorm_4_304');
    expect(postStore.posts.length).toBeGreaterThan(0);
    postStore.posts.forEach((p) => {
      expect(p.tag).toBe('梦话暴论');
    });
  });
});
