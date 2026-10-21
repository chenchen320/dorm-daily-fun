import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface SpinResult {
  scenario: string;
  winner: string;
  timestamp: number;
}

export const useWheelStore = defineStore('wheel', () => {
  // 按照 PRD 用户指定定制的三大核心场景
  const scenarios = ref<string[]>([
    '🛠️ 谁来报修',
    '💡 谁下床关灯',
    '📦 谁帮忙拿快递',
  ]);

  const activeScenario = ref<string>('🛠️ 谁来报修');
  const spinHistory = ref<SpinResult[]>([]);
  const isSpinning = ref(false);

  function addScenario(newScenario: string) {
    if (!newScenario.trim()) throw new Error('场景名称不能为空');
    if (scenarios.value.includes(newScenario.trim())) {
      throw new Error('该场景已存在');
    }
    scenarios.value.push(newScenario.trim());
    activeScenario.value = newScenario.trim();
  }

  // 核心转盘随机决策算法
  function rollCandidate(candidates: string[]): { winner: string; index: number; targetRotation: number } {
    if (!candidates || candidates.length === 0) {
      throw new Error('候选室友名单不能为空');
    }

    const n = candidates.length;
    const selectedIndex = Math.floor(Math.random() * n);
    const winner = candidates[selectedIndex];

    // 每个扇区的夹角
    const sectorAngle = 360 / n;
    // 基础旋转圈数 (5~8圈) + 扇区中间位置角度偏移
    const baseRounds = 360 * (5 + Math.floor(Math.random() * 3));
    const targetAngle = baseRounds + (360 - (selectedIndex * sectorAngle + sectorAngle / 2));

    const result: SpinResult = {
      scenario: activeScenario.value,
      winner,
      timestamp: Date.now(),
    };
    spinHistory.value.unshift(result);

    return {
      winner,
      index: selectedIndex,
      targetRotation: targetAngle,
    };
  }

  return {
    scenarios,
    activeScenario,
    spinHistory,
    isSpinning,
    addScenario,
    rollCandidate,
  };
});
