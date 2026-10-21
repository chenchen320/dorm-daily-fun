<template>
  <view v-if="visible" class="modal-overlay" @click.self="close">
    <view class="modal-content">
      <!-- 弹窗顶栏 -->
      <view class="modal-header">
        <text class="title">💬 室友吐槽神评 ({{ comments.length }})</text>
        <text class="close-btn" @click="close">✕</text>
      </view>

      <!-- 评论列表 -->
      <scroll-view scroll-y class="comment-scroll">
        <view v-if="loading" class="empty-tip">加载中...</view>
        <view v-else-if="comments.length === 0" class="empty-tip">
          还没有室友来吐槽，快抢首发神评！
        </view>
        <view v-else class="comment-list">
          <view
            v-for="c in comments"
            :key="c.id"
            class="comment-item"
            :class="{ anonymous: c.isAnonymous }"
          >
            <image
              class="avatar"
              :src="c.isAnonymous ? '/static/logo.png' : (c.authorAvatar || '/static/logo.png')"
              mode="aspectFill"
            />
            <view class="comment-body">
              <view class="meta-row">
                <text class="author-name">{{ c.authorName }}</text>
                <text class="time">{{ formatTime(c.createdAt) }}</text>
              </view>
              <text class="text">{{ c.content }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部输入栏 -->
      <view class="input-bar">
        <view class="anon-toggle" @click="isAnonymous = !isAnonymous">
          <text class="anon-icon">{{ isAnonymous ? '🕵️' : '👤' }}</text>
          <text class="anon-label">{{ isAnonymous ? '匿名开启' : '实名吐槽' }}</text>
        </view>

        <input
          v-model="commentText"
          class="comment-input"
          placeholder="留下一句扎心神评..."
          maxlength="150"
          :confirm-type="'send'"
          @confirm="handleSend"
        />

        <button class="send-btn" :loading="isSending" @click="handleSend">发送</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoomStore } from '../stores/room';
import { usePostStore } from '../stores/post';
import type { Comment } from '../types';

const props = defineProps<{
  visible: boolean;
  postId: string;
  isParentPostAnonymous?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
}>();

const roomStore = useRoomStore();
const postStore = usePostStore();

const comments = ref<Comment[]>([]);
const commentText = ref('');
const isAnonymous = ref(false);
const loading = ref(false);
const isSending = ref(false);

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal && props.postId) {
      isAnonymous.value = !!props.isParentPostAnonymous;
      await loadComments();
    }
  }
);

async function loadComments() {
  loading.value = true;
  try {
    const dormId = roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
    comments.value = await postStore.fetchComments(props.postId, dormId);
  } finally {
    loading.value = false;
  }
}

async function handleSend() {
  if (!commentText.value.trim()) {
    uni.showToast({ title: '评论内容不能为空', icon: 'none' });
    return;
  }

  isSending.value = true;
  try {
    const dormId = roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
    const authorId = roomStore.currentMember ? roomStore.currentMember.id : 'anon_usr';
    const authorName = roomStore.currentMember ? roomStore.currentMember.roleName : '舍友';

    await postStore.submitComment({
      postId: props.postId,
      dormId,
      authorId,
      authorName,
      authorAvatar: roomStore.currentMember?.avatarUrl,
      isAnonymous: isAnonymous.value,
      content: commentText.value,
    });

    commentText.value = '';
    await loadComments();
  } catch (err: any) {
    uni.showToast({ title: err.message || '发送失败', icon: 'none' });
  } finally {
    isSending.value = false;
  }
}

function close() {
  emit('update:visible', false);
}

function formatTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-top-left-radius: 36rpx;
  border-top-right-radius: 36rpx;
  padding: 30rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
  max-height: 75vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f1f2f6;

  .title {
    font-size: 30rpx;
    font-weight: bold;
    color: #2c3e50;
  }

  .close-btn {
    font-size: 32rpx;
    color: #b2bec3;
    padding: 10rpx;
  }
}

.comment-scroll {
  flex: 1;
  max-height: 50vh;
  padding: 20rpx 0;

  .empty-tip {
    text-align: center;
    color: #b2bec3;
    padding: 60rpx 0;
    font-size: 26rpx;
  }

  .comment-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .comment-item {
      display: flex;
      gap: 16rpx;

      .avatar {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        background: #ffeaa7;
      }

      .comment-body {
        flex: 1;
        background: #f8f9fa;
        border-radius: 16rpx;
        padding: 14rpx 20rpx;

        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6rpx;

          .author-name {
            font-size: 24rpx;
            font-weight: bold;
            color: #2d3436;
          }
          .time {
            font-size: 20rpx;
            color: #b2bec3;
          }
        }

        .text {
          font-size: 26rpx;
          color: #2f3640;
          line-height: 1.5;
        }
      }

      &.anonymous {
        .comment-body {
          background: #f3e5f5;
          .author-name {
            color: #8e44ad;
          }
        }
      }
    }
  }
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-top: 1rpx solid #f1f2f6;
  padding-top: 16rpx;

  .anon-toggle {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 10rpx 14rpx;
    border-radius: 20rpx;
    background: #f1f2f6;

    .anon-icon {
      font-size: 24rpx;
    }
    .anon-label {
      font-size: 20rpx;
      color: #636e72;
    }
  }

  .comment-input {
    flex: 1;
    background: #f8f9fa;
    height: 72rpx;
    border-radius: 36rpx;
    padding: 0 24rpx;
    font-size: 26rpx;
    border: 1rpx solid #e2e8f0;
  }

  .send-btn {
    background: #ff7675;
    color: #ffffff;
    font-size: 26rpx;
    font-weight: bold;
    border-radius: 36rpx;
    height: 72rpx;
    line-height: 72rpx;
    padding: 0 30rpx;
  }
}
</style>
