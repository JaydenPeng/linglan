---
phase: 02-图片生成核心流程
verified: 2026-03-20T12:00:00Z
status: human_needed
score: 11/11 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/11
  gaps_closed:
    - "用户可以在文生图 Tab 输入提示词并提交任务 — CreatePage 已挂载到 App.vue create Tab"
    - "用户可以切换到图生图 Tab，上传参考图片后提交任务 — 同上，CreatePage 含图生图分支"
    - "任务列表以卡片形式展示所有任务，最新任务排在最前 — TaskListPage 已挂载到 App.vue tasks Tab"
    - "点击任务卡片缩略图后全屏模态框展示原图 — TaskListPage 挂载后 ImagePreviewModal 可触达"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "提交文生图任务后自动跳转到任务 Tab"
    expected: "点击「开始生成」后 activeTab 切换为 tasks，任务卡片出现在列表中"
    why_human: "emit/onNavigate 链路需运行时验证，静态分析无法确认事件传递正确触发"
  - test: "主进程 API 签名验证"
    expected: "配置有效 AK/SK 后提交任务，主进程成功调用即梦 API 返回 job_id 并开始轮询"
    why_human: "HMAC-SHA256 签名正确性需真实 API 调用验证"
  - test: "多任务并行轮询"
    expected: "快速提交 3 个任务，3 个独立 setInterval 同时运行，互不干扰"
    why_human: "并发行为需运行时验证"
---

# Phase 2: 图片生成核心流程 验证报告

