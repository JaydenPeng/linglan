# Architecture Research

**Domain:** Electron + Capacitor AI 生图/生视频移动应用
**Researched:** 2026-03-19
**Confidence:** HIGH（基于 Electron 官方架构、API 文档直接分析）

## Standard Architecture

### System Overview

```
+------------------------------------------------------------------+
|                      渲染进程 (Renderer)                          |
|  +----------+  +----------+  +----------+  +--------------+     |
|  |  UI 页面  |  | 状态管理  |  | 任务列表  |  |  历史记录页  |     |
|  |(Vue/React)|  | (Store)  |  |  组件    |  |   组件       |     |
|  +----+-----+  +----+-----+  +----+-----+  +------+-------+     |
|       +------------------+--------+----------------+            |
|                     IPC invoke / on                             |
+------------------------------------------------------------------+
|                      主进程 (Main Process)                        |
|  +--------------+  +--------------+  +----------------------+   |
|  |  IPC Handler |  |  任务队列     |  |   API Service Layer  |   |
|  | (ipcMain)    |  | TaskQueue    |  |  JimengService       |   |
|  |              |  | + Poller     |  |  KlingService        |   |
|  +------+-------+  +------+-------+  +----------+-----------+   |
|         +--------------------+--------------------+             |
|  +--------------+  +--------------+                             |
|  |  Auth Module |  |  存储模块     |                             |
|  | HMAC-SHA256  |  | electron-    |                             |
|  | JWT HS256    |  | store / JSON |                             |
|  +--------------+  +--------------+                             |
+------------------------------------------------------------------+
|                   Capacitor Bridge (移动端)                       |
|  +--------------+  +--------------+  +----------------------+   |
|  |  Filesystem  |  |  HTTP Plugin |  |   Share / Download   |   |
|  |  Plugin      |  |  (原生网络)   |  |   Plugin             |   |
|  +--------------+  +--------------+  +----------------------+   |
+------------------------------------------------------------------+
|              外部 API（即梦 / 可灵）                               |
|  +--------------------------+  +--------------------------+      |
|  |  即梦 visual.volcengine  |  |  可灵 api-beijing.kling   |      |
|  |  HMAC-SHA256 签名        |  |  JWT Bearer Token         |      |
|  |  提交 -> 轮询 CVSync2Async|  |  提交 -> 轮询 omni-video  |      |
|  +--------------------------+  +--------------------------+      |
+------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| UI 页面层 | 表单输入、结果展示、历史浏览 | Vue 3 / React 组件 |
| 状态管理 (Store) | 任务列表状态、UI 加载状态、历史记录缓存 | Pinia / Zustand |
| IPC Handler | 接收渲染进程请求，分发到主进程服务 | ipcMain.handle() |
| TaskQueue | 维护待处理/进行中/已完成任务，驱动轮询 | 内存队列 + setInterval |
| JimengService | 即梦 API 调用：HMAC-SHA256 签名、提交、查询 | Node.js fetch + crypto |
| KlingService | 可灵 API 调用：JWT 生成、提交、查询 | Node.js fetch + jsonwebtoken |
| Auth Module | 两套鉴权逻辑封装，密钥不暴露到渲染进程 | 主进程内纯函数 |
| 存储模块 | 历史记录持久化（任务参数 + 结果 URL） | electron-store 或 JSON 文件 |
| Capacitor Bridge | 移动端原生能力：文件系统、网络、分享 | @capacitor/filesystem 等插件 |

## Recommended Project Structure

```
src/
├── main/                    # Electron 主进程
│   ├── ipc/                 # IPC 处理器注册
│   │   └── taskHandlers.ts  # 任务相关 IPC 通道
│   ├── services/            # API 服务层
│   │   ├── jimeng.ts        # 即梦 API（HMAC-SHA256）
│   │   └── kling.ts         # 可灵 API（JWT）
│   ├── auth/                # 鉴权模块
│   │   ├── hmacSigner.ts    # 火山引擎 V4 签名
│   │   └── jwtSigner.ts     # 可灵 JWT 生成
│   ├── queue/               # 任务队列
│   │   ├── TaskQueue.ts     # 队列管理 + 轮询调度
│   │   └── types.ts         # Task 类型定义
│   ├── store/               # 持久化存储
│   │   └── historyStore.ts  # 历史记录读写
│   └── index.ts             # 主进程入口
├── renderer/                # 渲染进程（Web UI）
│   ├── pages/               # 页面组件
│   │   ├── ImageGen.vue     # 生图页
│   │   ├── VideoGen.vue     # 生视频页
│   │   └── History.vue      # 历史记录页
│   ├── components/          # 通用组件
│   │   ├── TaskCard.vue     # 任务状态卡片
│   │   └── ResultViewer.vue # 图片/视频预览
│   ├── store/               # 前端状态（Pinia）
│   │   └── taskStore.ts     # 任务列表状态
│   ├── bridge/              # IPC 封装（渲染侧）
│   │   └── ipcClient.ts     # window.electron.invoke 封装
│   └── main.ts              # 渲染进程入口
├── shared/                  # 主进程/渲染进程共享类型
│   └── types.ts             # Task、Result 等接口定义
└── capacitor/               # Capacitor 移动端适配
    └── plugins.ts           # Filesystem / Share 插件封装
