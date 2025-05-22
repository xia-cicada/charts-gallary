import { get, set, del, keys, clear } from 'idb-keyval'

// 定义存储键名常量
const STORAGE_KEYS = {
  CHART_DATA: 'chart-data',
  CHART_CONFIG: 'chart-config',
  LAST_SAVED: 'last-saved',
} as const

type StorageKey = keyof typeof STORAGE_KEYS

export interface StoredChartData {
  title: string
  data: unknown
  links: unknown
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

class StorageService {
  // 获取存储键名
  private getKey(key: StorageKey): string {
    return STORAGE_KEYS[key]
  }

  // 保存图表数据
  async saveChartData(
    data: Omit<StoredChartData, 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const now = new Date().toISOString()
    const storedData: StoredChartData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    await set(this.getKey('CHART_DATA'), storedData)
    await set(this.getKey('LAST_SAVED'), now)
  }

  // 加载图表数据
  async loadChartData(): Promise<StoredChartData | undefined> {
    return get<StoredChartData>(this.getKey('CHART_DATA'))
  }

  // 删除图表数据
  async deleteChartData(): Promise<void> {
    await del(this.getKey('CHART_DATA'))
  }

  // 获取最后保存时间
  async getLastSavedTime(): Promise<string | undefined> {
    return get<string>(this.getKey('LAST_SAVED'))
  }

  // 列出所有存储的键
  async listKeys(): Promise<string[]> {
    return keys()
  }

  // 清空所有存储
  async clearAll(): Promise<void> {
    await clear()
  }
}

export const storageService = new StorageService()
