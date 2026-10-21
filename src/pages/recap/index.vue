<template>
  <view class="recap-container">
    <!-- 复古报纸主体卡片 -->
    <view class="newspaper-card">
      <!-- 报头 -->
      <view class="paper-header">
        <view class="masthead">
          <text class="masthead-title">🗞️ 4#304 沙雕黑料小报</text>
          <text class="edition-no">特刊第 001 期 · 内部绝密档案</text>
        </view>
        <view class="header-divider"></view>
      </view>

      <!-- 核心数据通报 -->
      <view class="stats-row">
        <view class="stat-box">
          <text class="num">{{ stats.dormDays }}</text>
          <text class="lbl">建立天数</text>
        </view>
        <view class="stat-box">
          <text class="num">{{ stats.totalPosts }}</text>
          <text class="lbl">累计留档</text>
        </view>
        <view class="stat-box">
          <text class="num">{{ stats.totalReactions }}</text>
          <text class="lbl">笑喷点赞</text>
        </view>
        <view class="stat-box">
          <text class="num">{{ stats.totalSlangs }}</text>
          <text class="lbl">产出黑话</text>
        </view>
      </view>

      <!-- 特别头条：年度受害王颁奖 -->
      <view class="headline-award">
        <view class="award-badge">🏆 4#304 年度受害之王</view>
        <text class="winner-name">【{{ stats.mostVictim.role }}】</text>
        <text class="award-reason">
          累计被室友 @当事人 抓包现场高达 {{ stats.mostVictim.count }} 次，全寝公认快乐源泉担当！
        </text>
      </view>

      <!-- TOP 3 沙雕名场面排行 -->
      <view class="ranking-section">
        <text class="section-title">🔥 最高沙雕核爆事件 TOP 3</text>
        <view class="ranking-list">
          <view
            v-for="(p, index) in stats.topPosts"
            :key="p.id"
            class="rank-item"
          >
            <view class="rank-badge" :class="`top-${index + 1}`">
              {{ index + 1 }}
            </view>
            <view class="rank-info">
              <view class="rank-meta">
                <text class="tag">[{{ p.tag }}]</text>
                <text class="author">记录人：{{ p.authorName }}</text>
                <text class="stars">{{ '⭐'.repeat(p.funnyLevel) }}</text>
              </view>
              <text class="rank-text">“{{ p.content }}”</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 镇寝神句引言 -->
      <view v-if="stats.topSlang" class="golden-quote">
        <text class="golden-title">👑 本期镇寝金句：</text>
        <text class="golden-body">“{{ stats.topSlang.content }}”</text>
        <text class="golden-author">—— 出自：{{ stats.topSlang.speakerRole }}</text>
      </view>

      <!-- 报纸底注 -->
      <view class="paper-footer">
        <text class="footer-seal">4#304沙雕组委会·权威存证</text>
        <text class="footer-time">{{ currentDateStr }}</text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="action-box">
      <button class="share-btn" @click="handleShareTip">
        📸 截屏发寝室群互相嘲笑
      </button>
      <button class="back-btn" @click="goBack">返回大本营</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoomStore } from '../../stores/room';
import { usePostStore } from '../../stores/post';
import { useSlangStore } from '../../stores/slang';
import { generateRecapStats, type RecapStats } from '../../utils/recapHelper';

const roomStore = useRoomStore();
const postStore = usePostStore();
const slangStore = useSlangStore();

const currentDateStr = new Date().toLocaleDateString('zh-CN');

const stats = ref<RecapStats>({
  totalPosts: 0,
  totalReactions: 0,
  totalSlangs: 0,
  dormDays: 1,
  mostVictim: { role: '暂无', count: 0 },
  topPosts: [],
  topSlang: null,
});

onMounted(async () => {
  const dormId = roomStore.currentRoom ? roomStore.currentRoom.id : 'dorm_4_304';
  await postStore.loadPosts(dormId);
  await slangStore.loadQuotes(dormId);

  stats.value = generateRecapStats(
    postStore.posts,
    slangStore.quotes,
    roomStore.currentRoom
  );
});

function handleShareTip() {
  uni.showModal({
    title: '截屏分享提示',
    content: '直接使用手机截屏当前页面，即可将本期4#304黑料小报发送到微信群！',
    showCancel: false,
    confirmText: '我知道了',
  });
}

function goBack() {
  uni.navigateBack();
}
</script>

<style lang="scss" scoped>
.recap-container {
  min-height: 100vh;
  background-color: #e5e5e5;
  padding: 30rpx 30rpx 80rpx;
  box-sizing: border-box;
}

