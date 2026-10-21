<template>
  <view class="gate-container">
    <!-- 顶部欢迎卡片 -->
    <view class="hero-card">
      <view class="emoji-logo">🚪✨</view>
      <text class="title">寝室专属空间门禁</text>
      <text class="subtitle">记录每天离谱瞬间，非本寝成员请勿靠近！</text>
    </view>

    <!-- 状态 A：已入寝，展示通行证 -->
    <view v-if="roomStore.currentMember && roomStore.currentRoom" class="passport-card">
      <view class="passport-header">
        <text class="dorm-badge">{{ roomStore.currentRoom.roomCode }} 专属通行证</text>
        <text class="status-tag">在席</text>
      </view>

      <view class="passport-body">
        <image class="role-avatar" :src="roomStore.currentMember.avatarUrl || '/static/logo.png'" mode="aspectFill" />
        <view class="passport-info">
          <text class="role-name">【{{ roomStore.currentMember.roleName }}】</text>
          <text class="nickname">{{ roomStore.currentMember.customNickname }}</text>
          <text class="role-desc" v-if="roomStore.currentMember.isOwner">👑 掌握寝室大权的寝室长</text>
          <text class="role-desc" v-else>沙雕日常首席特派员</text>
        </view>
      </view>

      <view class="notice-box">
        <text class="notice-title">📢 寝室公告：</text>
        <text class="notice-text">{{ roomStore.currentRoom.notice }}</text>
      </view>

      <view class="action-buttons">
        <button class="primary-btn" @click="enterDormFeed">立即进入寝室大本营 🚀</button>
        <button class="outline-btn" @click="roomStore.leaveRoom">切换身份 / 退出</button>
      </view>
    </view>

    <!-- 状态 B：未入寝，进行门禁与角色认领 -->
    <view v-else class="gate-flow">
      <!-- 步骤 1：输入门牌暗号 -->
      <view class="section-card">
        <view class="step-badge">第一步：核验寝室暗号</view>
        <view class="input-group">
          <text class="label">寝室代号</text>
          <input
            v-model="inputRoomCode"
            class="input-box"
            placeholder="例如: 4#304"
            placeholder-class="placeholder"
          />
        </view>
        <view class="input-group">
          <text class="label">进房独立密钥</text>
          <input
            v-model="inputSecretPIN"
            class="input-box"
            type="password"
            placeholder="6位独立密钥 (初始: 304888)"
            placeholder-class="placeholder"
          />
        </view>

        <button class="action-btn" :loading="isVerifying" @click="handleVerify">
          核验暗号
        </button>
      </view>

      <!-- 步骤 2：认领 6 大专属角色 -->
      <view v-if="verifiedRoom" class="section-card role-section">
        <view class="step-badge">第二步：认领你的专属角色</view>
        <text class="role-tip">
          寝室人数上限 {{ verifiedRoom.maxCapacity }} 人（当前已认领 {{ verifiedMembers.length }}/{{ verifiedRoom.maxCapacity }}）
        </text>

        <view class="role-grid">
          <view
            v-for="role in allPresetRoles"
            :key="role"
            class="role-card"
            :class="{
              taken: isRoleTaken(role),
              selected: selectedRole === role
            }"
            @click="selectRole(role)"
          >
            <text class="role-title">{{ role }}</text>
            <text class="role-status">
              {{ isRoleTaken(role) ? '已被认领 🔒' : (selectedRole === role ? '已选择 ✔' : '点击认领') }}
            </text>
          </view>
        </view>

        <view v-if="selectedRole" class="nickname-box">
          <text class="label">自定义昵称（选填）：</text>
          <input
            v-model="customNickname"
            class="input-box"
            :placeholder="`默认为: ${selectedRole}`"
          />
        </view>

        <button
          v-if="selectedRole"
          class="primary-btn submit-btn"
          :loading="isClaiming"
          @click="handleClaim"
        >
          确定认领【{{ selectedRole }}】并开门进入
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoomStore, ALL_PRESET_ROLES } from '../../stores/room';
import type { Room, Member } from '../../types';

const roomStore = useRoomStore();

const inputRoomCode = ref('4#304');
const inputSecretPIN = ref('304888');
const isVerifying = ref(false);
const isClaiming = ref(false);

const verifiedRoom = ref<Room | null>(null);
const verifiedMembers = ref<Member[]>([]);
const selectedRole = ref('');
const customNickname = ref('');

const allPresetRoles = ALL_PRESET_ROLES;

onMounted(async () => {
  await roomStore.initSession();
});

function isRoleTaken(role: string): boolean {
  return verifiedMembers.value.some((m) => m.roleName === role);
}

function selectRole(role: string) {
  if (isRoleTaken(role)) {
    uni.showToast({ title: `【${role}】已被室友认领啦，换一个吧~`, icon: 'none' });
    return;
  }
  selectedRole.value = role;
}

