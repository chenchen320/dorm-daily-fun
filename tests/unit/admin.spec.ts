import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRoomStore } from '../../src/stores/room';
import { MockStorageAdapter } from '../../src/api/MockStorageAdapter';

describe('Iteration 5: Room Owner Admin Console Tests', () => {
  let mockAdapter: MockStorageAdapter;

  beforeEach(async () => {
    setActivePinia(createPinia());
    mockAdapter = new MockStorageAdapter();
    mockAdapter.clearAll();
  });

  it('1. 寝室长应当能成功修改寝室公告', async () => {
    const store = useRoomStore();
    await store.verifyRoom('4#304', '304888');
    await store.claimRole('寝室长');

    const updated = await store.updateNotice('新公告：今晚全寝团建吃海底捞！');
    expect(updated.notice).toBe('新公告：今晚全寝团建吃海底捞！');
    expect(store.currentRoom?.notice).toBe('新公告：今晚全寝团建吃海底捞！');
  });

  it('2. 寝室长应当能重置进房独立密钥，旧密钥随即失效，新密钥生效', async () => {
    const store = useRoomStore();
    await store.verifyRoom('4#304', '304888');
    await store.claimRole('寝室长');

    // 重置密钥为 666888
    await store.updateSecretPIN('666888');

    // 模拟新室友用旧密钥登录：拦截失败
    store.leaveRoom();
    store.userOpenId = 'new_guy_openid';
    const oldTry = await store.verifyRoom('4#304', '304888');
    expect(oldTry.success).toBe(false);

    // 用新密钥登录：通过
    const newTry = await store.verifyRoom('4#304', '666888');
    expect(newTry.success).toBe(true);
  });

  it('3. 调整人数上限时，不能小于当前寝室在席人数', async () => {
    const store = useRoomStore();
    await store.verifyRoom('4#304', '304888');
    await store.claimRole('寝室长');

    // 当前有 1 人 (寝室长)，尝试缩容至 0 人
    await expect(store.updateCapacity(0)).rejects.toThrow('人数上限不能小于当前已有成员数');
  });

  it('4. 寝室长移出室友后，室友角色名额应当立即重新释放回可选角色池', async () => {
    const store = useRoomStore();
    await store.verifyRoom('4#304', '304888');
    await store.claimRole('寝室长');

    // 添加室友 "小肥肥"
    const feifei = await mockAdapter.addMember({
      id: 'mem_feifei_test',
      openid: 'openid_feifei_test',
      dormId: store.currentRoom!.id,
      roleName: '小肥肥',
      avatarUrl: '',
      isOwner: false,
      joinedAt: Date.now(),
    });
    await store.refreshMembers();
    expect(store.claimedRoles).toContain('小肥肥');

    // 移出小肥肥
    await store.kickMember(feifei.id);
    expect(store.claimedRoles).not.toContain('小肥肥');
    expect(store.availableRoles).toContain('小肥肥'); // 角色池恢复
  });
});
