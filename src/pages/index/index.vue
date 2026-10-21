<template>
  <view class="home-container">
    <!-- 顶部寝室专属看板 -->
    <view class="dorm-header">
      <view class="header-main">
        <view class="dorm-title-row">
          <text class="dorm-name">{{ currentRoomCode }} 沙雕大本营</text>
          <text class="gate-link" @click="goToGate">🚪 门禁</text>
        </view>
        <view class="user-pill" v-if="roomStore.currentMember">
          <text class="role-tag">【{{ roomStore.currentMember.roleName }}】</text>
        </view>
      </view>

      <!-- 快捷入口卡片组 -->
      <view class="quick-navs">
        <view class="nav-chip" @click="goToSlang">
          <text class="chip-icon">📜</text>
          <text class="chip-text">黑话词典</text>
        </view>
        <view class="nav-chip" @click="goToWheel">
          <text class="chip-icon">🎡</text>
          <text class="chip-text">命运转盘</text>
        </view>
        <view class="nav-chip" @click="goToRecap">
          <text class="chip-icon">🗞️</text>
          <text class="chip-text">黑料小报</text>
        </view>
      </view>

      <!-- 今日金句墙轮播 Banner -->
      <view v-if="slangStore.topQuote" class="quote-banner" @click="goToSlang">
        <text class="quote-icon">💬</text>
        <view class="quote-content">
          <text class="quote-title">今日寝室金句：</text>
          <text class="quote-body">“{{ slangStore.topQuote.content }}”</text>
          <text class="quote-by">—— {{ slangStore.topQuote.speakerRole }}</text>
        </view>
        <text class="quote-arrow">➔</text>
      </view>
    </view>

    <!-- 分类标签筛选栏 -->
    <scroll-view scroll-x class="tag-bar-scroll" :show-scrollbar="false">
      <view class="tag-bar">
        <view
          v-for="tag in allFilterTags"
          :key="tag"
          class="tag-item"
          :class="{ active: postStore.activeTag === tag }"
          @click="handleSelectTag(tag)"
        >
          {{ tag }}
        </view>
      </view>
    </scroll-view>

    <!-- 动态瀑布时间线 -->
    <view class="feed-list">
      <view v-if="postStore.loading" class="loading-state">
        <text class="loading-text">正在打捞寝室黑料中...</text>
      </view>

      <view v-else-if="postStore.posts.length === 0" class="empty-state">
        <view class="empty-emoji">🛌💤</view>
        <text class="empty-title">当前分类暂无离谱记录</text>
        <text class="empty-desc">寝室今天如此安静？难道没人说梦话或偷吃夜宵吗？</text>
        <button class="empty-btn" @click="goToEditor">去记下第一笔沙雕事 ✍️</button>
      </view>

      <view v-else>
        <PostCard
          v-for="item in postStore.posts"
          :key="item.id"
          :post="item"
        />
      </view>
    </view>

    <!-- 底部悬浮发布按钮 (FAB) -->
    <view class="fab-btn" @click="goToEditor">
      <text class="fab-icon">➕</text>
      <text class="fab-text">记一笔</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useRoomStore } from '../../stores/room';
import { usePostStore, POST_TAGS } from '../../stores/post';
import { useSlangStore } from '../../stores/slang';
import PostCard from '../../components/PostCard.vue';

const roomStore = useRoomStore();
const postStore = usePostStore();
const slangStore = useSlangStore();

const allFilterTags = POST_TAGS;

const currentRoomCode = computed(() => {
  return roomStore.currentRoom ? roomStore.currentRoom.roomCode : '4#304';
});

const currentDormId = computed(() => {
  return roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
});

onMounted(async () => {
  await roomStore.initSession();
  await postStore.loadPosts(currentDormId.value);
  await slangStore.loadQuotes(currentDormId.value);
});

onShow(async () => {
  await postStore.loadPosts(currentDormId.value);
  await slangStore.loadQuotes(currentDormId.value);
});

function handleSelectTag(tag: string) {
  postStore.switchTag(tag, currentDormId.value);
}

function goToGate() {
  uni.navigateTo({ url: '/pages/gate/index' });
}

function goToEditor() {
  uni.navigateTo({ url: '/pages/post-editor/index' });
}

