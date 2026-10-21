<template>
  <view class="wheel-container">
    <!-- 顶部场景选择栏 -->
    <view class="scenario-section">
      <view class="section-title-row">
        <text class="title">🎯 当前决策事件</text>
        <text class="add-btn" @click="showAddModal = true">➕ 新增场景</text>
      </view>

      <scroll-view scroll-x class="scenario-scroll" :show-scrollbar="false">
        <view class="scenario-list">
          <view
            v-for="s in wheelStore.scenarios"
            :key="s"
            class="scenario-chip"
            :class="{ active: wheelStore.activeScenario === s }"
            @click="wheelStore.activeScenario = s"
          >
            {{ s }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 核心大转盘区域 -->
    <view class="wheel-stage">
      <!-- 轮盘指示指针 -->
      <view class="pointer">▼</view>

      <!-- 转盘圆盘 -->
      <view
        class="wheel-disc"
        :style="{
          transform: `rotate(${currentRotation}deg)`,
          transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'
        }"
      >
        <view
          v-for="(member, idx) in candidateList"
          :key="member"
          class="sector-label"
          :style="{
            transform: `rotate(${(360 / candidateList.length) * idx + (180 / candidateList.length)}deg) translate(0, -180rpx)`
          }"
        >
          <text class="sector-text">{{ member }}</text>
        </view>
      </view>

      <!-- 中心启动按钮 -->
      <view class="center-trigger" @click="handleStartSpin">
        <text class="trigger-text">{{ isSpinning ? '命运中...' : '抽！' }}</text>
      </view>
    </view>

    <!-- 最近天选记录 -->
    <view class="history-section">
      <text class="history-title">📜 谁是倒霉蛋历史记录 ({{ wheelStore.spinHistory.length }})</text>
      <view v-if="wheelStore.spinHistory.length === 0" class="empty-history">
        还没有抽签，赶紧摇一个人去关灯！
      </view>
      <view v-else class="history-list">
        <view
          v-for="(h, idx) in wheelStore.spinHistory.slice(0, 5)"
          :key="idx"
          class="history-item"
        >
          <text class="h-scenario">{{ h.scenario }}</text>
          <text class="h-winner">🎯 天选：【{{ h.winner }}】</text>
        </view>
      </view>
    </view>

    <!-- 胜出中奖弹窗 -->
    <view v-if="winnerModal" class="modal-overlay" @click.self="winnerModal = false">
      <view class="winner-card">
        <text class="winner-emoji">🎉💥</text>
        <text class="winner-title">恭喜天选受害者诞生！</text>
        <text class="winner-scenario">{{ currentResult?.scenario }}</text>
        <view class="winner-box">
          <text class="winner-name">👉 {{ currentResult?.winner }} 👈</text>
        </view>
        <text class="winner-banter">愿赌服输，室友们在此为你摇旗呐喊！</text>
        <button class="confirm-btn" @click="winnerModal = false">服从命运安排 🤝</button>
      </view>
    </view>

    <!-- 新增场景弹窗 -->
    <view v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <view class="add-card">
        <text class="add-title">新增决策场景</text>
        <input
          v-model="newScenarioName"
          class="add-input"
          placeholder="例如: 🍟 谁去食堂买夜宵"
        />
        <view class="add-actions">
          <button class="cancel-btn" @click="showAddModal = false">取消</button>
          <button class="add-confirm-btn" @click="handleAddScenario">确定添加</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWheelStore, type SpinResult } from '../../stores/wheel';
import { ALL_PRESET_ROLES } from '../../stores/room';

const wheelStore = useWheelStore();
const candidateList = ALL_PRESET_ROLES;

const currentRotation = ref(0);
const isSpinning = ref(false);
const winnerModal = ref(false);
const currentResult = ref<SpinResult | null>(null);

const showAddModal = ref(false);
const newScenarioName = ref('');

function handleStartSpin() {
  if (isSpinning.value) return;

  isSpinning.value = true;
  const roll = wheelStore.rollCandidate(candidateList);
  currentRotation.value += roll.targetRotation;

  setTimeout(() => {
    isSpinning.value = false;
    currentResult.value = wheelStore.spinHistory[0];
    winnerModal.value = true;
  }, 4600);
}

function handleAddScenario() {
  if (!newScenarioName.value.trim()) {
    uni.showToast({ title: '请输入场景名称', icon: 'none' });
    return;
  }
  try {
    wheelStore.addScenario(newScenarioName.value.trim());
    newScenarioName.value = '';
    showAddModal.value = false;
    uni.showToast({ title: '添加成功！', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message || '添加失败', icon: 'none' });
  }
}
</script>

