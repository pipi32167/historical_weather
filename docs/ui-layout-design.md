# 历史气温数据分析平台 - UI布局设计文档

## 🎨 设计概览

### 设计原则
- **数据为王**: 图表和数据展示是核心，界面元素为其服务
- **直观交互**: 用户能够通过自然语言和可视化控件轻松查询数据
- **响应式设计**: 适配桌面、平板、手机等多种设备
- **性能优先**: 快速加载，流畅交互，优化大数据展示

### 设计风格
- **现代简约**: 干净的界面，充足的留白
- **科技感**: 深色主题可选，突出数据可视化
- **友好易用**: 温和的配色，清晰的层次结构

## 🏗️ 整体布局架构

### 主要布局模式

```
Desktop Layout (1200px+)
┌─────────────────────────────────────────────────────────────┐
│                        Header (60px)                        │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│   Sidebar       │            Main Content Area             │
│   (280px)       │               (Flexible)                 │
│                 │                                           │
│ • Quick Query   │  ┌─────────────────────────────────────┐  │
│ • Locations     │  │                                     │  │
│ • History       │  │        Chart Display Area           │  │
│ • Settings      │  │            (Primary)                │  │
│                 │  │                                     │  │
│                 │  └─────────────────────────────────────┘  │
│                 │                                           │
│                 │  ┌─────────────────────────────────────┐  │
│                 │  │      Natural Language Query         │  │
│                 │  │         Input Panel                 │  │
│                 │  └─────────────────────────────────────┘  │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

### 响应式断点设计

```scss
// 断点定义
$breakpoints: (
  mobile: 320px,   // 手机竖屏
  mobile-l: 480px, // 手机横屏  
  tablet: 768px,   // 平板竖屏
  tablet-l: 1024px,// 平板横屏
  desktop: 1200px, // 桌面
  desktop-l: 1440px // 大屏桌面
);
```

## 📱 移动端布局

### 手机端 (320px - 768px)

```
Mobile Layout
┌─────────────────────────┐
│    Header (50px)        │
│ ☰ Historical Temperature │
├─────────────────────────┤
│                         │
│    Search Bar           │
│  "Ask about weather"    │
│                         │
├─────────────────────────┤
│                         │
│                         │
│     Chart Area          │
│    (Full Width)         │
│                         │
│                         │
├─────────────────────────┤
│                         │
│   Quick Actions         │
│ [北京] [上海] [+地点]    │
│                         │
├─────────────────────────┤
│                         │
│   Bottom Sheet          │
│   (Collapsible)         │
│ • 图表选项               │
│ • 数据筛选               │
│ • 历史记录               │
│                         │
└─────────────────────────┘
```

### 平板端 (768px - 1024px)

```
Tablet Layout  
┌─────────────────────────────────────────────────────┐
│                  Header (55px)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Search & Quick Controls                │
│    ┌──────────────────┐  ┌──────────────────┐      │
│    │   Search Input   │  │   Quick Filters  │      │
│    └──────────────────┘  └──────────────────┘      │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│                Chart Display                        │
│               (2/3 width)                          │
│    ┌──────────────────────────────────────────┐    │
│    │                                          │    │
│    │           Main Chart                     │    │
│    │                                          │    │
│    └──────────────────────────────────────────┘    │
│                                                     │
├─────────────────┬───────────────────────────────────┤
│                 │                                   │
│   Side Panel    │        Data Summary              │
│   (1/3 width)   │                                   │
│                 │                                   │
│ • Location List │  • 统计信息                        │
│ • Time Range    │  • 异常值                         │
│ • Chart Options │  • 数据导出                        │
│                 │                                   │
└─────────────────┴───────────────────────────────────┘
```

## 🧩 核心组件布局

### 1. Header 组件

```jsx
// Header.tsx 布局结构
const HeaderLayout = {
  height: '60px',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  
  // 左侧区域
  left: {
    logo: 'Historical Temperature Analytics',
    navigation: ['数据对比', '趋势分析', '实时数据']
  },
  
  // 右侧区域  
  right: {
    userActions: ['设置', '帮助', '用户头像'],
    themeToggle: true
  }
};
```

### 2. 侧边栏组件

```jsx
// Sidebar.tsx 布局结构
const SidebarLayout = {
  width: '280px',
  background: 'var(--bg-secondary)',
  sections: [
    {
      title: '快速查询',
      component: 'QuickQuery',
      height: '200px'
    },
    {
      title: '地点管理', 
      component: 'LocationManager',
      height: '300px',
      scrollable: true
    },
    {
      title: '查询历史',
      component: 'QueryHistory', 
      height: '250px',
      collapsible: true
    },
    {
      title: '高级选项',
      component: 'AdvancedOptions',
      height: 'auto',
      collapsible: true
    }
  ]
};
```

### 3. 主内容区组件

```jsx
// MainContent.tsx 布局结构
const MainContentLayout = {
  flex: 1,
  padding: '24px',
  minHeight: 'calc(100vh - 60px)',
  
  sections: {
    // 图表显示区域
    chartArea: {
      minHeight: '400px',
      maxHeight: '60vh',
      marginBottom: '24px',
      borderRadius: '8px',
      background: 'var(--bg-primary)',
      padding: '16px'
    },
    
    // 自然语言查询区域
    queryArea: {
      height: '120px',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    },
    
    // 数据摘要区域
    summaryArea: {
      height: 'auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px'
    }
  }
};
```

## 📊 图表区域布局设计

### 图表容器结构

```jsx
// ChartContainer.tsx
const ChartContainerLayout = {
  // 图表头部工具栏
  toolbar: {
    height: '48px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    borderBottom: '1px solid var(--border-color)',
    
    left: {
      title: 'Chart Title',
      subtitle: 'Data Range Info'
    },
    
    right: {
      actions: [
        'chartType', // 图表类型切换
        'fullscreen', // 全屏显示
        'download',   // 数据下载
        'settings'    // 图表设置
      ]
    }
  },
  
  // 主图表区域
  chartArea: {
    height: 'calc(100% - 48px)',
    position: 'relative',
    
    // 图表画布
    canvas: {
      width: '100%',
      height: '100%',
      background: 'transparent'
    },
    
    // 加载状态
    loading: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }
};
```

### 多图表布局模式

```jsx
// 并排对比模式
const SideBySideLayout = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  height: '400px'
};