```

### Structure Rationale

- **main/services/:** API 调用和签名逻辑只在主进程运行，AK/SK 不暴露给渲染进程
- **main/queue/:** 轮询逻辑集中在主进程，避免页面切换导致轮询中断
- **renderer/bridge/:** 统一封装 contextBridge 暴露的 API，渲染进程不直接调用 ipcRenderer
- **shared/types.ts:** 两侧共享 Task 类型，避免类型不一致

## Architectural Patterns

### Pattern 1: 主进程持有任务队列（Task Queue in Main Process）

**What:** 所有 AI 任务的生命周期（提交、轮询、完成）由主进程的 TaskQueue 管理，渲染进程只负责展示。
**When to use:** 任何需要后台持续轮询的异步任务，用户切换页面不中断。
**Trade-offs:** 主进程内存占用略增；但避免了渲染进程被销毁导致轮询丢失。

**Example:**
```typescript
// main/queue/TaskQueue.ts
class TaskQueue {
  private tasks: Map<string, Task> = new Map()
  private pollInterval: NodeJS.Timeout | null = null

  add(task: Task) {
    this.tasks.set(task.id, task)
    this.startPollingIfNeeded()
  }

  private startPollingIfNeeded() {
    if (this.pollInterval) return
    this.pollInterval = setInterval(() => this.poll(), 5000)
  }

  private async poll() {
    const pending = [...this.tasks.values()].filter(t => t.status === 'processing')
    if (pending.length === 0) {
      clearInterval(this.pollInterval!)
      this.pollInterval = null
      return
    }
    for (const task of pending) {
      const result = await this.queryTask(task)
      if (result.done) {
        task.status = 'done'
        task.result = result.data
        mainWindow.webContents.send('task:updated', task)
      }
    }
  }
}
```

### Pattern 2: contextBridge 隔离（Security Boundary）

**What:** 通过 contextBridge.exposeInMainWorld 暴露有限 API，渲染进程无法直接访问 Node.js 模块。
**When to use:** 所有 Electron 应用，尤其是涉及 API 密钥的场景。
**Trade-offs:** 需要额外的 preload 脚本；但 AK/SK 永远不会出现在渲染进程代码中。

**Example:**
```typescript
// preload.ts
contextBridge.exposeInMainWorld('electron', {
  submitImageTask: (params: ImageTaskParams) =>
    ipcRenderer.invoke('task:submit-image', params),
  submitVideoTask: (params: VideoTaskParams) =>
    ipcRenderer.invoke('task:submit-video', params),
  onTaskUpdated: (cb: (task: Task) => void) =>
    ipcRenderer.on('task:updated', (_, task) => cb(task)),
})
```

### Pattern 3: 平台适配层（Platform Adapter）

**What:** 文件操作、网络请求等通过统一接口封装，Electron 和 Capacitor 各自实现。
**When to use:** 同一套 UI 代码需要在桌面（Electron）和移动端（Capacitor）运行。
**Trade-offs:** 增加一层抽象；但避免了 if (isElectron) 散落在业务代码中。

**Example:**
```typescript
// capacitor/plugins.ts
export const saveFile = async (url: string, filename: string) => {
  if (Capacitor.isNativePlatform()) {
    const response = await fetch(url)
    const base64 = await blobToBase64(await response.blob())
    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents
    })
  } else {
    await window.electron.downloadFile(url, filename)
  }
}
```

## Data Flow

### 任务提交流程

```
用户填写表单 (Renderer)
    |