**Phase Goal:** 实现图片生成核心流程，包括 API 调用、任务管理、UI 界面
**Verified:** 2026-03-20T12:00:00Z
**Status:** human_needed
**Re-verification:** Yes — plan 02-06 gap closure 后重新验证

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | 任务类型、状态枚举和图片参数接口已定义 | ✓ VERIFIED | src/types/task.ts + src/types/image.ts 完整导出 TaskStatus、TaskType、ImageTask、ImageParams、IPC_CHANNELS |
| 2 | Pinia taskStore 已建立，包含任务列表、添加/更新/取消任务的 actions | ✓ VERIFIED | src/stores/taskStore.ts 完整实现，导出 useTaskStore，含 addTask/updateTask/cancelTask/activeTasks |
| 3 | contextBridge 已暴露 imageApi 对象 | ✓ VERIFIED | src/preload/index.ts 暴露 submit/cancel/download/onStatusUpdate，类型声明完整 |
| 4 | 主进程接收 image:submit 后调用即梦 API 并返回 jobId | ✓ VERIFIED | src/main/imageHandler.ts 实现 submitImageTask（HMAC 签名、return_url:true）+ registerImageHandlers 注册到 src/main/index.ts |
| 5 | 主进程对每个活跃任务启动独立轮询，通过 image:status-update 推送 | ✓ VERIFIED | startPolling 使用 setInterval + activePollers Map，webContents.send 推送状态 |
| 6 | 收到 image:cancel 后立即停止对应任务的轮询 | ✓ VERIFIED | IMAGE_CANCEL handler 调用 clearInterval + activePollers.delete，并推送 CANCELLED 状态 |
| 7 | 参数配置区域默认折叠，可展开配置 | ✓ VERIFIED | src/renderer/components/ImageParamsPanel.vue 中 expanded = ref(false)，v-if="expanded" 控制显示 |
| 8 | 用户可以在文生图 Tab 输入提示词并提交任务 | ✓ VERIFIED | App.vue 第 21 行 `<CreatePage v-else-if="activeTab === 'create'" @navigate="onNavigate" />`，CreatePage 含完整提交逻辑 |
| 9 | 任务列表以卡片形式展示所有任务 | ✓ VERIFIED | App.vue 第 22 行 `<TaskListPage v-else-if="activeTab === 'tasks'" />`，TaskListPage 遍历 taskStore.tasks 渲染 TaskCard |
| 10 | 点击缩略图后全屏模态框展示原图，支持多图滑动 | ✓ VERIFIED | TaskListPage 第 27-32 行挂载 ImagePreviewModal，含触摸滑动 + 左右按钮 + 计数器 |
| 11 | 用户可以点击分享按钮弹出选项面板 | ✓ VERIFIED | ImagePreviewModal 实现分享面板（复制链接 + 保存到本地 + 在浏览器中打开），使用 window.imageApi.download() 和 navigator.clipboard，Electron 桌面端适配合理 |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/task.ts` | TaskStatus、TaskType 枚举 | ✓ VERIFIED | 完整 |
| `src/types/image.ts` | ImageTask、ImageParams、IPC_CHANNELS | ✓ VERIFIED | 完整 |
| `src/stores/taskStore.ts` | Pinia store，useTaskStore | ✓ VERIFIED | 含 activeTasks 筛选函数 |
| `src/preload/index.ts` | contextBridge 暴露 imageApi | ✓ VERIFIED | 暴露 submit/cancel/download/onStatusUpdate |
| `src/main/imageHandler.ts` | 即梦 API 调用 + 轮询管理器 | ✓ VERIFIED | 完整实现，含 IMAGE_DOWNLOAD IPC |
| `src/main/index.ts` | 注册 imageHandler | ✓ VERIFIED | registerImageHandlers(win) 在 app.whenReady 后调用 |
| `src/renderer/pages/CreatePage.vue` | 任务提交页面（含文生图/图生图 Tab） | ✓ VERIFIED | 完整实现，emit navigate 事件，App.vue 监听切换 Tab |
| `src/renderer/components/ImageParamsPanel.vue` | 可折叠参数配置面板 | ✓ VERIFIED | 被 CreatePage 引用，expanded 默认 false |
| `src/renderer/pages/TaskListPage.vue` | 任务列表页面 | ✓ VERIFIED | 被 App.vue tasks Tab 挂载，含状态监听/重试/取消 |
| `src/renderer/components/TaskCard.vue` | 单个任务卡片 | ✓ VERIFIED | 被 TaskListPage 引用，含状态标签/缩略图/操作按钮 |
| `src/renderer/components/ImagePreviewModal.vue` | 全屏图片预览模态框 | ✓ VERIFIED | 被 TaskListPage 挂载，含滑动/下载/分享面板 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/renderer/App.vue | CreatePage | `v-else-if="activeTab === 'create'"` | ✓ WIRED | App.vue 第 21 行，import 第 33 行 |
| src/renderer/App.vue | TaskListPage | `v-else-if="activeTab === 'tasks'"` | ✓ WIRED | App.vue 第 22 行，import 第 34 行 |
| CreatePage | App.vue activeTab | emit('navigate', 'tasks') | ✓ WIRED | CreatePage 第 125 行 emit，App.vue onNavigate 函数接收 |
| TaskListPage | src/stores/taskStore.ts | useTaskStore().tasks | ✓ WIRED | TaskListPage 第 38 行 import，第 44 行 useTaskStore() |
| TaskListPage | window.imageApi.onStatusUpdate | 监听状态更新 | ✓ WIRED | TaskListPage 第 51 行 onMounted 中注册 |
| TaskListPage | ImagePreviewModal | v-if="previewState" | ✓ WIRED | TaskListPage 第 27-32 行 |
| TaskListPage | window.imageApi.cancel | handleCancel | ✓ WIRED | TaskListPage 第 85 行 await window.imageApi.cancel(task.id) |
| CreatePage | src/stores/taskStore.ts | useTaskStore().addTask() | ✓ WIRED | CreatePage 第 57 行 import，第 114 行 taskStore.addTask(task) |
| CreatePage | window.imageApi.submit | IPC 调用提交任务 | ✓ WIRED | CreatePage 第 117 行 await window.imageApi.submit(localId, params) |
| src/stores/taskStore.ts | src/types/image.ts | import ImageTask, TaskStatus | ✓ WIRED | 确认 |
| src/main/imageHandler.ts | src/types/image.ts | IPC_CHANNELS, ImageParams | ✓ WIRED | 确认 |
| src/main/index.ts | imageHandler | registerImageHandlers | ✓ WIRED | 确认 |
| ImagePreviewModal | window.imageApi.download | handleDownload | ✓ WIRED | ImagePreviewModal 第 128 行 |
| ImagePreviewModal | navigator.clipboard | copyLink | ✓ WIRED | ImagePreviewModal 第 147 行 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|------|
| IMG-01 | 02-01, 02-03, 02-06 | 用户可以通过文字提示词发起生图任务（文生图） | ✓ SATISFIED | CreatePage 文生图 Tab + handleSubmit + window.imageApi.submit，已挂载到 App.vue |
| IMG-02 | 02-01, 02-03, 02-06 | 用户可以上传参考图片并结合提示词发起生图任务（图生图） | ✓ SATISFIED | CreatePage 图生图 Tab + pickRefImage + ref_image 参数，已挂载到 App.vue |
| IMG-03 | 02-01, 02-03, 02-06 | 用户可以配置图片参数（宽度、高度、宽高比） | ✓ SATISFIED | ImageParamsPanel 宽高比选择（1:1/16:9/9:16/4:3），被 CreatePage 引用 |
| IMG-04 | 02-01, 02-03, 02-06 | 用户可以配置 force_single 强制单图输出 | ✓ SATISFIED | ImageParamsPanel force_single toggle，被 CreatePage 引用 |
| TASK-01 | 02-01, 02-02, 02-04, 02-06 | 用户可以实时查看任务状态 | ✓ SATISFIED | TaskListPage onMounted 注册 onStatusUpdate，TaskCard 显示状态标签 + 进度条 |
| TASK-02 | 02-01, 02-02 | 系统支持多个任务并行执行 | ✓ SATISFIED | imageHandler.ts 的 activePollers Map 支持多任务并行轮询 |
| TASK-03 | 02-01, 02-04, 02-06 | 用户可以对失败的任务发起重试 | ✓ SATISFIED | TaskListPage.handleRetry 创建新任务并重新提交，TaskCard 失败时显示重试按钮 |
| TASK-04 | 02-01, 02-02, 02-04, 02-06 | 用户可以取消进行中的任务 | ✓ SATISFIED | TaskListPage.handleCancel 调用 taskStore.cancelTask + window.imageApi.cancel |
| RES-01 | 02-04, 02-05, 02-06 | 用户可以预览生成的图片 | ✓ SATISFIED | TaskCard 缩略图点击触发 openPreview，ImagePreviewModal 全屏展示 |
| RES-03 | 02-04, 02-05, 02-06 | 用户可以将生成的图片下载到本地 | ✓ SATISFIED | ImagePreviewModal handleDownload 调用 window.imageApi.download()，弹出系统保存对话框 |
| RES-04 | 02-04, 02-05, 02-06 | 用户可以分享生成结果的链接 | ✓ SATISFIED | 分享面板提供复制链接（navigator.clipboard）+ 保存到本地 + 在浏览器中打开，Electron 桌面端适配合理 |

### Anti-Patterns Found

无阻塞性 anti-pattern。以下为信息性记录：

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| src/renderer/components/ImagePreviewModal.vue | 使用 window.open() 替代 Capacitor Share | ℹ Info | 对 Electron 桌面端合理，若未来支持移动端需补充 @capacitor/share |
| src/views/CreateView.vue, src/views/TaskListView.vue | 原 Ionic 版本仍存在于 src/views/ | ℹ Info | 已被 src/renderer/pages/ 下的原生版本取代，旧文件可清理但不阻塞功能 |

### Human Verification Required

#### 1. 提交任务后自动跳转到任务 Tab

**Test:** 在「图片」Tab 输入提示词，点击「开始生成」
**Expected:** activeTab 自动切换为 tasks，任务卡片出现在列表中，状态为「已提交」
**Why human:** emit/onNavigate 事件链路需运行时验证

#### 2. 主进程 API 签名验证

**Test:** 配置有效的即梦 AK/SK，提交一个文生图任务
**Expected:** 主进程成功调用 CVSync2AsyncSubmitTask，返回 job_id，开始轮询，任务状态从「已提交」变为「处理中」再变为「成功」
**Why human:** HMAC-SHA256 签名正确性无法通过静态分析验证，需要真实 API 调用

#### 3. 多任务并行轮询

**Test:** 快速提交 3 个任务，观察是否同时轮询
**Expected:** 3 个独立 setInterval 同时运行，互不干扰，各自独立更新状态
**Why human:** 并发行为需要运行时验证

### Gaps Summary

所有自动化可验证项均已通过。plan 02-06 成功关闭了初次验证发现的全部 4 个 gap：CreatePage 和 TaskListPage 已从孤立状态接入 App.vue 的 Tab 导航，11/11 requirements 均有完整实现链路。

剩余 3 项需人工运行时验证（API 签名、并发轮询、Tab 跳转），属于正常的集成测试范畴，不构成代码层面的阻塞。

---

_Verified: 2026-03-20T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
