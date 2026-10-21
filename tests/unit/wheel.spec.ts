import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWheelStore } from '../../src/stores/wheel';
import { generateRecapStats } from '../../src/utils/recapHelper';
import type { Post, SlangQuote, Room } from '../../src/types';

describe('Iteration 4: Fortune Wheel & Black Book Recap Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('1. 命运转盘应当预置 PRD 指定的三大灵魂决策场景', () => {
    const wheelStore = useWheelStore();
    expect(wheelStore.scenarios).toContain('🛠️ 谁来报修');
    expect(wheelStore.scenarios).toContain('💡 谁下床关灯');
    expect(wheelStore.scenarios).toContain('📦 谁帮忙拿快递');
  });

  it('2. 应当支持新增自定义抽签场景，且拦截空名称与重复场景', () => {
    const wheelStore = useWheelStore();
    wheelStore.addScenario('🍟 谁去食堂带夜宵');
    expect(wheelStore.scenarios).toContain('🍟 谁去食堂带夜宵');
    expect(wheelStore.activeScenario).toBe('🍟 谁去食堂带夜宵');

    expect(() => wheelStore.addScenario('   ')).toThrow('场景名称不能为空');
    expect(() => wheelStore.addScenario('🛠️ 谁来报修')).toThrow('该场景已存在');
  });

  it('3. 抽取天选倒霉蛋时，应当精确命中候选室友并生成抽签历史记录', () => {
    const wheelStore = useWheelStore();
    const candidates = ['寝室长', '小肥肥', '晴晴姨', '皇上', '哈基', '王晨'];

    const roll = wheelStore.rollCandidate(candidates);
    expect(candidates).toContain(roll.winner);
    expect(roll.targetRotation).toBeGreaterThan(360 * 5); // 确保旋转圈数大于5圈
    expect(wheelStore.spinHistory[0].winner).toBe(roll.winner);
  });

  it('4. 年度黑料小报算法应当准确统计出“年度受害王”与高赞沙雕名场面', () => {
    const mockPosts: Post[] = [
      {
        id: 'p1',
        dormId: 'dorm_4_304',
        authorId: 'u1',
        authorName: '寝室长',
        authorAvatar: '',
        isAnonymous: false,
        targetGuyRoles: ['王晨'],
        content: '老王半夜梦话选C',
        images: [],
        funnyLevel: 5,
        tag: '梦话暴论',
        reactions: { '🤣': 10 },
        reactedUsers: {},
        commentCount: 2,
        createdAt: Date.now() - 100000,
      },
      {
        id: 'p2',
        dormId: 'dorm_4_304',
        authorId: 'u2',
        authorName: '小肥肥',
        authorAvatar: '',
        isAnonymous: false,
        targetGuyRoles: ['王晨'], // 王晨再次被 @
        content: '老王洗完头不吹',
        images: [],
        funnyLevel: 3,
        tag: '宿舍搞笑日常',
        reactions: { '🤣': 2 },
        reactedUsers: {},
        commentCount: 0,
        createdAt: Date.now() - 200000,
      },
      {
        id: 'p3',
        dormId: 'dorm_4_304',
        authorId: 'u3',
        authorName: '皇上',
        authorAvatar: '',
        isAnonymous: false,
        targetGuyRoles: ['哈基'],
        content: '哈基打呼噜',
        images: [],
        funnyLevel: 4,
        tag: '打呼连环',
        reactions: { '🤣': 5 },
        reactedUsers: {},
        commentCount: 1,
        createdAt: Date.now() - 300000,
      },
    ];

    const mockSlangs: SlangQuote[] = [
      {
        id: 's1',
        dormId: 'dorm_4_304',
        content: '不选C我倒立洗头',
        speakerRole: '王晨',
        likesCount: 20,
        createdAt: Date.now(),
      },
    ];

    const mockRoom: Room = {
      id: 'dorm_4_304',
      roomCode: '4#304',
      secretPIN: '304888',
      maxCapacity: 6,
      ownerOpenId: 'admin',
      notice: '公告',
      createdAt: Date.now() - 86400000 * 10,
    };

    const stats = generateRecapStats(mockPosts, mockSlangs, mockRoom);

    expect(stats.totalPosts).toBe(3);
    expect(stats.totalReactions).toBe(17);
    expect(stats.mostVictim.role).toBe('王晨'); // 王晨被@两次，荣膺受害王
    expect(stats.mostVictim.count).toBe(2);
    expect(stats.topPosts[0].id).toBe('p1'); // p1 分数最高，排在第一名
  });
});
