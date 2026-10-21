<template>
  <view class="admin-container">
    <!-- 权限拦截遮罩 -->
    <view v-if="!roomStore.isOwner" class="no-auth-card">
      <text class="lock-icon">🔒</text>
      <text class="no-auth-title">权限受限</text>
      <text class="no-auth-desc">控制台仅限【寝室长】访问，请在门禁认领寝室长身份后再进入！</text>
      <button class="back-btn" @click="goHome">返回首页</button>
    </view>

    <!-- 寝室长管理面板主体 -->
    <view v-else class="admin-content">
      <!-- 头部看板 -->
      <view class="admin-header">
        <text class="crown-icon">👑</text>
        <view class="header-text">
          <text class="admin-title">{{ roomStore.currentRoom?.roomCode }} 寝室长控制台</text>
          <text class="admin-sub">管理人数上限、室友名额与安全密钥</text>
        </view>
      </view>

      <!-- 模块 1：人数容量动态调节 -->
      <view class="setting-card">
        <view class="card-title-row">
          <text class="card-title">👥 寝室容量与人数上限</text>
          <text class="card-badge">当前在席 {{ roomStore.roomMembers.length }}/{{ currentCapacity }} 人</text>
        </view>
        <text class="tip-text">可根据实际住宿人数自由扩容或缩容（不能小于当前已有成员数）：</text>
        <view class="capacity-stepper">
          <button class="step-btn" @click="changeCapacity(-1)">-</button>
          <text class="capacity-val">{{ currentCapacity }} 人</text>
          <button class="step-btn" @click="changeCapacity(1)">+</button>
          <button class="save-btn" :loading="isSavingCap" @click="handleSaveCapacity">保存上限</button>
        </view>
      </view>

      <!-- 模块 2：在席室友管理与移出名额 -->
      <view class="setting-card">
        <text class="card-title">🪪 在席室友清单 ({{ roomStore.roomMembers.length }})</text>
        <text class="tip-text">移出室友后，其认领的角色名额将立即释放回可选角色池：</text>
        <view class="member-list">
          <view
            v-for="m in roomStore.roomMembers"
            :key="m.id"
            class="member-item"
          >
            <view class="member-left">
              <image class="m-avatar" :src="m.avatarUrl || '/static/logo.png'" mode="aspectFill" />
              <view class="m-meta">
                <text class="m-role">【{{ m.roleName }}】</text>
                <text class="m-nick">{{ m.customNickname }}</text>
                <text v-if="m.isOwner" class="owner-badge">室长本尊</text>
              </view>
            </view>

            <view class="member-right">
              <button
                v-if="!m.isOwner"
                class="kick-btn"
                @click="confirmKick(m)"
              >
                移出寝室
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 模块 3：寝室公告标语设置 -->
      <view class="setting-card">
        <text class="card-title">📢 寝室公告与置顶标语</text>
        <textarea
          v-model="noticeText"
          class="notice-textarea"
          placeholder="写一句搞笑又霸气的寝室置顶公告..."
          maxlength="100"
        />
        <button class="action-btn" :loading="isSavingNotice" @click="handleSaveNotice">
          更新寝室公告
        </button>
      </view>

      <!-- 模块 4：进房独立密钥重置 -->
      <view class="setting-card">
        <text class="card-title">🔑 进房独立密钥重置</text>
        <text class="tip-text">若密码不慎泄露给外寝人员，可在此随时更换：</text>
        <view class="pin-row">
          <input
            v-model="newPINText"
            class="pin-input"
            type="text"
            placeholder="输入新密钥 (不少于4位)"
          />
          <button class="action-btn pin-btn" :loading="isSavingPIN" @click="handleSavePIN">
            重置密钥
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoomStore } from '../../stores/room';
import type { Member } from '../../types';

const roomStore = useRoomStore();

const currentCapacity = ref(6);
const noticeText = ref('');
const newPINText = ref('');

const isSavingCap = ref(false);
const isSavingNotice = ref(false);
const isSavingPIN = ref(false);

onMounted(async () => {
  await roomStore.initSession();
  if (roomStore.currentRoom) {
    currentCapacity.value = roomStore.currentRoom.maxCapacity;
    noticeText.value = roomStore.currentRoom.notice;
    newPINText.value = roomStore.currentRoom.secretPIN;
  }
});

function changeCapacity(delta: number) {
  const target = currentCapacity.value + delta;
  if (target < roomStore.roomMembers.length) {
    uni.showToast({
      title: `人数不能小于已有成员数 (${roomStore.roomMembers.length}人)`,
      icon: 'none',
    });
    return;
  }
  if (target > 12) {
    uni.showToast({ title: '单寝室人数上限最多支持 12 人', icon: 'none' });
    return;
  }
  currentCapacity.value = target;
}

async function handleSaveCapacity() {
  isSavingCap.value = true;
  try {
    await roomStore.updateCapacity(currentCapacity.value);
    uni.showToast({ title: '容量更新成功！', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message || '更新失败', icon: 'none' });
  } finally {
    isSavingCap.value = false;
  }
}

