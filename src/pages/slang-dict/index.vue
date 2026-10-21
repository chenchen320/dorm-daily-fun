<template>
  <view class="dict-container">
    <!-- 顶部高赞金句 Banner -->
    <view v-if="slangStore.topQuote" class="hero-quote">
      <view class="badge-row">
        <text class="top-tag">👑 今日镇寝神句 TOP 1</text>
        <text class="likes">❤️ {{ slangStore.topQuote.likesCount }} 膜拜</text>
      </view>
      <text class="quote-text">“{{ slangStore.topQuote.content }}”</text>
      <view class="quote-author">
        <text class="speaker">—— {{ slangStore.topQuote.speakerRole }}</text>
      </view>
      <text v-if="slangStore.topQuote.explanation" class="quote-exp">
        典故：{{ slangStore.topQuote.explanation }}
      </text>
    </view>

    <!-- 列表标题与新增入口 -->
    <view class="section-bar">
      <text class="title">📜 4#304 独家黑话词条库 ({{ slangStore.quotes.length }})</text>
      <text class="add-link" @click="showAddModal = true">➕ 录入黑话</text>
    </view>

    <!-- 黑话卡片瀑布流 -->
    <view class="quotes-list">
      <view
        v-for="(item, index) in slangStore.quotes"
        :key="item.id"
        class="quote-card"
      >
        <view class="card-left">
          <text class="rank-index">#{{ index + 1 }}</text>
          <view class="quote-main">
            <text class="content">“{{ item.content }}”</text>
            <view class="speaker-row">
              <text class="speaker-pill">🗣️ {{ item.speakerRole }}</text>
              <text class="time">{{ formatTime(item.createdAt) }}</text>
            </view>
            <text v-if="item.explanation" class="explanation">
              💡 释义：{{ item.explanation }}
            </text>
          </view>
        </view>

        <view class="card-right">
          <view class="like-btn" @click="handleLike(item.id)">
            <text class="heart">❤️</text>
            <text class="like-num">{{ item.likesCount }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 录入新黑话弹窗 -->
    <view v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <view class="modal-card">
        <text class="modal-title">✍️ 收录寝室新黑话 / 暴论</text>

        <view class="input-item">
          <text class="input-label">金句正文：</text>
          <input
            v-model="newContent"
            class="input-field"
            placeholder="例如: 谁信谁小狗"
          />
        </view>

        <view class="input-item">
          <text class="input-label">发源当事人：</text>
          <view class="roles-chips">
            <view
              v-for="r in allRoles"
              :key="r"
              class="role-chip"
              :class="{ selected: newSpeaker === r }"
              @click="newSpeaker = r"
            >
              {{ r }}
            </view>
          </view>
        </view>

        <view class="input-item">
          <text class="input-label">黑话典故/释义（选填）：</text>
          <textarea
            v-model="newExplanation"
            class="textarea-field"
            placeholder="交代一下这句话是在什么离谱场景下诞生的..."
          />
        </view>

        <view class="modal-actions">
          <button class="cancel-btn" @click="showAddModal = false">取消</button>
          <button class="confirm-btn" :loading="isSubmitting" @click="handleCreate">
            收录入库 🚀
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoomStore, ALL_PRESET_ROLES } from '../../stores/room';
import { useSlangStore } from '../../stores/slang';

const roomStore = useRoomStore();
const slangStore = useSlangStore();

const allRoles = ALL_PRESET_ROLES;

const showAddModal = ref(false);
const newContent = ref('');
const newSpeaker = ref('王晨');
const newExplanation = ref('');
const isSubmitting = ref(false);

onMounted(async () => {
  const dormId = roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
  await slangStore.loadQuotes(dormId);
});

async function handleLike(quoteId: string) {
  const dormId = roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
  await slangStore.likeQuote(dormId, quoteId);
}