async function handleVerify() {
  if (!inputRoomCode.value.trim() || !inputSecretPIN.value.trim()) {
    uni.showToast({ title: '请填写完整的房号和密钥', icon: 'none' });
    return;
  }

  isVerifying.value = true;
  try {
    const res = await roomStore.verifyRoom(inputRoomCode.value, inputSecretPIN.value);
    if (!res.success) {
      uni.showModal({ title: '门禁拦截', content: res.message, showCancel: false });
      return;
    }

    verifiedRoom.value = res.room || null;
    verifiedMembers.value = res.members || [];

    // 若已经是本寝室成员，直接进房
    if (res.isAlreadyMember) {
      uni.showToast({ title: '欢迎归寝！', icon: 'success' });
      enterDormFeed();
    } else {
      uni.showToast({ title: '暗号匹配成功，请认领角色', icon: 'none' });
    }
  } catch (err: any) {
    uni.showToast({ title: err.message || '核验异常', icon: 'none' });
  } finally {
    isVerifying.value = false;
  }
}

async function handleClaim() {
  if (!selectedRole.value) return;

  isClaiming.value = true;
  try {
    await roomStore.claimRole(selectedRole.value, customNickname.value);
    uni.showToast({ title: '恭喜认领成功，身份已绑定！', icon: 'success' });
    enterDormFeed();
  } catch (err: any) {
    uni.showModal({ title: '认领失败', content: err.message || '操作异常', showCancel: false });
  } finally {
    isClaiming.value = false;
  }
}

function enterDormFeed() {
  uni.switchTab({
    url: '/pages/index/index',
    fail() {
      uni.navigateTo({ url: '/pages/index/index' });
    },
  });
}
</script>

<style lang="scss" scoped>
.gate-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding: 30rpx 30rpx 80rpx;
  box-sizing: border-box;
}

.hero-card {
  text-align: center;
  margin-top: 40rpx;
  margin-bottom: 40rpx;

  .emoji-logo {
    font-size: 80rpx;
    margin-bottom: 16rpx;
  }

  .title {
    display: block;
    font-size: 40rpx;
    font-weight: 800;
    color: #2c3e50;
    margin-bottom: 10rpx;
  }

  .subtitle {
    font-size: 26rpx;
    color: #7f8c8d;
  }
}

.section-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 36rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);

  .step-badge {
    font-size: 28rpx;
    font-weight: bold;
    color: #ff6b6b;
    margin-bottom: 24rpx;
  }

  .input-group {
    margin-bottom: 24rpx;

    .label {
      display: block;
      font-size: 26rpx;
      color: #636e72;
      margin-bottom: 12rpx;
    }

    .input-box {
      background: #f8f9fa;
      height: 80rpx;
      line-height: 80rpx;
      border-radius: 14rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
      border: 1rpx solid #e2e8f0;
    }
  }
}

.action-btn, .primary-btn {
  background: linear-gradient(135deg, #ff7675, #d63031);
  color: #ffffff;
  border-radius: 50rpx;
  font-weight: bold;
  font-size: 30rpx;
  margin-top: 20rpx;
  box-shadow: 0 6rpx 16rpx rgba(214, 48, 49, 0.25);
}

.role-section {
  .role-tip {
    font-size: 24rpx;
    color: #95a5a6;
    margin-bottom: 20rpx;
    display: block;
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
    margin-bottom: 30rpx;

    .role-card {
      background: #f8f9fa;
      border: 2rpx solid #e9ecef;
      border-radius: 18rpx;
      padding: 24rpx;
      text-align: center;
      transition: all 0.2s;

      .role-title {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #2d3436;
        margin-bottom: 8rpx;
      }

      .role-status {
        font-size: 22rpx;
        color: #0984e3;
      }

      &.selected {
        background: #fff0f0;
        border-color: #ff7675;
        .role-title {
          color: #d63031;
        }
        .role-status {
          color: #d63031;
        }
      }

      &.taken {
        opacity: 0.5;
        background: #f1f2f6;
        .role-status {
          color: #b2bec3;
        }
      }
    }
  }
}

.passport-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);

  .passport-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2rpx dashed #eee;
    padding-bottom: 20rpx;
    margin-bottom: 30rpx;

    .dorm-badge {
      font-size: 32rpx;
      font-weight: 800;
      color: #2d3436;
    }

    .status-tag {
      background: #e1f5fe;
      color: #0288d1;
      font-size: 22rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
    }
  }

  .passport-body {
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-bottom: 30rpx;

    .role-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      background: #fab1a0;
    }

    .passport-info {
      .role-name {
        font-size: 36rpx;
        font-weight: 800;
        color: #d63031;
      }
      .nickname {
        font-size: 28rpx;
        color: #636e72;
        margin-left: 10rpx;
      }
      .role-desc {
        display: block;
        font-size: 24rpx;
        color: #a4b0be;
        margin-top: 8rpx;
      }
    }
  }

  .notice-box {
    background: #fff9e6;
    border-left: 8rpx solid #f1c40f;
    padding: 20rpx;
    border-radius: 12rpx;
    margin-bottom: 30rpx;

    .notice-title {
      font-size: 24rpx;
      font-weight: bold;
      color: #d35400;
      display: block;
      margin-bottom: 6rpx;
    }
    .notice-text {
      font-size: 24rpx;
      color: #7f8c8d;
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .outline-btn {
      background: transparent;
      border: 2rpx solid #dfe6e9;
      color: #636e72;
      border-radius: 50rpx;
      font-size: 28rpx;
    }
  }
}
</style>