// 上下堆叠模式
const StackedLayout = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  
  primary: { flex: 2 },    // 主图表
  secondary: { flex: 1 }   // 辅助图表
};

// 混合布局模式
const MixedLayout = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gridTemplateRows: '2fr 1fr',
  gap: '16px',
  height: '500px',
  
  areas: {
    main: 'grid-area: 1 / 1 / 2 / 2',      // 主图表
    sidebar: 'grid-area: 1 / 2 / 3 / 3',   // 侧边数据
    mini: 'grid-area: 2 / 1 / 3 / 2'       // 迷你图表
  }
};
```

## 🔍 搜索和查询界面

### 自然语言查询组件

```jsx
// NLQueryInterface.tsx
const QueryInterfaceLayout = {
  container: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '24px',
    color: 'white'
  },
  
  // 主输入区域
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    
    input: {
      flex: 1,
      border: 'none',
      background: 'transparent',
      color: 'white',
      fontSize: '16px',
      placeholder: '问问我关于天气的任何问题...'
    },
    
    button: {
      marginLeft: '12px',
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      color: 'white',
      cursor: 'pointer'
    }
  },
  
  // 快速建议
  suggestions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    
    item: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      padding: '4px 12px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  }
};
```

### 高级筛选面板

```jsx
// FilterPanel.tsx
const FilterPanelLayout = {
  // 可折叠面板容器
  container: {
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  
  // 面板头部
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'var(--bg-tertiary)',
    cursor: 'pointer',
    userSelect: 'none'
  },
  
  // 筛选内容区域
  content: {
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    
    // 时间范围选择器
    timeRange: {
      gridColumn: '1 / -1'  // 占满整行
    },
    
    // 地点选择器
    locationSelect: {
      minWidth: '200px'
    },
    
    // 数据指标选择
    metricsSelect: {
      minWidth: '200px'
    }
  }
};
```

## 📊 数据展示卡片

### 统计卡片布局

```jsx
// StatCard.tsx
const StatCardLayout = {
  container: {
    background: 'var(--bg-primary)',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid var(--border-color)',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  
  // 卡片头部
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    
    icon: {
      width: '24px',
      height: '24px',
      marginRight: '8px',
      color: 'var(--primary-color)'
    },
    
    title: {
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--text-secondary)'
    }
  },
  
  // 主要数值
  value: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: '1.2'
  },
  
  // 变化趋势
  change: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    marginTop: '8px',
    
    positive: { color: '#52c41a' },
    negative: { color: '#f5222d' },
    neutral: { color: 'var(--text-secondary)' }
  }
};
```

### 数据对比表格

```jsx
// ComparisonTable.tsx  
const TableLayout = {
  container: {
    background: 'var(--bg-primary)',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)'
  },
  
  // 表格头部
  header: {
    background: 'var(--bg-tertiary)',
    padding: '16px',
    borderBottom: '1px solid var(--border-color)',
    
    title: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'var(--text-primary)'
    }
  },
  
  // 表格内容
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    
    th: {
      background: 'var(--bg-secondary)',
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--text-secondary)',
      borderBottom: '1px solid var(--border-color)'
    },
    
    td: {
      padding: '12px 16px',
      fontSize: '14px',
      color: 'var(--text-primary)',
      borderBottom: '1px solid var(--border-light)'
    },
    
    // 斑马纹
    'tr:nth-child(even)': {
      background: 'var(--bg-secondary)'
    }
  }
};
```

## 🎯 交互状态和动效

### 加载状态

```jsx
// LoadingStates.tsx
const LoadingStates = {
  // 图表加载骨架屏
  chartSkeleton: {
    background: 'var(--bg-secondary)',
    borderRadius: '8px',
    padding: '16px',
    
    // 模拟图表结构
    elements: [
      { width: '100%', height: '20px', marginBottom: '16px' }, // 标题
      { width: '100%', height: '200px', marginBottom: '16px' }, // 图表区域
      { width: '60%', height: '16px' } // 说明文字
    ],
    
    animation: 'shimmer 1.5s ease-in-out infinite'
  },
  
  // 数据加载指示器
  dataLoader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    flexDirection: 'column',
    
    spinner: {
      width: '32px',
      height: '32px',
      border: '3px solid var(--border-color)',
      borderTop: '3px solid var(--primary-color)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    
    text: {
      marginTop: '16px',
      color: 'var(--text-secondary)',
      fontSize: '14px'
    }
  }
};
```

### 过渡动画

```scss
// Animations.scss
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// 图表入场动画
.chart-enter {
  animation: fadeInUp 0.6s ease-out;
}