async function handleCreate() {
  if (!newContent.value.trim()) {
    uni.showToast({ title: '请输入金句正文', icon: 'none' });
    return;
  }

  isSubmitting.value = true;
  try {
    const dormId = roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
    await slangStore.addQuote({
      dormId,
      content: newContent.value,
      speakerRole: newSpeaker.value,
      explanation: newExplanation.value,
    });

    uni.showToast({ title: '收录成功！', icon: 'success' });
    newContent.value = '';
    newExplanation.value = '';
    showAddModal.value = false;
  } catch (err: any) {
    uni.showToast({ title: err.message || '录入失败', icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
}

function formatTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}
</script>

<style lang="scss" scoped>
.dict-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding: 30rpx 30rpx 80rpx;
  box-sizing: border-box;
}

.hero-quote {
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  border-radius: 28rpx;
  padding: 36rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(250, 177, 160, 0.35);

  .badge-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .top-tag {
      background: #d63031;
      color: #ffffff;
      font-size: 22rpx;
      font-weight: bold;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
    }

    .likes {
      font-size: 24rpx;
      font-weight: bold;
      color: #d63031;
    }
  }

  .quote-text {
    font-size: 36rpx;
    font-weight: 900;
    color: #2d3436;
    line-height: 1.5;
    display: block;
    margin-bottom: 16rpx;
  }

  .quote-author {
    text-align: right;
    margin-bottom: 16rpx;
    .speaker {
      font-size: 28rpx;
      font-weight: bold;
      color: #e17055;
    }
  }

  .quote-exp {
    font-size: 24rpx;
    color: #636e72;
    background: rgba(255, 255, 255, 0.6);
    padding: 12rpx 20rpx;
    border-radius: 14rpx;
    display: block;
  }
}

.section-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;

  .title {
    font-size: 30rpx;
    font-weight: bold;
    color: #2c3e50;
  }

  .add-link {
    font-size: 26rpx;
    color: #0984e3;
    font-weight: bold;
  }
}

.quotes-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .quote-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 28rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);

    .card-left {
      display: flex;
      gap: 20rpx;
      flex: 1;

      .rank-index {
        font-size: 32rpx;
        font-weight: 900;
        color: #b2bec3;
      }

      .quote-main {
        flex: 1;

        .content {
          font-size: 30rpx;
          font-weight: bold;
          color: #2d3436;
          display: block;
          margin-bottom: 10rpx;
        }

        .speaker-row {
          display: flex;
          align-items: center;
          gap: 16rpx;
          margin-bottom: 10rpx;

          .speaker-pill {
            background: #ffeaa7;
            color: #d35400;
            font-size: 22rpx;
            padding: 4rpx 14rpx;
            border-radius: 16rpx;
            font-weight: 600;
          }

          .time {
            font-size: 20rpx;
            color: #b2bec3;
          }
        }

        .explanation {
          font-size: 24rpx;
          color: #7f8c8d;
          line-height: 1.4;
          display: block;
        }
      }
    }

    .card-right {
      margin-left: 20rpx;

      .like-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #fff5f5;
        border: 2rpx solid #ffe3e3;
        border-radius: 20rpx;
        padding: 12rpx 20rpx;

        .heart {
          font-size: 32rpx;
        }
        .like-num {
          font-size: 22rpx;
          font-weight: bold;
          color: #e74c3c;
          margin-top: 4rpx;
        }
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  z-index: 1000;
}

.modal-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 36rpx;
  width: 100%;
  max-width: 650rpx;

  .modal-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #2c3e50;
    text-align: center;
    display: block;
    margin-bottom: 30rpx;
  }

  .input-item {
    margin-bottom: 24rpx;

    .input-label {
      font-size: 24rpx;
      color: #636e72;
      display: block;
      margin-bottom: 10rpx;
      font-weight: 600;
    }

    .input-field {
      background: #f8f9fa;
      height: 76rpx;
      border-radius: 14rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      border: 1rpx solid #e2e8f0;
    }

    .textarea-field {
      width: 100%;
      height: 140rpx;
      background: #f8f9fa;
      border-radius: 14rpx;
      padding: 16rpx 20rpx;
      font-size: 26rpx;
      border: 1rpx solid #e2e8f0;
      box-sizing: border-box;
    }

    .roles-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;

      .role-chip {
        padding: 8rpx 20rpx;
        background: #f1f2f6;
        border-radius: 20rpx;
        font-size: 24rpx;
        color: #485460;

        &.selected {
          background: #ff7675;
          color: #ffffff;
          font-weight: bold;
        }
      }
    }
  }

  .modal-actions {
    display: flex;
    gap: 20rpx;
    margin-top: 36rpx;

    .cancel-btn {
      flex: 1;
      background: #f1f2f6;
      color: #636e72;
      border-radius: 40rpx;
      font-size: 28rpx;
    }

    .confirm-btn {
      flex: 1;
      background: #ff7675;
      color: #ffffff;
      border-radius: 40rpx;
      font-size: 28rpx;
      font-weight: bold;
    }
  }
}
</style>
