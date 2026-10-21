<template>
  <view class="reaction-container">
    <!-- 四大快捷寝室表情 -->
    <view class="quick-bar">
      <view
        v-for="item in quickOptions"
        :key="item.emoji"
        class="reaction-btn"
        :class="{ active: isReacted(item.emoji) }"
        @click="handleReact(item.emoji)"
      >
        <text class="emoji">{{ item.emoji }}</text>
        <text class="label">{{ item.label }}</text>
        <text v-if="getCount(item.emoji) > 0" class="count">{{ getCount(item.emoji) }}</text>
      </view>

      <!-- 更多表情展开开关 -->
      <view class="more-toggle" @click="showMore = !showMore">
        <text class="toggle-icon">{{ showMore ? '✕' : '➕' }}</text>
      </view>
    </view>

    <!-- 展开的全量标准 Unicode 表情库 -->
    <view v-if="showMore" class="more-grid">
      <view
        v-for="emoji in moreEmojis"
        :key="emoji"
        class="emoji-item"
        :class="{ active: isReacted(emoji) }"
        @click="handleReact(emoji)"
      >
        <text class="grid-emoji">{{ emoji }}</text>
        <text v-if="getCount(emoji) > 0" class="grid-count">{{ getCount(emoji) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoomStore } from '../stores/room';
import { usePostStore } from '../stores/post';
import type { Post } from '../types';

const props = defineProps<{
  post: Post;
}>();

const roomStore = useRoomStore();
const postStore = usePostStore();

const showMore = ref(false);

const quickOptions = [
  { emoji: '🤣', label: '笑喷' },
  { emoji: '🤯', label: '逆天' },
  { emoji: '📁', label: '留档' },
  { emoji: '🚪', label: '开除' },
];

const moreEmojis = ['👋', '🤡', '💩', '💀', '🐂', '🍺', '💤', '🍔', '🥤', '🍗', '🏃', '👻', '🏆', '🔥', '💥', '🤝'];

function getCount(emoji: string): number {
  return props.post.reactions ? (props.post.reactions[emoji] || 0) : 0;
}

function isReacted(emoji: string): boolean {
  if (!props.post.reactedUsers || !props.post.reactedUsers[emoji]) return false;
  return props.post.reactedUsers[emoji].includes(roomStore.userOpenId);
}

async function handleReact(emoji: string) {
  const dormId = roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
  await postStore.toggleReaction(props.post.id, emoji, roomStore.userOpenId, dormId);
}
</script>

<style lang="scss" scoped>
.reaction-container {
  margin-top: 16rpx;
}

.quick-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;

  .reaction-btn {
    display: flex;
    align-items: center;
    gap: 6rpx;
    background: #f8f9fa;
    border: 2rpx solid #e9ecef;
    border-radius: 28rpx;
    padding: 8rpx 18rpx;
    transition: all 0.2s;

    .emoji {
      font-size: 26rpx;
    }
    .label {
      font-size: 22rpx;
      color: #636e72;
    }
    .count {
      font-size: 20rpx;
      font-weight: bold;
      color: #d63031;
      margin-left: 4rpx;
    }

    &.active {
      background: #ffeaa7;
      border-color: #fdcb6e;
      .label {
        color: #d35400;
        font-weight: bold;
      }
    }
  }

  .more-toggle {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    background: #f1f2f6;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid #dfe6e9;

    .toggle-icon {
      font-size: 24rpx;
      color: #636e72;
    }
  }
}

.more-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10rpx;
  background: #fdfdfd;
  border: 1rpx solid #f1f2f6;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-top: 14rpx;

  .emoji-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10rpx 0;
    border-radius: 12rpx;

    .grid-emoji {
      font-size: 32rpx;
    }

    .grid-count {
      font-size: 18rpx;
      color: #d63031;
      font-weight: bold;
    }

    &.active {
      background: #ffeaa7;
    }
  }
}
</style>
