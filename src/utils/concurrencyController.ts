/**
 * 并发控制器
 * 用于控制同时进行的异步请求数量，防止API过载
 */

interface QueuedTask<T> {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
}

export class ConcurrencyController {
  private readonly maxConcurrency: number;
  private currentConcurrency: number = 0;
  private queue: QueuedTask<any>[] = [];

  constructor(maxConcurrency: number = 10) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * 添加任务到队列并执行
   * @param task 要执行的异步任务
   * @returns Promise 返回任务结果
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedTask: QueuedTask<T> = {
        task,
        resolve,
        reject
      };

      this.queue.push(queuedTask);
      this.processQueue();
    });
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue(): Promise<void> {
    // 如果当前并发数已达到最大值，或队列为空，则不处理
    if (this.currentConcurrency >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    // 从队列中取出一个任务
    const queuedTask = this.queue.shift();
    if (!queuedTask) {
      return;
    }

    // 增加当前并发计数
    this.currentConcurrency++;

    try {
      console.log(`[ConcurrencyController] 执行任务，当前并发: ${this.currentConcurrency}/${this.maxConcurrency}, 队列长度: ${this.queue.length}`);
      
      // 执行任务
      const result = await queuedTask.task();
      queuedTask.resolve(result);
    } catch (error) {
      console.error(`[ConcurrencyController] 任务执行失败:`, error);
      queuedTask.reject(error);
    } finally {
      // 减少当前并发计数
      this.currentConcurrency--;
      
      console.log(`[ConcurrencyController] 任务完成，当前并发: ${this.currentConcurrency}/${this.maxConcurrency}, 队列长度: ${this.queue.length}`);
      
      // 继续处理队列中的下一个任务
      this.processQueue();
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): { currentConcurrency: number; maxConcurrency: number; queueLength: number } {
    return {
      currentConcurrency: this.currentConcurrency,
      maxConcurrency: this.maxConcurrency,
      queueLength: this.queue.length
    };
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.queue.forEach(task => {
      task.reject(new Error('队列已被清空'));
    });
    this.queue = [];
  }

  /**
   * 等待所有任务完成
   */
  async waitForCompletion(): Promise<void> {
    while (this.currentConcurrency > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * 批量执行任务的辅助函数
 * @param tasks 任务数组
 * @param maxConcurrency 最大并发数
 * @returns Promise 返回所有任务的结果
 */
export async function executeConcurrently<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency: number = 10
): Promise<(T | null)[]> {
  const controller = new ConcurrencyController(maxConcurrency);
  const results: (T | null)[] = [];

  console.log(`[ConcurrencyController] 开始批量执行 ${tasks.length} 个任务，最大并发: ${maxConcurrency}`);

  // 将所有任务添加到并发控制器
  const promises = tasks.map(async (task, index) => {
    try {
      const result = await controller.execute(task);
      results[index] = result;
      return result;
    } catch (error) {
      console.error(`[ConcurrencyController] 任务 ${index} 执行失败:`, error);
      results[index] = null;
      return null;
    }
  });

  // 等待所有任务完成
  await Promise.all(promises);

  console.log(`[ConcurrencyController] 批量任务执行完成，成功: ${results.filter(r => r !== null).length}/${tasks.length}`);

  return results;
}

// 创建全局并发控制器实例
export const globalConcurrencyController = new ConcurrencyController(10);

/**
 * 带重试机制的并发执行
 * @param task 要执行的任务
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟（毫秒）
 * @returns Promise 返回任务结果
 */
export async function executeWithRetry<T>(
  task: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  return globalConcurrencyController.execute(async () => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await task();
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.warn(`[ConcurrencyController] 任务执行失败，${retryDelay}ms 后重试 (${attempt + 1}/${maxRetries}):`, error);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError;
  });
}