<style lang="scss" scoped>
.wheel-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding: 30rpx 30rpx 80rpx;
  box-sizing: border-box;
}

.scenario-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);

  .section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .title {
      font-size: 28rpx;
      font-weight: bold;
      color: #2c3e50;
    }

    .add-btn {
      font-size: 24rpx;
      color: #0984e3;
      font-weight: 600;
    }
  }

  .scenario-scroll {
    white-space: nowrap;
    width: 100%;

    .scenario-list {
      display: flex;
      gap: 16rpx;

      .scenario-chip {
        display: inline-block;
        padding: 12rpx 28rpx;
        background: #f1f2f6;
        border-radius: 30rpx;
        font-size: 24rpx;
        color: #636e72;

        &.active {
          background: #ff7675;
          color: #ffffff;
          font-weight: bold;
        }
      }
    }
  }
}

.wheel-stage {
  position: relative;
  width: 580rpx;
  height: 580rpx;
  margin: 40rpx auto 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .pointer {
    position: absolute;
    top: -24rpx;
    font-size: 48rpx;
    color: #d63031;
    z-index: 10;
    text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
  }

  .wheel-disc {
    width: 560rpx;
    height: 560rpx;
    border-radius: 50%;
    border: 12rpx solid #fab1a0;
    background: conic-gradient(
      #ff7675 0deg 60deg,
      #ffeaa7 60deg 120deg,
      #55efc4 120deg 180deg,
      #74b9ff 180deg 240deg,
      #a29bfe 240deg 300deg,
      #fd79a8 300deg 360deg
    );
    position: relative;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.12);

    .sector-label {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      .sector-text {
        font-size: 26rpx;
        font-weight: 900;
        color: #2d3436;
        white-space: nowrap;
        text-shadow: 0 1rpx 4rpx rgba(255, 255, 255, 0.8);
      }
    }
  }

  .center-trigger {
    position: absolute;
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #d63031, #e17055);
    border: 6rpx solid #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.2);
    z-index: 5;
    cursor: pointer;

    .trigger-text {
      font-size: 32rpx;
      font-weight: 900;
      color: #ffffff;
    }
  }
}

.history-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);

  .history-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 20rpx;
    display: block;
  }

  .empty-history {
    font-size: 24rpx;
    color: #b2bec3;
    text-align: center;
    padding: 30rpx 0;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 14rpx;

    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
      border-radius: 12rpx;
      padding: 14rpx 20rpx;

      .h-scenario {
        font-size: 24rpx;
        color: #636e72;
      }
      .h-winner {
        font-size: 24rpx;
        font-weight: bold;
        color: #d63031;
      }
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  z-index: 1000;
}

.winner-card, .add-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 40rpx;
  width: 100%;
  max-width: 600rpx;
  text-align: center;

  .winner-emoji {
    font-size: 80rpx;
    margin-bottom: 12rpx;
    display: block;
  }

  .winner-title {
    font-size: 34rpx;
    font-weight: 900;
    color: #2d3436;
    margin-bottom: 10rpx;
    display: block;
  }

  .winner-scenario {
    font-size: 26rpx;
    color: #e17055;
    margin-bottom: 24rpx;
    display: block;
  }

  .winner-box {
    background: #ffeaa7;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;

    .winner-name {
      font-size: 44rpx;
      font-weight: 900;
      color: #d63031;
    }
  }

  .winner-banter {
    font-size: 24rpx;
    color: #7f8c8d;
    display: block;
    margin-bottom: 30rpx;
  }

  .confirm-btn {
    background: #ff7675;
    color: #ffffff;
    font-size: 28rpx;
    font-weight: bold;
    border-radius: 40rpx;
  }
}

.add-card {
  text-align: left;
  .add-title {
    font-size: 30rpx;
    font-weight: bold;
    margin-bottom: 24rpx;
    display: block;
  }

  .add-input {
    background: #f8f9fa;
    border: 1rpx solid #e2e8f0;
    border-radius: 14rpx;
    padding: 0 20rpx;
    height: 76rpx;
    margin-bottom: 30rpx;
    font-size: 26rpx;
  }

  .add-actions {
    display: flex;
    gap: 16rpx;

    .cancel-btn {
      flex: 1;
      background: #f1f2f6;
      border-radius: 30rpx;
      font-size: 26rpx;
    }
    .add-confirm-btn {
      flex: 1;
      background: #ff7675;
      color: #ffffff;
      border-radius: 30rpx;
      font-size: 26rpx;
      font-weight: bold;
    }
  }
}
</style>
