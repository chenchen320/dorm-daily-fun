<template>
  <view class="editor-container">
    <!-- 头部模式提示 (匿名树洞模式专属通知) -->
    <view v-if="selectedTag === '来吐槽吧'" class="treehole-banner">
      <text class="banner-title">🕵️ 匿名树洞模式已激活</text>
      <text class="banner-desc">你的真实身份将被彻底封存，发布者将展示为【神秘室友】，评论亦全部匿名！</text>
    </view>

    <!-- 标签选择栏 -->
    <view class="section">
      <text class="section-title">选择事件分类：</text>
      <scroll-view scroll-x class="tag-scroll">
        <view class="tag-list">
          <view
            v-for="tag in allTags"
            :key="tag"
            class="tag-item"
            :class="{ active: selectedTag === tag }"
            @click="selectedTag = tag"
          >
            {{ tag }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 正文输入框 -->
    <view class="section input-section">
      <textarea
        v-model="content"
        class="content-textarea"
        placeholder="记录室友干了什么离谱的事、说了什么逆天暴论...（支持输入法Emoji表情）"
        maxlength="500"
        placeholder-class="placeholder"
      />
      <view class="word-counter">{{ content.length }}/500</view>
    </view>

    <!-- @当事人室友 -->
    <view class="section">
      <text class="section-title">@本次事件受害主角（可选）：</text>
      <view class="target-grid">
        <view
          v-for="guy in availableGuyRoles"
          :key="guy"
          class="target-chip"
          :class="{ selected: targetGuys.includes(guy) }"
          @click="toggleGuy(guy)"
        >
          @{{ guy }}
        </view>
      </view>
    </view>

    <!-- 沙雕指数打分 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">沙雕指数评级：</text>
        <text class="level-desc">{{ funnyLevelDesc }}</text>
      </view>
      <view class="star-picker">
        <text
          v-for="star in 5"
          :key="star"
          class="star-icon"
          :class="{ active: star <= funnyLevel }"
          @click="funnyLevel = star"
        >
          ⭐
        </text>
      </view>
    </view>

    <!-- 现场照片存证 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">现场照片存证（最多9张）：</text>
        <text class="image-counter">{{ images.length }}/9</text>
      </view>

      <view class="image-uploader">
        <view
          v-for="(img, idx) in images"
          :key="idx"
          class="upload-thumb"
        >
          <image class="thumb-img" :src="img" mode="aspectFill" />
          <view class="del-badge" @click="removeImage(idx)">✕</view>
        </view>

        <view
          v-if="images.length < 9"
          class="upload-btn"
          @click="chooseImages"
        >
          <text class="camera-icon">📷</text>
          <text class="upload-text">添加照片</text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-box">
      <button class="submit-btn" :loading="isSubmitting" @click="handleSubmit">
        立即留档发布 🚀
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoomStore, ALL_PRESET_ROLES } from '../../stores/room';
import { usePostStore } from '../../stores/post';
import type { PostTag } from '../../types';

const roomStore = useRoomStore();
const postStore = usePostStore();

const allTags: PostTag[] = [
  '宿舍搞笑日常',
  '黑话梗合集',
  '来吐槽吧',
  '梦话暴论',
  '外卖奇遇',
  '打呼连环',
  '破防时刻',
];

const selectedTag = ref<PostTag>('宿舍搞笑日常');
const content = ref('');
const targetGuys = ref<string[]>([]);
const funnyLevel = ref(5);
const images = ref<string[]>([]);
const isSubmitting = ref(false);

const availableGuyRoles = ALL_PRESET_ROLES;

const funnyLevelDesc = computed(() => {
  switch (funnyLevel.value) {
    case 1: return '1星: 寻常打卡';
    case 2: return '2星: 有点意思';
    case 3: return '3星: 当场笑喷';
    case 4: return '4星: 离了个大谱';
    case 5: return '5星: 逆天核爆级 💥';
    default: return '';
  }
});

function toggleGuy(guy: string) {
  const idx = targetGuys.value.indexOf(guy);
  if (idx >= 0) {
    targetGuys.value.splice(idx, 1);
  } else {
    targetGuys.value.push(guy);
  }
}

