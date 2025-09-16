# 并发控制实现文档

## 概述

为了防止API过载和优化性能，我们实现了一个并发控制系统来限制同时发送的HTTP请求数量。系统默认限制同一时间最多发送10个并发请求。

## 实现架构

### 核心组件

#### 1. ConcurrencyController 类 (`src/utils/concurrencyController.ts`)

```typescript
export class ConcurrencyController {
  private readonly maxConcurrency: number = 10;
  private currentConcurrency: number = 0;
  private queue: QueuedTask<any>[] = [];
  
  async execute<T>(task: () => Promise<T>): Promise<T>
  getStatus(): { currentConcurrency: number; maxConcurrency: number; queueLength: number }
  clearQueue(): void
  waitForCompletion(): Promise<void>
}
```

**主要功能：**
- 维护一个任务队列
- 控制同时执行的任务数量
- 自动处理任务排队和执行
- 提供状态监控和队列管理

#### 2. 批量执行函数 (`executeConcurrently`)

```typescript
async function executeConcurrently<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency: number = 10
): Promise<(T | null)[]>
```

**功能：**
- 批量执行多个异步任务
- 自动应用并发限制
- 收集所有任务结果（成功或失败）

#### 3. 重试机制函数 (`executeWithRetry`)

```typescript
async function executeWithRetry<T>(
  task: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T>
```

**功能：**
- 结合并发控制的重试机制
- 自动处理临时性网络错误
- 指数退避重试策略

## 应用场景

### 1. 历史同期数据获取

在 `openMeteoWeather.ts` 中：

```typescript
// 老方法：无并发控制，可能同时发送20+个请求
const promises = [];
for (let i = 0; i < years; i++) {
  promises.push(this.getHistoricalWeather(...));
}
await Promise.all(promises);

// 新方法：并发控制，最多同时10个请求
const tasks = [];
for (let i = 0; i < years; i++) {
  tasks.push(async () => this.getHistoricalWeather(...));
}
const results = await executeConcurrently(tasks, 10);
```

### 2. 月度温度趋势分析

在 `monthlyTemperatureService.ts` 中：

```typescript
// 获取多年数据时应用并发控制
const tasks = [];
for (let year = startYear; year <= endYear; year++) {
  tasks.push(() => this.getMonthlyTemperatureStats(...));
}
const results = await executeConcurrently(tasks, 10);
```

### 3. 年度温度概况计算

```typescript
// 12个月的数据并发获取，限制为6个并发
const monthTasks = [];
for (let month = 1; month <= 12; month++) {
  monthTasks.push(() => this.getMonthlyTemperatureTrends(...));
}
const results = await executeConcurrently(monthTasks, 6);
```

## 配置选项

### 全局配置

```typescript
// 创建全局并发控制器实例（最大并发10）
export const globalConcurrencyController = new ConcurrencyController(10);
```

### 局部配置

不同的操作可以使用不同的并发限制：

```typescript
// 高优先级操作：较高并发
await executeConcurrently(urgentTasks, 10);

// 批量后台操作：较低并发
await executeConcurrently(backgroundTasks, 5);

// 敏感操作：极低并发
await executeConcurrently(sensitiveTasks, 2);
```

## 监控和日志

系统提供详细的执行日志：

```
[ConcurrencyController] 执行任务，当前并发: 5/10, 队列长度: 15
[ConcurrencyController] 任务完成，当前并发: 4/10, 队列长度: 14
[OpenMeteoService] 准备获取 20 年的历史同期数据，使用并发控制
[OpenMeteoService] 成功获取 18/20 年的历史同期数据
[MonthlyTemperatureService] 准备获取 15 年的数据，使用并发控制
[MonthlyTemperatureService] 成功获取 15/15 年的数据
```

## 错误处理

### 1. 任务失败处理

```typescript
// 失败的任务返回null，不影响其他任务
const results = await executeConcurrently(tasks, 10);
const successfulResults = results.filter(r => r !== null);
```

### 2. 重试机制

```typescript
// 单个请求失败时自动重试
const data = await executeWithRetry(
  () => apiCall(),
  3,    // 最多重试3次
  1000  // 重试延迟1秒
);
```

### 3. 队列管理

```typescript
// 获取当前状态
const status = controller.getStatus();
console.log(`当前并发: ${status.currentConcurrency}/${status.maxConcurrency}`);
console.log(`队列长度: ${status.queueLength}`);

// 紧急情况下清空队列
controller.clearQueue();
```

## 性能优化

### 1. 减少API服务器压力
- 避免同时发送过多请求
- 防止触发API限流机制
- 减少服务器负载

### 2. 提升用户体验
- 避免浏览器连接限制
- 平衡加载速度和系统稳定性
- 保持界面响应性

### 3. 错误恢复
- 自动重试临时性错误
- 优雅处理网络波动
- 提供详细的错误信息

## 最佳实践

### 1. 选择合适的并发数

```typescript
// 轻量级请求：较高并发
await executeConcurrently(lightTasks, 15);

// 重型数据请求：中等并发
await executeConcurrently(heavyTasks, 8);

// 关键系统操作：低并发
await executeConcurrently(criticalTasks, 3);
```

### 2. 合理使用缓存

```typescript
// 先检查缓存，减少不必要的请求
const cached = cache.get(key);
if (cached) return cached;

// 只对未缓存的数据发送请求
const result = await executeWithRetry(() => apiCall());
cache.set(key, result, TTL);
```

### 3. 错误监控

```typescript
try {
  const results = await executeConcurrently(tasks, 10);
  const successRate = results.filter(r => r !== null).length / tasks.length;
  if (successRate < 0.8) {
    console.warn(`成功率较低: ${successRate * 100}%`);
  }
} catch (error) {
  console.error('批量任务执行失败:', error);
}
```

## 总结

并发控制系统显著提升了应用的稳定性和性能：

- **API友好**: 避免过载Open-Meteo免费API服务
- **用户体验**: 平衡加载速度和系统响应性  
- **错误处理**: 自动重试和优雅降级
- **监控能力**: 详细日志和状态监控
- **灵活配置**: 根据场景调整并发限制

该系统确保了月度温度分析功能在处理大量历史数据时的稳定性和效率。