.newspaper-card {
  background: #fdfaf4;
  border: 4rpx solid #2d3436;
  border-radius: 16rpx;
  padding: 36rpx;
  box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.15);

  .paper-header {
    text-align: center;
    margin-bottom: 24rpx;

    .masthead-title {
      font-size: 42rpx;
      font-weight: 900;
      color: #2d3436;
      display: block;
      letter-spacing: 2rpx;
      font-family: serif, sans-serif;
    }

    .edition-no {
      font-size: 20rpx;
      color: #636e72;
      display: block;
      margin-top: 6rpx;
    }

    .header-divider {
      height: 4rpx;
      background: #2d3436;
      margin-top: 16rpx;
      border-top: 2rpx solid #2d3436;
      border-bottom: 2rpx solid #2d3436;
    }
  }

  .stats-row {
    display: flex;
    justify-content: space-around;
    background: #f4ece1;
    border: 2rpx solid #d2b48c;
    border-radius: 12rpx;
    padding: 16rpx 0;
    margin-bottom: 28rpx;

    .stat-box {
      text-align: center;

      .num {
        font-size: 32rpx;
        font-weight: 900;
        color: #d63031;
        display: block;
      }
      .lbl {
        font-size: 20rpx;
        color: #7f8c8d;
      }
    }
  }

  .headline-award {
    background: #fff0f0;
    border: 2rpx dashed #ff7675;
    border-radius: 16rpx;
    padding: 24rpx;
    text-align: center;
    margin-bottom: 28rpx;

    .award-badge {
      display: inline-block;
      background: #d63031;
      color: #ffffff;
      font-size: 22rpx;
      font-weight: bold;
      padding: 6rpx 20rpx;
      border-radius: 20rpx;
      margin-bottom: 12rpx;
    }

    .winner-name {
      font-size: 44rpx;
      font-weight: 900;
      color: #2d3436;
      display: block;
      margin-bottom: 8rpx;
    }

    .award-reason {
      font-size: 24rpx;
      color: #636e72;
      line-height: 1.4;
      display: block;
    }
  }

  .ranking-section {
    margin-bottom: 28rpx;

    .section-title {
      font-size: 28rpx;
      font-weight: 900;
      color: #2d3436;
      margin-bottom: 16rpx;
      display: block;
      border-left: 6rpx solid #d63031;
      padding-left: 12rpx;
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 16rpx;

      .rank-item {
        display: flex;
        gap: 16rpx;
        background: #ffffff;
        border: 1rpx solid #e2e8f0;
        border-radius: 12rpx;
        padding: 16rpx;

        .rank-badge {
          width: 44rpx;
          height: 44rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24rpx;
          font-weight: 900;
          color: #ffffff;
          background: #b2bec3;

          &.top-1 { background: #f1c40f; }
          &.top-2 { background: #95a5a6; }
          &.top-3 { background: #e67e22; }
        }

        .rank-info {
          flex: 1;

          .rank-meta {
            display: flex;
            align-items: center;
            gap: 10rpx;
            margin-bottom: 6rpx;

            .tag {
              font-size: 20rpx;
              color: #d63031;
              font-weight: bold;
            }
            .author {
              font-size: 20rpx;
              color: #7f8c8d;
            }
            .stars {
              font-size: 18rpx;
            }
          }

          .rank-text {
            font-size: 24rpx;
            color: #2d3436;
            line-height: 1.4;
          }
        }
      }
    }
  }

  .golden-quote {
    background: #fdf2e9;
    border: 2rpx solid #f5cba7;
    border-radius: 12rpx;
    padding: 18rpx;
    margin-bottom: 24rpx;

    .golden-title {
      font-size: 22rpx;
      font-weight: bold;
      color: #d35400;
      display: block;
      margin-bottom: 6rpx;
    }

    .golden-body {
      font-size: 28rpx;
      font-weight: 900;
      color: #2d3436;
      display: block;
      margin-bottom: 6rpx;
    }

    .golden-author {
      font-size: 20rpx;
      color: #7f8c8d;
      text-align: right;
      display: block;
    }
  }

  .paper-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2rpx dashed #b2bec3;
    padding-top: 16rpx;

    .footer-seal {
      font-size: 20rpx;
      color: #e74c3c;
      font-weight: bold;
      border: 1rpx solid #e74c3c;
      padding: 2rpx 8rpx;
    }
    .footer-time {
      font-size: 20rpx;
      color: #95a5a6;
    }
  }
}

.action-box {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 36rpx;

  .share-btn {
    background: linear-gradient(135deg, #ff7675, #d63031);
    color: #ffffff;
    font-weight: bold;
    font-size: 30rpx;
    border-radius: 50rpx;
  }

  .back-btn {
    background: #ffffff;
    border: 2rpx solid #dcdde1;
    color: #636e72;
    border-radius: 50rpx;
    font-size: 28rpx;
  }
}
</style>