function chooseImages() {
  const remainCount = 9 - images.value.length;
  if (remainCount <= 0) return;

  uni.chooseImage({
    count: remainCount,
    sizeType: ['compressed'],
    success: (res) => {
      const paths = res.tempFilePaths as string[];
      // 检查单张大小 <= 5MB
      if (res.tempFiles) {
        for (const file of res.tempFiles as any[]) {
          if (file.size > 5 * 1024 * 1024) {
            uni.showToast({ title: '单张图片大小不能超过 5MB', icon: 'none' });
            return;
          }
        }
      }
      images.value.push(...paths);
    },
  });
}

function removeImage(idx: number) {
  images.value.splice(idx, 1);
}

async function handleSubmit() {
  if (!content.value.trim()) {
    uni.showToast({ title: '请填写事件正文', icon: 'none' });
    return;
  }

  const dormId = roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
  const authorId = roomStore.currentMember ? roomStore.currentMember.id : 'anonymous_id';
  const authorName = roomStore.currentMember ? roomStore.currentMember.roleName : '舍友';

  isSubmitting.value = true;
  try {
    await postStore.publishPost({
      dormId,
      authorId,
      authorName,
      authorAvatar: roomStore.currentMember?.avatarUrl,
      targetGuyRoles: targetGuys.value,
      content: content.value,
      images: images.value,
      funnyLevel: funnyLevel.value,
      tag: selectedTag.value,
    });

    uni.showToast({ title: '留档成功！', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 500);
  } catch (err: any) {
    uni.showModal({ title: '发布失败', content: err.message || '网络异常', showCancel: false });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.editor-container {
  min-height: 100vh;
  background-color: #f6f7fb;
  padding: 30rpx 30rpx 100rpx;
  box-sizing: border-box;
}

.treehole-banner {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  color: #ffffff;

  .banner-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    margin-bottom: 6rpx;
  }
  .banner-desc {
    font-size: 22rpx;
    opacity: 0.9;
  }
}

.section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
  }

  .section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #2d3436;
    margin-bottom: 16rpx;
    display: block;
  }

  .level-desc, .image-counter {
    font-size: 24rpx;
    color: #e17055;
    font-weight: 600;
  }
}

.tag-scroll {
  white-space: nowrap;
  width: 100%;

  .tag-list {
    display: flex;
    gap: 16rpx;

    .tag-item {
      display: inline-block;
      padding: 12rpx 28rpx;
      background: #f1f2f6;
      border-radius: 30rpx;
      font-size: 26rpx;
      color: #636e72;

      &.active {
        background: #ff7675;
        color: #ffffff;
        font-weight: bold;
      }
    }
  }
}

.input-section {
  position: relative;

  .content-textarea {
    width: 100%;
    height: 240rpx;
    font-size: 30rpx;
    line-height: 1.6;
    color: #2d3436;
  }

  .word-counter {
    text-align: right;
    font-size: 22rpx;
    color: #b2bec3;
  }
}

.target-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;

  .target-chip {
    padding: 10rpx 24rpx;
    background: #f8f9fa;
    border: 2rpx solid #e9ecef;
    border-radius: 30rpx;
    font-size: 26rpx;
    color: #485460;

    &.selected {
      background: #ffeaa7;
      border-color: #fdcb6e;
      color: #d35400;
      font-weight: bold;
    }
  }
}

.star-picker {
  display: flex;
  gap: 20rpx;
  font-size: 48rpx;

  .star-icon {
    opacity: 0.3;
    transition: opacity 0.2s;

    &.active {
      opacity: 1;
    }
  }
}

.image-uploader {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;

  .upload-thumb {
    position: relative;
    width: 100%;
    height: 190rpx;
    border-radius: 16rpx;
    overflow: hidden;

    .thumb-img {
      width: 100%;
      height: 100%;
    }

    .del-badge {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      width: 36rpx;
      height: 36rpx;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20rpx;
    }
  }

  .upload-btn {
    width: 100%;
    height: 190rpx;
    border-radius: 16rpx;
    border: 2rpx dashed #dcdde1;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;

    .camera-icon {
      font-size: 40rpx;
    }
    .upload-text {
      font-size: 22rpx;
      color: #a4b0be;
    }
  }
}

.submit-box {
  margin-top: 40rpx;

  .submit-btn {
    background: linear-gradient(135deg, #ff7675, #d63031);
    color: #ffffff;
    font-size: 32rpx;
    font-weight: bold;
    border-radius: 50rpx;
    height: 90rpx;
    line-height: 90rpx;
    box-shadow: 0 8rpx 20rpx rgba(214, 48, 49, 0.3);
  }
}
</style>
