import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRoomStore, ALL_PRESET_ROLES } from '../../src/stores/room';
import { MockStorageAdapter } from '../../src/api/MockStorageAdapter';

describe('Iteration 1: Room Gatekeeper & Member System Tests', () => {
  let mockAdapter: MockStorageAdapter;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockAdapter = new MockStorageAdapter();
    mockAdapter.clearAll();
  });

  it('1. 应当成功通过 4#304 与正确密钥 304888 的门禁校验', async () => {
    const store = useRoomStore();
    const result = await store.verifyRoom('4#304', '304888');

    expect(result.success).toBe(true);
    expect(result.room?.roomCode).toBe('4#304');
    expect(result.room?.maxCapacity).toBe(6);
  });

  it('2. 应当拦截错误密码的进入请求（防撞库）', async () => {
    const store = useRoomStore();
    const result = await store.verifyRoom('4#304', 'wrong_pin');

    expect(result.success).toBe(false);
    expect(result.message).toContain('进房密钥不正确');
  });

  it('3. 应当支持室友认领可用角色，且角色被占用后不可重复认领', async () => {
    const store = useRoomStore();
    await store.verifyRoom('4#304', '304888');

    // 用户 1 认领 "皇上"
    const member = await store.claimRole('皇上', '朕乃九五至尊');
    expect(member.roleName).toBe('皇上');
    expect(store.claimedRoles).toContain('皇上');
    expect(store.availableRoles).not.toContain('皇上');

    // 模拟第二个新用户
    store.userOpenId = 'user_openid_2';
    await expect(store.claimRole('皇上')).rejects.toThrow('已被其他室友抢先认领');
  });

  it('4. 达到 6 人上限时，应当物理熔断准入通道（满员锁死）', async () => {
    const store = useRoomStore();
    const roomRes = await store.verifyRoom('4#304', '304888');
    const dormId = roomRes.room!.id;

    // 模拟快速塞满 6 人 (寝室长、小肥肥、晴晴姨、皇上、哈基、王晨)
    for (let i = 0; i < 6; i++) {
      await mockAdapter.addMember({
        id: `mem_${i}`,
        openid: `open_${i}`,
        dormId,
        roleName: ALL_PRESET_ROLES[i],
        avatarUrl: '',
        isOwner: i === 0,
        joinedAt: Date.now(),
      });
    }

    // 第 7 位外来人员尝试通过门禁
    store.userOpenId = 'stranger_openid_7';
    const verifyRes = await store.verifyRoom('4#304', '304888');

    expect(verifyRes.success).toBe(false);
    expect(verifyRes.message).toContain('已满员');
    expect(verifyRes.message).toContain('通道已锁死');
  });

  it('5. 寝室长具备管理权限，可调整容量上限并移出室友释放名额', async () => {
    const store = useRoomStore();
    await store.verifyRoom('4#304', '304888');

    // 认领寝室长身份
    await store.claimRole('寝室长');
    expect(store.isOwner).toBe(true);

    // 模拟寝室长将人数扩容到 8 人
    const updated = await store.updateCapacity(8);
    expect(updated.maxCapacity).toBe(8);

    // 模拟添加一位室友 "哈基"
    const haji = await mockAdapter.addMember({
      id: 'mem_haji_99',
      openid: 'openid_haji_99',
      dormId: store.currentRoom!.id,
      roleName: '哈基',
      avatarUrl: '',
      isOwner: false,
      joinedAt: Date.now(),
    });
    await store.refreshMembers();
    expect(store.claimedRoles).toContain('哈基');

    // 寝室长将哈基移出寝室
    await store.kickMember(haji.id);
    expect(store.claimedRoles).not.toContain('哈基');
    expect(store.availableRoles).toContain('哈基'); // 角色名额被成功释放！
  });
});
