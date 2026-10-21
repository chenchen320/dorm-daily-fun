<template>
  <view class="post-card" :class="{ 'anonymous-card': post.isAnonymous }">
    <!-- 头部：发布人与身份 -->
    <view class="card-header">
      <view class="author-box">
        <image
          class="avatar"
          :src="post.isAnonymous ? '/static/logo.png' : (post.authorAvatar || '/static/logo.png')"
          mode="aspectFill"
        />
        <view class="author-meta">
          <view class="name-row">
            <text class="author-name">{{ post.authorName }}</text>
            <text class="tag-pill" :class="tagClass(post.tag)">{{ post.tag }}</text>
          </view>
          <text class="time-text">{{ formatTime(post.createdAt) }}</text>
        </view>
      </view>

      <!-- 沙雕指数评级 -->
      <view class="rating-box">
        <text class="stars">{{ '⭐'.repeat(post.funnyLevel) }}</text>
      </view>
    </view>

    <!-- @当事人 胶囊标签 -->
    <view v-if="post.targetGuyRoles && post.targetGuyRoles.length > 0" class="targets-row">
      <text class="target-label">受害主角：</text>
      <text v-for="guy in post.targetGuyRoles" :key="guy" class="target-pill">
        @{{ guy }}
      </text>
    </view>

    <!-- 正文内容 -->
    <view class="content-box">
      <text class="post-text">{{ post.content }}</text>
    </view>

    <!-- 九宫格配图 -->
    <view v-if="post.images && post.images.length > 0" class="image-gallery" :class="`grid-${gridSize}`">
      <image
        v-for="(img, idx) in post.images"
        :key="idx"
        class="post-img"
        :src="img"
        mode="aspectFill"
        @click="previewImg(idx)"
      />
    </view>

    <!-- 底部互动与状态栏 -->
    <view class="card-footer">
      <view class="reactions-summary">
        <text v-if="post.reactions['🤣']" class="reaction-tag">🤣 {{ post.reactions['🤣'] }}</text>
        <text v-if="post.reactions['🤯']" class="reaction-tag">🤯 {{ post.reactions['🤯'] }}</text>
        <text v-if="post.reactions['📁']" class="reaction-tag">📁 {{ post.reactions['📁'] }}</text>
        <text v-if="post.reactions['🚪']" class="reaction-tag">🚪 {{ post.reactions['🚪'] }}</text>
      </view>

      <view class="meta-right">
        <text class="comment-count">💬 {{ post.commentCount }} 吐槽</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Post } from '../types';

const props = defineProps<{
  post: Post;
}>();

const gridSize = computed(() => {
  const count = props.post.images ? props.post.images.length : 0;
  if (count === 1) return 1;
  if (count <= 4) return 2;
  return 3;
});

function tagClass(tag: string) {
  if (tag === '来吐槽吧') return 'tag-treehole';
  if (tag === '黑话梗合集') return 'tag-slang';
  if (tag === '梦话暴论') return 'tag-dream';
  return 'tag-default';
}

function formatTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

function previewImg(currentIdx: number) {
  if (!props.post.images || props.post.images.length === 0) return;
  uni.previewImage({
    current: currentIdx,
    urls: props.post.images,
  });
}
</script>

<style lang="scss" scoped>
.post-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 18rpx rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;

  &.anonymous-card {
    background: linear-gradient(180deg, #fbfaff 0%, #ffffff 40%);
    border-left: 8rpx solid #8e44ad;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;

  .author-box {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .avatar {
      width: 76rpx;
      height: 76rpx;
      border-radius: 50%;
      background: #fab1a0;
    }

    .author-meta {
      .name-row {
        display: flex;
        align-items: center;
        gap: 12rpx;

        .author-name {
          font-size: 28rpx;
          font-weight: bold;
          color: #2d3436;
        }

        .tag-pill {
          font-size: 20rpx;
          padding: 4rpx 14rpx;
          border-radius: 12rpx;
          font-weight: 500;

          &.tag-default {
            background: #ffeaa7;
            color: #d35400;
          }
          &.tag-treehole {
            background: #f3e5f5;
            color: #8e44ad;
          }
          &.tag-slang {
            background: #e8f5e9;
            color: #2e7d32;
          }
          &.tag-dream {
            background: #e3f2fd;
            color: #1565c0;
          }
        }
      }

      .time-text {
        font-size: 22rpx;
        color: #b2bec3;
      }
    }
  }

  .rating-box {
    .stars {
      font-size: 24rpx;
    }
  }
}

.targets-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 16rpx;

  .target-label {
    font-size: 22rpx;
    color: #e17055;
    font-weight: bold;
  }

  .target-pill {
    background: #ff7675;
    color: #ffffff;
    font-size: 22rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    font-weight: 600;
  }
}

.content-box {
  margin-bottom: 20rpx;
  .post-text {
    font-size: 30rpx;
    color: #2f3640;
    line-height: 1.6;
    word-break: break-all;
  }
}

.image-gallery {
  display: grid;
  gap: 12rpx;
  margin-bottom: 20rpx;

  &.grid-1 {
    grid-template-columns: 1fr;
    .post-img {
      width: 100%;
      height: 380rpx;
      border-radius: 16rpx;
    }
  }

  &.grid-2 {
    grid-template-columns: repeat(2, 1fr);
    .post-img {
      width: 100%;
      height: 220rpx;
      border-radius: 14rpx;
    }
  }

  &.grid-3 {
    grid-template-columns: repeat(3, 1fr);
    .post-img {
      width: 100%;
      height: 180rpx;
      border-radius: 12rpx;
    }
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #f1f2f6;
  padding-top: 16rpx;

  .reactions-summary {
    display: flex;
    gap: 12rpx;

    .reaction-tag {
      background: #f8f9fa;
      border: 1rpx solid #e9ecef;
      border-radius: 16rpx;
      padding: 4rpx 14rpx;
      font-size: 22rpx;
      color: #636e72;
    }
  }

  .meta-right {
    .comment-count {
      font-size: 22rpx;
      color: #95a5a6;
    }
  }
}
</style>