// 侧边栏滑动
.sidebar-enter {
  animation: slideInFromRight 0.3s ease-out;
}

// 卡片悬停效果
.stat-card {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}
```

## 🌙 主题和样式系统

### CSS变量定义

```css
/* Theme Variables */
:root {
  /* 浅色主题 */
  --primary-color: #1890ff;
  --primary-hover: #40a9ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #f5222d;
  
  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #fafafa;
  
  /* 文字色 */
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-disabled: #bfbfbf;
  
  /* 边框色 */
  --border-color: #d9d9d9;
  --border-light: #f0f0f0;
  
  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 深色主题 */
[data-theme="dark"] {
  --primary-color: #177ddc;
  --primary-hover: #3c9be8;
  
  --bg-primary: #141414;
  --bg-secondary: #1f1f1f;
  --bg-tertiary: #262626;
  
  --text-primary: #ffffff;
  --text-secondary: #d9d9d9;
  --text-disabled: #595959;
  
  --border-color: #434343;
  --border-light: #303030;
  
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

### 响应式工具类

```css
/* Responsive Utilities */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 0 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 32px;
  }
}

/* 显示/隐藏工具类 */
.mobile-only {
  @media (min-width: 768px) {
    display: none !important;
  }
}

.desktop-only {
  @media (max-width: 767px) {
    display: none !important;
  }
}

/* 网格系统 */
.grid {
  display: grid;
  gap: 16px;
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
```

## 🚀 实施建议

### 开发优先级

#### Phase 1: 基础布局 (Week 1-2)
- [ ] 创建响应式网格系统
- [ ] 实现Header和侧边栏组件
- [ ] 搭建主内容区域结构
- [ ] 适配移动端基础布局

#### Phase 2: 核心组件 (Week 3-4)  
- [ ] 图表容器和工具栏
- [ ] 自然语言查询界面
- [ ] 数据展示卡片系统
- [ ] 筛选和控制面板

#### Phase 3: 交互增强 (Week 5-6)
- [ ] 加载状态和骨架屏
- [ ] 过渡动画和微交互
- [ ] 主题切换功能
- [ ] 无障碍访问优化

### 技术实现栈

```typescript
// 推荐技术栈
{
  "framework": "React 19 + TypeScript",
  "styling": "Tailwind CSS + CSS Variables",
  "components": "Headless UI + Radix UI",
  "layout": "CSS Grid + Flexbox",
  "animation": "Framer Motion",
  "responsive": "Mobile First Approach"
}
```

这个UI布局设计为历史气温数据分析平台提供了完整的界面架构，既满足了功能需求，又考虑了用户体验和开发效率。设计采用了现代化的布局技术和响应式原则，确保在各种设备上都能提供优秀的使用体验。