taskStore.submitTask(params)
    |
ipcClient.invoke('task:submit-image', params)
    | IPC
ipcMain.handle('task:submit-image')
    |
JimengService.submit(params)  -->  即梦 API POST /CVSync2AsyncSubmitTask
    | 返回 task_id
TaskQueue.add({ id: task_id, status: 'processing', ... })
    |
ipcMain 返回 { taskId } 给渲染进程
    |
taskStore.addTask({ id, status: 'processing' })  -->  UI 显示"生成中"
```

### 轮询 & 状态更新流程

```
TaskQueue.poll() (每 5s，主进程 setInterval)
    |
JimengService.query(task_id)  -->  即梦 API GET /CVSync2AsyncGetResult
    | status: done
task.status = 'done', task.result = { image_urls }
    |
mainWindow.webContents.send('task:updated', task)
    | IPC push
ipcRenderer.on('task:updated')  -->  taskStore.updateTask(task)
    |
UI 自动更新，显示生成结果
    |
historyStore.save(task)  -->  持久化到本地
```

### 可灵 JWT 鉴权流程

```
KlingService.submit(params)
    |
jwtSigner.generate(ak, sk)
    -> Header: { alg: 'HS256', typ: 'JWT' }
    -> Payload: { iss: ak, exp: now+1800, nbf: now-5 }
    -> 签名: HS256(sk, header.payload)
    |
POST /v1/videos/omni-video
Authorization: Bearer <token>
    | 返回 task_id
TaskQueue.add(task)
```

### 即梦 HMAC-SHA256 鉴权流程

```
JimengService.submit(params)
    |
hmacSigner.sign(ak, sk, body, query)
    -> 规范化请求: method + uri + querystring + headers + body_hash
    -> 签名密钥: HMAC(HMAC(HMAC(HMAC(sk, date), region), service), 'request')
    -> Authorization: HMAC-SHA256 Credential=ak/scope, SignedHeaders=..., Signature=...
    |
POST https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31
    | 返回 task_id
TaskQueue.add(task)
```

### Key Data Flows

1. **任务提交:** 渲染进程 -> IPC -> 主进程服务 -> 外部 API -> 任务队列 -> 返回 taskId
2. **状态轮询:** 主进程定时器 -> 外部 API -> 任务队列更新 -> IPC push -> 渲染进程状态更新
3. **结果下载:** 渲染进程 -> Capacitor/IPC -> 文件系统写入

## Build Order (Component Dependencies)

构建顺序基于依赖关系，下层必须先于上层完成：

```
Phase 1: 基础设施
  shared/types.ts          <- 所有组件依赖的类型定义
  main/auth/hmacSigner.ts  <- JimengService 依赖
  main/auth/jwtSigner.ts   <- KlingService 依赖

Phase 2: API 服务层
  main/services/jimeng.ts  <- 依赖 hmacSigner
  main/services/kling.ts   <- 依赖 jwtSigner

Phase 3: 任务队列
  main/queue/TaskQueue.ts  <- 依赖 JimengService + KlingService

Phase 4: IPC 层
  preload.ts               <- 依赖 shared/types
  main/ipc/taskHandlers.ts <- 依赖 TaskQueue