function confirmKick(member: Member) {
  uni.showModal({
    title: '移出室友确认',
    content: `确定要将【${member.roleName}】(${member.customNickname}) 移出寝室吗？其角色名额将立即释放。`,
    confirmColor: '#d63031',
    success: async (res) => {
      if (res.confirm) {
        try {
          await roomStore.kickMember(member.id);
          uni.showToast({ title: '已成功移出并释放角色', icon: 'success' });
        } catch (err: any) {
          uni.showToast({ title: err.message || '操作失败', icon: 'none' });
        }
      }
    },
  });
}

async function handleSaveNotice() {
  if (!noticeText.value.trim()) {
    uni.showToast({ title: '公告内容不能为空', icon: 'none' });
    return;
  }

  isSavingNotice.value = true;
  try {
    await roomStore.updateNotice(noticeText.value);
    uni.showToast({ title: '公告更新成功！', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message || '更新失败', icon: 'none' });
  } finally {
    isSavingNotice.value = false;
  }
}

async function handleSavePIN() {
  if (newPINText.value.trim().length < 4) {
    uni.showToast({ title: '密钥长度不能少于4位', icon: 'none' });
    return;
  }

  isSavingPIN.value = true;
  try {
    await roomStore.updateSecretPIN(newPINText.value);
    uni.showToast({ title: '密钥重置成功！', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message || '重置失败', icon: 'none' });
  } finally {
    isSavingPIN.value = false;
  }
}

function goHome() {
  uni.navigateBack();
}
</script>

<style lang="scss" scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding: 30rpx 30rpx 80rpx;
  box-sizing: border-box;
}

.no-auth-card {
  text-align: center;
  padding: 120rpx 40rpx;
  background: #ffffff;
  border-radius: 28rpx;

  .lock-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
    display: block;
  }
  .no-auth-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #2d3436;
    margin-bottom: 12rpx;
    display: block;
  }
  .no-auth-desc {
    font-size: 26rpx;
    color: #7f8c8d;
    margin-bottom: 40rpx;
    display: block;
  }
  .back-btn {
    background: #ff7675;
    color: #ffffff;
    border-radius: 40rpx;
    font-size: 28rpx;
  }
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;

  .crown-icon {
    font-size: 60rpx;
  }
  .header-text {
    .admin-title {
      font-size: 32rpx;
      font-weight: 900;
      color: #2d3436;
      display: block;
    }
    .admin-sub {
      font-size: 22rpx;
      color: #636e72;
    }
  }
}

.setting-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 26rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);

  .card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10rpx;
  }

  .card-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #2c3e50;
    display: block;
  }

  .card-badge {
    font-size: 22rpx;
    color: #0984e3;
    background: #e3f2fd;
    padding: 4rpx 14rpx;
    border-radius: 16rpx;
    font-weight: 600;
  }

  .tip-text {
    font-size: 22rpx;
    color: #95a5a6;
    margin-bottom: 20rpx;
    display: block;
  }
}

.capacity-stepper {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .step-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: #f1f2f6;
    font-size: 36rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .capacity-val {
    font-size: 32rpx;
    font-weight: 900;
    color: #d63031;
    min-width: 100rpx;
    text-align: center;
  }

  .save-btn {
    margin-left: auto;
    background: #ff7675;
    color: #ffffff;
    font-size: 24rpx;
    border-radius: 30rpx;
    padding: 0 30rpx;
    height: 64rpx;
    line-height: 64rpx;
  }
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .member-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
    border-radius: 16rpx;
    padding: 16rpx 20rpx;

    .member-left {
      display: flex;
      align-items: center;
      gap: 14rpx;

      .m-avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        background: #fab1a0;
      }

      .m-meta {
        display: flex;
        align-items: center;
        gap: 10rpx;

        .m-role {
          font-size: 26rpx;
          font-weight: bold;
          color: #d63031;
        }
        .m-nick {
          font-size: 24rpx;
          color: #636e72;
        }
        .owner-badge {
          background: #ffeaa7;
          color: #d35400;
          font-size: 18rpx;
          padding: 2rpx 10rpx;
          border-radius: 10rpx;
          font-weight: bold;
        }
      }
    }

    .member-right {
      .kick-btn {
        background: #ffebee;
        color: #c0392b;
        font-size: 22rpx;
        font-weight: bold;
        border-radius: 20rpx;
        padding: 0 20rpx;
        height: 52rpx;
        line-height: 52rpx;
        border: 1rpx solid #ffcdd2;
      }
    }
  }
}

.notice-textarea {
  width: 100%;
  height: 140rpx;
  background: #f8f9fa;
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  border: 1rpx solid #e2e8f0;
  box-sizing: border-box;
  margin-bottom: 20rpx;
}

.pin-row {
  display: flex;
  gap: 16rpx;

  .pin-input {
    flex: 1;
    background: #f8f9fa;
    border: 1rpx solid #e2e8f0;
    border-radius: 14rpx;
    padding: 0 20rpx;
    height: 76rpx;
    font-size: 26rpx;
  }

  .pin-btn {
    width: 200rpx;
  }
}

.action-btn {
  background: #ff7675;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: bold;
  border-radius: 36rpx;
  height: 76rpx;
  line-height: 76rpx;
}
</style>
