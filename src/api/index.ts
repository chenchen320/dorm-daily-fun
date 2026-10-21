import { MockStorageAdapter } from './MockStorageAdapter';
import type { IStorageAdapter } from './IStorageAdapter';

// 工厂模式：根据环境变量无缝切换 Mock 与云端 BaaS
export const storageAdapter: IStorageAdapter = new MockStorageAdapter();
