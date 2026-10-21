import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storageAdapter } from '../api';
import type { SlangQuote } from '../types';

export const useSlangStore = defineStore('slang', () => {
  const quotes = ref<SlangQuote[]>([]);
  const loading = ref(false);

  const topQuote = computed(() => {
    return quotes.value.length > 0 ? quotes.value[0] : null;
  });

  async function loadQuotes(dormId: string) {
    loading.value = true;
    try {
      quotes.value = await storageAdapter.getSlangQuotes(dormId);
    } finally {
      loading.value = false;
    }
  }

  async function addQuote(payload: {
    dormId: string;
    content: string;
    speakerRole: string;
    explanation?: string;
  }) {
    if (!payload.content.trim()) throw new Error('金句内容不能为空');
    if (!payload.speakerRole.trim()) throw new Error('请指定说话人/当事人');

    const newQuote: SlangQuote = {
      id: 'slang_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      dormId: payload.dormId,
      content: payload.content.trim(),
      speakerRole: payload.speakerRole.trim(),
      explanation: payload.explanation?.trim() || '',
      likesCount: 1,
      createdAt: Date.now(),
    };

    const saved = await storageAdapter.addSlangQuote(newQuote);
    quotes.value.unshift(saved);
    return saved;
  }

  async function likeQuote(dormId: string, quoteId: string) {
    const target = quotes.value.find((q) => q.id === quoteId);
    if (target) {
      target.likesCount += 1;
    }
    await storageAdapter.likeSlangQuote(dormId, quoteId);
  }

  return {
    quotes,
    loading,
    topQuote,
    loadQuotes,
    addQuote,
    likeQuote,
  };
});
