import type { Post, SlangQuote, Room } from '../types';

export interface RecapStats {
  totalPosts: number;
  totalReactions: number;
  totalSlangs: number;
  dormDays: number;
  mostVictim: { role: string; count: number };
  topPosts: Post[];
  topSlang: SlangQuote | null;
}

export function generateRecapStats(
  posts: Post[],
  slangs: SlangQuote[],
  room: Room | null
): RecapStats {
  const totalPosts = posts.length;

  let totalReactions = 0;
  const victimCounts: Record<string, number> = {};

  posts.forEach((p) => {
    // 累加表情
    if (p.reactions) {
      Object.values(p.reactions).forEach((count) => {
        totalReactions += count;
      });
    }

    // 统计 @当事人
    if (p.targetGuyRoles) {
      p.targetGuyRoles.forEach((role) => {
        victimCounts[role] = (victimCounts[role] || 0) + 1;
      });
    }
  });

  // 计算年度受害王
  let maxVictimRole = '暂无';
  let maxCount = 0;
  Object.entries(victimCounts).forEach(([role, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxVictimRole = role;
    }
  });

  // 计算最高沙雕指数 TOP 3 (基于沙雕星级与表态热度综合加权)
  const sortedPosts = [...posts].sort((a, b) => {
    const scoreA = (a.funnyLevel || 1) * 3 + Object.values(a.reactions || {}).reduce((s, c) => s + c, 0);
    const scoreB = (b.funnyLevel || 1) * 3 + Object.values(b.reactions || {}).reduce((s, c) => s + c, 0);
    return scoreB - scoreA;
  });

  // 寝室建立天数
  const createdAt = room ? room.createdAt : Date.now() - 86400000 * 30;
  const dormDays = Math.max(1, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));

  return {
    totalPosts,
    totalReactions,
    totalSlangs: slangs.length,
    dormDays,
    mostVictim: { role: maxVictimRole, count: maxCount },
    topPosts: sortedPosts.slice(0, 3),
    topSlang: slangs.length > 0 ? slangs[0] : null,
  };
}