Phase 5: 渲染进程
  renderer/store/taskStore <- 依赖 shared/types
  renderer/bridge/ipcClient<- 依赖 preload 暴露的 API
  renderer/pages/*         <- 依赖 taskStore + ipcClient

Phase 6: 持久化
  main/store/historyStore  <- 依赖 shared/types，可并行于 Phase 3

Phase 7: Capacitor 适配
  capacitor/plugins.ts     <- 依赖渲染进程完成后集成
```

## Anti-Patterns

### Anti-Pattern 1: 在渲染进程中直接调用 API

**What people do:** 在 Vue/React 组件里直接 fetch 外部 API，并在前端完成签名。
**Why it's wrong:** AK/SK 暴露在前端代码中，用户可通过 DevTools 提取；Capacitor 移动端还会遇到 CORS 问题。
**Do this instead:** 所有 API 调用和签名逻辑放在 Electron 主进程，通过 IPC 通信。

### Anti-Pattern 2: 轮询逻辑放在渲染进程组件内

**What people do:** 在组件 mounted 里 setInterval 轮询，组件销毁时 clearInterval。
**Why it's wrong:** 用户切换页面或组件卸载时轮询停止，任务状态丢失；多个组件可能创建重复轮询。
**Do this instead:** 轮询由主进程 TaskQueue 统一管理，通过 webContents.send 推送更新到渲染进程。

### Anti-Pattern 3: JWT 未处理 nbf 导致 1003 错误

**What people do:** 每次请求都生成新 token，但 nbf 设为当前时间，服务端时钟偏差导致 token 未到生效时间。
**Why it's wrong:** 可灵返回 1003（Authorization 未到有效时间），请求失败。
**Do this instead:** nbf 设为 now - 5（秒），exp 设为 now + 1800；缓存 token 在过期前 60 秒重新生成。

### Anti-Pattern 4: 不区分 Electron 和 Capacitor 运行时

**What people do:** 直接使用 Node.js fs 模块保存文件，期望在移动端也能工作。
**Why it's wrong:** Capacitor 移动端没有 Node.js fs 模块，会直接报错。
**Do this instead:** 通过 Capacitor.isNativePlatform() 判断，移动端使用 @capacitor/filesystem。

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| 即梦 visual.volcengineapi.com | HMAC-SHA256 V4 签名，POST + GET 轮询 | 任务状态：in_queue / generating / done；图片 URL 有效期 24h |
| 可灵 api-beijing.klingai.com | JWT HS256 Bearer Token，POST + GET 轮询 | 任务状态：submitted / processing / succeed / failed；视频 URL 有效期 30 天 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| 渲染进程 <-> 主进程 | IPC（invoke/handle + send/on） | 通过 contextBridge 隔离，preload 脚本定义白名单 |
| 主进程 <-> 外部 API | Node.js fetch（主进程内） | 签名在主进程完成，AK/SK 不离开主进程 |
| 渲染进程 <-> 移动端原生 | Capacitor Plugin Bridge | 仅在 Capacitor.isNativePlatform() 为 true 时生效 |
| TaskQueue <-> 存储模块 | 直接函数调用（同进程） | 任务完成时同步写入历史记录 |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 单用户本地应用 | 当前架构完全满足，内存队列 + JSON 持久化足够 |
| 多任务并发（>10个同时进行） | 轮询间隔动态调整，避免 API 限流（可灵 1302/1303 错误码） |
| 历史记录增长（>1000条） | 考虑 SQLite（better-sqlite3）替换 JSON 文件，支持分页查询 |

### Scaling Priorities

1. **首要瓶颈:** API 限流（可灵 429/1302，即梦 50429）— 轮询间隔不低于 3-5 秒，并发任务数限制在 3-5 个
2. **次要瓶颈:** 历史记录 JSON 文件过大 — 超过 500 条时迁移到 SQLite

## Sources

- Electron 官方文档：主进程/渲染进程架构，contextBridge 安全模型（HIGH confidence）
- 即梦 API 文档（docs/即梦.md）：HMAC-SHA256 V4 签名实现，任务状态枚举（HIGH confidence）
- 可灵 API 文档（docs/可灵.md）：JWT HS256 鉴权，任务状态枚举，错误码（HIGH confidence）
- Capacitor 官方文档：isNativePlatform()，Filesystem Plugin（HIGH confidence）

---
*Architecture research for: Electron + Capacitor AI 生图/生视频应用*
*Researched: 2026-03-19*
