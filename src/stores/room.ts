import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storageAdapter } from '../api';
import type { Room, Member, PresetRole } from '../types';

export const ALL_PRESET_ROLES: PresetRole[] = [
  '寝室长',
  '小肥肥',
  '晴晴姨',
  '皇上',
  '哈基',
  '王晨',
];

export const useRoomStore = defineStore('room', () => {
  const currentRoom = ref<Room | null>(null);
  const currentMember = ref<Member | null>(null);
  const roomMembers = ref<Member[]>([]);
  const loading = ref(false);

  // 虚拟设备/用户 OpenID 获取 (跨端适配：优先读本地或自动生成唯一 ID)
  const userOpenId = ref<string>(initUserOpenId());

  function initUserOpenId(): string {
    const KEY = 'dorm_user_openid_v1';
    let id = '';
    try {
      if (typeof uni !== 'undefined' && uni.getStorageSync) {
        id = uni.getStorageSync(KEY);
      } else if (typeof localStorage !== 'undefined') {
        id = localStorage.getItem(KEY) || '';
      }
    } catch (e) {
      // ignore
    }
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      try {
        if (typeof uni !== 'undefined' && uni.setStorageSync) {
          uni.setStorageSync(KEY, id);
        } else if (typeof localStorage !== 'undefined') {
          localStorage.setItem(KEY, id);
        }
      } catch (e) {
        // ignore
      }
    }
    return id;
  }

  // 计算已认领的角色和剩余可用角色
  const claimedRoles = computed(() => {
    return roomMembers.value.map((m) => m.roleName);
  });

  const availableRoles = computed(() => {
    return ALL_PRESET_ROLES.filter((role) => !claimedRoles.value.includes(role));
  });

  // 是否满员
  const isRoomFull = computed(() => {
    if (!currentRoom.value) return false;
    return roomMembers.value.length >= currentRoom.value.maxCapacity;
  });

  // 当前用户是否是寝室长管理员
  const isOwner = computed(() => {
    return currentMember.value?.isOwner === true;
  });

  // 初始化检查活跃会话
  async function initSession() {
    loading.value = true;
    try {
      const session = storageAdapter.getActiveSession();
      if (session && session.dormId) {
        const room = await storageAdapter.getRoom(session.dormId);
        if (room) {
          currentRoom.value = room;
          await refreshMembers();
          const me = roomMembers.value.find((m) => m.openid === userOpenId.value);
          if (me) {
            currentMember.value = me;
          } else {
            storageAdapter.setActiveSession(null);
            currentRoom.value = null;
            currentMember.value = null;
          }
        }
      }
    } finally {
      loading.value = false;
    }
  }

  // 刷新成员列表
  async function refreshMembers() {
    if (!currentRoom.value) return;
    roomMembers.value = await storageAdapter.getMembers(currentRoom.value.id);
  }

  // 门禁校验与寝室查找
  async function verifyRoom(roomCode: string, secretPIN: string) {
    if (!roomCode || !secretPIN) {
      return { success: false, message: '请输入寝室号和独立进房密钥' };
    }

    const room = await storageAdapter.getRoomByCode(roomCode);
    if (!room) {
      return { success: false, message: `未找到寝室代号 [${roomCode}]，请检查输入` };
    }

    if (room.secretPIN !== secretPIN.trim()) {
      return { success: false, message: '进房密钥不正确，请向寝室长索取' };
    }

    const members = await storageAdapter.getMembers(room.id);
    const isAlreadyMember = members.some((m) => m.openid === userOpenId.value);

    // 满员熔断校验 (非已有成员且达到容量上限)
    if (!isAlreadyMember && members.length >= room.maxCapacity) {
      return {
        success: false,
        message: `寝室 [${room.roomCode}] 已满员（当前 ${members.length}/${room.maxCapacity} 人），准入通道已锁死`,
      };
    }

    currentRoom.value = room;
    roomMembers.value = members;

    return {
      success: true,
      message: '门禁校验通过',
      room,
      members,
      isAlreadyMember,
    };
  }

  // 认领角色并绑定微信身份进入寝室
  async function claimRole(roleName: string, customNickname?: string, avatarUrl = '/static/logo.png') {
    if (!currentRoom.value) {
      throw new Error('未选择任何寝室');
    }

    await refreshMembers();

    // 检查角色是否已被占用
    const isTaken = roomMembers.value.some((m) => m.roleName === roleName && m.openid !== userOpenId.value);
    if (isTaken) {
      throw new Error(`角色【${roleName}】已被其他室友抢先认领啦！`);
    }

    // 检查满员
    const isSelfIn = roomMembers.value.some((m) => m.openid === userOpenId.value);
    if (!isSelfIn && roomMembers.value.length >= currentRoom.value.maxCapacity) {
      throw new Error(`抱歉，寝室已达到 ${currentRoom.value.maxCapacity} 人容量上限`);
    }

    const member: Member = {
      id: 'mem_' + Math.random().toString(36).substring(2, 9),
      openid: userOpenId.value,
      dormId: currentRoom.value.id,
      roleName,
      customNickname: customNickname || roleName,
      avatarUrl,
      isOwner: roleName === '寝室长' || currentRoom.value.ownerOpenId === userOpenId.value,
      joinedAt: Date.now(),
    };

    await storageAdapter.addMember(member);
    currentMember.value = member;
    await refreshMembers();

    // 存储当前会话
    storageAdapter.setActiveSession({
      openid: userOpenId.value,
      dormId: currentRoom.value.id,
    });

    return member;
  }

  // 管理员能力：动态调整人数上限
  async function updateCapacity(newCapacity: number) {
    if (!currentRoom.value) throw new Error('寝室不存在');
    if (!isOwner.value) throw new Error('只有寝室长可以调整人数上限');

    if (newCapacity < roomMembers.value.length) {
      throw new Error(`人数上限不能小于当前已有成员数 (${roomMembers.value.length}人)`);
    }

    const updated = await storageAdapter.updateRoom(currentRoom.value.id, {
      maxCapacity: newCapacity,
    });
    currentRoom.value = updated;
    return updated;
  }

  // 管理员能力：移出成员并释放角色
  async function kickMember(memberId: string) {
    if (!currentRoom.value) throw new Error('寝室不存在');
    if (!isOwner.value) throw new Error('只有寝室长可以移出成员');

    const target = roomMembers.value.find((m) => m.id === memberId);
    if (!target) throw new Error('成员不存在');
    if (target.openid === userOpenId.value) throw new Error('不能将自己移出寝室');

    await storageAdapter.removeMember(currentRoom.value.id, memberId);
    await refreshMembers();
    return true;
  }

  // 管理员能力：更新寝室公告
  async function updateNotice(newNotice: string) {
    if (!currentRoom.value) throw new Error('寝室不存在');
    if (!isOwner.value) throw new Error('只有寝室长可以修改寝室公告');
    if (!newNotice.trim()) throw new Error('公告内容不能为空');

    const updated = await storageAdapter.updateRoom(currentRoom.value.id, {
      notice: newNotice.trim(),
    });
    currentRoom.value = updated;
    return updated;
  }

  // 管理员能力：重置进房密码
  async function updateSecretPIN(newPIN: string) {
    if (!currentRoom.value) throw new Error('寝室不存在');
    if (!isOwner.value) throw new Error('只有寝室长可以重置进房密钥');
    if (newPIN.trim().length < 4) throw new Error('密钥长度不能少于4位');

    const updated = await storageAdapter.updateRoom(currentRoom.value.id, {
      secretPIN: newPIN.trim(),
    });
    currentRoom.value = updated;
    return updated;
  }

  // 退出寝室
  function leaveRoom() {
    storageAdapter.setActiveSession(null);
    currentRoom.value = null;
    currentMember.value = null;
    roomMembers.value = [];
  }

  return {
    currentRoom,
    currentMember,
    roomMembers,
    loading,
    userOpenId,
    claimedRoles,
    availableRoles,
    isRoomFull,
    isOwner,
    initSession,
    refreshMembers,
    verifyRoom,
    claimRole,
    updateCapacity,
    kickMember,
    updateNotice,
    updateSecretPIN,
    leaveRoom,
  };
});