function goToSlang() {
  uni.navigateTo({ url: '/pages/slang-dict/index' });
}

function goToWheel() {
  uni.navigateTo({ url: '/pages/fortune-wheel/index' });
}

function goToRecap() {
  uni.navigateTo({ url: '/pages/recap/index' });
}
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding-bottom: 160rpx;
}

.dorm-header {
  background: linear-gradient(180deg, #ffffff 0%, #fffbfb 100%);
  padding: 30rpx 30rpx 20rpx;
  border-bottom: 1rpx solid #f1f2f6;

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .dorm-title-row {
      display: flex;
      align-items: center;
      gap: 16rpx;

      .dorm-name {
        font-size: 36rpx;
        font-weight: 900;
        color: #2c3e50;
      }

      .gate-link {
        font-size: 22rpx;
        color: #0984e3;
        background: #e3f2fd;
        padding: 4rpx 14rpx;
        border-radius: 20rpx;
      }
    }

    .user-pill {
      .role-tag {
        font-size: 22rpx;
        color: #d63031;
        font-weight: bold;
        background: #ffeaa7;
        padding: 6rpx 16rpx;
        border-radius: 30rpx;
      }
    }
  }

  .quick-navs {
    display: flex;
    gap: 16rpx;
    margin-bottom: 20rpx;

    .nav-chip {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      background: #f8f9fa;
      border: 1rpx solid #e9ecef;
      padding: 12rpx 0;
      border-radius: 18rpx;

      .chip-icon {
        font-size: 26rpx;
      }
      .chip-text {
        font-size: 22rpx;
        font-weight: 600;
        color: #2d3436;
      }
    }
  }

  .quote-banner {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: #fff9e6;
    border-left: 8rpx solid #f39c12;
    border-radius: 14rpx;
    padding: 16rpx 20rpx;

    .quote-icon {
      font-size: 32rpx;
    }

    .quote-content {
      flex: 1;
      overflow: hidden;

      .quote-title {
        font-size: 20rpx;
        color: #e67e22;
        font-weight: bold;
        display: block;
      }

      .quote-body {
        font-size: 24rpx;
        color: #2d3436;
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: block;
      }

      .quote-by {
        font-size: 20rpx;
        color: #7f8c8d;
      }
    }

    .quote-arrow {
      font-size: 24rpx;
      color: #b2bec3;
    }
  }
}

.tag-bar-scroll {
  white-space: nowrap;
  width: 100%;
  background: #ffffff;
  padding: 16rpx 20rpx;
  box-sizing: border-box;
  border-bottom: 1rpx solid #f1f2f6;

  .tag-bar {
    display: flex;
    gap: 16rpx;

    .tag-item {
      display: inline-block;
      padding: 10rpx 26rpx;
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

.feed-list {
  padding: 24rpx 30rpx;

  .loading-state {
    text-align: center;
    padding: 60rpx;
    .loading-text {
      font-size: 26rpx;
      color: #a4b0be;
    }
  }

  .empty-state {
    text-align: center;
    padding: 100rpx 40rpx;

    .empty-emoji {
      font-size: 100rpx;
      margin-bottom: 20rpx;
    }

    .empty-title {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      color: #2f3640;
      margin-bottom: 12rpx;
    }

    .empty-desc {
      display: block;
      font-size: 24rpx;
      color: #a4b0be;
      margin-bottom: 30rpx;
    }

    .empty-btn {
      display: inline-block;
      background: #ff7675;
      color: #ffffff;
      font-size: 26rpx;
      font-weight: bold;
      border-radius: 40rpx;
      padding: 0 40rpx;
      height: 70rpx;
      line-height: 70rpx;
    }
  }
}

.fab-btn {
  position: fixed;
  bottom: 50rpx;
  right: 40rpx;
  background: linear-gradient(135deg, #ff7675, #d63031);
  color: #ffffff;
  padding: 16rpx 36rpx;
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  box-shadow: 0 10rpx 24rpx rgba(214, 48, 49, 0.4);
  z-index: 999;

  .fab-icon {
    font-size: 32rpx;
    font-weight: bold;
  }
  .fab-text {
    font-size: 28rpx;
    font-weight: bold;
  }
}
</style>
