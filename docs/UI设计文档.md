# UI 设计文档

> 版本：1.0 | 阶段：Phase 1 设计文档 | 适用范围：Phase 2+ 开发参考

## 1. 应用整体结构

底部 Tab 导航（IonTabBar）：生图、生视频、任务、历史、设置 5 个 Tab。
每个 Tab 对应一个页面组件，路由用 Vue Router + IonRouterOutlet。

```
App.vue
└── IonApp
    └── IonTabs
        ├── IonRouterOutlet（页面内容区）
        └── IonTabBar（底部导航）
            ├── IonTabButton（tab="image"）   → 生图
            ├── IonTabButton（tab="video"）   → 生视频
            ├── IonTabButton（tab="tasks"）   → 任务
            ├── IonTabButton（tab="history"） → 历史
            └── IonTabButton（tab="settings"）→ 设置
```

## 2. 页面清单与组件树

### 2.1 设置页（Settings.vue）— Phase 1 实现

```
Settings.vue
├── IonPage
│   ├── IonHeader > IonToolbar > IonTitle（"设置"）
│   └── IonContent
│       ├── IonList（即梦配置区）
│       │   ├── IonListHeader（"即梦 API"）
│       │   ├── IonItem > IonInput（Access Key，type=password）
│       │   ├── IonItem > IonInput（Secret Key，type=password）
│       │   ├── IonItem > IonNote（状态：已配置 ✓ / 未配置）
│       │   └── IonButton（"保存即梦密钥"）
│       └── IonList（可灵配置区）
│           ├── IonListHeader（"可灵 API"）
│           ├── IonItem > IonInput（Access Key，type=password）
│           ├── IonItem > IonInput（Secret Key，type=password）
│           ├── IonItem > IonNote（状态：已配置 ✓ / 未配置）
│           └── IonButton（"保存可灵密钥"）
```

状态显示规则：渲染进程只接收 `{ jimengConfigured: boolean, klingConfigured: boolean }`，不显示明文。

### 2.2 生图页（ImageGen.vue）— Phase 2 实现

```
ImageGen.vue
├── IonPage
│   ├── IonHeader > IonToolbar > IonTitle（"AI 生图"）
│   └── IonContent
│       ├── PromptInput.vue（IonTextarea，提示词输入）
│       ├── ImageUpload.vue（IonButton + 图片预览，图生图参考图）
│       ├── ParamPanel.vue（宽高比选择 IonSegment，force_single IonToggle）
│       └── IonButton（"生成图片"，提交任务）
```

### 2.3 生视频页（VideoGen.vue）— Phase 3 实现

```
VideoGen.vue
├── IonPage
│   ├── IonHeader > IonToolbar > IonTitle（"AI 生视频"）
│   └── IonContent
│       ├── PromptInput.vue（提示词输入）
│       ├── VideoParamPanel.vue（时长 3-15s IonRange，宽高比 IonSegment，模式 std/pro IonSegment）
│       ├── FrameUpload.vue（首帧/尾帧图片上传）
│       └── IonButton（"生成视频"）
```

### 2.4 任务列表页（TaskList.vue）— Phase 2 实现

```
TaskList.vue
├── IonPage
│   ├── IonHeader > IonToolbar > IonTitle（"任务"）
│   └── IonContent
│       └── IonList
│           └── TaskCard.vue（×N）
│               ├── IonItem
│               │   ├── 任务类型图标（生图/生视频）
│               │   ├── 提示词摘要（前 30 字）
│               │   ├── IonBadge（状态：submitted/processing/succeed/failed）
│               │   └── IonButton（重试 / 取消，按状态显示）
│               └── 结果预览（succeed 时显示缩略图/视频封面）
```

### 2.5 历史记录页（History.vue）— Phase 3 实现

```
History.vue
├── IonPage
│   ├── IonHeader > IonToolbar > IonTitle（"历史"）
│   └── IonContent
│       └── IonGrid（2 列瀑布流）
│           └── ResultCard.vue（×N）
│               ├── IonImg（图片）或 video 标签（视频）
│               ├── IonFab（收藏、下载、分享按钮）
│               └── 长按 → IonActionSheet（删除、复用提示词）
```

## 3. 共享组件清单

| 组件 | 文件路径 | 用途 |
|------|---------|------|
| PromptInput | src/renderer/components/PromptInput.vue | 提示词文本域，字数统计 |
| TaskCard | src/renderer/components/TaskCard.vue | 任务状态卡片 |
| ResultCard | src/renderer/components/ResultCard.vue | 生成结果展示 |
| StatusBadge | src/renderer/components/StatusBadge.vue | 任务状态徽章 |

## 4. Ionic Vue 组件选型

| 场景 | 组件 | 说明 |
|------|------|------|
| 页面容器 | IonPage + IonHeader + IonContent | 标准页面结构 |
| 底部导航 | IonTabBar + IonTabButton | 5 Tab 导航 |
| 表单输入 | IonInput（type=password） | AK/SK 输入，不显示明文 |
| 状态展示 | IonNote + IonBadge | 配置状态、任务状态 |
| 参数选择 | IonSegment + IonSegmentButton | 宽高比、模式选择 |
| 开关 | IonToggle | force_single 等布尔参数 |
| 列表 | IonList + IonItem + IonListHeader | 设置项、任务列表 |
| 操作菜单 | IonActionSheet | 长按结果卡片操作 |
| 加载状态 | IonSpinner + IonProgressBar | 任务处理中 |
| 消息提示 | IonToast | 保存成功/失败提示 |

## 5. 状态管理（Pinia Stores）

| Store | 文件 | 职责 |
|-------|------|------|
| configStore | src/renderer/store/configStore.ts | 配置状态（布尔值，不含密钥） |
| taskStore | src/renderer/store/taskStore.ts | 任务列表、轮询状态（Phase 2） |
| historyStore | src/renderer/store/historyStore.ts | 历史记录（Phase 3） |

## 6. 路由结构

```typescript
// src/renderer/router/index.ts
const routes = [
  { path: '/', redirect: '/tabs/image' },
  {
    path: '/tabs',
    component: TabsLayout,
    children: [
      { path: 'image', component: ImageGen },
      { path: 'video', component: VideoGen },
      { path: 'tasks', component: TaskList },
      { path: 'history', component: History },
      { path: 'settings', component: Settings }
    ]
  }
]
```
